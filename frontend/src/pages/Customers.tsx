import React, { useState, useEffect } from 'react';
import { request } from '../api/client';
import { Customer, CustomerStatus, CustomerType } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Search, UserPlus, Edit3, MessageSquare } from 'lucide-react';

export const Customers: React.FC = () => {
  const { hasRole } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [isFollowUpModalOpen, setIsFollowUpModalOpen] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    businessName: '',
    gstNumber: '',
    customerType: 'Wholesale' as CustomerType,
    address: '',
    status: 'Lead' as CustomerStatus,
    followUpDate: '',
    notes: ''
  });

  const [followUpNote, setFollowUpNote] = useState('');
  const [nextFollowUpDate, setNextFollowUpDate] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, [search, statusFilter, typeFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('customerType', typeFilter);

      const res = await request<{ customers: Customer[] }>(`/customers?${params.toString()}`);
      setCustomers(res.customers);
    } catch (err: any) {
      console.error('Failed to load customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'Wholesale',
      address: '',
      status: 'Lead',
      followUpDate: '',
      notes: ''
    });
    setEditingCustomer(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name,
      mobile: c.mobile,
      email: c.email,
      businessName: c.businessName,
      gstNumber: c.gstNumber || '',
      customerType: c.customerType,
      address: c.address,
      status: c.status,
      followUpDate: c.followUpDate ? c.followUpDate.slice(0, 10) : '',
      notes: c.notes || ''
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await request(`/customers/${editingCustomer.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await request('/customers', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setIsAddModalOpen(false);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to save customer');
    }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      await request(`/customers/${selectedCustomer.id}/followups`, {
        method: 'POST',
        body: JSON.stringify({
          note: followUpNote,
          nextFollowUpDate: nextFollowUpDate || undefined
        })
      });
      setFollowUpNote('');
      setNextFollowUpDate('');
      setIsFollowUpModalOpen(false);

      // Refresh selected customer details
      const updated = await request<{ customer: Customer }>(`/customers/${selectedCustomer.id}`);
      setSelectedCustomer(updated.customer);
      fetchCustomers();
    } catch (err: any) {
      alert(err.message || 'Failed to add follow-up note');
    }
  };

  const openCustomerDetail = async (id: string) => {
    try {
      const res = await request<{ customer: Customer }>(`/customers/${id}`);
      setSelectedCustomer(res.customer);
    } catch (err: any) {
      alert('Failed to fetch customer detail');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header & Actions */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Customer CRM Management</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Track leads, active distributors, and follow-up notes</p>
        </div>
        {hasRole(['ADMIN', 'SALES']) && (
          <button onClick={handleOpenAddModal} className="btn btn-primary">
            <UserPlus size={18} /> Add New Customer
          </button>
        )}
      </div>

      {/* Search & Filter Bar */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search by name, business, email, GST..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '160px' }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Lead">Lead</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="">All Types</option>
          <option value="Retail">Retail</option>
          <option value="Wholesale">Wholesale</option>
          <option value="Distributor">Distributor</option>
        </select>
      </div>

      {/* Customer Data Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Business Name & Contact</th>
              <th>Customer Type</th>
              <th>Status</th>
              <th>GST Number</th>
              <th>Next Follow-Up</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading CRM records...</td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No customers found.</td></tr>
            ) : (
              customers.map(c => (
                <tr key={c.id}>
                  <td>
                    <div style={{ fontWeight: 700, color: '#FFF' }}>{c.businessName}</div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '10px' }}>
                      <span>👤 {c.name}</span>
                      <span>📞 {c.mobile}</span>
                    </div>
                  </td>
                  <td>
                    <span style={{ fontSize: '0.8rem', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)' }}>
                      {c.customerType}
                    </span>
                  </td>
                  <td>
                    <span className={`badge badge-${c.status.toLowerCase()}`}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.85rem', color: c.gstNumber ? 'var(--text-main)' : 'var(--text-subtle)' }}>
                    {c.gstNumber || 'N/A'}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: 'var(--accent-amber)' }}>
                    {c.followUpDate ? new Date(c.followUpDate).toLocaleDateString() : '—'}
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                      <button onClick={() => openCustomerDetail(c.id)} className="btn btn-secondary btn-sm" title="View details & follow-ups">
                        View
                      </button>
                      {hasRole(['ADMIN', 'SALES']) && (
                        <button onClick={() => handleOpenEditModal(c)} className="btn btn-secondary btn-sm" title="Edit customer">
                          <Edit3 size={14} />
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

      {/* Add / Edit Customer Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingCustomer ? 'Edit Customer Info' : 'Add New Customer'}>
        <form onSubmit={handleSubmitCustomer} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label">Business Name *</label>
            <input className="form-input" value={formData.businessName} onChange={e => setFormData({ ...formData, businessName: e.target.value })} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Contact Person *</label>
              <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Mobile Number *</label>
              <input className="form-input" value={formData.mobile} onChange={e => setFormData({ ...formData, mobile: e.target.value })} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Email Address *</label>
              <input type="email" className="form-input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">GST Number (Optional)</label>
              <input className="form-input" value={formData.gstNumber} onChange={e => setFormData({ ...formData, gstNumber: e.target.value })} placeholder="e.g. 27AAAAA0000A1Z5" />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Customer Type</label>
              <select className="form-select" value={formData.customerType} onChange={e => setFormData({ ...formData, customerType: e.target.value as CustomerType })}>
                <option value="Wholesale">Wholesale</option>
                <option value="Distributor">Distributor</option>
                <option value="Retail">Retail</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Status</label>
              <select className="form-select" value={formData.status} onChange={e => setFormData({ ...formData, status: e.target.value as CustomerStatus })}>
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Address *</label>
            <input className="form-input" value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Follow-Up Date</label>
              <input type="date" className="form-input" value={formData.followUpDate} onChange={e => setFormData({ ...formData, followUpDate: e.target.value })} />
            </div>
            <div className="input-group">
              <label className="input-label">Initial Notes</label>
              <input className="form-input" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Lead source, notes..." />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Customer</button>
          </div>
        </form>
      </Modal>

      {/* Customer Detail Drawer / Modal */}
      <Modal isOpen={!!selectedCustomer} onClose={() => setSelectedCustomer(null)} title="Customer Detail & CRM Timeline">
        {selectedCustomer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            {/* Info Summary */}
            <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '1.1rem', fontWeight: 800 }}>{selectedCustomer.businessName}</h4>
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Contact: {selectedCustomer.name}</div>
                </div>
                <span className={`badge badge-${selectedCustomer.status.toLowerCase()}`}>{selectedCustomer.status}</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                <div><strong>Mobile:</strong> {selectedCustomer.mobile}</div>
                <div><strong>Email:</strong> {selectedCustomer.email}</div>
                <div><strong>GST:</strong> {selectedCustomer.gstNumber || 'N/A'}</div>
                <div><strong>Type:</strong> {selectedCustomer.customerType}</div>
                <div style={{ gridColumn: 'span 2' }}><strong>Address:</strong> {selectedCustomer.address}</div>
              </div>
            </div>

            {/* Follow-up Notes Timeline */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 700 }}>Follow-up Timeline & Notes</h4>
                {hasRole(['ADMIN', 'SALES']) && (
                  <button onClick={() => setIsFollowUpModalOpen(true)} className="btn btn-primary btn-sm">
                    <MessageSquare size={14} /> Add Note
                  </button>
                )}
              </div>

              {!selectedCustomer.followUps || selectedCustomer.followUps.length === 0 ? (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-subtle)', fontStyle: 'italic' }}>No follow-up notes recorded yet.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {selectedCustomer.followUps.map(f => (
                    <div key={f.id} style={{ padding: '12px', background: 'rgba(13, 19, 34, 0.6)', borderLeft: '3px solid var(--primary)', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.85rem', color: '#FFF' }}>{f.note}</div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '6px', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Logged by {f.createdBy?.name || 'Staff'}</span>
                        <span>{new Date(f.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </Modal>

      {/* Add Follow-up Note Sub-modal */}
      <Modal isOpen={isFollowUpModalOpen} onClose={() => setIsFollowUpModalOpen(false)} title="Log Follow-up Note">
        <form onSubmit={handleAddFollowUp} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label">Follow-Up Note *</label>
            <textarea className="form-textarea" rows={4} value={followUpNote} onChange={e => setFollowUpNote(e.target.value)} placeholder="Summary of discussion with customer..." required />
          </div>

          <div className="input-group">
            <label className="input-label">Update Next Follow-Up Date</label>
            <input type="date" className="form-input" value={nextFollowUpDate} onChange={e => setNextFollowUpDate(e.target.value)} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
            <button type="button" onClick={() => setIsFollowUpModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Add Note</button>
          </div>
        </form>
      </Modal>

    </div>
  );
};
