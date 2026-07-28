import React, { useState, useEffect } from 'react';
import { request } from '../api/client';
import { Invoice, SalesChallan } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Download, Plus } from 'lucide-react';

export const Invoices: React.FC = () => {
  const { hasRole } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [confirmedChallans, setConfirmedChallans] = useState<SalesChallan[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [selectedChallanId, setSelectedChallanId] = useState('');
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [invRes, chalRes] = await Promise.all([
        request<{ invoices: Invoice[] }>('/invoices'),
        request<{ challans: SalesChallan[] }>('/challans?status=Confirmed')
      ]);
      setInvoices(invRes.invoices);
      setConfirmedChallans(chalRes.challans);
    } catch (err: any) {
      console.error('Failed to load invoices:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenGenerateModal = () => {
    setSelectedChallanId(confirmedChallans[0]?.id || '');
    setIsGenerateModalOpen(true);
  };

  const handleGenerateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedChallanId) return;

    try {
      await request(`/invoices/generate/${selectedChallanId}`, {
        method: 'POST'
      });
      setIsGenerateModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      alert(err.message || 'Failed to generate invoice');
    }
  };

  const handleDownloadPDF = (invoiceId: string, invoiceNum: string) => {
    const token = localStorage.getItem('token');
    fetch(`/api/invoices/${invoiceId}/pdf`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(res => res.blob())
      .then(blob => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${invoiceNum}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      })
      .catch(() => alert('Failed to download PDF invoice'));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Invoices & Billing</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Generate tax invoices from confirmed challans & export PDF receipts</p>
        </div>
        {hasRole(['ADMIN', 'ACCOUNTS']) && (
          <button onClick={handleOpenGenerateModal} className="btn btn-primary">
            <Plus size={18} /> Generate Invoice from Challan
          </button>
        )}
      </div>

      {/* Invoice Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Invoice # & Date</th>
              <th>Customer Business Name</th>
              <th>Challan Ref</th>
              <th>Total Amount (INR)</th>
              <th>Status & Due Date</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading billing records...</td></tr>
            ) : invoices.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No invoices generated yet.</td></tr>
            ) : (
              invoices.map(inv => (
                <tr key={inv.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--primary)' }}>{inv.invoiceNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(inv.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>{inv.customer?.businessName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>GST: {inv.customer?.gstNumber || 'N/A'}</div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                      {inv.salesChallan?.challanNumber}
                    </span>
                  </td>
                  <td style={{ fontWeight: 800, color: 'var(--accent-emerald)', fontSize: '0.95rem' }}>
                    Rs. {inv.totalAmount.toLocaleString()}
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      <span className="badge badge-lead" style={{ width: 'fit-content' }}>{inv.status}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                        Due: {new Date(inv.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setSelectedInvoice(inv)} className="btn btn-secondary btn-sm" title="Preview Invoice">
                        View
                      </button>
                      <button onClick={() => handleDownloadPDF(inv.id, inv.invoiceNumber)} className="btn btn-primary btn-sm" title="Export PDF Receipt">
                        <Download size={14} /> PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Generate Invoice Modal */}
      <Modal isOpen={isGenerateModalOpen} onClose={() => setIsGenerateModalOpen(false)} title="Generate Invoice from Confirmed Sales Challan">
        <form onSubmit={handleGenerateInvoice} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div className="input-group">
            <label className="input-label">Select Confirmed Sales Challan *</label>
            {confirmedChallans.length === 0 ? (
              <div style={{ fontSize: '0.85rem', color: '#F87171', padding: '10px' }}>
                No confirmed sales challans available. Please confirm a draft challan first.
              </div>
            ) : (
              <select className="form-select" value={selectedChallanId} onChange={e => setSelectedChallanId(e.target.value)} required>
                {confirmedChallans.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.challanNumber} - {c.customer?.businessName} (Rs. {c.totalAmount.toLocaleString()})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Note: Generating an invoice will create an official tax receipt with a 30-day payment due window linked to the customer's GST profile.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsGenerateModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={confirmedChallans.length === 0}>Generate Invoice</button>
          </div>
        </form>
      </Modal>

      {/* View Invoice Preview Modal */}
      <Modal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} title={`Tax Invoice Preview: ${selectedInvoice?.invoiceNumber}`}>
        {selectedInvoice && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Header */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>NEXUS WHOLESALE & DISTRIBUTION</h3>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tax Invoice / Bill of Supply</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>{selectedInvoice.invoiceNumber}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Date: {new Date(selectedInvoice.createdAt).toLocaleDateString()}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', fontSize: '0.85rem' }}>
                <div>
                  <strong>Billed To:</strong>
                  <div>{selectedInvoice.customer?.businessName}</div>
                  <div style={{ color: 'var(--text-muted)' }}>Attn: {selectedInvoice.customer?.name} ({selectedInvoice.customer?.mobile})</div>
                  <div style={{ color: 'var(--text-muted)' }}>GST: {selectedInvoice.customer?.gstNumber || 'N/A'}</div>
                </div>
                <div>
                  <strong>Payment Terms:</strong>
                  <div>Status: <span className="badge badge-lead">{selectedInvoice.status}</span></div>
                  <div>Due Date: {new Date(selectedInvoice.dueDate).toLocaleDateString()}</div>
                  <div>Challan Ref: {selectedInvoice.salesChallan?.challanNumber}</div>
                </div>
              </div>
            </div>

            {/* Total Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
              <div style={{ fontSize: '0.9rem' }}>Grand Total Payable:</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                Rs. {selectedInvoice.totalAmount.toLocaleString()}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button onClick={() => setSelectedInvoice(null)} className="btn btn-secondary">Close</button>
              <button onClick={() => handleDownloadPDF(selectedInvoice.id, selectedInvoice.invoiceNumber)} className="btn btn-primary">
                <Download size={16} /> Download Official PDF
              </button>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
};
