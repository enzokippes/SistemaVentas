import React from 'react';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Calendar, 
  Award, 
  BarChart3, 
} from 'lucide-react';

export default function MonthlyComparisonModal({ isOpen, onClose, sales }) {
  if (!isOpen) return null;

  const formatCurrency = (val) => {
    return `$${Math.round(val || 0).toLocaleString('es-AR')}`;
  };

  // Group all sales by month key: YYYY-MM
  const monthsMap = {};

  (sales || []).forEach((sale) => {
    if (!sale.date) return;
    const d = new Date(sale.date);
    if (isNaN(d.getTime())) return;

    const year = d.getFullYear();
    const month = d.getMonth(); // 0 to 11
    const key = `${year}-${String(month + 1).padStart(2, '0')}`;

    if (!monthsMap[key]) {
      // Get human readable month name
      const monthName = d.toLocaleDateString('es-AR', { month: 'long' });
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

      monthsMap[key] = {
        key,
        year,
        month,
        displayName: `${capitalizedMonth} ${year}`,
        dateObj: new Date(year, month, 1),
        collectedSalesTotal: 0,
        fiadoSalesTotal: 0,
        totalSalesAmount: 0,
        salesCount: 0,
        collectedSalesCount: 0,
        fiadoSalesCount: 0,
      };
    }

    const isFiado = sale.paymentMethod === 'fiado';
    const total = Number(sale.total) || 0;

    monthsMap[key].salesCount += 1;
    monthsMap[key].totalSalesAmount += total;

    if (isFiado) {
      monthsMap[key].fiadoSalesTotal += total;
      monthsMap[key].fiadoSalesCount += 1;
    } else {
      monthsMap[key].collectedSalesTotal += total;
      monthsMap[key].collectedSalesCount += 1;
    }
  });

  // Sort chronologically ascending to compute month-over-month growth correctly
  const sortedChronological = Object.values(monthsMap).sort(
    (a, b) => a.dateObj.getTime() - b.dateObj.getTime()
  );

  // Calculate month-over-month differences
  const monthlyData = sortedChronological.map((item, idx) => {
    const prevMonth = idx > 0 ? sortedChronological[idx - 1] : null;

    let growthCollectedDiff = 0;
    let growthCollectedPercent = 0;
    let hasPrev = false;

    if (prevMonth) {
      hasPrev = true;
      growthCollectedDiff = item.collectedSalesTotal - prevMonth.collectedSalesTotal;
      if (prevMonth.collectedSalesTotal > 0) {
        growthCollectedPercent = Math.round((growthCollectedDiff / prevMonth.collectedSalesTotal) * 100);
      } else if (item.collectedSalesTotal > 0) {
        growthCollectedPercent = 100;
      }
    }

    const avgTicket = item.collectedSalesCount > 0 
      ? Math.round(item.collectedSalesTotal / item.collectedSalesCount) 
      : 0;

    return {
      ...item,
      hasPrev,
      prevDisplayName: prevMonth?.displayName || '',
      growthCollectedDiff,
      growthCollectedPercent,
      avgTicket,
    };
  });

  // For display, show from newest to oldest month so the user sees the latest months first
  const displayList = [...monthlyData].reverse();

  // Find record month (highest collected revenue)
  const maxCollected = monthlyData.reduce((max, m) => Math.max(max, m.collectedSalesTotal), 0);
  const bestMonth = monthlyData.find(m => m.collectedSalesTotal === maxCollected && maxCollected > 0);

  // Overall totals across all recorded months
  const totalCollectedAll = monthlyData.reduce((sum, m) => sum + m.collectedSalesTotal, 0);
  const totalFiadoAll = monthlyData.reduce((sum, m) => sum + m.fiadoSalesTotal, 0);
  const avgMonthlyCollected = monthlyData.length > 0 ? Math.round(totalCollectedAll / monthlyData.length) : 0;

  return (
    <div 
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        style={{
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--modal-shadow, 0 25px 50px -12px rgba(0, 0, 0, 0.35))',
          overflow: 'hidden',
          animation: 'modalSlideUp 0.2s ease-out'
        }}
      >
        {/* Modal Header */}
        <div 
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'var(--bg-hover)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div 
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                backgroundColor: 'rgba(56, 189, 248, 0.15)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <BarChart3 size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                Comparativa Mensual Completa
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Evolución histórica de todos los meses con ventas registradas
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title="Cerrar (Esc)"
          >
            <X size={20} />
          </button>
        </div>

        {/* Global Summary Metrics (KPIs) */}
        <div 
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
            gap: '0.75rem',
            padding: '1rem 1.5rem',
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border)'
          }}
        >
          <div style={{ backgroundColor: 'var(--bg-deep)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Meses con Ventas
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.2rem' }}>
              {monthlyData.length} {monthlyData.length === 1 ? 'Mes' : 'Meses'}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Registrados en el sistema
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--bg-deep)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Total Histórico Cobrado
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success, #16a34a)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalCollectedAll)}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Dinero real ingresado
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--bg-deep)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.7rem', color: totalFiadoAll > 0 ? '#ca8a04' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Fiado Acumulado
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: totalFiadoAll > 0 ? '#ca8a04' : 'var(--text-muted)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(totalFiadoAll)}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Mercadería en cuenta corriente
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--bg-deep)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Promedio por Mes
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
              {formatCurrency(avgMonthlyCollected)}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Cobro promedio mensual
            </span>
          </div>

          <div style={{ backgroundColor: 'var(--bg-deep)', padding: '0.85rem 1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Award size={13} color="#f59e0b" />
              Mes Récord
            </span>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {bestMonth ? bestMonth.displayName : '—'}
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {bestMonth ? formatCurrency(bestMonth.collectedSalesTotal) : '—'}
            </span>
          </div>
        </div>

        {/* Scrollable Month List */}
        <div 
          style={{
            overflowY: 'auto',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
            flex: 1
          }}
        >
          {displayList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
              <Calendar size={40} style={{ opacity: 0.3, margin: '0 auto 0.75rem auto' }} />
              <p style={{ margin: 0, fontSize: '1rem', fontWeight: 600 }}>No hay ventas registradas aún.</p>
              <span style={{ fontSize: '0.8rem' }}>Cuando realices ventas, aparecerán comparadas mes a mes en esta vista.</span>
            </div>
          ) : (
            displayList.map((m) => {
              const isRecord = bestMonth && m.key === bestMonth.key;
              const barPercent = maxCollected > 0 ? Math.round((m.collectedSalesTotal / maxCollected) * 100) : 0;
              const isPositive = m.growthCollectedDiff >= 0;

              return (
                <div 
                  key={m.key}
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    border: isRecord ? '2px solid rgba(245, 158, 11, 0.4)' : '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.15rem 1.25rem',
                    boxShadow: 'var(--card-shadow)',
                    transition: 'all 0.15s ease',
                    position: 'relative'
                  }}
                >
                  {/* Badge Récord */}
                  {isRecord && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '-10px',
                        right: '16px',
                        backgroundColor: '#f59e0b',
                        color: '#000',
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.6rem',
                        borderRadius: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        letterSpacing: '0.04em',
                        boxShadow: '0 2px 6px rgba(245, 158, 11, 0.4)'
                      }}
                    >
                      <Award size={12} />
                      MES RÉCORD HISTÓRICO
                    </div>
                  )}

                  {/* Month Header Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <Calendar size={18} color="var(--primary)" />
                      <span style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {m.displayName}
                      </span>
                      <span 
                        style={{ 
                          fontSize: '0.75rem', 
                          color: 'var(--text-muted)', 
                          backgroundColor: 'var(--bg-hover)', 
                          padding: '0.2rem 0.5rem', 
                          borderRadius: '4px',
                          border: '1px solid var(--border)' 
                        }}
                      >
                        {m.salesCount} {m.salesCount === 1 ? 'ticket' : 'tickets'}
                      </span>
                    </div>

                    {/* Growth Badge vs Previous Month */}
                    <div>
                      {m.hasPrev ? (
                        <div 
                          style={{ 
                            padding: '0.35rem 0.75rem', 
                            borderRadius: 'var(--radius-md)', 
                            backgroundColor: isPositive ? 'rgba(34, 197, 94, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                            border: `1px solid ${isPositive ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                            color: isPositive ? 'var(--success, #16a34a)' : '#ef4444',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontWeight: 700,
                            fontSize: '0.82rem'
                          }}
                        >
                          {isPositive ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
                          <span>
                            {isPositive ? '+' : ''}{formatCurrency(m.growthCollectedDiff)} ({isPositive ? '+' : ''}{m.growthCollectedPercent}%) vs {m.prevDisplayName}
                          </span>
                        </div>
                      ) : (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                          Primer mes registrado (Mes base)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Visual Bar vs Record Month */}
                  <div style={{ marginBottom: '0.85rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>
                      <span>Rendimiento vs Mes Récord</span>
                      <span style={{ fontWeight: 600 }}>{barPercent}% del máximo histórico</span>
                    </div>
                    <div style={{ height: '8px', backgroundColor: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          height: '100%', 
                          width: `${barPercent}%`, 
                          backgroundColor: isRecord ? '#f59e0b' : 'var(--primary)',
                          borderRadius: '4px',
                          transition: 'width 0.4s ease-out'
                        }}
                      />
                    </div>
                  </div>

                  {/* Financial Breakdown Grid */}
                  <div 
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: '0.5rem',
                      paddingTop: '0.5rem',
                      borderTop: '1px solid var(--border)'
                    }}
                  >
                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Dinero Cobrado
                      </span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--success, #16a34a)', fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(m.collectedSalesTotal)}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: m.fiadoSalesTotal > 0 ? '#ca8a04' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Fiado en la Calle
                      </span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: m.fiadoSalesTotal > 0 ? '#ca8a04' : 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(m.fiadoSalesTotal)}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Total Facturado
                      </span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(m.totalSalesAmount)}
                      </div>
                    </div>

                    <div>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
                        Ticket Promedio
                      </span>
                      <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                        {formatCurrency(m.avgTicket)}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div 
          style={{
            padding: '0.85rem 1.5rem',
            borderTop: '1px solid var(--border)',
            backgroundColor: 'var(--bg-hover)',
            display: 'flex',
            justifyContent: 'flex-end'
          }}
        >
          <button
            onClick={onClose}
            className="btn btn-secondary"
            style={{ padding: '0.5rem 1.25rem' }}
          >
            Cerrar Ventana
          </button>
        </div>
      </div>
    </div>
  );
}
