import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  Save, 
  Banknote, 
  QrCode, 
  CreditCard, 
  UserCheck, 
  Calendar, 
  Receipt, 
  ChevronDown 
} from 'lucide-react';
import ModalBackdrop from '../Common/ModalBackdrop';

export default function EditSaleModal({ 
  isOpen, 
  onClose, 
  sale, 
  clients = [], 
  onSave 
}) {
  const [paymentMethod, setPaymentMethod] = useState('efectivo');
  const [clientName, setClientName] = useState('Consumidor Final');
  const [date, setDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientDropdownRef = useRef(null);

  useEffect(() => {
    if (isOpen && sale) {
      setPaymentMethod(sale.paymentMethod || 'efectivo');
      setClientName(sale.clientName || 'Consumidor Final');
      setNotes(sale.notes || '');

      // Format ISO date to YYYY-MM-DDTHH:mm for datetime-local input
      if (sale.date) {
        try {
          const d = new Date(sale.date);
          const pad = (n) => String(n).padStart(2, '0');
          const localIso = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
          setDate(localIso);
        } catch {
          setDate('');
        }
      } else {
        setDate('');
      }
    }
  }, [isOpen, sale]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (clientDropdownRef.current && !clientDropdownRef.current.contains(event.target)) {
        setIsClientDropdownOpen(false);
      }
    }
    if (isClientDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isClientDropdownOpen]);

  if (!isOpen || !sale) return null;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (paymentMethod === 'fiado' && (!clientName.trim() || clientName.trim() === 'Consumidor Final')) {
      alert('Debes indicar un cliente para ventas a Cuenta Corriente (Fiado).');
      return;
    }

    const isoDate = date ? new Date(date).toISOString() : sale.date;

    onSave(sale.id, {
      paymentMethod,
      clientName: clientName.trim() || 'Consumidor Final',
      date: isoDate,
      notes: notes.trim()
    });

    onClose();
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '560px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Receipt size={20} color="#2563eb" />
            <div>
              <h3 style={{ margin: 0, fontSize: '1.15rem' }}>
                Modificar Venta {sale.dailyTicketNumber ? `Ticket #${sale.dailyTicketNumber}` : `#${sale.id.slice(-6).toUpperCase()}`}
              </h3>
              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                Total: <strong>{formatCurrency(sale.total)}</strong> | {sale.items?.length || 0} producto{(sale.items?.length || 0) > 1 ? 's' : ''}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
            
            {/* Payment Method Selector */}
            <div>
              <label className="form-label" style={{ marginBottom: '0.4rem' }}>Medio de Pago</label>
              <div className="payment-methods-2x2">
                <div 
                  className={`pm-tile ${paymentMethod === 'efectivo' ? 'active-cash' : ''}`}
                  onClick={() => {
                    setPaymentMethod('efectivo');
                    if (!clientName.trim()) setClientName('Consumidor Final');
                    setIsClientDropdownOpen(false);
                  }}
                >
                  <Banknote size={18} color="#16a34a" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>Efectivo</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Cobro en mano</span>
                  </div>
                </div>

                <div 
                  className={`pm-tile ${paymentMethod === 'tarjeta' ? 'active-card' : ''}`}
                  onClick={() => {
                    setPaymentMethod('tarjeta');
                    if (!clientName.trim()) setClientName('Consumidor Final');
                    setIsClientDropdownOpen(false);
                  }}
                >
                  <CreditCard size={18} color="#2563eb" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>Tarjeta</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Débito / Crédito</span>
                  </div>
                </div>

                <div 
                  className={`pm-tile ${paymentMethod === 'transferencia' ? 'active-transfer' : ''}`}
                  onClick={() => {
                    setPaymentMethod('transferencia');
                    if (!clientName.trim()) setClientName('Consumidor Final');
                    setIsClientDropdownOpen(false);
                  }}
                >
                  <QrCode size={18} color="#9333ea" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>Transferencia</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Mercado Pago / QR</span>
                  </div>
                </div>

                <div 
                  className={`pm-tile ${paymentMethod === 'fiado' ? 'active-credit' : ''}`}
                  onClick={() => {
                    setPaymentMethod('fiado');
                    if (clientName === 'Consumidor Final') setClientName('');
                    setIsClientDropdownOpen(true);
                  }}
                >
                  <UserCheck size={18} color="#ca8a04" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>Cuenta Corriente</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Anotar en fiados</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Client Selector */}
            <div className="form-group" style={{ margin: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                <label className="form-label" style={{ margin: 0 }}>
                  {paymentMethod === 'fiado' ? 'Cliente Cuenta Corriente (Obligatorio) *' : 'Cliente'}
                </label>
                {clients.length > 0 && (
                  <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                    {clients.length} cliente{clients.length > 1 ? 's' : ''} registrado{clients.length > 1 ? 's' : ''}
                  </span>
                )}
              </div>

              <div ref={clientDropdownRef} style={{ position: 'relative' }}>
                <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                  <input
                    type="text"
                    className="form-input"
                    value={clientName}
                    onChange={(e) => {
                      setClientName(e.target.value);
                      setIsClientDropdownOpen(true);
                    }}
                    onFocus={(e) => {
                      e.target.select();
                      setIsClientDropdownOpen(true);
                    }}
                    onClick={() => setIsClientDropdownOpen(true)}
                    placeholder={paymentMethod === 'fiado' ? "Buscar o seleccionar cliente..." : "Consumidor Final o nombre..."}
                    required={paymentMethod === 'fiado'}
                    style={{ paddingRight: clientName ? '4.8rem' : '2.6rem' }}
                  />

                  {clientName && (
                    <button
                      type="button"
                      onClick={() => {
                        setClientName('');
                        setIsClientDropdownOpen(true);
                      }}
                      title="Borrar texto"
                      style={{
                        position: 'absolute',
                        right: '2.3rem',
                        background: 'transparent',
                        border: 'none',
                        color: '#94a3b8',
                        cursor: 'pointer',
                        padding: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.color = '#ef4444'}
                      onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
                    >
                      <X size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setIsClientDropdownOpen((prev) => !prev)}
                    title={isClientDropdownOpen ? "Ocultar clientes" : "Mostrar clientes"}
                    style={{
                      position: 'absolute',
                      right: '0.5rem',
                      background: 'transparent',
                      border: 'none',
                      color: isClientDropdownOpen ? '#2563eb' : '#64748b',
                      cursor: 'pointer',
                      padding: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <ChevronDown 
                      size={18} 
                      style={{ 
                        transform: isClientDropdownOpen ? 'rotate(180deg)' : 'none', 
                        transition: 'transform 0.15s ease' 
                      }} 
                    />
                  </button>
                </div>

                {/* Dropdown Menu with Clients */}
                {isClientDropdownOpen && (
                  <div 
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 4px)',
                      left: 0,
                      right: 0,
                      maxHeight: '190px',
                      overflowY: 'auto',
                      backgroundColor: 'var(--bg-surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.2))',
                      zIndex: 60,
                      padding: '0.25rem 0'
                    }}
                  >
                    {paymentMethod !== 'fiado' && (
                      <div
                        onClick={() => {
                          setClientName('Consumidor Final');
                          setIsClientDropdownOpen(false);
                        }}
                        style={{
                          padding: '0.5rem 0.75rem',
                          cursor: 'pointer',
                          borderBottom: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          backgroundColor: clientName === 'Consumidor Final' ? 'var(--bg-hover)' : 'transparent'
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = clientName === 'Consumidor Final' ? 'var(--bg-hover)' : 'transparent'}
                      >
                        <div>
                          <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>Consumidor Final</strong>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Venta general sin cuenta corriente</div>
                        </div>
                      </div>
                    )}

                    {(() => {
                      const query = clientName.trim().toLowerCase();
                      const filtered = clients.filter((c) => {
                        if (!query || query === 'consumidor final') return true;
                        return (
                          c.name.toLowerCase().includes(query) ||
                          (c.phone && c.phone.toLowerCase().includes(query))
                        );
                      });

                      if (filtered.length > 0) {
                        return filtered.map((c) => (
                          <div
                            key={c.id}
                            onClick={() => {
                              setClientName(c.name);
                              setIsClientDropdownOpen(false);
                            }}
                            style={{
                              padding: '0.55rem 0.75rem',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              borderBottom: '1px solid var(--border)',
                              transition: 'background-color 0.12s',
                              backgroundColor: c.name.toLowerCase() === clientName.trim().toLowerCase() ? 'var(--primary-light)' : 'transparent'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-hover)'}
                            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = c.name.toLowerCase() === clientName.trim().toLowerCase() ? 'var(--primary-light)' : 'transparent'}
                          >
                            <div>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{c.name}</strong>
                              {c.phone && (
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                  Tel: {c.phone}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px' }}>
                              <span 
                                style={{
                                  fontSize: '0.7rem',
                                  fontWeight: 700,
                                  padding: '1px 6px',
                                  borderRadius: '4px',
                                  backgroundColor: c.currentDebt > 0 ? '#fef2f2' : '#f0fdf4',
                                  color: c.currentDebt > 0 ? '#dc2626' : '#16a34a',
                                  border: `1px solid ${c.currentDebt > 0 ? '#fecaca' : '#bbf7d0'}`
                                }}
                              >
                                Deuda: {formatCurrency(c.currentDebt)}
                              </span>
                              <span style={{ fontSize: '0.68rem', color: '#64748b' }}>
                                Límite: {(c.unlimitedCredit || c.creditLimit === null) ? '∞ Ilimitado' : formatCurrency(c.creditLimit)}
                              </span>
                            </div>
                          </div>
                        ));
                      }

                      return (
                        <div style={{ padding: '0.75rem', textAlign: 'center', color: '#64748b', fontSize: '0.8rem' }}>
                          {clientName.trim() ? (
                            <>
                              <div>No hay clientes registrados con <strong>"{clientName}"</strong></div>
                              <div style={{ fontSize: '0.72rem', color: '#2563eb', marginTop: '0.25rem' }}>
                                ℹ️ Se creará automáticamente al guardar la venta
                              </div>
                            </>
                          ) : (
                            <div>No hay clientes registrados todavía</div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                )}
              </div>
            </div>

            {/* Date & Time */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.35rem' }}>
                <Calendar size={15} color="#2563eb" />
                <span>Fecha y Hora de la Venta</span>
              </label>
              <input
                type="datetime-local"
                className="form-input"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            {/* Notes */}
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ marginBottom: '0.35rem' }}>Notas / Observaciones</label>
              <input
                type="text"
                className="form-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Ej: Cambio de medio de pago acordado, pago pendiente..."
              />
            </div>

            {/* Items Summary Preview */}
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '0.75rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', display: 'block', marginBottom: '0.35rem' }}>
                Artículos del Ticket ({sale.items?.length || 0})
              </span>
              <div style={{ maxHeight: '100px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {sale.items?.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#334155' }}>
                    <span>{item.quantity}x {item.product?.name}</span>
                    <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(item.subtotal)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Save size={16} />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}
