import React, { useState } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Receipt, 
  Package,
  ShoppingBag,
  CreditCard,
  Banknote
} from 'lucide-react';

export default function ReportsView({ sales }) {
  const [dateFilter, setDateFilter] = useState('hoy');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Filter sales by date
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000;
  const startOfWeek = now.getTime() - 7 * 24 * 60 * 60 * 1000;
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

  const filteredSales = sales.filter((s) => {
    const saleTime = new Date(s.date).getTime();
    if (dateFilter === 'hoy') return saleTime >= startOfToday;
    if (dateFilter === 'ayer') return saleTime >= startOfYesterday && saleTime < startOfToday;
    if (dateFilter === 'semana') return saleTime >= startOfWeek;
    if (dateFilter === 'mes') return saleTime >= startOfMonth;
    return true;
  });

  // Calculate Metrics
  const totalRevenue = filteredSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalCost = filteredSales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
  const totalProfit = totalRevenue - totalCost;
  const profitMarginPercent = totalRevenue > 0 ? Math.round((totalProfit / totalRevenue) * 100) : 0;
  const averageTicket = filteredSales.length > 0 ? Math.round(totalRevenue / filteredSales.length) : 0;

  // Breakdown by payment method
  const paymentBreakdown = {
    efectivo: filteredSales.filter(s => s.paymentMethod === 'efectivo').reduce((sum, s) => sum + s.total, 0),
    mercadopago: filteredSales.filter(s => s.paymentMethod === 'mercadopago' || s.paymentMethod === 'transferencia').reduce((sum, s) => sum + s.total, 0),
    tarjeta: filteredSales.filter(s => s.paymentMethod === 'tarjeta').reduce((sum, s) => sum + s.total, 0),
    fiado: filteredSales.filter(s => s.paymentMethod === 'fiado').reduce((sum, s) => sum + s.total, 0),
  };

  // Category sales breakdown
  const categoryTotals = {};
  filteredSales.forEach((sale) => {
    sale.items?.forEach((item) => {
      const cat = item.product.category || 'variedades';
      categoryTotals[cat] = (categoryTotals[cat] || 0) + (item.subtotal || 0);
    });
  });

  // Top Products Sold
  const productSalesMap = {};
  filteredSales.forEach((sale) => {
    sale.items?.forEach((item) => {
      const prodId = item.product.id;
      if (!productSalesMap[prodId]) {
        productSalesMap[prodId] = {
          name: item.product.name,
          category: item.product.category,
          quantity: 0,
          revenue: 0
        };
      }
      productSalesMap[prodId].quantity += item.quantity;
      productSalesMap[prodId].revenue += item.subtotal;
    });
  });

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 5);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Date Filter Bar */}
      <div 
        style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          backgroundColor: '#ffffff', 
          padding: '1rem 1.25rem', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          flexWrap: 'wrap',
          gap: '0.75rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <Calendar size={18} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Reporte de Ventas y Rendimiento
            </h2>
            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
              Métricas financieras y ganancias en tiempo real
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: '#f8fafc', padding: '0.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0' }}>
          {[
            { id: 'hoy', label: 'Hoy' },
            { id: 'ayer', label: 'Ayer' },
            { id: 'semana', label: 'Últimos 7 días' },
            { id: 'mes', label: 'Este Mes' },
            { id: 'todos', label: 'Histórico' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setDateFilter(tab.id)}
              style={{
                padding: '0.4rem 0.85rem',
                borderRadius: '6px',
                border: 'none',
                backgroundColor: dateFilter === tab.id ? '#2563eb' : 'transparent',
                color: dateFilter === tab.id ? '#ffffff' : '#64748b',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Primary KPI Cards (High Contrast White) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            TOTAL VENDIDO EN EL PERÍODO
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: '#16a34a', marginTop: '0.25rem' }}>
            {formatCurrency(totalRevenue)}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>
            {filteredSales.length} ventas realizadas
          </span>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            GANANCIA NETA ESTIMADA
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
            {formatCurrency(totalProfit)}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>
            Margen del {profitMarginPercent}% de ganancia
          </span>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            TICKET PROMEDIO
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {formatCurrency(averageTicket)}
          </div>
          <span style={{ fontSize: '0.8rem', color: '#475569', fontWeight: 500 }}>
            Gasto promedio por cliente
          </span>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
          <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            EFECTIVO VS DIGITAL
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '0.5rem', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>💵 Efectivo:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: '#16a34a' }}>{formatCurrency(paymentBreakdown.efectivo)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#475569' }}>
              <span>📱 Digital (MP / Tarjeta):</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: '#2563eb' }}>{formatCurrency(paymentBreakdown.mercadopago + paymentBreakdown.tarjeta)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Top 5 Products & Category Sales Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Top 5 Products */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={18} color="#16a34a" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Top Productos Más Vendidos</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {topProducts.map((p, idx) => (
              <div 
                key={idx}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  backgroundColor: '#f8fafc',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid #e2e8f0'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span 
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      backgroundColor: idx === 0 ? '#fef08a' : '#e2e8f0', 
                      color: idx === 0 ? '#854d0e' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.75rem',
                      fontWeight: 800
                    }}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.875rem', color: '#0f172a' }}>{p.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.quantity} unidades vendidas</span>
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16a34a' }}>
                  {formatCurrency(p.revenue)}
                </span>
              </div>
            ))}

            {topProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                No hay ventas registradas en este período
              </div>
            )}
          </div>
        </div>

        {/* Sales by Category */}
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BarChart3 size={18} color="#2563eb" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Ventas por Categoría</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Object.entries(categoryTotals).map(([cat, total]) => {
              const percentage = totalRevenue > 0 ? Math.round((total / totalRevenue) * 100) : 0;
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    <span style={{ textTransform: 'capitalize', fontWeight: 600, color: '#0f172a' }}>{cat}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: '#475569' }}>{formatCurrency(total)} ({percentage}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#f1f5f9', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        backgroundColor: '#2563eb',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {Object.keys(categoryTotals).length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8', fontSize: '0.85rem' }}>
                Sin ventas por categorías en este período
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Sales Log Table */}
      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          <Receipt size={18} color="#2563eb" />
          <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>Registro Cronológico de Tickets</h3>
        </div>

        <div style={{ border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
          <table className="mockup-table">
            <thead>
              <tr>
                <th>Ticket ID</th>
                <th>Fecha y Hora</th>
                <th>Cliente</th>
                <th>Artículos</th>
                <th>Medio de Pago</th>
                <th style={{ textAlign: 'right' }}>Total Venta</th>
                <th style={{ textAlign: 'right' }}>Ganancia</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((s) => (
                <tr key={s.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#2563eb', fontWeight: 600 }}>
                    #{s.id.slice(-6).toUpperCase()}
                  </td>
                  <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                    {new Date(s.date).toLocaleDateString('es-AR')} {new Date(s.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td style={{ fontWeight: 600, color: '#0f172a' }}>{s.clientName}</td>
                  <td style={{ fontSize: '0.85rem', color: '#475569' }}>
                    {s.items?.map(i => `${i.quantity}x ${i.product.name}`).join(', ')}
                  </td>
                  <td>
                    <span 
                      style={{ 
                        padding: '2px 8px', 
                        borderRadius: '4px', 
                        fontSize: '0.75rem', 
                        textTransform: 'uppercase', 
                        fontWeight: 700,
                        backgroundColor: '#f1f5f9',
                        color: '#334155'
                      }}
                    >
                      {s.paymentMethod}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16a34a' }}>
                    {formatCurrency(s.total)}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#2563eb', fontWeight: 600 }}>
                    +{formatCurrency(s.profit)}
                  </td>
                </tr>
              ))}

              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                    No hay ventas registradas en el período seleccionado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
