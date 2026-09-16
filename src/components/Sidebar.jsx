import React from 'react';
import { 
  ShoppingCart, 
  Package, 
  Tags, 
  Users, 
  BarChart3, 
  Settings, 
  LogOut 
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onLogout, storeName = 'MiniMercado Kippes' }) {
  const menuItems = [
    { id: 'pos', label: 'Ventas', icon: ShoppingCart },
    { id: 'inventory', label: 'Productos', icon: Package },
    { id: 'categories', label: 'Categorías', icon: Tags },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'reports', label: 'Reportes', icon: BarChart3 },
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
              >
                <Icon size={18} />
                <span>{item.label}</span>
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
