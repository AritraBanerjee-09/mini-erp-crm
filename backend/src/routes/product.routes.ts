import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const productSchema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.number().positive('Unit price must be greater than 0'),
  currentStock: z.number().int().min(0, 'Current stock cannot be negative'),
  minStockAlert: z.number().int().min(0).default(5),
  location: z.string().min(1, 'Warehouse location is required'),
  imageUrl: z.string().optional().nullable()
});

const stockMovementSchema = z.object({
  productId: z.string().uuid(),
  quantityChanged: z.number().int().positive('Quantity must be greater than 0'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(2, 'Reason for stock movement is required')
});

// GET /api/products - Get all products with search, category & low-stock filter
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, category, lowStock, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (category && typeof category === 'string') {
      where.category = category;
    }

    if (search && typeof search === 'string') {
      const query = search.trim();
      where.OR = [
        { name: { contains: query } },
        { sku: { contains: query } },
        { category: { contains: query } },
        { location: { contains: query } }
      ];
    }

    let products = await prisma.product.findMany({
      where,
      skip,
      take: limitNum,
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { stockLogs: true } }
      }
    });

    if (lowStock === 'true') {
      products = products.filter(p => p.currentStock <= p.minStockAlert);
    }

    const total = await prisma.product.count({ where });

    return res.json({
      products,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching products:', error);
    return res.status(500).json({ error: 'Failed to fetch products', message: error.message });
  }
});

// GET /api/products/:id - Product detail
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        stockLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { createdBy: { select: { name: true, role: true } } }
        }
      }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    return res.json({ product });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch product detail', message: error.message });
  }
});

// POST /api/products - Add new product (Warehouse & Admin)
router.post('/', authenticateToken, requireRoles(['ADMIN', 'WAREHOUSE']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = productSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
    }

    const data = parseResult.data;

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
    if (existingSku) {
      return res.status(400).json({ error: `Product with SKU '${data.sku}' already exists` });
    }

    const product = await prisma.product.create({
      data
    });

    // Create initial stock log if currentStock > 0
    if (product.currentStock > 0) {
      await prisma.stockLog.create({
        data: {
          productId: product.id,
          quantityChanged: product.currentStock,
          movementType: 'IN',
          reason: 'Initial stock setup upon product creation',
          createdById: req.user!.id
        }
      });
    }

    return res.status(201).json({ message: 'Product created successfully', product });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to create product', message: error.message });
  }
});

// PUT /api/products/:id - Edit product
router.put('/:id', authenticateToken, requireRoles(['ADMIN', 'WAREHOUSE']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = productSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
    }

    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const data = parseResult.data;

    if (data.sku && data.sku !== existing.sku) {
      const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
      if (existingSku) {
        return res.status(400).json({ error: `Product with SKU '${data.sku}' already exists` });
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data
    });

    return res.json({ message: 'Product updated successfully', product: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update product', message: error.message });
  }
});

// POST /api/products/stock-movement - Record manual stock movement (IN / OUT)
router.post('/stock-movement', authenticateToken, requireRoles(['ADMIN', 'WAREHOUSE']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = stockMovementSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
    }

    const { productId, quantityChanged, movementType, reason } = parseResult.data;

    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    let newStock = product.currentStock;
    if (movementType === 'IN') {
      newStock += quantityChanged;
    } else {
      if (product.currentStock < quantityChanged) {
        return res.status(400).json({
          error: `Insufficient stock! Current available stock is ${product.currentStock}, but attempted OUT movement is ${quantityChanged}.`
        });
      }
      newStock -= quantityChanged;
    }

    // Atomic transaction for updating stock & creating stock log
    const [updatedProduct, log] = await prisma.$transaction([
      prisma.product.update({
        where: { id: productId },
        data: { currentStock: newStock }
      }),
      prisma.stockLog.create({
        data: {
          productId,
          quantityChanged,
          movementType,
          reason,
          createdById: req.user!.id
        },
        include: { createdBy: { select: { name: true, role: true } } }
      })
    ]);

    return res.status(200).json({
      message: `Stock successfully adjusted ${movementType} by ${quantityChanged}`,
      product: updatedProduct,
      log
    });
  } catch (error: any) {
    console.error('Error logging stock movement:', error);
    return res.status(500).json({ error: 'Failed to log stock movement', message: error.message });
  }
});

// GET /api/products/:id/stock-logs - Stock logs for a specific product
router.get('/:id/stock-logs', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const logs = await prisma.stockLog.findMany({
      where: { productId: id },
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: { select: { name: true, role: true, email: true } }
      }
    });

    return res.json({ stockLogs: logs });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch stock logs', message: error.message });
  }
});

export default router;
