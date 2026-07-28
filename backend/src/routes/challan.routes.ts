import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const challanItemSchema = z.object({
  productId: z.string().uuid(),
  quantity: z.number().int().positive('Quantity must be greater than 0')
});

const createChallanSchema = z.object({
  customerId: z.string().uuid(),
  status: z.enum(['Draft', 'Confirmed']).default('Draft'),
  items: z.array(challanItemSchema).min(1, 'At least one product item is required')
});

const updateStatusSchema = z.object({
  status: z.enum(['Confirmed', 'Cancelled'])
});

// Utility to generate unique Challan Number
async function generateChallanNumber(): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const count = await prisma.salesChallan.count();
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `CH-${dateStr}-${nextNum}`;
}

// GET /api/challans - List all sales challans
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { status, customerId, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && typeof status === 'string') where.status = status;
    if (customerId && typeof customerId === 'string') where.customerId = customerId;

    const [challans, total] = await Promise.all([
      prisma.salesChallan.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          customer: { select: { id: true, name: true, businessName: true, mobile: true, email: true } },
          createdBy: { select: { id: true, name: true, role: true } },
          items: {
            include: { product: { select: { name: true, sku: true } } }
          },
          invoices: { select: { id: true, invoiceNumber: true, status: true } }
        }
      }),
      prisma.salesChallan.count({ where })
    ]);

    return res.json({
      challans,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching challans:', error);
    return res.status(500).json({ error: 'Failed to fetch sales challans', message: error.message });
  }
});

// GET /api/challans/:id - Challan details
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: {
        customer: true,
        createdBy: { select: { id: true, name: true, role: true, email: true } },
        items: {
          include: { product: true }
        },
        invoices: true
      }
    });

    if (!challan) {
      return res.status(404).json({ error: 'Sales challan not found' });
    }

    return res.json({ challan });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch challan details', message: error.message });
  }
});

// POST /api/challans - Create new sales challan (Sales & Admin)
router.post('/', authenticateToken, requireRoles(['ADMIN', 'SALES']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = createChallanSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
    }

    const { customerId, status, items } = parseResult.data;

    // Verify Customer
    const customer = await prisma.customer.findUnique({ where: { id: customerId } });
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Customer Snapshot
    const customerSnapshotJson = JSON.stringify({
      id: customer.id,
      name: customer.name,
      businessName: customer.businessName,
      mobile: customer.mobile,
      email: customer.email,
      gstNumber: customer.gstNumber,
      address: customer.address,
      customerType: customer.customerType
    });

    // Verify all products and prepare item snapshot
    const productIds = items.map(i => i.productId);
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } }
    });

    if (products.length !== productIds.length) {
      return res.status(400).json({ error: 'One or more selected products do not exist' });
    }

    const productMap = new Map(products.map(p => [p.id, p]));

    // Check stock availability if status is Confirmed
    if (status === 'Confirmed') {
      const insufficientProducts: string[] = [];
      for (const item of items) {
        const p = productMap.get(item.productId)!;
        if (p.currentStock < item.quantity) {
          insufficientProducts.push(
            `Product '${p.name}' (SKU: ${p.sku}) has only ${p.currentStock} in stock, but requested quantity is ${item.quantity}.`
          );
        }
      }

      if (insufficientProducts.length > 0) {
        return res.status(400).json({
          error: 'Insufficient stock to confirm challan',
          details: insufficientProducts
        });
      }
    }

    let totalQuantity = 0;
    let totalAmount = 0;

    const preparedItems = items.map(item => {
      const p = productMap.get(item.productId)!;
      const lineTotal = p.unitPrice * item.quantity;
      totalQuantity += item.quantity;
      totalAmount += lineTotal;

      return {
        productId: p.id,
        productSnapshotJson: JSON.stringify({
          id: p.id,
          name: p.name,
          sku: p.sku,
          category: p.category,
          unitPrice: p.unitPrice,
          location: p.location
        }),
        quantity: item.quantity,
        unitPrice: p.unitPrice,
        lineTotal
      };
    });

    const challanNumber = await generateChallanNumber();

    // Execute within database transaction
    const result = await prisma.$transaction(async (tx) => {
      const challan = await tx.salesChallan.create({
        data: {
          challanNumber,
          customerId,
          customerSnapshotJson,
          totalQuantity,
          totalAmount,
          status,
          createdById: req.user!.id,
          items: {
            create: preparedItems
          }
        },
        include: {
          items: true,
          customer: { select: { name: true, businessName: true } }
        }
      });

      // If created directly as Confirmed, deduct stock & log movements
      if (status === 'Confirmed') {
        for (const item of preparedItems) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } }
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Stock deducted via Confirmed Sales Challan ${challanNumber}`,
              createdById: req.user!.id
            }
          });
        }
      }

      return challan;
    });

    return res.status(201).json({
      message: `Sales Challan created successfully as ${status}`,
      challan: result
    });
  } catch (error: any) {
    console.error('Error creating challan:', error);
    return res.status(500).json({ error: 'Failed to create sales challan', message: error.message });
  }
});

// PUT /api/challans/:id/status - Update challan status (Draft -> Confirmed, Confirmed -> Cancelled)
router.put('/:id/status', authenticateToken, requireRoles(['ADMIN', 'SALES', 'WAREHOUSE']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = updateStatusSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
    }

    const { status: targetStatus } = parseResult.data;

    const challan = await prisma.salesChallan.findUnique({
      where: { id },
      include: { items: { include: { product: true } } }
    });

    if (!challan) {
      return res.status(404).json({ error: 'Sales challan not found' });
    }

    if (challan.status === targetStatus) {
      return res.status(400).json({ error: `Challan is already in '${targetStatus}' status.` });
    }

    if (challan.status === 'Cancelled') {
      return res.status(400).json({ error: 'Cannot change status of a Cancelled challan.' });
    }

    // Transition: DRAFT -> CONFIRMED
    if (challan.status === 'Draft' && targetStatus === 'Confirmed') {
      // Validate stock availability
      const insufficientProducts: string[] = [];
      for (const item of challan.items) {
        if (item.product.currentStock < item.quantity) {
          insufficientProducts.push(
            `Product '${item.product.name}' (SKU: ${item.product.sku}) current stock is ${item.product.currentStock}, required is ${item.quantity}.`
          );
        }
      }

      if (insufficientProducts.length > 0) {
        return res.status(400).json({
          error: 'Insufficient stock to confirm challan',
          details: insufficientProducts
        });
      }

      const updatedChallan = await prisma.$transaction(async (tx) => {
        // Deduct stock & write stock logs
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { decrement: item.quantity } }
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'OUT',
              reason: `Deducted via Confirmed Sales Challan ${challan.challanNumber}`,
              createdById: req.user!.id
            }
          });
        }

        return tx.salesChallan.update({
          where: { id },
          data: { status: 'Confirmed' },
          include: { items: true, customer: true }
        });
      });

      return res.json({ message: `Challan ${challan.challanNumber} confirmed and stock deducted successfully`, challan: updatedChallan });
    }

    // Transition: CONFIRMED -> CANCELLED (Restores stock)
    if (challan.status === 'Confirmed' && targetStatus === 'Cancelled') {
      const updatedChallan = await prisma.$transaction(async (tx) => {
        // Restore stock & write stock logs
        for (const item of challan.items) {
          await tx.product.update({
            where: { id: item.productId },
            data: { currentStock: { increment: item.quantity } }
          });

          await tx.stockLog.create({
            data: {
              productId: item.productId,
              quantityChanged: item.quantity,
              movementType: 'IN',
              reason: `Restored stock due to Cancelled Sales Challan ${challan.challanNumber}`,
              createdById: req.user!.id
            }
          });
        }

        return tx.salesChallan.update({
          where: { id },
          data: { status: 'Cancelled' },
          include: { items: true, customer: true }
        });
      });

      return res.json({ message: `Challan ${challan.challanNumber} cancelled and stock restored`, challan: updatedChallan });
    }

    return res.status(400).json({ error: `Invalid status transition from '${challan.status}' to '${targetStatus}'.` });
  } catch (error: any) {
    console.error('Error updating challan status:', error);
    return res.status(500).json({ error: 'Failed to update challan status', message: error.message });
  }
});

export default router;
