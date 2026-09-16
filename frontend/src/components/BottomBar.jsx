import React from 'react';
import { ShoppingCart, CreditCard, Banknote, Printer, FileText } from 'lucide-react';

export default function BottomBar({ 
  lastSale, 
  onPrintLastTicket, 
  onOpenDaySales 
}) {
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const total = lastSale?.total || 0;
  const cashGiven = lastSale?.cashGiven || 0;
  const changeGiven = lastSale?.changeGiven || 0;

  return (
    <footer className="bottom-bar">
      {/* Left: Last transaction quick stats */}
      <div className="bottom-stats">
        <div className="bottom-stat-group">
          <ShoppingCart size={18} color="#64748b" />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span className="bottom-stat-title">Total:</span>
            <span className="bottom-stat-amount">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="bottom-stat-group">
          <div className="bottom-badge-blue">
            <CreditCard size={16} />
            <span>Pagó con: <strong>{formatCurrency(cashGiven)}</strong></span>
          </div>
        </div>

        <div className="bottom-stat-group">
          <div className="bottom-badge-green">
            <Banknote size={16} />
            <span>Cambio: <strong>{formatCurrency(changeGiven)}</strong></span>
          </div>
        </div>
      </div>

      {/* Right: Quick action buttons */}
      <div className="bottom-actions">
        <button 
          className="btn-bottom-outline" 
          onClick={onPrintLastTicket}
          disabled={!lastSale}
          style={{ opacity: lastSale ? 1 : 0.6 }}
        >
          <Printer size={16} />
          <span>Imprimir Último Ticket</span>
        </button>

        <button className="btn-bottom-outline" onClick={onOpenDaySales}>
          <FileText size={16} />
          <span>Ventas del día y Devoluciones</span>
        </button>
      </div>
    </footer>
  );
}
