import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { Layers, ShieldCheck, UserCheck, Package, Receipt, ArrowRight, UserPlus } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  // Form states
  const [email, setEmail] = useState('admin@minierp.com');
  const [password, setPassword] = useState('Password123');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('SALES');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegisterMode) {
        await register(name, email, password, role);
      } else {
        await login(email, password);
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail: string) => {
    setIsRegisterMode(false);
    setEmail(demoEmail);
    setPassword('Password123');
    setError('');
    setLoading(true);
    try {
      await login(demoEmail, 'Password123');
    } catch (err: any) {
      setError(err.message || 'Quick login failed');
    } finally {
      setLoading(false);
    }
  };

  const roleDemos = [
    { title: 'Administrator', email: 'admin@minierp.com', role: 'ADMIN', color: '#EC4899', icon: ShieldCheck, desc: 'Full access to CRM, Inventory, Sales & Billing' },
    { title: 'Sales Executive', email: 'sales@minierp.com', role: 'SALES', color: '#6366F1', icon: UserCheck, desc: 'Manage Leads/Customers & Create Sales Challans' },
    { title: 'Warehouse Manager', email: 'warehouse@minierp.com', role: 'WAREHOUSE', color: '#06B6D4', icon: Package, desc: 'Manage Stock Levels & Record Stock IN/OUT Logs' },
    { title: 'Accounts Executive', email: 'accounts@minierp.com', role: 'ACCOUNTS', color: '#10B981', icon: Receipt, desc: 'Generate Invoices & Export Tax PDF Receipts' }
  ];

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 30%, rgba(99, 102, 241, 0.15), transparent 70%), #090D16',
      padding: '20px'
    }}>
      <div style={{ width: '100%', maxWidth: '1000px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', alignItems: 'center' }}>
        
        {/* Left Card - Form (Login / Register Switcher) */}
        <div className="glass-card" style={{ padding: '36px', boxShadow: '0 20px 40px rgba(0,0,0,0.5)' }}>
          
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
            <div style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFF',
              boxShadow: '0 0 16px rgba(99,102,241,0.5)'
            }}>
              <Layers size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Nexus Portal</h2>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                {isRegisterMode ? 'Create a new user account' : 'Sign in to Operations Portal'}
              </p>
            </div>
          </div>

          {/* Tab Switcher */}
          <div style={{
            display: 'flex',
            background: 'rgba(13, 19, 34, 0.8)',
            padding: '4px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '20px',
            border: '1px solid var(--border-color)'
          }}>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(false); setError(''); }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '4px',
                background: !isRegisterMode ? 'var(--primary)' : 'transparent',
                color: !isRegisterMode ? '#FFF' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => { setIsRegisterMode(true); setError(''); }}
              style={{
                flex: 1,
                padding: '8px',
                border: 'none',
                borderRadius: '4px',
                background: isRegisterMode ? 'var(--primary)' : 'transparent',
                color: isRegisterMode ? '#FFF' : 'var(--text-muted)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              Register New Account
            </button>
          </div>

          {error && (
            <div style={{
              padding: '12px',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(244, 63, 94, 0.15)',
              border: '1px solid rgba(244, 63, 94, 0.3)',
              color: '#F87171',
              fontSize: '0.85rem',
              marginBottom: '20px'
            }}>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {isRegisterMode && (
              <div className="input-group">
                <label className="input-label">Full Name *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="input-group">
              <label className="input-label">Email Address *</label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. user@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input-group">
              <label className="input-label">Password *</label>
              <input
                type="password"
                className="form-input"
                placeholder="At least 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>

            {isRegisterMode && (
              <div className="input-group">
                <label className="input-label">Select Assigned Role *</label>
                <select
                  className="form-select"
                  value={role}
                  onChange={e => setRole(e.target.value as Role)}
                >
                  <option value="SALES">Sales Executive (CRM & Challans)</option>
                  <option value="WAREHOUSE">Warehouse Manager (Stock & Inventory)</option>
                  <option value="ACCOUNTS">Accounts Executive (Invoices & Billing)</option>
                  <option value="ADMIN">Administrator (Full Access)</option>
                </select>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: '100%', marginTop: '12px', padding: '12px' }}
            >
              {loading
                ? 'Processing...'
                : isRegisterMode
                ? 'Create Account & Enter Portal'
                : 'Sign In to Dashboard'}
              {isRegisterMode ? <UserPlus size={16} /> : <ArrowRight size={16} />}
            </button>
          </form>
        </div>

        {/* Right Card - Quick Demo Login Roles */}
        <div>
          <div style={{ marginBottom: '16px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Or Quick Demo Login</h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>1-Click demo profiles pre-loaded with sample business data:</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {roleDemos.map((demo) => {
              const Icon = demo.icon;
              return (
                <button
                  key={demo.role}
                  onClick={() => handleQuickLogin(demo.email)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '14px 18px',
                    borderRadius: 'var(--radius-md)',
                    background: 'rgba(17, 24, 39, 0.6)',
                    border: `1px solid rgba(255, 255, 255, 0.06)`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textAlign: 'left'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.borderColor = demo.color)}
                  onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.06)')}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{
                      width: '38px',
                      height: '38px',
                      borderRadius: '10px',
                      background: `${demo.color}15`,
                      border: `1px solid ${demo.color}30`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: demo.color
                    }}>
                      <Icon size={20} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#FFF' }}>{demo.title}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{demo.desc}</div>
                    </div>
                  </div>
                  <span className="badge" style={{ background: `${demo.color}20`, color: demo.color }}>
                    {demo.role}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};
