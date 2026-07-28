import React, { useEffect, useState } from 'react';
import { request } from '../api/client';
import { DashboardStats } from '../types';
import { Users, Package, AlertTriangle, FileCheck, IndianRupee, PhoneCall, ArrowUpRight } from 'lucide-react';

interface DashboardProps {
  setActiveTab: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ setActiveTab }) => {
  const [data, setData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await request<DashboardStats>('/dashboard/stats');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', color: 'var(--text-muted)' }}>Loading operational statistics...</div>;
  }

  if (error || !data) {
    return <div style={{ padding: '40px', color: '#F87171' }}>{error || 'Failed to load dashboard'}</div>;
  }

  const { stats, lowStockProducts, upcomingFollowups } = data;

  const statCards = [
    { title: 'Total Customers', value: stats.totalCustomers, sub: `${stats.leadsCount} Leads | ${stats.activeCustomersCount} Active`, icon: Users, color: '#6366F1' },
    { title: 'Catalog Products', value: stats.totalProducts, sub: `${stats.lowStockCount} Low stock alerts`, icon: Package, color: '#06B6D4' },
    { title: 'Low Stock Alerts', value: stats.lowStockCount, sub: 'Requires warehouse restock', icon: AlertTriangle, color: stats.lowStockCount > 0 ? '#F43F5E' : '#10B981' },
    { title: 'Confirmed Sales', value: `Rs. ${stats.totalConfirmedRevenue.toLocaleString()}`, sub: `${stats.confirmedChallansCount} Confirmed Challans`, icon: FileCheck, color: '#10B981' },
    { title: 'Pending Receivables', value: `Rs. ${stats.pendingInvoiceRevenue.toLocaleString()}`, sub: `${stats.pendingInvoicesCount} Pending Invoices`, icon: IndianRupee, color: '#F59E0B' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      
      {/* Top Banner Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Operations Overview</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Real-time business performance across CRM, Stock & Billing</p>
        </div>
        <button onClick={fetchStats} className="btn btn-secondary btn-sm">
          Refresh Overview
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
        {statCards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>{card.title}</span>
                <div style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '8px',
                  background: `${card.color}15`,
                  border: `1px solid ${card.color}30`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: card.color
                }}>
                  <Icon size={18} />
                </div>
              </div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#FFF' }}>{card.value}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{card.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Two Column Section: Low Stock Warning + Followup Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Low Stock Alerts */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <AlertTriangle size={20} style={{ color: '#F43F5E' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Low Stock Alert Monitor</h3>
            </div>
            <button onClick={() => setActiveTab('products')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
              Inventory <ArrowUpRight size={12} />
            </button>
          </div>

          {lowStockProducts.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--accent-emerald)', fontSize: '0.875rem' }}>
              ✓ All inventory items are above minimum stock threshold.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {lowStockProducts.map(product => (
                <div key={product.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: 'rgba(244, 63, 94, 0.08)',
                  border: '1px solid rgba(244, 63, 94, 0.2)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FFF' }}>{product.name}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SKU: {product.sku} | Loc: {product.location}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#F87171' }}>
                      {product.currentStock} left
                    </div>
                    <div style={{ fontSize: '0.7rem', color: 'var(--text-subtle)' }}>Alert Limit: {product.minStockAlert}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* CRM Follow-up Queue */}
        <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <PhoneCall size={20} style={{ color: 'var(--primary)' }} />
              <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Upcoming Lead Follow-ups</h3>
            </div>
            <button onClick={() => setActiveTab('customers')} className="btn btn-secondary btn-sm" style={{ fontSize: '0.75rem' }}>
              Open CRM <ArrowUpRight size={12} />
            </button>
          </div>

          {upcomingFollowups.length === 0 ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
              No pending follow-ups scheduled for today.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {upcomingFollowups.map(customer => (
                <div key={customer.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px 14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)'
                }}>
                  <div>
                    <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#FFF' }}>{customer.businessName}</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Contact: {customer.name} ({customer.mobile})</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className="badge badge-lead">
                      Due: {customer.followUpDate ? new Date(customer.followUpDate).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

    </div>
  );
};
