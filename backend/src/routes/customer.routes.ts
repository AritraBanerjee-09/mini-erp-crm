import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { z } from 'zod';

const router = Router();

const customerSchema = z.object({
  name: z.string().min(2, 'Customer name is required'),
  mobile: z.string().min(8, 'Mobile number is required'),
  email: z.string().email('Valid email is required'),
  businessName: z.string().min(2, 'Business name is required'),
  gstNumber: z.string().optional().nullable(),
  customerType: z.enum(['Retail', 'Wholesale', 'Distributor']),
  address: z.string().min(3, 'Address is required'),
  status: z.enum(['Lead', 'Active', 'Inactive']),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

const followUpSchema = z.object({
  note: z.string().min(1, 'Follow-up note cannot be empty')
});

// GET /api/customers - Search, filter, pagination
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { search, status, customerType, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (status && typeof status === 'string') {
      where.status = status;
    }

    if (customerType && typeof customerType === 'string') {
      where.customerType = customerType;
    }

    if (search && typeof search === 'string') {
      const query = search.trim();
      where.OR = [
        { name: { contains: query } },
        { businessName: { contains: query } },
        { email: { contains: query } },
        { mobile: { contains: query } },
        { gstNumber: { contains: query } }
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        skip,
        take: limitNum,
        orderBy: { createdAt: 'desc' },
        include: {
          followUps: {
            take: 1,
            orderBy: { createdAt: 'desc' },
            include: { createdBy: { select: { name: true, email: true } } }
          }
        }
      }),
      prisma.customer.count({ where })
    ]);

    return res.json({
      customers,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      }
    });
  } catch (error: any) {
    console.error('Error fetching customers:', error);
    return res.status(500).json({ error: 'Failed to fetch customers', message: error.message });
  }
});

// GET /api/customers/:id - View customer detail
router.get('/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        followUps: {
          orderBy: { createdAt: 'desc' },
          include: { createdBy: { select: { name: true, role: true } } }
        },
        salesChallans: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: { id: true, challanNumber: true, totalAmount: true, status: true, createdAt: true }
        }
      }
    });

    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    return res.json({ customer });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch customer details', message: error.message });
  }
});

// POST /api/customers - Add customer (Sales & Admin)
router.post('/', authenticateToken, requireRoles(['ADMIN', 'SALES']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const parseResult = customerSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
    }

    const data = parseResult.data;

    const customer = await prisma.customer.create({
      data: {
        ...data,
        followUpDate: data.followUpDate ? new Date(data.followUpDate) : null
      }
    });

    return res.status(201).json({ message: 'Customer created successfully', customer });
  } catch (error: any) {
    console.error('Error creating customer:', error);
    return res.status(500).json({ error: 'Failed to create customer', message: error.message });
  }
});

// PUT /api/customers/:id - Edit customer
router.put('/:id', authenticateToken, requireRoles(['ADMIN', 'SALES']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = customerSchema.partial().safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
    }

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const data = parseResult.data;
    const updated = await prisma.customer.update({
      where: { id },
      data: {
        ...data,
        followUpDate: data.followUpDate !== undefined ? (data.followUpDate ? new Date(data.followUpDate) : null) : existing.followUpDate
      }
    });

    return res.json({ message: 'Customer updated successfully', customer: updated });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to update customer', message: error.message });
  }
});

// POST /api/customers/:id/followups - Add follow-up note
router.post('/:id/followups', authenticateToken, requireRoles(['ADMIN', 'SALES']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const parseResult = followUpSchema.safeParse(req.body);
    if (!parseResult.success) {
      return res.status(400).json({ error: 'Validation failed', details: parseResult.error.errors });
    }

    const existingCustomer = await prisma.customer.findUnique({ where: { id } });
    if (!existingCustomer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const followUp = await prisma.customerFollowUp.create({
      data: {
        customerId: id,
        note: parseResult.data.note,
        createdById: req.user!.id
      },
      include: {
        createdBy: { select: { name: true, role: true } }
      }
    });

    // Optionally update customer followUpDate if provided in body
    if (req.body.nextFollowUpDate) {
      await prisma.customer.update({
        where: { id },
        data: { followUpDate: new Date(req.body.nextFollowUpDate) }
      });
    }

    return res.status(201).json({ message: 'Follow-up note added', followUp });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to add follow-up note', message: error.message });
  }
});

export default router;
