import React, { useState, useEffect } from 'react';
import { 
  X, 
  Banknote, 
  QrCode, 
  CreditCard, 
  UserCheck, 
  Check, 
  Calculator
} from 'lucide-react';

export default function CheckoutModal({ 
  isOpen, 
  onClose, 
  total, 
  initialPaymentMethod = 'efectivo',
  onConfirmSale, 
  storeConfig 
}) {
  const [paymentMethod, setPaymentMethod] = useState(initialPaymentMethod);
  const [cashGiven, setCashGiven] = useState('');
  const [clientName, setClientName] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (isOpen) {
      setPaymentMethod(initialPaymentMethod || 'efectivo');
      setCashGiven(total.toString());
      setClientName('Consumidor Final');
      setNotes('');
    }
  }, [isOpen, total, initialPaymentMethod]);

  if (!isOpen) return null;

  const numCashGiven = Number(cashGiven) || 0;
  const changeDue = Math.max(0, numCashGiven - total);
  const isCashSufficient = paymentMethod !== 'efectivo' || numCashGiven >= total;

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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isCashSufficient) return;

    onConfirmSale({
      paymentMethod,
      cashGiven: paymentMethod === 'efectivo' ? numCashGiven : total,
      changeGiven: paymentMethod === 'efectivo' ? changeDue : 0,
      clientName: clientName.trim() || 'Consumidor Final',
      notes
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Calculator size={20} color="#2563eb" />
            <h3 style={{ fontSize: '1.2rem', color: '#0f172a', margin: 0 }}>Cobrar Venta (F12)</h3>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Total Display Banner */}
            <div 
              style={{
                backgroundColor: '#f8fafc',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                textAlign: 'center',
                marginBottom: '1.25rem'
              }}
            >
              <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                Total a Cobrar
              </span>
              <div 
                style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '2.5rem', 
                  fontWeight: 800, 
                  color: '#16a34a', 
                  marginTop: '0.25rem' 
                }}
              >
                {formatCurrency(total)}
              </div>
            </div>

            {/* Payment Method Selector */}
            <div style={{ marginBottom: '1.25rem' }}>
              <label className="form-label">Medio de Pago Seleccionado</label>
              <div className="payment-methods-2x2">
                <div 
                  className={`pm-tile ${paymentMethod === 'efectivo' ? 'active-cash' : ''}`}
                  onClick={() => setPaymentMethod('efectivo')}
                >
                  <Banknote size={18} color="#16a34a" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>Efectivo</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Calcula vuelto</span>
                  </div>
                </div>

                <div 
                  className={`pm-tile ${paymentMethod === 'tarjeta' ? 'active-card' : ''}`}
                  onClick={() => setPaymentMethod('tarjeta')}
                >
                  <CreditCard size={18} color="#2563eb" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>Tarjeta</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Débito / Crédito</span>
                  </div>
                </div>

                <div 
                  className={`pm-tile ${paymentMethod === 'transferencia' ? 'active-transfer' : ''}`}
                  onClick={() => setPaymentMethod('transferencia')}
                >
                  <QrCode size={18} color="#9333ea" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>Transferencia</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>QR / Mercado Pago</span>
                  </div>
                </div>

                <div 
                  className={`pm-tile ${paymentMethod === 'fiado' ? 'active-credit' : ''}`}
                  onClick={() => setPaymentMethod('fiado')}
                >
                  <UserCheck size={18} color="#ca8a04" />
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.85rem' }}>Cuenta Corriente</strong>
                    <span style={{ fontSize: '0.7rem', color: '#64748b' }}>Anotar fiado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Cash Input & Change Calculation */}
            {paymentMethod === 'efectivo' && (
              <div style={{ background: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0 }}>¿Con cuánto paga el cliente?</label>
                  <button
                    type="button"
                    onClick={() => handleQuickCash(total)}
                    style={{ 
                      background: '#eff6ff', 
                      border: '1px solid #bfdbfe', 
                      color: '#2563eb', 
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
                  type="number"
                  className="form-input"
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  placeholder="0"
                  autoFocus
                  style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', fontWeight: 700, textAlign: 'right' }}
                />

                {/* Quick Bills Buttons */}
                <div className="bill-buttons">
                  <button type="button" className="bill-btn" onClick={() => handleAddCash(1000)}>+$1.000</button>
                  <button type="button" className="bill-btn" onClick={() => handleAddCash(2000)}>+$2.000</button>
                  <button type="button" className="bill-btn" onClick={() => handleAddCash(5000)}>+$5.000</button>
                  <button type="button" className="bill-btn" onClick={() => handleQuickCash(10000)}>$10.000</button>
                  <button type="button" className="bill-btn" onClick={() => handleQuickCash(20000)}>$20.000</button>
                  <button type="button" className="bill-btn" onClick={() => handleQuickCash(50000)}>$50.000</button>
                </div>

                {/* Vuelto / Cambio Banner */}
                <div 
                  style={{ 
                    marginTop: '1rem', 
                    padding: '0.75rem 1rem', 
                    borderRadius: 'var(--radius-sm)', 
                    background: changeDue > 0 ? '#f0fdf4' : '#ffffff',
                    border: `1px solid ${changeDue > 0 ? '#86efac' : '#e2e8f0'}`,
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                  }}
                >
                  <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#475569' }}>Vuelto a entregar:</span>
                  <span 
                    style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontSize: '1.5rem', 
                      fontWeight: 800, 
                      color: changeDue > 0 ? '#16a34a' : '#64748b' 
                    }}
                  >
                    {formatCurrency(changeDue)}
                  </span>
                </div>

                {!isCashSufficient && (
                  <div style={{ color: '#dc2626', fontSize: '0.8rem', marginTop: '0.5rem', textAlign: 'right', fontWeight: 600 }}>
                    * Falta abonar {formatCurrency(total - numCashGiven)}
                  </div>
                )}
              </div>
            )}

            {/* Client Name Input */}
            <div className="form-group">
              <label className="form-label">
                {paymentMethod === 'fiado' ? 'Nombre del Cliente (Obligatorio para Cuenta Corriente) *' : 'Cliente (Opcional)'}
              </label>
              <input
                type="text"
                className="form-input"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Ej: Don Carlos, Vecino Piso 3..."
                required={paymentMethod === 'fiado'}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-success" 
              disabled={!isCashSufficient || (paymentMethod === 'fiado' && !clientName.trim())}
              style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
            >
              <Check size={18} />
              <span>Confirmar y Finalizar Venta</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
