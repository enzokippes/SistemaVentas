import React, { useState } from 'react';
import { 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Lock, 
  Unlock, 
  History, 
  DollarSign, 
  Plus
} from 'lucide-react';
import ModalBackdrop from '../Common/ModalBackdrop';

export default function CashRegisterView({ 
  cashSession, 
  sales, 
  cashMovements, 
  cashClosings, 
  onOpenSession, 
  onCloseSession, 
  onAddMovement 
}) {
  const [initialCashInput, setInitialCashInput] = useState('10000');
  const [operatorInput, setOperatorInput] = useState('Turno Mañana');
  
  // Movement form state
  const [movementType, setMovementType] = useState('salida');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  
  // Closing form state
  const [countedCash, setCountedCash] = useState('');
  const [closingNotes, setClosingNotes] = useState('');
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const sessionStartTime = (cashSession?.isOpen && cashSession?.openedAt)
    ? new Date(cashSession.openedAt).getTime()
    : null;
  const currentSessionSales = sessionStartTime !== null
    ? sales.filter((s) => new Date(s.date).getTime() >= sessionStartTime)
    : [];
  const currentSessionMovements = sessionStartTime !== null
    ? cashMovements.filter((m) => new Date(m.date).getTime() >= sessionStartTime)
    : [];

  const cashSalesTotal = currentSessionSales
    .filter((s) => s.paymentMethod === 'efectivo')
    .reduce((acc, s) => acc + s.total, 0);

  const digitalSalesTotal = currentSessionSales
    .filter((s) => s.paymentMethod !== 'efectivo' && s.paymentMethod !== 'fiado')
    .reduce((acc, s) => acc + s.total, 0);

  const creditSalesTotal = currentSessionSales
    .filter((s) => s.paymentMethod === 'fiado')
    .reduce((acc, s) => acc + s.total, 0);

  const totalExpenses = currentSessionMovements
    .filter((m) => m.type === 'salida')
    .reduce((acc, m) => acc + m.amount, 0);

  // Incomes: Cash incomes enter physical cash drawer, digital incomes do not
  const cashIncomes = currentSessionMovements
    .filter((m) => m.type === 'ingreso' && (m.paymentMethod === 'efectivo' || !m.paymentMethod))
    .reduce((acc, m) => acc + m.amount, 0);

  const digitalIncomes = currentSessionMovements
    .filter((m) => m.type === 'ingreso' && m.paymentMethod !== 'efectivo')
    .reduce((acc, m) => acc + m.amount, 0);

  const _totalIncomes = cashIncomes + digitalIncomes;

  // Specific debt collections breakdown
  const debtCollectionsCash = currentSessionMovements
    .filter((m) => m.type === 'ingreso' && m.category === 'debt_payment' && (m.paymentMethod === 'efectivo' || !m.paymentMethod))
    .reduce((acc, m) => acc + m.amount, 0);

  const debtCollectionsDigital = currentSessionMovements
    .filter((m) => m.type === 'ingreso' && m.category === 'debt_payment' && m.paymentMethod !== 'efectivo')
    .reduce((acc, m) => acc + m.amount, 0);

  const debtCollectionsTotal = debtCollectionsCash + debtCollectionsDigital;

  const initialAmount = cashSession?.initialCash || 0;
  const expectedCashInDrawer = initialAmount + cashSalesTotal + cashIncomes - totalExpenses;

  const handleOpenRegister = (e) => {
    e.preventDefault();
    onOpenSession(Number(initialCashInput) || 0, operatorInput.trim() || 'Cajero');
  };

  const handleAddMovementSubmit = (e) => {
    e.preventDefault();
    if (!movementAmount || Number(movementAmount) <= 0) return;
    onAddMovement(movementType, Number(movementAmount), movementReason.trim());
    setMovementAmount('');
    setMovementReason('');
  };

  const handleConfirmClose = (e) => {
    e.preventDefault();
    if (countedCash === '') return;
    onCloseSession(Number(countedCash), closingNotes);
    setIsClosingModalOpen(false);
    setCountedCash('');
    setClosingNotes('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Session Status Header */}
      <div 
        style={{ 
          background: 'var(--bg-surface)', 
          border: '1px solid var(--border)', 
          borderRadius: 'var(--radius-xl)', 
          padding: '1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div 
            style={{ 
              width: '50px', 
              height: '50px', 
              borderRadius: 'var(--radius-lg)', 
              background: cashSession?.isOpen ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: cashSession?.isOpen ? '#34d399' : '#f87171'
            }}
          >
            {cashSession?.isOpen ? <Unlock size={28} /> : <Lock size={28} />}
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h2 style={{ fontSize: '1.5rem', color: '#fff', margin: 0 }}>
                {cashSession?.isOpen ? 'Caja Abierta' : 'Caja Cerrada'}
              </h2>
              <span className={`status-badge ${cashSession?.isOpen ? 'open' : 'closed'}`}>
                {cashSession?.operator || 'Turno'}
              </span>
            </div>
            {cashSession?.isOpen && (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Abierta el {new Date(cashSession.openedAt).toLocaleDateString('es-AR')} a las {new Date(cashSession.openedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        </div>

        {cashSession?.isOpen ? (
          <button 
            className="btn btn-danger" 
            style={{ padding: '0.75rem 1.5rem', fontSize: '1rem' }}
            onClick={() => {
              setCountedCash(expectedCashInDrawer.toString());
              setIsClosingModalOpen(true);
            }}
          >
            <Lock size={18} />
            <span>Realizar Cierre de Turno / Arqueo</span>
          </button>
        ) : (
          <form onSubmit={handleOpenRegister} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem', margin: '0 0 2px 0' }}>Fondo Inicial (Cambio)</label>
              <input
                type="number"
                className="form-input"
                placeholder="10000"
                value={initialCashInput}
                onChange={(e) => setInitialCashInput(e.target.value)}
                style={{ width: '150px', fontFamily: 'var(--font-mono)' }}
                required
              />
            </div>
            <div>
              <label className="form-label" style={{ fontSize: '0.75rem', margin: '0 0 2px 0' }}>Nombre del Turno / Cajero</label>
              <input
                type="text"
                className="form-input"
                placeholder="Turno Mañana"
                value={operatorInput}
                onChange={(e) => setOperatorInput(e.target.value)}
                style={{ width: '160px' }}
              />
            </div>
            <button type="submit" className="btn btn-success" style={{ alignSelf: 'flex-end' }}>
              <Unlock size={18} />
              <span>Abrir Caja</span>
            </button>
          </form>
        )}
      </div>

      {/* Real-time Cash Balance Grid */}
      {cashSession?.isOpen && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Fondo Inicial (Apertura)
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color: '#94a3b8', marginTop: '0.25rem' }}>
              {formatCurrency(initialAmount)}
            </div>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Ventas Efectivo
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color: '#34d399', marginTop: '0.25rem' }}>
              +{formatCurrency(cashSalesTotal)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({currentSessionSales.filter(s => s.paymentMethod === 'efectivo').length} tickets)
            </span>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Cobro Fiados (Efectivo)
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color: '#38bdf8', marginTop: '0.25rem' }}>
              +{formatCurrency(cashIncomes)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              ({currentSessionMovements.filter(m => m.type === 'ingreso').length} ingreso/cobro)
            </span>
          </div>

          <div style={{ background: 'var(--bg-surface)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600 }}>
              Gastos / Pagos de Caja
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 700, color: '#f87171', marginTop: '0.25rem' }}>
              -{formatCurrency(totalExpenses)}
            </div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              (Proveedores, pan, etc.)
            </span>
          </div>

          <div 
            style={{ 
              background: '#F8FAFC', 
              padding: '1.25rem', 
              borderRadius: 'var(--radius-lg)', 
              border: '1px solid var(--border-color)',
              boxShadow: 'var(--shadow-sm)'
            }}
          >
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>
              Debe haber en el cajón (Efectivo)
            </span>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: 'var(--color-primary-dark)', marginTop: '0.25rem' }}>
              {formatCurrency(expectedCashInDrawer)}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              (Fondo + Ventas + Cobros - Gastos)
            </span>
          </div>
        </div>
      )}

      {/* Movement Registrar & Session Digital Sales */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        {/* Left: Quick Expense / Income Registrar */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <ArrowDownCircle size={20} color="#f87171" />
            <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>Registrar Salida / Ingreso de Dinero</h3>
          </div>

          <form onSubmit={handleAddMovementSubmit}>
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={`btn ${movementType === 'salida' ? 'btn-danger' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setMovementType('salida')}
              >
                <ArrowDownCircle size={16} />
                <span>Salida / Gasto (ej. Panadero)</span>
              </button>
              <button
                type="button"
                className={`btn ${movementType === 'ingreso' ? 'btn-success' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setMovementType('ingreso')}
              >
                <ArrowUpCircle size={16} />
                <span>Ingreso Extra de Cambio</span>
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Monto ($)</label>
              <input
                type="number"
                className="form-input"
                placeholder="Ej: 3500"
                value={movementAmount}
                onChange={(e) => setMovementAmount(e.target.value)}
                style={{ fontFamily: 'var(--font-mono)', fontSize: '1.15rem', fontWeight: 700 }}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Motivo / Descripción</label>
              <input
                type="text"
                className="form-input"
                placeholder="Ej: Pago al repartidor de pan lactal, hielo, etc."
                value={movementReason}
                onChange={(e) => setMovementReason(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '0.5rem' }}>
              <Plus size={18} />
              <span>Guardar Movimiento</span>
            </button>
          </form>

          {/* Recent movements list */}
          <div style={{ marginTop: '1.5rem', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 600, display: 'block', marginBottom: '0.75rem' }}>
              Movimientos del Turno
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', maxHeight: '180px', overflowY: 'auto' }}>
              {currentSessionMovements.map((m) => (
                <div 
                  key={m.id}
                  style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    padding: '0.5rem 0.75rem', 
                    background: 'var(--bg-input)', 
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border)',
                    fontSize: '0.85rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    {m.type === 'salida' ? (
                      <ArrowDownCircle size={16} color="#f87171" />
                    ) : (
                      <ArrowUpCircle size={16} color="#34d399" />
                    )}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                        {m.category === 'debt_payment' && (
                          <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', padding: '1px 6px', borderRadius: '3px', fontWeight: 700 }}>
                            COBRO FIADO
                          </span>
                        )}
                        <span style={{ fontWeight: 500 }}>{m.reason}</span>
                      </div>
                      {m.paymentMethod && (
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                          {m.paymentMethod === 'efectivo' ? '💵 Efectivo (Cajón)' : '📲 Transferencia'}
                        </span>
                      )}
                    </div>
                  </div>
                  <span 
                    style={{ 
                      fontFamily: 'var(--font-mono)', 
                      fontWeight: 700, 
                      color: m.type === 'salida' ? '#f87171' : '#34d399' 
                    }}
                  >
                    {m.type === 'salida' ? '-' : '+'}{formatCurrency(m.amount)}
                  </span>
                </div>
              ))}
              {currentSessionMovements.length === 0 && (
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem' }}>
                  No hay movimientos manuales en este turno
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Digital Payments & Other Totals */}
        <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <DollarSign size={20} color="#38bdf8" />
              <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>Ventas Totales del Turno Actual</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.9rem' }}>💵 Ventas en Efectivo:</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: '#34d399' }}>{formatCurrency(cashSalesTotal)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.9rem' }}>📲 Transferencias / Mercado Pago:</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>{formatCurrency(digitalSalesTotal)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '0.9rem' }}>📋 Fiados Otorgados (Turno):</span>
                <strong style={{ fontFamily: 'var(--font-mono)', color: '#fbbf24' }}>{formatCurrency(creditSalesTotal)}</strong>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.75rem', background: 'var(--bg-input)', borderRadius: 'var(--radius-md)' }}>
                <div>
                  <span style={{ fontSize: '0.9rem', display: 'block' }}>🤝 Cobro de Fiados / Deudas:</span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    (💵 {formatCurrency(debtCollectionsCash)} efvo · 📲 {formatCurrency(debtCollectionsDigital)} transf)
                  </span>
                </div>
                <strong style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8' }}>+{formatCurrency(debtCollectionsTotal)}</strong>
              </div>

              <div style={{ borderTop: '1px dashed var(--border)', margin: '0.25rem 0' }}></div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '0.75rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: 'var(--radius-md)' }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 700 }}>Total Facturado en el Turno:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '1.45rem', fontWeight: 800, color: '#34d399' }}>
                  {formatCurrency(cashSalesTotal + digitalSalesTotal + creditSalesTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History of Past Closings */}
      <div style={{ background: 'var(--bg-surface)', padding: '1.5rem', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <History size={20} color="var(--primary)" />
          <h3 style={{ fontSize: '1.15rem', color: '#fff', margin: 0 }}>Historial de Cierres de Turno Anteriores</h3>
        </div>

        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha de Cierre</th>
                <th>Turno / Cajero</th>
                <th style={{ textAlign: 'right' }}>Fondo Inicial</th>
                <th style={{ textAlign: 'right' }}>Ventas Efectivo</th>
                <th style={{ textAlign: 'right' }}>Transferencias</th>
                <th style={{ textAlign: 'right' }}>Total Facturado</th>
                <th style={{ textAlign: 'right' }}>Efectivo Esperado</th>
                <th style={{ textAlign: 'right' }}>Efectivo Real Contado</th>
                <th style={{ textAlign: 'center' }}>Diferencia</th>
              </tr>
            </thead>
            <tbody>
              {cashClosings.map((c) => {
                const isExact = Math.abs(c.difference) < 1;
                const isSurplus = c.difference > 0;
                return (
                  <tr key={c.id}>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(c.closedAt).toLocaleDateString('es-AR')} {new Date(c.closedAt).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>{c.operator}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatCurrency(c.initialCash)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatCurrency(c.cashSalesTotal)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatCurrency(c.digitalSalesTotal)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#34d399' }}>{formatCurrency(c.totalSales)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>{formatCurrency(c.expectedCashInDrawer)}</td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>{formatCurrency(c.countedCash)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <span 
                        style={{ 
                          padding: '2px 8px', 
                          borderRadius: '4px', 
                          fontSize: '0.8rem', 
                          fontFamily: 'var(--font-mono)', 
                          fontWeight: 700,
                          background: isExact ? 'rgba(16, 185, 129, 0.15)' : isSurplus ? 'rgba(59, 130, 246, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: isExact ? '#34d399' : isSurplus ? '#38bdf8' : '#f87171'
                        }}
                      >
                        {isExact ? 'Exacto' : `${isSurplus ? '+' : ''}${formatCurrency(c.difference)}`}
                      </span>
                    </td>
                  </tr>
                );
              })}

              {cashClosings.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>
                    No hay cierres de caja archivados aún. Realiza tu primer cierre al terminar el turno.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for Register Closing / Arqueo */}
      {isClosingModalOpen && (
        <ModalBackdrop onClose={() => setIsClosingModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2 style={{ fontSize: '1.25rem', color: '#fff', margin: 0 }}>Cierre de Turno y Arqueo de Caja</h2>
            </div>
            <form onSubmit={handleConfirmClose}>
              <div className="modal-body">
                <div style={{ background: 'var(--bg-input)', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span>Efectivo calculado por sistema:</span>
                    <strong style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontSize: '1.1rem' }}>
                      {formatCurrency(expectedCashInDrawer)}
                    </strong>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    (Fondo inicial {formatCurrency(initialAmount)} + Ventas efectivo {formatCurrency(cashSalesTotal)} + Cobros efectivo {formatCurrency(cashIncomes)} - Gastos {formatCurrency(totalExpenses)})
                  </span>
                </div>

                <div className="form-group">
                  <label className="form-label">Efectivo Real en el Cajón (Contado por el cajero) *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={countedCash}
                    onChange={(e) => setCountedCash(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                    required
                  />
                </div>

                {countedCash !== '' && (
                  <div 
                    style={{ 
                      padding: '0.75rem', 
                      borderRadius: 'var(--radius-sm)', 
                      background: Number(countedCash) === expectedCashInDrawer ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                      color: Number(countedCash) === expectedCashInDrawer ? '#34d399' : '#f87171',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      display: 'flex',
                      justifyContent: 'space-between'
                    }}
                  >
                    <span>Diferencia:</span>
                    <span>
                      {Number(countedCash) === expectedCashInDrawer ? 'Coincide Exactamente ($0)' : formatCurrency(Number(countedCash) - expectedCashInDrawer)}
                    </span>
                  </div>
                )}

                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label className="form-label">Observaciones / Notas del Cierre</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Turno tranquilo, sin novedades..."
                    value={closingNotes}
                    onChange={(e) => setClosingNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsClosingModalOpen(false)}>
                  Volver
                </button>
                <button type="submit" className="btn btn-danger">
                  <Lock size={18} />
                  <span>Confirmar y Guardar Cierre</span>
                </button>
              </div>
            </form>
          </div>
        </ModalBackdrop>
      )}
    </div>
  );
}
