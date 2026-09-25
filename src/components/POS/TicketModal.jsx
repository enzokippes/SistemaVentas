import React from 'react';
import { X, Printer, CheckCircle } from 'lucide-react';
import ModalBackdrop from '../Common/ModalBackdrop';

export default function TicketModal({ isOpen, onClose, sale, config }) {
  if (!isOpen || !sale) return null;

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const dateObj = new Date(sale.date);
  const formattedDate = dateObj.toLocaleDateString('es-AR');
  const formattedTime = dateObj.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle size={20} color="#10b981" />
            <h2 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>¡Venta Completada!</h2>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ background: '#f8fafc', color: '#0f172a', padding: '1.5rem', borderRadius: '4px', margin: '1rem' }}>
          {/* Real Thermal Ticket Preview */}
          <div id="printable-ticket" style={{ fontFamily: 'monospace', fontSize: '13px', lineHeight: 1.4 }}>
            <div style={{ textAlign: 'center', marginBottom: '12px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 'bold', margin: '0 0 4px 0' }}>{config?.storeName || 'MINIMERCADO KIPPES'}</h3>
              <div style={{ fontSize: '11px', color: '#475569' }}>{config?.address || 'Dirección del Local'}</div>
              <div style={{ fontSize: '11px', color: '#475569' }}>Tel: {config?.phone || '-'}</div>
              <div style={{ borderBottom: '1px dashed #64748b', margin: '8px 0' }}></div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span>Fecha: {formattedDate}</span>
                <span>Hora: {formattedTime}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ fontWeight: 'bold' }}>
                  {sale.dailyTicketNumber != null 
                    ? `Ticket #${sale.dailyTicketNumber}` 
                    : `Ticket #${sale.id.slice(-6).toUpperCase()}`}
                </span>
                <span>Cliente: {sale.clientName}</span>
              </div>
              <div style={{ borderBottom: '1px dashed #64748b', margin: '8px 0' }}></div>
            </div>

            {/* Items List */}
            <div style={{ marginBottom: '12px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #cbd5e1', textAlign: 'left' }}>
                    <th style={{ paddingBottom: '4px' }}>Cant x Prod</th>
                    <th style={{ textAlign: 'right', paddingBottom: '4px' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {sale.items.map((item, idx) => (
                    <tr key={idx}>
                      <td style={{ padding: '3px 0' }}>
                        <div>{item.product.name}</div>
                        <span style={{ fontSize: '11px', color: '#64748b' }}>
                          {item.quantity} x {formatCurrency(item.unitPrice)}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', verticalAlign: 'top', padding: '3px 0', fontWeight: 'bold' }}>
                        {formatCurrency(item.subtotal)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ borderBottom: '1px dashed #64748b', margin: '8px 0' }}></div>

            {/* Totals */}
            <div style={{ fontSize: '14px', fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
              <span>TOTAL:</span>
              <span style={{ fontSize: '16px' }}>{formatCurrency(sale.total)}</span>
            </div>

            <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
              <span>Medio de Pago:</span>
              <span style={{ textTransform: 'uppercase', fontWeight: 'bold' }}>{sale.paymentMethod}</span>
            </div>

            {sale.paymentMethod === 'efectivo' && (
              <>
                <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Paga con:</span>
                  <span>{formatCurrency(sale.cashGiven)}</span>
                </div>
                <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
                  <span>Vuelto:</span>
                  <span>{formatCurrency(sale.changeGiven)}</span>
                </div>
              </>
            )}

            <div style={{ borderBottom: '1px dashed #64748b', margin: '12px 0 8px 0' }}></div>

            <div style={{ textAlign: 'center', fontSize: '11px', color: '#475569' }}>
              {config?.ticketFooter || '¡Gracias por su compra!'}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar (Esc)
          </button>
          <button type="button" className="btn btn-primary" onClick={handlePrint}>
            <Printer size={18} />
            <span>Imprimir Ticket</span>
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
