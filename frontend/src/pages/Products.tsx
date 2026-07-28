import React, { useState, useEffect } from 'react';
import { request } from '../api/client';
import { Product, StockLog } from '../types';
import { useAuth } from '../context/AuthContext';
import { Modal } from '../components/Modal';
import { Search, Plus, ArrowUpRight, AlertTriangle, Edit3, History } from 'lucide-react';

export const Products: React.FC = () => {
  const { hasRole } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockOnly, setLowStockOnly] = useState(false);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [selectedProductForLog, setSelectedProductForLog] = useState<Product | null>(null);
  const [productLogs, setProductLogs] = useState<StockLog[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    category: '',
    unitPrice: 0,
    currentStock: 0,
    minStockAlert: 5,
    location: ''
  });

  const [stockAdjustment, setStockAdjustment] = useState({
    productId: '',
    quantityChanged: 1,
    movementType: 'IN' as 'IN' | 'OUT',
    reason: ''
  });

  useEffect(() => {
    fetchProducts();
  }, [search, categoryFilter, lowStockOnly]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (categoryFilter) params.append('category', categoryFilter);
      if (lowStockOnly) params.append('lowStock', 'true');

      const res = await request<{ products: Product[] }>(`/products?${params.toString()}`);
      setProducts(res.products);
    } catch (err: any) {
      console.error('Failed to load products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setFormData({
      name: '',
      sku: '',
      category: 'Electronics & Power',
      unitPrice: 100,
      currentStock: 10,
      minStockAlert: 5,
      location: 'Warehouse A'
    });
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormData({
      name: p.name,
      sku: p.sku,
      category: p.category,
      unitPrice: p.unitPrice,
      currentStock: p.currentStock,
      minStockAlert: p.minStockAlert,
      location: p.location
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingProduct) {
        await request(`/products/${editingProduct.id}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
      } else {
        await request('/products', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
      }
      setIsAddModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Failed to save product');
    }
  };

  const handleOpenStockModal = (product?: Product) => {
    setStockAdjustment({
      productId: product ? product.id : (products[0]?.id || ''),
      quantityChanged: 5,
      movementType: 'IN',
      reason: 'Manual warehouse adjustment'
    });
    setIsStockModalOpen(true);
  };

  const handleSubmitStockMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await request('/products/stock-movement', {
        method: 'POST',
        body: JSON.stringify(stockAdjustment)
      });
      setIsStockModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      alert(err.message || 'Stock adjustment failed');
    }
  };

  const viewStockLogs = async (product: Product) => {
    try {
      setSelectedProductForLog(product);
      const res = await request<{ stockLogs: StockLog[] }>(`/products/${product.id}/stock-logs`);
      setProductLogs(res.stockLogs);
    } catch (err: any) {
      alert('Failed to load stock movement history');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Product & Inventory Control</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Warehouse stock levels, minimum alerts, and movement logs</p>
        </div>
        {hasRole(['ADMIN', 'WAREHOUSE']) && (
          <div style={{ display: 'flex', gap: '12px' }}>
            <button onClick={() => handleOpenStockModal()} className="btn btn-secondary">
              <ArrowUpRight size={16} /> Adjust Stock (IN/OUT)
            </button>
            <button onClick={handleOpenAddModal} className="btn btn-primary">
              <Plus size={18} /> Add New Product
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="glass-card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-input"
            style={{ paddingLeft: '38px' }}
            placeholder="Search product name, SKU, warehouse location..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <input
          type="text"
          className="form-input"
          style={{ width: '180px' }}
          placeholder="Filter Category"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        />

        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-main)', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={lowStockOnly}
            onChange={e => setLowStockOnly(e.target.checked)}
            style={{ accentColor: 'var(--primary)' }}
          />
          <AlertTriangle size={16} style={{ color: '#F43F5E' }} /> Low Stock Only
        </label>
      </div>

      {/* Product Table */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Product Details & SKU</th>
              <th>Category</th>
              <th>Unit Price (INR)</th>
              <th>Current Stock</th>
              <th>Warehouse Bay</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Loading inventory...</td></tr>
            ) : products.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>No products found.</td></tr>
            ) : (
              products.map(p => {
                const isLowStock = p.currentStock <= p.minStockAlert;
                return (
                  <tr key={p.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: '#FFF' }}>{p.name}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: <code style={{ color: 'var(--accent-cyan)' }}>{p.sku}</code></div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{p.category}</span>
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--accent-emerald)' }}>
                      Rs. {p.unitPrice.toLocaleString()}
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{
                          fontWeight: 800,
                          fontSize: '0.95rem',
                          color: isLowStock ? '#F87171' : '#FFF'
                        }}>
                          {p.currentStock} units
                        </span>
                        {isLowStock && (
                          <span className="badge badge-cancelled" style={{ fontSize: '0.65rem' }}>
                            <AlertTriangle size={10} /> Low Stock (Min: {p.minStockAlert})
                          </span>
                        )}
                      </div>
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {p.location}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => viewStockLogs(p)} className="btn btn-secondary btn-sm" title="Stock Movement Logs">
                          <History size={14} /> Logs
                        </button>
                        {hasRole(['ADMIN', 'WAREHOUSE']) && (
                          <>
                            <button onClick={() => handleOpenStockModal(p)} className="btn btn-secondary btn-sm" title="Stock IN/OUT">
                              ± Stock
                            </button>
                            <button onClick={() => handleOpenEditModal(p)} className="btn btn-secondary btn-sm" title="Edit Product">
                              <Edit3 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title={editingProduct ? 'Edit Product' : 'Add New Product'}>
        <form onSubmit={handleSubmitProduct} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label">Product Name *</label>
            <input className="form-input" value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} required />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">SKU / Item Code *</label>
              <input className="form-input" value={formData.sku} onChange={e => setFormData({ ...formData, sku: e.target.value })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Category *</label>
              <input className="form-input" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} required />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Unit Price (INR) *</label>
              <input type="number" step="0.01" className="form-input" value={formData.unitPrice} onChange={e => setFormData({ ...formData, unitPrice: parseFloat(e.target.value) || 0 })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Current Stock *</label>
              <input type="number" className="form-input" value={formData.currentStock} onChange={e => setFormData({ ...formData, currentStock: parseInt(e.target.value) || 0 })} required />
            </div>
            <div className="input-group">
              <label className="input-label">Min Stock Alert Limit</label>
              <input type="number" className="form-input" value={formData.minStockAlert} onChange={e => setFormData({ ...formData, minStockAlert: parseInt(e.target.value) || 0 })} required />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Warehouse Location *</label>
            <input className="form-input" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="e.g. Warehouse A - Aisle 3" required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsAddModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Save Product</button>
          </div>
        </form>
      </Modal>

      {/* Manual Stock Movement Modal */}
      <Modal isOpen={isStockModalOpen} onClose={() => setIsStockModalOpen(false)} title="Record Manual Stock Movement">
        <form onSubmit={handleSubmitStockMovement} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div className="input-group">
            <label className="input-label">Select Product</label>
            <select className="form-select" value={stockAdjustment.productId} onChange={e => setStockAdjustment({ ...stockAdjustment, productId: e.target.value })}>
              {products.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} (SKU: {p.sku}) - Current Stock: {p.currentStock}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div className="input-group">
              <label className="input-label">Movement Type</label>
              <select className="form-select" value={stockAdjustment.movementType} onChange={e => setStockAdjustment({ ...stockAdjustment, movementType: e.target.value as 'IN' | 'OUT' })}>
                <option value="IN">IN (Stock Addition / Restock)</option>
                <option value="OUT">OUT (Stock Deduction / Loss)</option>
              </select>
            </div>
            <div className="input-group">
              <label className="input-label">Quantity</label>
              <input type="number" min={1} className="form-input" value={stockAdjustment.quantityChanged} onChange={e => setStockAdjustment({ ...stockAdjustment, quantityChanged: parseInt(e.target.value) || 1 })} required />
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Reason / Reference *</label>
            <input className="form-input" value={stockAdjustment.reason} onChange={e => setStockAdjustment({ ...stockAdjustment, reason: e.target.value })} placeholder="e.g. Received Purchase Order #402, Stock Audit" required />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '12px' }}>
            <button type="button" onClick={() => setIsStockModalOpen(false)} className="btn btn-secondary">Cancel</button>
            <button type="submit" className="btn btn-primary">Record Movement</button>
          </div>
        </form>
      </Modal>

      {/* Stock Logs Drawer / Modal */}
      <Modal isOpen={!!selectedProductForLog} onClose={() => setSelectedProductForLog(null)} title={`Stock Audit Logs: ${selectedProductForLog?.name}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {productLogs.length === 0 ? (
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', padding: '20px', textAlign: 'center' }}>No stock movement logs recorded.</div>
          ) : (
            productLogs.map(log => (
              <div key={log.id} style={{
                padding: '12px 16px',
                background: log.movementType === 'IN' ? 'rgba(16, 185, 129, 0.08)' : 'rgba(244, 63, 94, 0.08)',
                border: `1px solid ${log.movementType === 'IN' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'}`,
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FFF' }}>{log.reason}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    By: {log.createdBy?.name || 'User'} ({log.createdBy?.role}) • {new Date(log.createdAt).toLocaleString()}
                  </div>
                </div>
                <div style={{
                  fontSize: '1rem',
                  fontWeight: 800,
                  color: log.movementType === 'IN' ? 'var(--accent-emerald)' : '#F87171'
                }}>
                  {log.movementType === 'IN' ? `+${log.quantityChanged}` : `-${log.quantityChanged}`}
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

    </div>
  );
};
