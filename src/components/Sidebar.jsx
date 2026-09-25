import React from 'react';
import { 
  ShoppingCart, 
  Package, 
  Tags, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut,
  Wallet
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout, storeName = 'MiniMercado Kippes', config }) {
  const showCash = config?.showCashModule !== false;

  const menuItems = [
    { id: 'pos', label: 'Ventas', icon: ShoppingCart, key: 'F1' },
    { id: 'inventory', label: 'Productos', icon: Package, key: 'F2' },
    { id: 'clients', label: 'Clientes', icon: Users, key: 'F3' },
    ...(showCash ? [{ id: 'cashregister', label: 'Caja', icon: Wallet, key: 'F4' }] : []),
    { id: 'reports', label: 'Reportes', icon: BarChart3, key: 'F5' },
    { id: 'categories', label: 'Categorías', icon: Tags },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  return (
    <aside className="app-sidebar">
      <div>
        {/* Brand Logo & Name */}
        <div className="sidebar-brand">
          <div className="brand-icon-box">
            <ShoppingCart size={20} />
          </div>
          <div>
            <div className="brand-text-title">{storeName || 'MiniMercado Kippes'}</div>
            <div className="brand-text-subtitle">PUNTO DE VENTA</div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="sidebar-menu">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`sidebar-item ${isActive ? 'active' : ''}`}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </div>
                {item.key && (
                  <span style={{ 
                    fontSize: '0.68rem', 
                    color: isActive ? '#93C5FD' : '#64748B', 
                    backgroundColor: isActive ? 'rgba(37, 99, 235, 0.2)' : 'rgba(255, 255, 255, 0.05)', 
                    padding: '2px 5px', 
                    borderRadius: '4px',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 600
                  }}>
                    {item.key}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Logout / Exit at Bottom */}
      <div className="sidebar-footer">
        <button className="sidebar-logout-btn" onClick={onLogout} title="Cerrar turno / salir">
          <LogOut size={18} />
          <span>Salir</span>
        </button>
      </div>
    </aside>
  );
}
