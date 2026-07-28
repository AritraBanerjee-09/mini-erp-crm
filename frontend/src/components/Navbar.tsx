import React from 'react';
import { useAuth } from '../context/AuthContext';
import { LogOut, User as UserIcon, Shield, Layers } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();

  const getRoleBadgeClass = (role?: string) => {
    switch (role) {
      case 'ADMIN': return 'badge-admin';
      case 'SALES': return 'badge-sales';
      case 'WAREHOUSE': return 'badge-warehouse';
      case 'ACCOUNTS': return 'badge-accounts';
      default: return '';
    }
  };

  return (
    <header style={{
      height: '64px',
      background: 'rgba(13, 19, 34, 0.9)',
      backdropFilter: 'blur(12px)',
      borderBottom: '1px solid var(--border-color)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 32px',
      position: 'sticky',
      top: 0,
      zIndex: 100
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '10px',
          background: 'linear-gradient(135deg, #6366F1, #4F46E5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#FFF',
          boxShadow: '0 0 12px rgba(99,102,241,0.4)'
        }}>
          <Layers size={20} />
        </div>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.02em', background: 'linear-gradient(to right, #FFF, #94A3B8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            NEXUS ERP <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--primary)', WebkitTextFillColor: 'initial' }}>+ CRM</span>
          </h1>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Wholesale & Distribution Portal</p>
        </div>
      </div>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: 'rgba(255,255,255,0.03)', padding: '6px 14px', borderRadius: '20px', border: '1px solid var(--border-color)' }}>
            <UserIcon size={16} style={{ color: 'var(--text-muted)' }} />
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>{user.name}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{user.email}</div>
            </div>
            <span className={`badge ${getRoleBadgeClass(user.role)}`}>
              <Shield size={10} />
              {user.role}
            </span>
          </div>

          <button
            onClick={logout}
            className="btn btn-secondary btn-sm"
            title="Sign out"
            style={{ color: '#F87171', borderColor: 'rgba(244, 63, 94, 0.2)' }}
          >
            <LogOut size={15} />
            Logout
          </button>
        </div>
      )}
    </header>
  );
};
