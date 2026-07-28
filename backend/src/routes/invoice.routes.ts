import { Router, Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../db';
import { authenticateToken, requireRoles, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Utility to generate unique Invoice Number
async function generateInvoiceNumber(): Promise<string> {
  const dateStr = new Date().toISOString().slice(0, 7).replace('-', '');
  const count = await prisma.invoice.count();
  const nextNum = (count + 1).toString().padStart(4, '0');
  return `INV-${dateStr}-${nextNum}`;
}

// GET /api/invoices - List all invoices
router.get('/', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, name: true, businessName: true, mobile: true, email: true, gstNumber: true } },
        salesChallan: { select: { id: true, challanNumber: true, totalQuantity: true, status: true } }
      }
    });

    return res.json({ invoices });
  } catch (error: any) {
    return res.status(500).json({ error: 'Failed to fetch invoices', message: error.message });
  }
});

// POST /api/invoices/generate/:challanId - Generate Invoice from Confirmed Challan (Accounts & Admin)
router.post('/generate/:challanId', authenticateToken, requireRoles(['ADMIN', 'ACCOUNTS']), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { challanId } = req.params;

    const challan = await prisma.salesChallan.findUnique({
      where: { id: challanId },
      include: { customer: true, invoices: true }
    });

    if (!challan) {
      return res.status(404).json({ error: 'Sales challan not found' });
    }

    if (challan.status !== 'Confirmed') {
      return res.status(400).json({ error: `Cannot generate invoice for a challan with status '${challan.status}'. Only 'Confirmed' challans can be invoiced.` });
    }

    if (challan.invoices && challan.invoices.length > 0) {
      return res.status(400).json({ error: `Invoice already exists for Challan ${challan.challanNumber}`, invoice: challan.invoices[0] });
    }

    const invoiceNumber = await generateInvoiceNumber();
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 30); // 30 days credit period

    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        salesChallanId: challan.id,
        customerId: challan.customerId,
        totalAmount: challan.totalAmount,
        status: 'Pending',
        dueDate
      },
      include: {
        customer: true,
        salesChallan: { include: { items: true } }
      }
    });

    return res.status(201).json({
      message: `Invoice ${invoiceNumber} created successfully`,
      invoice
    });
  } catch (error: any) {
    console.error('Error generating invoice:', error);
    return res.status(500).json({ error: 'Failed to generate invoice', message: error.message });
  }
});

// GET /api/invoices/:id/pdf - Stream PDF invoice
router.get('/:id/pdf', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: true,
        salesChallan: {
          include: { items: true }
        }
      }
    });

    if (!invoice) {
      return res.status(404).json({ error: 'Invoice not found' });
    }

    const doc = new PDFDocument({ margin: 50 });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="${invoice.invoiceNumber}.pdf"`);

    doc.pipe(res);

    // PDF Header
    doc.fillColor('#1E293B').fontSize(22).text('MINI ERP & CRM OPERATIONS', { align: 'center' });
    doc.fontSize(10).fillColor('#64748B').text('Tax Invoice / Distribution Receipt', { align: 'center' });
    doc.moveDown(1.5);

    // Invoice Meta
    doc.fontSize(12).fillColor('#0F172A').text(`INVOICE NUMBER: ${invoice.invoiceNumber}`, { underline: true });
    doc.fontSize(10).fillColor('#334155');
    doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`);
    doc.text(`Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}`);
    doc.text(`Status: ${invoice.status.toUpperCase()}`);
    doc.text(`Challan Reference: ${invoice.salesChallan.challanNumber}`);
    doc.moveDown();

    // Customer Info Box
    doc.rect(50, doc.y, 500, 70).fillAndStroke('#F8FAFC', '#E2E8F0');
    doc.fillColor('#0F172A').fontSize(11).font('Helvetica-Bold').text('BILL TO:', 60, doc.y - 60);
    doc.font('Helvetica').fontSize(10).text(`Business Name: ${invoice.customer.businessName}`);
    doc.text(`Customer Name: ${invoice.customer.name} | Mobile: ${invoice.customer.mobile}`);
    doc.text(`GST Number: ${invoice.customer.gstNumber || 'N/A'}`);
    doc.text(`Address: ${invoice.customer.address}`);
    doc.moveDown(2);

    // Table Header
    const tableTop = doc.y + 20;
    doc.fontSize(10).fillColor('#1E293B').font('Helvetica-Bold');
    doc.text('Item / Product Snapshot', 50, tableTop);
    doc.text('Qty', 330, tableTop);
    doc.text('Unit Price', 380, tableTop);
    doc.text('Line Total (INR)', 470, tableTop);
    doc.moveTo(50, tableTop + 15).lineTo(550, tableTop + 15).stroke('#CBD5E1');

    let position = tableTop + 25;

    invoice.salesChallan.items.forEach((item) => {
      let productMeta = { name: 'Product', sku: 'N/A' };
      try {
        productMeta = JSON.parse(item.productSnapshotJson);
      } catch (e) {}

      doc.fontSize(9).fillColor('#334155').font('Helvetica');
      doc.text(`${productMeta.name} (${productMeta.sku})`, 50, position, { width: 260 });
      doc.text(`${item.quantity}`, 330, position);
      doc.text(`Rs. ${item.unitPrice.toFixed(2)}`, 380, position);
      doc.text(`Rs. ${item.lineTotal.toFixed(2)}`, 470, position);
      position += 20;
    });

    doc.moveTo(50, position + 5).lineTo(550, position + 5).stroke('#CBD5E1');

    // Total Summary
    doc.fontSize(12).fillColor('#0F172A').font('Helvetica-Bold').text(`TOTAL AMOUNT: Rs. ${invoice.totalAmount.toFixed(2)}`, 350, position + 20);

    // Footer
    doc.fontSize(8).fillColor('#94A3B8').text('This is a computer-generated tax invoice. Thank you for your business!', 50, 700, { align: 'center' });

    doc.end();
  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return res.status(500).json({ error: 'Failed to generate PDF', message: error.message });
  }
});

export default router;
