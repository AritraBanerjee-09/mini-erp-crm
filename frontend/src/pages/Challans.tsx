import React, { useState, useEffect } from 'react';
import { request } from '../api/client';
import { SalesChallan, Customer, Product } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Plus, CheckCircle, XCircle, AlertCircle, Trash2, Eye } from 'lucide-react';

export const Challans: React.FC = () => {
  const { hasRole } = useAuth();
  const [challans, setChallans] = useState<SalesChallan[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedChallan, setSelectedChallan] = useState<SalesChallan | null>(null);

  // Challan Creation Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [challanStatus, setChallanStatus] = useState<'Draft' | 'Confirmed'>('Draft');
  const [selectedItems, setSelectedItems] = useState<{ productId: string; quantity: number }[]>([]);

  // Validation Error state
  const [errorAlert, setErrorAlert] = useState<string | string[] | null>(null);

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);
      const [cRes, custRes, prodRes] = await Promise.all([
        request<{ challans: SalesChallan[] }>('/challans'),
        request<{ customers: Customer[] }>('/customers'),
        request<{ products: Product[] }>('/products')
      ]);
      setChallans(cRes.challans);
      setCustomers(custRes.customers);
      setProducts(prodRes.products);
    } catch (err: any) {
      console.error('Failed to load challan data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreateModal = () => {
    setErrorAlert(null);
    setSelectedCustomerId(customers[0]?.id || '');
    setChallanStatus('Draft');
    setSelectedItems([{ productId: products[0]?.id || '', quantity: 1 }]);
    setIsCreateModalOpen(true);
  };

  const handleAddItemRow = () => {
    const availableProd = products.find(p => !selectedItems.some(i => i.productId === p.id)) || products[0];
    if (availableProd) {
      setSelectedItems([...selectedItems, { productId: availableProd.id, quantity: 1 }]);
    }
  };

  const handleRemoveItemRow = (index: number) => {
    if (selectedItems.length === 1) return;
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    const updated = [...selectedItems];
    if (field === 'productId') {
      updated[index].productId = value;
    } else {
      updated[index].quantity = Math.max(1, parseInt(value) || 1);
    }
    setSelectedItems(updated);
  };

  const calculateTotals = () => {
    let totalQty = 0;
    let totalAmount = 0;
    selectedItems.forEach(item => {
      const p = products.find(prod => prod.id === item.productId);
      if (p) {
        totalQty += item.quantity;
        totalAmount += p.unitPrice * item.quantity;
      }
    });
    return { totalQty, totalAmount };
  };

  const handleSubmitChallan = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorAlert(null);
    try {
      await request('/challans', {
        method: 'POST',
        body: JSON.stringify({
          customerId: selectedCustomerId,
          status: challanStatus,
          items: selectedItems
        })
      });
      setIsCreateModalOpen(false);
      fetchInitialData();
    } catch (err: any) {
      if (err.details) {
        setErrorAlert(err.details);
      } else {
        setErrorAlert(err.message || 'Failed to create sales challan');
      }
    }
  };

  const handleStatusChange = async (challanId: string, targetStatus: 'Confirmed' | 'Cancelled') => {
    try {
      await request(`/challans/${challanId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: targetStatus })
      });
      fetchInitialData();
      if (selectedChallan?.id === challanId) {
        setSelectedChallan(null);
      }
    } catch (err: any) {
      const msg = err.details ? err.details.join('\n') : err.message;
      alert(`Status update failed: ${msg}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Sales Challans & Dispatch</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Generate draft challans & auto-deduct stock upon confirmation</p>
        </div>
        {hasRole(['ADMIN', 'SALES']) && (
          <button onClick={handleOpenCreateModal} className="btn btn-primary">
            <Plus size={18} /> Create Sales Challan
          </button>
        )}
      </div>

      {/* Challan Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Challan # & Date</th>
              <th>Customer Name</th>
              <th>Total Quantity</th>
              <th>Total Amount</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading sales challans...</td></tr>
            ) : challans.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No sales challans recorded.</td></tr>
            ) : (
              challans.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: 'var(--accent-cyan)' }}>{c.challanNumber}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{new Date(c.createdAt).toLocaleDateString()}</div>
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#FFF' }}>{c.customer?.businessName || 'Customer'}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{c.customer?.name}</div>
                  </td>
                  <td style={{ fontWeight: 700 }}>
                    {c.totalQuantity} items
                  </td>
                  <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                    Rs. {c.totalAmount.toLocaleString()}
                  </td>
                  <td>
                    <span className={`badge badge-${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => setSelectedChallan(c)} className="btn btn-secondary btn-sm" title="View Snapshot">
                        <Eye size={14} /> View
                      </button>

                      {c.status === 'Draft' && hasRole(['ADMIN', 'SALES', 'WAREHOUSE']) && (
                        <button onClick={() => handleStatusChange(c.id, 'Confirmed')} className="btn btn-success btn-sm" title="Confirm & Deduct Stock">
                          <CheckCircle size={14} /> Confirm
                        </button>
                      )}

                      {c.status === 'Confirmed' && hasRole(['ADMIN', 'SALES']) && (
                        <button onClick={() => handleStatusChange(c.id, 'Cancelled')} className="btn btn-danger btn-sm" title="Cancel & Restore Stock">
                          <XCircle size={14} /> Cancel
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Create Sales Challan Modal */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)} title="Create New Sales Challan">
        <form onSubmit={handleSubmitChallan} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          
          {errorAlert && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              borderRadius: 'var(--radius-sm)',
              color: '#F87171',
              fontSize: '0.85rem'
            }}>
              <div style={{ fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertCircle size={16} /> Stock Guard Error:
              </div>
              {Array.isArray(errorAlert) ? (
                <ul style={{ paddingLeft: '20px', margin: 0 }}>
                  {errorAlert.map((err, idx) => <li key={idx}>{err}</li>)}
                </ul>
              ) : (
                <div>{errorAlert}</div>
              )}
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Select Customer *</label>
              <select className="form-select" value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} required>
                {customers.map(cust => (
                  <option key={cust.id} value={cust.id}>
                    {cust.businessName} ({cust.name})
                  </option>
                ))}
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Initial Status</label>
              <select className="form-select" value={challanStatus} onChange={e => setChallanStatus(e.target.value as 'Draft' | 'Confirmed')}>
                <option value="Draft">Draft (No stock change)</option>
                <option value="Confirmed">Confirmed (Immediately deducts stock)</option>
              </select>
            </div>
          </div>

          {/* Product Items Table Builder */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <label className="input-label" style={{ marginBottom: 0 }}>Challan Product Line Items *</label>
              <button type="button" onClick={handleAddItemRow} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
                <Plus size={14} /> Add Product Row
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {selectedItems.map((item, index) => {
                const selectedProd = products.find(p => p.id === item.productId);
                const isStockSufficient = selectedProd ? selectedProd.currentStock >= item.quantity : true;
                const lineTotal = selectedProd ? selectedProd.unitPrice * item.quantity : 0;

                return (
                  <div key={index} style={{
                    display: 'grid',
                    gridTemplateColumns: '2fr 1fr 1fr 40px',
                    gap: '10px',
                    alignItems: 'center',
                    background: 'rgba(13, 19, 34, 0.6)',
                    padding: '10px',
                    borderRadius: 'var(--radius-sm)',
                    border: !isStockSufficient && challanStatus === 'Confirmed' ? '1px solid rgba(244,63,94,0.4)' : '1px solid var(--border-color)'
                  }}>
                    <div>
                      <select className="form-select" value={item.productId} onChange={e => handleItemChange(index, 'productId', e.target.value)}>
                        {products.map(p => (
                          <option key={p.id} value={p.id}>
                            {p.name} (Stock: {p.currentStock}) - Rs. {p.unitPrice}
                          </option>
                        ))}
                      </select>
                      {selectedProd && (
                        <div style={{ fontSize: '0.7rem', color: isStockSufficient ? 'var(--text-muted)' : '#F87171', marginTop: '2px' }}>
                          Available: {selectedProd.currentStock} units | Loc: {selectedProd.location}
                        </div>
                      )}
                    </div>

                    <div>
                      <input
                        type="number"
                        min={1}
                        className="form-input"
                        value={item.quantity}
                        onChange={e => handleItemChange(index, 'quantity', e.target.value)}
                        placeholder="Qty"
                      />
                    </div>

                    <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-emerald)', textAlign: 'right' }}>
                      Rs. {lineTotal.toLocaleString()}
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        className="btn btn-secondary btn-sm"
                        disabled={selectedItems.length === 1}
                        style={{ color: '#F87171' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Totals Banner */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px',
            background: 'rgba(99, 102, 241, 0.1)',
            borderRadius: 'var(--radius-sm)',
            border: '1px solid rgba(99, 102, 241, 0.2)'
          }}>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Total Quantity: <strong>{calculateTotals().totalQty} items</strong>
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#FFF' }}>
              Total Challan Amount: <span style={{ color: 'var(--accent-emerald)' }}>Rs. {calculateTotals().totalAmount.toLocaleString()}</span>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
            <button type="button" onClick={() => setIsCreateModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Generate Challan</button>
          </div>
        </form>
      </Modal>

      {/* View Snapshot Detail Modal */}
      <Modal isOpen={!!selectedChallan} onClose={() => setSelectedChallan(null)} title={`Challan Detail Snapshot: ${selectedChallan?.challanNumber}`}>
        {selectedChallan && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Customer Snapshot Header */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800 }}>{selectedChallan.customer?.businessName}</h4>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customer: {selectedChallan.customer?.name} ({selectedChallan.customer?.mobile})</div>
                </div>
                <span className={`badge badge-${selectedChallan.status.toLowerCase()}`}>{selectedChallan.status}</span>
              </div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)', marginTop: '8px' }}>
                Created by {selectedChallan.createdBy?.name} on {new Date(selectedChallan.createdAt).toLocaleString()}
              </div>
            </div>

            {/* Snapshot Line Items */}
            <div>
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '10px' }}>Product Snapshots & Quantities</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {selectedChallan.items.map((item, idx) => {
                  let snap = { name: 'Product', sku: 'N/A', location: 'N/A' };
                  try { snap = JSON.parse(item.productSnapshotJson || '{}'); } catch(e){}

                  return (
                    <div key={idx} style={{
                      padding: '12px',
                      background: 'rgba(13, 19, 34, 0.6)',
                      borderRadius: 'var(--radius-sm)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}>
                      <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FFF' }}>{snap.name}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {snap.sku} | Unit Price: Rs. {item.unitPrice}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--accent-emerald)' }}>
                          Rs. {item.lineTotal.toLocaleString()}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty: {item.quantity}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-color)' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 700 }}>Total Quantity: {selectedChallan.totalQuantity}</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--accent-emerald)' }}>
                Total: Rs. {selectedChallan.totalAmount.toLocaleString()}
              </div>
            </div>

          </div>
        )}
      </Modal>

    </div>
  );
};
