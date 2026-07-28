import { Router, Response } from 'express';
import { prisma } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

router.get('/stats', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const [
      totalCustomers,
      leadsCount,
      activeCustomersCount,
      allProducts,
      totalChallans,
      confirmedChallans,
      totalInvoices,
      recentFollowups
    ] = await Promise.all([
      prisma.customer.count(),
      prisma.customer.count({ where: { status: 'Lead' } }),
      prisma.customer.count({ where: { status: 'Active' } }),
      prisma.product.findMany(),
      prisma.salesChallan.count(),
      prisma.salesChallan.findMany({ where: { status: 'Confirmed' } }),
      prisma.invoice.findMany(),
      prisma.customer.findMany({
        where: {
          status: 'Lead',
          followUpDate: { not: null }
        },
        take: 5,
        orderBy: { followUpDate: 'asc' }
      })
    ]);

    // Low stock items filtering
    const lowStockProducts = allProducts.filter(p => p.currentStock <= p.minStockAlert);

    // Calculate total revenue from confirmed challans
    const totalConfirmedRevenue = confirmedChallans.reduce((sum, c) => sum + c.totalAmount, 0);

    // Pending invoices total
    const pendingInvoices = totalInvoices.filter(i => i.status === 'Pending');
    const pendingInvoiceRevenue = pendingInvoices.reduce((sum, i) => sum + i.totalAmount, 0);

    return res.json({
      stats: {
        totalCustomers,
        leadsCount,
        activeCustomersCount,
        totalProducts: allProducts.length,
        lowStockCount: lowStockProducts.length,
        totalChallans,
        confirmedChallansCount: confirmedChallans.length,
        totalConfirmedRevenue,
        totalInvoicesCount: totalInvoices.length,
        pendingInvoicesCount: pendingInvoices.length,
        pendingInvoiceRevenue
      },
      lowStockProducts: lowStockProducts.slice(0, 10),
      upcomingFollowups: recentFollowups
    });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ error: 'Failed to fetch dashboard statistics', message: error.message });
  }
});

export default router;
