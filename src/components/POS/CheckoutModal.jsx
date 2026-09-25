import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  X, 
  Banknote, 
  QrCode, 
  CreditCard, 
  UserCheck, 
  Check, 
  Calculator,
  ChevronDown
} from 'lucide-react';
import ModalBackdrop from '../Common/ModalBackdrop';

const PAYMENT_METHODS = [
  { id: 'efectivo',      label: 'Efectivo',               subtitle: 'Calcula vuelto',      icon: Banknote,   color: '#16a34a' },
  { id: 'transferencia', label: 'Transferencia',          subtitle: 'QR / Mercado Pago',   icon: QrCode,     color: '#2563eb' },
  { id: 'tarjeta',       label: 'Tarjeta',                subtitle: 'Débito / Crédito',    icon: CreditCard, color: '#7c3aed' },
  { id: 'fiado',         label: 'Cliente (Cuenta Cte)',   subtitle: 'Anotar fiado',        icon: UserCheck,  color: '#d97706' },
];

const GRID_NAV = {
  efectivo: {
    ArrowRight: 'transferencia',
    ArrowDown: 'tarjeta',
    ArrowLeft: 'transferencia',
    ArrowUp: 'tarjeta',
  },
  transferencia: {
    ArrowLeft: 'efectivo',
    ArrowDown: 'fiado',
    ArrowRight: 'efectivo',
    ArrowUp: 'fiado',
  },
  tarjeta: {
    ArrowUp: 'efectivo',
    ArrowRight: 'fiado',
    ArrowDown: 'efectivo',
    ArrowLeft: 'fiado',
  },
  fiado: {
    ArrowUp: 'transferencia',
    ArrowLeft: 'tarjeta',
    ArrowDown: 'transferencia',
    ArrowRight: 'tarjeta',
  },
};

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  total, 
  initialPaymentMethod = 'efectivo',
  onConfirmSale, 
  clients = []
}) {
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod);
  const [cashGiven, setCashGiven] = useState('');
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');
  const [cardType, setCardType] = useState('debito');
  const [refNumber, setRefNumber] = useState('');
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const [highlightedClientIndex, setHighlightedClientIndex] = useState(0);

  const clientDropdownRef = useRef(null);
  const cashInputRef = useRef(null);
  const clientInputRef = useRef(null);

  // Initialize modal state on open
  useEffect(() => {
    if (isOpen) {
      const pm = initialPaymentMethod || 'efectivo';
      setPaymentMethod(pm);
      setCashGiven(total.toString());
      setClientName(pm === 'fiado' ? '' : 'Consumidor Final');
      setNotes('');
      setRefNumber('');
      setCardType('debito');
      setIsClientDropdownOpen(false);
      setHighlightedClientIndex(0);
      if (pm === 'efectivo') {
        setTimeout(() => {
          cashInputRef.current?.focus();
          cashInputRef.current?.select();
        }, 60);
      } else if (pm === 'fiado') {
        setTimeout(() => {
          clientInputRef.current?.focus();
        }, 60);
      }
    }
  }, [isOpen, total, initialPaymentMethod]);

  // Click outside client dropdown
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

  const numCashGiven = Number(cashGiven) || 0;
  const changeDue = Math.max(0, numCashGiven - total);
  const isCashSufficient = paymentMethod !== 'efectivo' || numCashGiven >= total;
  const isFiadoValid = paymentMethod !== 'fiado' || clientName.trim().length > 0;
  const canConfirm = isCashSufficient && isFiadoValid;

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const handleQuickCash = (amount) => {
    setCashGiven(amount.toString());
  };

  const handleAddCash = (amount) => {
    setCashGiven((prev) => ((Number(prev) || 0) + amount).toString());
  };

  const handleConfirm = useCallback(() => {
    if (!canConfirm) return;

    let finalNotes = notes.trim();
    if (paymentMethod === 'transferencia' && refNumber.trim()) {
      finalNotes = finalNotes ? `${finalNotes} | Comprobante: ${refNumber.trim()}` : `Comprobante: ${refNumber.trim()}`;
    } else if (paymentMethod === 'tarjeta') {
      const cardTypeLabel = cardType === 'debito' ? 'Débito' : cardType === 'credito_cuotas' ? 'Crédito Cuotas' : 'Crédito 1 Pago';
      const cardDetail = refNumber.trim() ? `${cardTypeLabel} (Cupón: ${refNumber.trim()})` : cardTypeLabel;
      finalNotes = finalNotes ? `${finalNotes} | ${cardDetail}` : cardDetail;
    }

    onConfirmSale({
      paymentMethod,
      cashGiven: paymentMethod === 'efectivo' ? numCashGiven : total,
      changeGiven: paymentMethod === 'efectivo' ? changeDue : 0,
      clientName: paymentMethod === 'fiado' ? (clientName.trim() || 'Cliente Cta Cte') : 'Consumidor Final',
      notes: finalNotes
    });
  }, [canConfirm, onConfirmSale, paymentMethod, numCashGiven, total, changeDue, clientName, notes, cardType, refNumber]);

  // Handle switching payment method via arrow keys or click
  const selectMethod = useCallback((newMethod) => {
    setPaymentMethod(newMethod);
    setIsClientDropdownOpen(false);
    setHighlightedClientIndex(0);
    if (newMethod === 'fiado') {
      if (clientName === 'Consumidor Final') setClientName('');
      setTimeout(() => clientInputRef.current?.focus(), 50);
    } else {
      setClientName('Consumidor Final');
      if (newMethod === 'efectivo') {
        setTimeout(() => cashInputRef.current?.select(), 50);
      }
    }
  }, [clientName]);

  // Clients filtered list for fiado
  const filteredClients = clients.filter((c) => {
    const q = clientName.trim().toLowerCase();
    if (!q || q === 'consumidor final') return true;
    return c.name.toLowerCase().includes(q) || (c.phone && c.phone.toLowerCase().includes(q));
  });

  // Global Keydown Handler inside Checkout Modal
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      // F2 → Confirmar y Finalizar Venta
      if (e.key === 'F2') {
        e.preventDefault();
        e.stopPropagation();
        handleConfirm();
        return;
      }

      // Escape → Close
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        if (isClientDropdownOpen) {
          setIsClientDropdownOpen(false);
        } else {
          onClose();
        }
        return;
      }

      // Arrow navigation between Payment Methods (←, →, ↑, ↓)
      const isArrowKey = e.key === 'ArrowLeft' || e.key === 'ArrowRight' || e.key === 'ArrowUp' || e.key === 'ArrowDown';

      if (isArrowKey) {
        // If client dropdown is explicitly open and user is browsing it with ArrowDown:
        if (paymentMethod === 'fiado' && isClientDropdownOpen) {
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedClientIndex((prev) => (prev >= filteredClients.length - 1 ? 0 : prev + 1));
            return;
          }
          if (e.key === 'ArrowUp' && highlightedClientIndex > 0) {
            e.preventDefault();
            setHighlightedClientIndex((prev) => prev - 1);
            return;
          }
          // If at the top of client list (index 0) and pressing ArrowUp -> exit dropdown and switch to Transferencia!
          setIsClientDropdownOpen(false);
        }

        // 2D Spatial Grid navigation between Payment Methods
        e.preventDefault();
        e.stopPropagation();
        const nextMethod = GRID_NAV[paymentMethod]?.[e.key];
        if (nextMethod) {
          selectMethod(nextMethod);
        }
        return;
      }

      // Enter key
      if (e.key === 'Enter') {
        // If in client dropdown selecting a client
        if (paymentMethod === 'fiado' && isClientDropdownOpen && filteredClients.length > 0) {
          e.preventDefault();
          const selected = filteredClients[Math.max(0, Math.min(highlightedClientIndex, filteredClients.length - 1))];
          if (selected) {
            setClientName(selected.name);
            setIsClientDropdownOpen(false);
          }
          return;
        }

        // Otherwise: Enter confirms and finalizes
        e.preventDefault();
        handleConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [isOpen, paymentMethod, isClientDropdownOpen, filteredClients, highlightedClientIndex, selectMethod, handleConfirm, onClose]);

  if (!isOpen) return null;

  return (
    <ModalBackdrop onClose={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: '540px', 
          width: '95vw', 
          minHeight: '625px', 
          height: '625px', 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'space-between',
          overflow: 'visible'
        }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={20} color="var(--primary)" />
            <h3 style={{ fontSize: '1.2rem', color: 'var(--text-main)', margin: 0 }}>Cobrar Venta (F12)</h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* Total Display Banner */}
          <div 
            style={{
              backgroundColor: 'var(--bg-hover)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.1rem',
              textAlign: 'center',
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
              Total a Cobrar
            </span>
            <div 
              style={{ 
                fontFamily: 'var(--font-mono)', 
                fontSize: '2.5rem', 
                fontWeight: 800, 
                color: 'var(--success, #16a34a)', 
                marginTop: '0.15rem' 
              }}
            >
              {formatCurrency(total)}
            </div>
          </div>

          {/* Payment Method Selector (Arrow keys navigate) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.45rem' }}>
              <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>
                Método de Pago
              </label>
              <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 7px', borderRadius: '4px', border: '1px solid var(--border)' }}>
                Flechitas (↑ ↓ ← →) para cambiar
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.6rem' }}>
              {PAYMENT_METHODS.map(({ id, label, subtitle, icon: Icon, color }) => {
                const isActive = paymentMethod === id;
                return (
                  <div 
                    key={id}
                    onClick={() => selectMethod(id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 0.9rem',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      border: isActive ? `2.5px solid ${color}` : '1.5px solid var(--border)',
                      backgroundColor: isActive ? `${color}15` : 'var(--bg-surface)',
                      boxShadow: isActive ? `0 0 0 2px ${color}30` : 'none',
                      transition: 'all 0.12s ease',
                      position: 'relative'
                    }}
                  >
                    <div 
                      style={{ 
                        width: '36px', height: '36px', borderRadius: '8px',
                        backgroundColor: isActive ? `${color}25` : 'var(--bg-hover)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                      }}
                    >
                      <Icon size={20} color={isActive ? color : 'var(--text-muted)'} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ display: 'block', fontSize: '0.88rem', color: isActive ? color : 'var(--text-main)' }}>
                        {label}
                      </strong>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        {subtitle}
                      </span>
                    </div>
                    {isActive && (
                      <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: color }} />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Uniform Height Payment Method Panels (Fixed 258px container to prevent modal layout shift) */}
          {paymentMethod === 'efectivo' && (
            <div 
              style={{ 
                height: '258px', 
                boxSizing: 'border-box', 
                background: 'var(--bg-hover)', 
                padding: '0.9rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border)', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                position: 'relative' 
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700, fontSize: '0.88rem' }}>
                    ¿Con cuánto paga el cliente?
                  </label>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(total)}
                    style={{ 
                      background: 'var(--primary-light)', 
                      border: '1px solid var(--border)', 
                      color: 'var(--primary)', 
                      borderRadius: '4px', 
                      padding: '2px 8px', 
                      fontSize: '0.75rem', 
                      fontWeight: 600,
                      cursor: 'pointer' 
                    }}
                  >
                    Monto Exacto
                  </button>
                </div>

                <input
                  ref={cashInputRef}
                  type="number"
                  className="form-input"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  onFocus={(e) => e.target.select()}
                  onKeyDown={(e) => {
                    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                      e.preventDefault();
                    }
                  }}
                  placeholder="0"
                  style={{ fontSize: '1.55rem', fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'right', padding: '0.35rem 0.75rem' }}
                />

                {/* Quick Bills Buttons */}
                <div className="bill-buttons" style={{ marginTop: '0.5rem', gap: '0.35rem' }}>
                  <button type="button" className="bill-btn" onClick={() => handleAddCash(1000)}>+$1.000</button>
                  <button type="button" className="bill-btn" onClick={() => handleAddCash(2000)}>+$2.000</button>
                  <button type="button" className="bill-btn" onClick={() => handleAddCash(5000)}>+$5.000</button>
                  <button type="button" className="bill-btn" onClick={() => handleQuickCash(10000)}>$10.000</button>
                  <button type="button" className="bill-btn" onClick={() => handleQuickCash(20000)}>$20.000</button>
                  <button type="button" className="bill-btn" onClick={() => handleQuickCash(50000)}>$50.000</button>
                </div>
              </div>

              <div>
                <div 
                  style={{ 
                    padding: '0.65rem 0.9rem', 
                    borderRadius: 'var(--radius-sm)', 
                    background: changeDue > 0 ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-input)',
                    border: `1px solid ${changeDue > 0 ? 'rgba(34, 197, 94, 0.4)' : 'var(--border)'}`,
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}
                >
                  <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>Vuelto a entregar:</span>
                  <span 
                    style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '1.45rem', 
                      fontWeight: 800, 
                      color: changeDue > 0 ? '#16a34a' : 'var(--text-muted)' 
                    }}
                  >
                    {formatCurrency(changeDue)}
                  </span>
                </div>

                {!isCashSufficient && (
                  <div style={{ color: '#dc2626', fontSize: '0.78rem', marginTop: '0.3rem', textAlign: 'right', fontWeight: 600 }}>
                    * Falta abonar {formatCurrency(total - numCashGiven)}
                  </div>
                )}
              </div>
            </div>
          )}

          {paymentMethod === 'transferencia' && (
            <div 
              style={{ 
                height: '258px', 
                boxSizing: 'border-box', 
                background: 'var(--bg-hover)', 
                padding: '0.9rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border)', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                position: 'relative' 
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontWeight: 700, fontSize: '0.9rem' }}>
                    <QrCode size={18} />
                    <span>Transferencia / QR / Mercado Pago</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#2563eb', backgroundColor: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.25)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Acreditación en cuenta
                  </span>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600 }}>
                      Monto exacto a transferir
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Escanear QR o transferir al alias del local
                    </span>
                  </div>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.45rem', color: '#2563eb', fontWeight: 800 }}>
                    {formatCurrency(total)}
                  </strong>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ margin: '0 0 0.3rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  N° de Comprobante / Referencia (Opcional)
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Ej: 1489201 ó últimos 4 dígitos..."
                  value={refNumber}
                  onChange={(e) => setRefNumber(e.target.value)}
                  style={{ fontSize: '0.88rem', padding: '0.45rem 0.75rem' }}
                />
              </div>

              <div style={{ padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-sm)', background: 'rgba(37, 99, 235, 0.08)', border: '1px solid rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Check size={18} color="#2563eb" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: '#1e40af', lineHeight: 1.3 }}>
                  <strong>Pago sin efectivo:</strong> El importe se registra acreditado en cuenta bancaria / digital. No requiere vuelto.
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'tarjeta' && (
            <div 
              style={{ 
                height: '258px', 
                boxSizing: 'border-box', 
                background: 'var(--bg-hover)', 
                padding: '0.9rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border)', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                position: 'relative' 
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#7c3aed', fontWeight: 700, fontSize: '0.9rem' }}>
                    <CreditCard size={18} />
                    <span>Cobro con Tarjeta (Posnet / Terminal)</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#7c3aed', backgroundColor: 'rgba(124, 58, 237, 0.1)', border: '1px solid rgba(124, 58, 237, 0.25)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    Terminal / Posnet
                  </span>
                </div>

                <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', padding: '0.65rem 0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.03em', fontWeight: 600 }}>
                      Monto a pasar por el posnet
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      Pasar tarjeta física, chip o sin contacto (NFC)
                    </span>
                  </div>
                  <strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.45rem', color: '#7c3aed', fontWeight: 800 }}>
                    {formatCurrency(total)}
                  </strong>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '0.6rem', alignItems: 'flex-end' }}>
                <div>
                  <label className="form-label" style={{ margin: '0 0 0.3rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Modalidad de Tarjeta
                  </label>
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    {[
                      { id: 'debito', label: 'Débito' },
                      { id: 'credito_1', label: 'Crédito' },
                      { id: 'credito_cuotas', label: 'Cuotas' }
                    ].map(t => (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setCardType(t.id)}
                        style={{
                          flex: 1,
                          padding: '0.35rem 0.2rem',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          borderRadius: '4px',
                          border: cardType === t.id ? '1.5px solid #7c3aed' : '1px solid var(--border)',
                          backgroundColor: cardType === t.id ? '#7c3aed' : 'var(--bg-surface)',
                          color: cardType === t.id ? '#ffffff' : 'var(--text-main)',
                          cursor: 'pointer'
                        }}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ margin: '0 0 0.3rem 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    N° Cupón / Lote (Opc.)
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Cupón 842..."
                    value={refNumber}
                    onChange={(e) => setRefNumber(e.target.value)}
                    style={{ fontSize: '0.82rem', padding: '0.35rem 0.6rem' }}
                  />
                </div>
              </div>

              <div style={{ padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-sm)', background: 'rgba(124, 58, 237, 0.08)', border: '1px solid rgba(124, 58, 237, 0.2)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <Check size={18} color="#7c3aed" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: '#5b21b6', lineHeight: 1.3 }}>
                  <strong>Cobro electrónico:</strong> Registrado mediante comprobante de terminal. No requiere entrega de cambio.
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'fiado' && (
            <div 
              style={{ 
                height: '258px', 
                boxSizing: 'border-box', 
                background: 'var(--bg-hover)', 
                padding: '0.9rem 1rem', 
                borderRadius: 'var(--radius-md)', 
                border: '1px solid var(--border)', 
                display: 'flex', 
                flexDirection: 'column', 
                justifyContent: 'space-between', 
                position: 'relative' 
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#d97706', fontWeight: 700, fontSize: '0.9rem' }}>
                    <UserCheck size={18} />
                    <span>Seleccionar Cliente (Cuenta Corriente) *</span>
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#d97706', backgroundColor: 'rgba(217, 119, 6, 0.1)', border: '1px solid rgba(217, 119, 6, 0.25)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                    {clients.length} cliente{clients.length !== 1 ? 's' : ''}
                  </span>
                </div>

                <div ref={clientDropdownRef} style={{ position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', position: 'relative' }}>
                    <input
                      ref={clientInputRef}
                      type="text"
                      className="form-input"
                      value={clientName}
                      onChange={(e) => {
                        setClientName(e.target.value);
                        setIsClientDropdownOpen(true);
                        setHighlightedClientIndex(0);
                      }}
                      onFocus={(e) => {
                        e.target.select();
                      }}
                      onClick={() => setIsClientDropdownOpen(true)}
                      placeholder="Buscar o escribir nombre del cliente..."
                      required
                      style={{ paddingRight: clientName ? '4.8rem' : '2.6rem' }}
                    />

                    {clientName && (
                      <button
                        type="button"
                        onClick={() => {
                          setClientName('');
                          setIsClientDropdownOpen(true);
                          clientInputRef.current?.focus();
                        }}
                        title="Borrar texto"
                        style={{
                          position: 'absolute', right: '2.3rem', background: 'transparent',
                          border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}
                      >
                        <X size={15} />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsClientDropdownOpen((prev) => !prev)}
                      title={isClientDropdownOpen ? "Ocultar clientes" : "Mostrar clientes"}
                      style={{
                        position: 'absolute', right: '0.5rem', background: 'transparent',
                        border: 'none', color: isClientDropdownOpen ? '#2563eb' : '#64748b',
                        cursor: 'pointer', padding: '4px', display: 'flex', alignItems: 'center'
                      }}
                    >
                      <ChevronDown 
                        size={18} 
                        style={{ transform: isClientDropdownOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s ease' }} 
                      />
                    </button>
                  </div>

                  {/* Dropdown Menu with Clients */}
                  {isClientDropdownOpen && (
                    <div 
                      style={{
                        position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
                        maxHeight: '180px', overflowY: 'auto', backgroundColor: 'var(--bg-surface)',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
                        boxShadow: 'var(--shadow-lg, 0 10px 25px -5px rgba(0, 0, 0, 0.25))',
                        zIndex: 100, padding: '0.25rem 0'
                      }}
                    >
                      {filteredClients.length > 0 ? (
                        filteredClients.map((c, idx) => {
                          const isHighlighted = idx === highlightedClientIndex;
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                setClientName(c.name);
                                setIsClientDropdownOpen(false);
                              }}
                              style={{
                                padding: '0.55rem 0.75rem', cursor: 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                borderBottom: '1px solid var(--border)',
                                backgroundColor: isHighlighted ? 'rgba(217, 119, 6, 0.12)' : 'transparent'
                              }}
                              onMouseEnter={() => setHighlightedClientIndex(idx)}
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
                                    fontSize: '0.7rem', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
                                    backgroundColor: c.currentDebt > 0 ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
                                    color: c.currentDebt > 0 ? '#ef4444' : '#16a34a',
                                    border: `1px solid ${c.currentDebt > 0 ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`
                                  }}
                                >
                                  Deuda: {formatCurrency(c.currentDebt)}
                                </span>
                                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
                                  Límite: {(c.unlimitedCredit || c.creditLimit === null) ? '∞ Ilimitado' : formatCurrency(c.creditLimit)}
                                </span>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div style={{ padding: '0.75rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {clientName.trim() ? (
                            <>
                              <div>No hay clientes registrados con <strong>"{clientName}"</strong></div>
                              <div style={{ fontSize: '0.72rem', color: '#d97706', marginTop: '0.25rem', fontWeight: 600 }}>
                                ℹ️ Se creará automáticamente al finalizar la venta
                              </div>
                            </>
                          ) : (
                            <div>No hay clientes registrados todavía</div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div>
                {(() => {
                  const matchedClient = clients.find(c => c.name.toLowerCase() === clientName.trim().toLowerCase());
                  if (matchedClient) {
                    const newTotalDebt = (matchedClient.currentDebt || 0) + total;
                    const hasLimit = !matchedClient.unlimitedCredit && matchedClient.creditLimit !== null && matchedClient.creditLimit !== undefined;
                    const isOverLimit = hasLimit && newTotalDebt > matchedClient.creditLimit;
                    return (
                      <div style={{ 
                        padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem',
                        backgroundColor: isOverLimit ? '#fef2f2' : 'var(--bg-surface)',
                        border: `1px solid ${isOverLimit ? '#fecaca' : 'var(--border)'}`,
                        color: isOverLimit ? '#991b1b' : 'var(--text-main)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                          <span>Deuda actual: <strong style={{ color: matchedClient.currentDebt > 0 ? '#ef4444' : '#16a34a' }}>{formatCurrency(matchedClient.currentDebt)}</strong></span>
                          <span>Límite: <strong style={{ color: '#0284c7' }}>{(matchedClient.unlimitedCredit || matchedClient.creditLimit === null) ? '∞ Ilimitado' : formatCurrency(matchedClient.creditLimit)}</strong></span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, paddingTop: '0.25rem', borderTop: '1px dashed var(--border)' }}>
                          <span>Nuevo saldo tras esta compra:</span>
                          <span style={{ fontSize: '1rem', fontFamily: 'var(--font-mono)', color: isOverLimit ? '#dc2626' : '#d97706' }}>
                            {formatCurrency(newTotalDebt)}
                          </span>
                        </div>
                        {isOverLimit && (
                          <div style={{ fontSize: '0.75rem', color: '#dc2626', marginTop: '0.2rem', fontWeight: 600 }}>
                            ⚠️ Esta venta supera el límite de crédito acordado para el cliente.
                          </div>
                        )}
                      </div>
                    );
                  }
                  return (
                    <div style={{ 
                      padding: '0.55rem 0.85rem', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem',
                      backgroundColor: 'var(--bg-surface)', border: '1px dashed var(--border)',
                      color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem'
                    }}>
                      <UserCheck size={18} color="#d97706" style={{ flexShrink: 0 }} />
                      <span>
                        {clientName.trim() 
                          ? `Cliente nuevo "${clientName.trim()}". Se registrará la deuda de esta compra en su cuenta.` 
                          : 'Seleccioná un cliente de la lista o escribí su nombre para anotar la venta fiada.'}
                      </span>
                    </div>
                  );
                })()}
              </div>

              <div style={{ padding: '0.65rem 0.9rem', borderRadius: 'var(--radius-sm)', background: 'rgba(217, 119, 6, 0.08)', border: '1px solid rgba(217, 119, 6, 0.2)', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <UserCheck size={18} color="#d97706" style={{ flexShrink: 0 }} />
                <span style={{ fontSize: '0.82rem', color: '#92400e', lineHeight: 1.3 }}>
                  <strong>Venta fiada:</strong> El importe se sumará automáticamente a la cuenta corriente del cliente como saldo deudor.
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.75rem' }}>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cancelar (Esc)
          </button>
          <button 
            type="button" 
            className="btn btn-success" 
            disabled={!canConfirm}
            onClick={handleConfirm}
            style={{ 
              padding: '0.75rem 1.6rem', 
              fontSize: '1rem', 
              fontWeight: 700, 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              boxShadow: canConfirm ? '0 2px 10px rgba(22, 163, 74, 0.3)' : 'none'
            }}
          >
            <Check size={20} />
            <span>Confirmar y Finalizar Venta (F2)</span>
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
