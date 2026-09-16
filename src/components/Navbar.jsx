import React, { useState, useEffect } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Wallet, 
  BarChart3, 
  Settings, 
  Store, 
  Clock, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, cashSession, todaySalesTotal }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const navItems = [
    { id: 'pos', label: 'Ventas (POS)', icon: ShoppingCart, hotkey: 'F1' },
    { id: 'inventory', label: 'Stock e Inventario', icon: Package, hotkey: 'F2' },
    { id: 'cash', label: 'Caja Diaria', icon: Wallet, hotkey: 'F3' },
    { id: 'reports', label: 'Reportes & Ganancias', icon: BarChart3, hotkey: 'F4' },
    { id: 'settings', label: 'Ajustes & Respaldo', icon: Settings },
  ];

  return (
    <header className="navbar">
      <div className="brand-section">
        <div className="brand-icon">
          <Store size={22} />
        </div>
        <div>
          <h1 className="brand-title" style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>
            KioscoPOS
          </h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Control de Stock & Caja
          </span>
        </div>
      </div>

      <nav className="nav-links">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`nav-btn ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.hotkey && (
                <span 
                  style={{ 
                    fontSize: '0.65rem', 
                    padding: '2px 5px', 
                    borderRadius: '4px', 
                    background: isActive ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.06)',
                    color: isActive ? '#fff' : 'var(--text-muted)'
                  }}
                >
                  {item.hotkey}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div className="nav-status">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            <Clock size={14} color="var(--primary)" />
            {currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            Hoy: <strong style={{ color: '#34d399', fontFamily: 'var(--font-mono)' }}>{formatCurrency(todaySalesTotal)}</strong>
          </div>
        </div>

        <div 
          className={`status-badge ${cashSession?.isOpen ? 'open' : 'closed'}`}
          onClick={() => setActiveTab('cash')}
          style={{ cursor: 'pointer' }}
          title="Clic para ver caja"
        >
          {cashSession?.isOpen ? (
            <>
              <CheckCircle2 size={14} />
              <span>Caja Abierta</span>
            </>
          ) : (
            <>
              <AlertCircle size={14} />
              <span>Caja Cerrada</span>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
