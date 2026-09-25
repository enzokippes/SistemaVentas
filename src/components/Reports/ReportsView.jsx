import React, { useState, useMemo, useRef } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Calendar, 
  Receipt,
  Search,
  Filter,
  Edit2,
  Trash2,
  Printer,
  AlertTriangle,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  ArrowRight,
  Award,
  Sparkles
} from 'lucide-react';
import EditSaleModal from './EditSaleModal';
import TicketModal from '../POS/TicketModal';
import ModalBackdrop from '../Common/ModalBackdrop';
import MonthlyComparisonModal from './MonthlyComparisonModal';

// Helper to format local date to YYYY-MM-DD
const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to format local date to YYYY-MM
const getLocalMonthString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

export default function ReportsView({ 
  sales = [], 
  clients = [], 
  categories = [],
  cashMovements = [],
  config, 
  onUpdateSale, 
  onDeleteSale 
}) {
  // Modes: 'dia' (Día específico) | 'mes' (Mes específico) | 'rango' (Períodos rápidos)
  const [reportMode, setReportMode] = useState('dia');
  
  // Specific day selection: YYYY-MM-DD
  const [selectedDate, setSelectedDate] = useState(() => getLocalDateString(new Date()));
  
  // Specific month selection: YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(() => getLocalMonthString(new Date()));
  
  // Quick ranges: 'semana' | 'todos'
  const [quickRange, setQuickRange] = useState('semana');

  // Filters within the tickets table
  const [tableSearchQuery, setTableSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('todos');

  // Modals state
  const [editingSale, setEditingSale] = useState(null);
  const [deletingSale, setDeletingSale] = useState(null);
  const [printingSale, setPrintingSale] = useState(null);
  const [isMonthlyComparisonOpen, setIsMonthlyComparisonOpen] = useState(false);

  // Ref to scroll to tickets table
  const ticketsTableRef = useRef(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getCategoryDisplayName = (catIdOrName) => {
    if (!catIdOrName) return 'General';
    const found = categories.find(
      (c) => c.id === catIdOrName || (c.name && c.name.toLowerCase() === catIdOrName.toLowerCase())
    );
    if (found) return found.name;
    // Strip timestamps/digits suffixes like cigarros_4063 -> Cigarros
    const clean = catIdOrName.replace(/[_-]\d+$/, '').replace(/[_-]/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  const now = new Date();
  const todayStr = getLocalDateString(now);
  const yesterdayDate = new Date();
  yesterdayDate.setDate(yesterdayDate.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterdayDate);
  const thisMonthStr = getLocalMonthString(now);

  // Day navigation handlers
  const handlePrevDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const prev = new Date(y, m - 1, d - 1);
    setSelectedDate(getLocalDateString(prev));
  };

  const handleNextDay = () => {
    const [y, m, d] = selectedDate.split('-').map(Number);
    const next = new Date(y, m - 1, d + 1);
    setSelectedDate(getLocalDateString(next));
  };

  const handleSetToday = () => {
    setSelectedDate(todayStr);
  };

  const handleSetYesterday = () => {
    setSelectedDate(yesterdayStr);
  };

  // Month navigation handlers
  const handlePrevMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const prev = new Date(y, m - 2, 1);
    setSelectedMonth(getLocalMonthString(prev));
  };

  const handleNextMonth = () => {
    const [y, m] = selectedMonth.split('-').map(Number);
    const next = new Date(y, m, 1);
    setSelectedMonth(getLocalMonthString(next));
  };

  const handleSetThisMonth = () => {
    setSelectedMonth(thisMonthStr);
  };

  const handleSetPrevMonth = () => {
    const prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    setSelectedMonth(getLocalMonthString(prev));
  };

  // Calculate active filter boundaries & human readable descriptions
  let filterStart = 0;
  let filterEnd = Infinity;
  let activePeriodLabel = '';
  let activePeriodBadge = '';

  if (reportMode === 'dia') {
    const [y, m, d] = (selectedDate || todayStr).split('-').map(Number);
    const startDay = new Date(y, m - 1, d, 0, 0, 0, 0);
    const endDay = new Date(y, m - 1, d, 23, 59, 59, 999);
    filterStart = startDay.getTime();
    filterEnd = endDay.getTime();

    const isToday = selectedDate === todayStr;
    const isYesterday = selectedDate === yesterdayStr;
    const weekdayName = startDay.toLocaleDateString('es-AR', { weekday: 'long' });
    const formattedDay = startDay.toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' });
    const capitalizedWeekday = weekdayName.charAt(0).toUpperCase() + weekdayName.slice(1);

    activePeriodLabel = `${capitalizedWeekday} ${formattedDay}`;
    activePeriodBadge = isToday ? 'Hoy' : isYesterday ? 'Ayer' : 'Día Específico';
  } else if (reportMode === 'mes') {
    const [y, m] = (selectedMonth || thisMonthStr).split('-').map(Number);
    const startM = new Date(y, m - 1, 1, 0, 0, 0, 0);
    const endM = new Date(y, m, 0, 23, 59, 59, 999);
    filterStart = startM.getTime();
    filterEnd = endM.getTime();

    const isThisMonth = selectedMonth === thisMonthStr;
    const monthName = startM.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    activePeriodLabel = capitalizedMonth;
    activePeriodBadge = isThisMonth ? 'Mes en Curso' : 'Mes Histórico';
  } else if (reportMode === 'rango') {
    if (quickRange === 'semana') {
      filterStart = now.getTime() - 7 * 24 * 60 * 60 * 1000;
      filterEnd = now.getTime();
      activePeriodLabel = 'Últimos 7 Días';
      activePeriodBadge = 'Última semana';
    } else {
      filterStart = 0;
      filterEnd = Infinity;
      activePeriodLabel = 'Histórico Total';
      activePeriodBadge = 'Todo el tiempo';
    }
  }

  // Filter sales and cash movements by calculated timestamp range
  const filteredSales = sales.filter((s) => {
    if (!s.date) return false;
    const saleTime = new Date(s.date).getTime();
    if (isNaN(saleTime)) return false;
    return saleTime >= filterStart && saleTime <= filterEnd;
  });

  const filteredMovements = cashMovements.filter((m) => {
    if (!m.date) return false;
    const movTime = new Date(m.date).getTime();
    if (isNaN(movTime)) return false;
    return movTime >= filterStart && movTime <= filterEnd;
  });

  const debtRecoveredMovements = filteredMovements.filter(m => m.type === 'ingreso' && m.category === 'debt_payment');
  const debtRecoveredTotal = debtRecoveredMovements.reduce((sum, m) => sum + (m.amount || 0), 0);
  const debtRecoveredCash = debtRecoveredMovements.filter(m => m.paymentMethod === 'efectivo' || !m.paymentMethod).reduce((sum, m) => sum + (m.amount || 0), 0);
  const debtRecoveredDigital = debtRecoveredMovements.filter(m => m.paymentMethod !== 'efectivo').reduce((sum, m) => sum + (m.amount || 0), 0);

  // Separate collected money from fiado (credit)
  const collectedSales = filteredSales.filter(s => s.paymentMethod !== 'fiado');
  const fiadoSales = filteredSales.filter(s => s.paymentMethod === 'fiado');

  const totalCollected = collectedSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalFiado = fiadoSales.reduce((sum, s) => sum + (s.total || 0), 0);
  const totalRevenue = totalCollected + totalFiado;

  // Profit calculated on collected sales
  const realCost = collectedSales.reduce((sum, s) => sum + (s.totalCost || 0), 0);
  const realProfit = totalCollected - realCost;
  const profitMarginPercent = totalCollected > 0 ? Math.round((realProfit / totalCollected) * 100) : 0;
  const averageTicket = collectedSales.length > 0 ? Math.round(totalCollected / collectedSales.length) : 0;

  // Month-to-Month comparison data (for the selected month vs its previous month)
  const comparisonData = useMemo(() => {
    if (reportMode !== 'mes') return null;
    const [y, m] = (selectedMonth || thisMonthStr).split('-').map(Number);
    const currStart = new Date(y, m - 1, 1, 0, 0, 0, 0).getTime();
    const currEnd = new Date(y, m, 0, 23, 59, 59, 999).getTime();

    const prevStart = new Date(y, m - 2, 1, 0, 0, 0, 0).getTime();
    const prevEnd = new Date(y, m - 1, 0, 23, 59, 59, 999).getTime();

    const currSales = sales.filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= currStart && t <= currEnd && s.paymentMethod !== 'fiado';
    });
    const prevSales = sales.filter((s) => {
      const t = new Date(s.date).getTime();
      return t >= prevStart && t <= prevEnd && s.paymentMethod !== 'fiado';
    });

    const currTotal = currSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const prevTotal = prevSales.reduce((sum, s) => sum + (s.total || 0), 0);
    const diff = currTotal - prevTotal;
    const growthPercent = prevTotal > 0 
      ? Math.round(((currTotal - prevTotal) / prevTotal) * 100) 
      : (currTotal > 0 ? 100 : 0);

    const prevMonthLabel = new Date(y, m - 2, 1).toLocaleDateString('es-AR', { month: 'long' });
    const currMonthLabel = new Date(y, m - 1, 1).toLocaleDateString('es-AR', { month: 'long' });

    return {
      currTotal,
      prevTotal,
      diff,
      growthPercent,
      prevMonthLabel,
      currMonthLabel
    };
  }, [sales, selectedMonth, reportMode, thisMonthStr]);

  // Day-by-Day Breakdown for the Selected Month
  const dailyBreakdown = (() => {
    if (reportMode !== 'mes') return [];

    const daysMap = {};

    filteredSales.forEach((sale) => {
      if (!sale.date) return;
      const d = new Date(sale.date);
      if (isNaN(d.getTime())) return;
      const dayKey = getLocalDateString(d);

      if (!daysMap[dayKey]) {
        const dayNum = d.getDate();
        const weekday = d.toLocaleDateString('es-AR', { weekday: 'short' });
        const fullDateStr = d.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' });

        daysMap[dayKey] = {
          dayKey,
          dayNum,
          weekday: weekday.charAt(0).toUpperCase() + weekday.slice(1),
          fullDateStr,
          dateObj: d,
          totalSales: 0,
          collectedTotal: 0,
          fiadoTotal: 0,
          ticketsCount: 0,
          profit: 0,
          itemsCount: 0
        };
      }

      const isFiado = sale.paymentMethod === 'fiado';
      const total = Number(sale.total) || 0;
      const profit = Number(sale.profit) || (total - (Number(sale.totalCost) || 0));

      daysMap[dayKey].totalSales += total;
      daysMap[dayKey].ticketsCount += 1;
      daysMap[dayKey].profit += profit;

      if (isFiado) {
        daysMap[dayKey].fiadoTotal += total;
      } else {
        daysMap[dayKey].collectedTotal += total;
      }

      if (sale.items) {
        daysMap[dayKey].itemsCount += sale.items.reduce((sum, it) => sum + (it.quantity || 1), 0);
      }
    });

    // Sorted descending (latest date first)
    return Object.values(daysMap).sort((a, b) => b.dayKey.localeCompare(a.dayKey));
  })();

  // Daily statistics for the selected month
  const bestDay = dailyBreakdown.length > 0 
    ? [...dailyBreakdown].sort((a, b) => b.totalSales - a.totalSales)[0] 
    : null;

  const avgDailySales = dailyBreakdown.length > 0
    ? Math.round(dailyBreakdown.reduce((acc, d) => acc + d.totalSales, 0) / dailyBreakdown.length)
    : 0;

  // Jump to specific day from daily breakdown
  const handleInspectSpecificDay = (dayKey) => {
    setSelectedDate(dayKey);
    setReportMode('dia');
    setTimeout(() => {
      ticketsTableRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Breakdown by payment method
  const paymentBreakdown = {
    efectivo: filteredSales.filter(s => s.paymentMethod === 'efectivo').reduce((sum, s) => sum + s.total, 0),
    transferencia: filteredSales.filter(s => s.paymentMethod === 'transferencia' || s.paymentMethod === 'mercadopago').reduce((sum, s) => sum + s.total, 0),
    tarjeta: filteredSales.filter(s => s.paymentMethod === 'tarjeta').reduce((sum, s) => sum + s.total, 0),
    fiado: filteredSales.filter(s => s.paymentMethod === 'fiado').reduce((sum, s) => sum + s.total, 0),
  };

  // Category sales breakdown
  const categoryTotals = {};
  filteredSales.forEach((sale) => {
    sale.items?.forEach((item) => {
      const catName = getCategoryDisplayName(item.product.category);
      categoryTotals[catName] = (categoryTotals[catName] || 0) + (item.subtotal || 0);
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
          category: getCategoryDisplayName(item.product.category),
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
      {/* Top Filter Card with Report Mode and Navigation Controls */}
      <div 
        style={{ 
          backgroundColor: 'var(--bg-surface)', 
          padding: '1.25rem', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid var(--border)',
          boxShadow: 'var(--card-shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}
      >
        {/* Row 1: Title & Mode Tabs (Por Día, Por Mes, Períodos Rápidos) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <CalendarDays size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                  Reportes de Ventas
                </h2>
                <span 
                  style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    padding: '2px 8px', 
                    borderRadius: '12px', 
                    backgroundColor: reportMode === 'dia' ? 'var(--primary-light)' : reportMode === 'mes' ? 'rgba(34, 197, 94, 0.15)' : 'var(--bg-hover)',
                    color: reportMode === 'dia' ? 'var(--primary)' : reportMode === 'mes' ? 'var(--success)' : 'var(--text-secondary)',
                    border: '1px solid var(--border)'
                  }}
                >
                  {activePeriodBadge}
                </span>
              </div>
              <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block', marginTop: '2px' }}>
                Viendo: <strong style={{ color: 'var(--text-main)' }}>{activePeriodLabel}</strong>
              </span>
            </div>
          </div>

          {/* Mode Selector Tabs */}
          <div style={{ display: 'flex', gap: '0.35rem', backgroundColor: 'var(--bg-hover)', padding: '0.3rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
            <button
              onClick={() => setReportMode('dia')}
              style={{
                border: 'none',
                backgroundColor: reportMode === 'dia' ? 'var(--primary)' : 'transparent',
                color: reportMode === 'dia' ? '#ffffff' : 'var(--text-muted)',
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Calendar size={15} />
              <span>Por Día</span>
            </button>

            <button
              onClick={() => setReportMode('mes')}
              style={{
                border: 'none',
                backgroundColor: reportMode === 'mes' ? 'var(--primary)' : 'transparent',
                color: reportMode === 'mes' ? '#ffffff' : 'var(--text-muted)',
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <CalendarDays size={15} />
              <span>Por Mes</span>
            </button>

            <button
              onClick={() => setReportMode('rango')}
              style={{
                border: 'none',
                backgroundColor: reportMode === 'rango' ? 'var(--primary)' : 'transparent',
                color: reportMode === 'rango' ? '#ffffff' : 'var(--text-muted)',
                padding: '0.45rem 0.95rem',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                transition: 'all 0.15s ease'
              }}
            >
              <Clock size={15} />
              <span>Períodos Rápidos</span>
            </button>
          </div>
        </div>

        {/* Row 2: Sub-controls specific to the active mode */}
        <div 
          style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            paddingTop: '0.85rem', 
            borderTop: '1px solid var(--border)',
            flexWrap: 'wrap',
            gap: '0.75rem'
          }}
        >
          {/* MODE: POR DÍA */}
          {reportMode === 'dia' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSetToday}
                  className={`btn ${selectedDate === todayStr ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                >
                  Hoy
                </button>
                <button
                  onClick={handleSetYesterday}
                  className={`btn ${selectedDate === yesterdayStr ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                >
                  Ayer
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.35rem' }}>
                  <button
                    onClick={handlePrevDay}
                    title="Día anterior"
                    style={{
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <input
                    type="date"
                    className="form-input"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value || todayStr)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      width: 'auto',
                      height: '34px',
                      cursor: 'pointer'
                    }}
                  />

                  <button
                    onClick={handleNextDay}
                    title="Día siguiente"
                    style={{
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {filteredSales.length} ticket{filteredSales.length !== 1 ? 's' : ''} emitido{filteredSales.length !== 1 ? 's' : ''} en este día
              </div>
            </>
          )}

          {/* MODE: POR MES */}
          {reportMode === 'mes' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  onClick={handleSetThisMonth}
                  className={`btn ${selectedMonth === thisMonthStr ? 'btn-primary' : 'btn-secondary'}`}
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                >
                  Este Mes
                </button>
                <button
                  onClick={handleSetPrevMonth}
                  className="btn btn-secondary"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.82rem' }}
                >
                  Mes Anterior
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginLeft: '0.35rem' }}>
                  <button
                    onClick={handlePrevMonth}
                    title="Mes anterior"
                    style={{
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <ChevronLeft size={16} />
                  </button>

                  <input
                    type="month"
                    className="form-input"
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value || thisMonthStr)}
                    style={{
                      padding: '0.35rem 0.65rem',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                      width: 'auto',
                      height: '34px',
                      cursor: 'pointer'
                    }}
                  />

                  <button
                    onClick={handleNextMonth}
                    title="Mes siguiente"
                    style={{
                      background: 'var(--bg-hover)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.4rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--text-secondary)'
                    }}
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <button
                  onClick={() => setIsMonthlyComparisonOpen(true)}
                  className="btn btn-outline"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    padding: '0.4rem 0.8rem',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    borderRadius: 'var(--radius-md)',
                    borderColor: 'var(--primary)',
                    color: 'var(--primary)',
                    backgroundColor: 'rgba(56, 189, 248, 0.08)',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap'
                  }}
                >
                  <BarChart3 size={15} />
                  <span>Histórico Comparativo</span>
                </button>
              </div>
            </>
          )}

          {/* MODE: RANGO RÁPIDO */}
          {reportMode === 'rango' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => setQuickRange('semana')}
                className={`btn ${quickRange === 'semana' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
              >
                Últimos 7 días
              </button>
              <button
                onClick={() => setQuickRange('todos')}
                className={`btn ${quickRange === 'todos' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
              >
                Histórico Total
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Month-over-Month Comparison Banner Card (Only when viewing by month) */}
      {reportMode === 'mes' && comparisonData && (
        <div 
          style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border)', 
            padding: '1.15rem 1.25rem', 
            borderRadius: 'var(--radius-lg)', 
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <BarChart3 size={20} />
            </div>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
                Comparación Mensual ({comparisonData.currMonthLabel} vs {comparisonData.prevMonthLabel})
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {comparisonData.currMonthLabel}: <strong style={{ color: 'var(--success, #16a34a)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(comparisonData.currTotal)}</strong>
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>vs</span>
                <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                  {comparisonData.prevMonthLabel}: <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(comparisonData.prevTotal)}</strong>
                </span>
              </div>
            </div>
          </div>

          <div 
            style={{ 
              padding: '0.45rem 0.9rem', 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: comparisonData.diff >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
              border: `1px solid ${comparisonData.diff >= 0 ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              color: comparisonData.diff >= 0 ? 'var(--success, #16a34a)' : '#ef4444',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              fontWeight: 700,
              fontSize: '0.9rem'
            }}
          >
            {comparisonData.diff >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
            <span>
              {comparisonData.diff >= 0 ? '+' : ''}{formatCurrency(comparisonData.diff)} ({comparisonData.diff >= 0 ? '+' : ''}{comparisonData.growthPercent}%)
            </span>
          </div>
        </div>
      )}

      {/* Primary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            {reportMode === 'dia' ? 'TOTAL COBRADO EN EL DÍA' : reportMode === 'mes' ? 'TOTAL COBRADO EN EL MES' : 'TOTAL COBRADO EN EL PERÍODO'}
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: 'var(--success, #16a34a)', marginTop: '0.25rem' }}>
            {formatCurrency(totalCollected + debtRecoveredTotal)}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500, display: 'block' }}>
            {collectedSales.length} venta{collectedSales.length !== 1 ? 's' : ''} cobrada{collectedSales.length !== 1 ? 's' : ''}
          </span>
          {debtRecoveredTotal > 0 && (
            <span style={{ fontSize: '0.75rem', color: '#0284c7', fontWeight: 600, display: 'block', marginTop: '2px' }}>
              +{formatCurrency(debtRecoveredTotal)} cobrado de deudas
            </span>
          )}
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: totalFiado > 0 ? '1px solid rgba(202, 138, 4, 0.4)' : '1px solid var(--border)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
          <span style={{ fontSize: '0.75rem', color: totalFiado > 0 ? '#ca8a04' : 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            FIADO / PENDIENTE DE COBRO
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: totalFiado > 0 ? '#ca8a04' : 'var(--text-muted)', marginTop: '0.25rem' }}>
            {formatCurrency(totalFiado)}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            {fiadoSales.length} {fiadoSales.length === 1 ? 'ticket fiado' : 'tickets fiados'} (no suma a caja)
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            GANANCIA NETA COBRADA
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '2rem', fontWeight: 800, color: 'var(--primary, #2563eb)', marginTop: '0.25rem' }}>
            {formatCurrency(realProfit)}
          </div>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
            Margen del {profitMarginPercent}% · Ticket prom: {formatCurrency(averageTicket)}
          </span>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em' }}>
            DESGLOSE POR MEDIO
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', marginTop: '0.4rem', fontSize: '0.82rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>💵 Efectivo:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--success, #16a34a)' }}>{formatCurrency(paymentBreakdown.efectivo + debtRecoveredCash)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>📲 Transferencia / QR:</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary, #2563eb)' }}>{formatCurrency(paymentBreakdown.transferencia + paymentBreakdown.tarjeta + debtRecoveredDigital)}</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
              <span>📒 Cta. Cte. (Fiado):</span>
              <strong style={{ fontFamily: 'var(--font-mono)', color: '#ca8a04' }}>{formatCurrency(paymentBreakdown.fiado)}</strong>
            </div>
            {debtRecoveredTotal > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: '#0284c7', fontSize: '0.76rem', borderTop: '1px dashed var(--border)', paddingTop: '3px', marginTop: '2px', fontWeight: 600 }}>
                <span>🤝 Cobro deudas:</span>
                <span style={{ fontFamily: 'var(--font-mono)' }}>+{formatCurrency(debtRecoveredTotal)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NEW SECTION: Daily Breakdown Table & Mini-Stats (Only shown when reportMode === 'mes') */}
      {reportMode === 'mes' && (
        <div 
          style={{ 
            backgroundColor: 'var(--bg-surface)', 
            border: '1px solid var(--border)', 
            padding: '1.25rem', 
            borderRadius: 'var(--radius-lg)', 
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          {/* Header with Title and Month Highlights */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '8px', backgroundColor: 'rgba(34, 197, 94, 0.15)', color: 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={18} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                  Ventas Día por Día de {activePeriodLabel}
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  Total vendido y desglose por cada día del mes. Hacé clic en "Ver Día" para inspeccionar sus tickets.
                </span>
              </div>
            </div>

            {/* Monthly highlights: Record day & daily average */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              {bestDay && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--bg-hover)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <Award size={16} color="#eab308" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Mejor día: <strong>{bestDay.weekday} {bestDay.dayNum}</strong> ({formatCurrency(bestDay.totalSales)})
                  </span>
                </div>
              )}
              {avgDailySales > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'var(--bg-hover)', padding: '0.4rem 0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <Sparkles size={15} color="var(--primary)" />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Promedio diario: <strong style={{ fontFamily: 'var(--font-mono)' }}>{formatCurrency(avgDailySales)}/día</strong>
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Table of Days in Month */}
          <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            <table className="mockup-table">
              <thead>
                <tr>
                  <th style={{ width: '180px' }}>Fecha / Día</th>
                  <th style={{ textAlign: 'right' }}>Total Vendido</th>
                  <th style={{ textAlign: 'right' }}>Cobrado en Caja</th>
                  <th style={{ textAlign: 'right' }}>Cta. Cte. (Fiado)</th>
                  <th style={{ textAlign: 'center' }}>Tickets</th>
                  <th style={{ textAlign: 'right' }}>Ganancia Est.</th>
                  <th style={{ textAlign: 'center', width: '140px' }}>Acción</th>
                </tr>
              </thead>
              <tbody>
                {dailyBreakdown.map((item) => {
                  const isTodayItem = item.dayKey === todayStr;
                  const isRecord = bestDay && bestDay.dayKey === item.dayKey && item.totalSales > 0;

                  return (
                    <tr 
                      key={item.dayKey}
                      style={{ 
                        backgroundColor: isTodayItem ? 'rgba(59, 130, 246, 0.04)' : undefined 
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span 
                            style={{ 
                              fontWeight: 700, 
                              color: 'var(--text-main)', 
                              fontSize: '0.88rem' 
                            }}
                          >
                            {item.weekday} {item.dayNum}
                          </span>
                          {isTodayItem && (
                            <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(59, 130, 246, 0.15)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
                              HOY
                            </span>
                          )}
                          {isRecord && (
                            <span style={{ fontSize: '0.68rem', backgroundColor: '#fef08a', color: '#854d0e', padding: '1px 6px', borderRadius: '10px', fontWeight: 800 }}>
                              ⭐ RÉCORD
                            </span>
                          )}
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.fullDateStr}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: '0.95rem', color: 'var(--success, #16a34a)' }}>
                        {formatCurrency(item.totalSales)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        {formatCurrency(item.collectedTotal)}
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: item.fiadoTotal > 0 ? '#ca8a04' : 'var(--text-muted)', fontWeight: item.fiadoTotal > 0 ? 700 : 400 }}>
                        {item.fiadoTotal > 0 ? formatCurrency(item.fiadoTotal) : '$0'}
                      </td>
                      <td style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{item.ticketsCount}</span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                          {item.ticketsCount > 0 ? `Prom: ${formatCurrency(Math.round(item.totalSales / item.ticketsCount))}` : ''}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 600 }}>
                        +{formatCurrency(item.profit)}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          type="button"
                          onClick={() => handleInspectSpecificDay(item.dayKey)}
                          className="btn btn-outline"
                          style={{
                            padding: '0.3rem 0.65rem',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            borderRadius: 'var(--radius-sm)',
                            borderColor: 'var(--primary)',
                            color: 'var(--primary)',
                            backgroundColor: 'transparent',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            cursor: 'pointer'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--primary)';
                            e.currentTarget.style.color = '#ffffff';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.color = 'var(--primary)';
                          }}
                        >
                          <span>Ver Día</span>
                          <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {dailyBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No se registraron ventas en ningún día de este mes ({activePeriodLabel}).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Top 5 Products & Category Sales Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
        {/* Top 5 Products */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <TrendingUp size={18} color="#16a34a" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Top Productos Más Vendidos</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
            {topProducts.map((p, idx) => (
              <div 
                key={idx}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'space-between',
                  backgroundColor: 'var(--bg-hover)',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span 
                    style={{ 
                      width: '24px', 
                      height: '24px', 
                      borderRadius: '50%', 
                      backgroundColor: idx === 0 ? '#fef08a' : 'var(--border)', 
                      color: idx === 0 ? '#854d0e' : 'var(--text-secondary)',
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
                    <strong style={{ display: 'block', fontSize: '0.875rem', color: 'var(--text-main)' }}>{p.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{p.quantity} unidades vendidas</span>
                  </div>
                </div>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success, #16a34a)' }}>
                  {formatCurrency(p.revenue)}
                </span>
              </div>
            ))}

            {topProducts.length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                No hay ventas registradas en este período
              </div>
            )}
          </div>
        </div>

        {/* Sales by Category */}
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--border)', padding: '1.25rem', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <BarChart3 size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>Ventas por Categoría</h3>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {Object.entries(categoryTotals).map(([cat, total]) => {
              const percentage = totalRevenue > 0 ? Math.round((total / totalRevenue) * 100) : 0;
              return (
                <div key={cat}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.35rem', fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{cat}</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>{formatCurrency(total)} ({percentage}%)</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: 'var(--bg-hover)', borderRadius: '4px', overflow: 'hidden' }}>
                    <div 
                      style={{ 
                        height: '100%', 
                        width: `${percentage}%`, 
                        backgroundColor: 'var(--primary)',
                        borderRadius: '4px'
                      }}
                    />
                  </div>
                </div>
              );
            })}

            {Object.keys(categoryTotals).length === 0 && (
              <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                Sin ventas por categorías en este período
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Complete Sales Log Table */}
      <div 
        ref={ticketsTableRef}
        style={{ 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--border)', 
          padding: '1.25rem', 
          borderRadius: 'var(--radius-lg)', 
          boxShadow: 'var(--card-shadow)' 
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={18} color="var(--primary)" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              {reportMode === 'dia' ? `Tickets del Día: ${activePeriodLabel}` : reportMode === 'mes' ? `Tickets del Mes: ${activePeriodLabel}` : 'Registro de Tickets'}
            </h3>
            <span style={{ fontSize: '0.75rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '2px 8px', borderRadius: '12px', fontWeight: 700 }}>
              {filteredSales.length} ticket{filteredSales.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Table Search & Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color="#94a3b8" style={{ position: 'absolute', left: '10px' }} />
              <input
                type="text"
                className="form-input"
                placeholder="Buscar ticket, cliente o prod..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                style={{ paddingLeft: '30px', paddingRight: tableSearchQuery ? '26px' : '10px', fontSize: '0.8rem', height: '34px', width: '220px' }}
              />
              {tableSearchQuery && (
                <button
                  type="button"
                  onClick={() => setTableSearchQuery('')}
                  style={{ position: 'absolute', right: '6px', background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '2px', display: 'flex' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Payment Method Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Filter size={14} color="#64748b" />
              <select
                className="form-input"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                style={{ fontSize: '0.8rem', height: '34px', padding: '0 8px', width: 'auto' }}
              >
                <option value="todos">Todos los Medios</option>
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
                <option value="fiado">Cuenta Corriente</option>
              </select>
            </div>
          </div>
        </div>

        {(() => {
          const tableSales = filteredSales.filter((s) => {
            if (paymentFilter !== 'todos') {
              if (paymentFilter === 'transferencia') {
                if (s.paymentMethod !== 'transferencia' && s.paymentMethod !== 'mercadopago') return false;
              } else if (s.paymentMethod !== paymentFilter) {
                return false;
              }
            }
            if (tableSearchQuery.trim()) {
              const q = tableSearchQuery.trim().toLowerCase();
              const matchId = s.id?.toLowerCase().includes(q)
                || (s.dailyTicketNumber != null && String(s.dailyTicketNumber).includes(q))
                || (s.dailyTicketNumber != null && `ticket #${s.dailyTicketNumber}`.includes(q))
                || (s.dailyTicketNumber != null && `#${s.dailyTicketNumber}`.includes(q));
              const matchClient = s.clientName?.toLowerCase().includes(q);
              const matchItem = s.items?.some(i => i.product?.name?.toLowerCase().includes(q));
              if (!matchId && !matchClient && !matchItem) return false;
            }
            return true;
          });

          return (
            <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
              <table className="mockup-table">
                <thead>
                  <tr>
                    <th>Ticket</th>
                    <th>Fecha y Hora</th>
                    <th>Cliente</th>
                    <th>Artículos</th>
                    <th>Medio de Pago</th>
                    <th style={{ textAlign: 'right' }}>Total Venta</th>
                    <th style={{ textAlign: 'right' }}>Ganancia</th>
                    <th style={{ textAlign: 'center', width: '110px' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {tableSales.map((s) => {
                    const paymentBadgeColor = {
                      efectivo: { bg: 'rgba(34, 197, 94, 0.15)', color: '#16a34a', border: 'rgba(34, 197, 94, 0.3)' },
                      tarjeta: { bg: 'rgba(37, 99, 235, 0.15)', color: '#2563eb', border: 'rgba(37, 99, 235, 0.3)' },
                      transferencia: { bg: 'rgba(147, 51, 234, 0.15)', color: '#9333ea', border: 'rgba(147, 51, 234, 0.3)' },
                      mercadopago: { bg: 'rgba(147, 51, 234, 0.15)', color: '#9333ea', border: 'rgba(147, 51, 234, 0.3)' },
                      fiado: { bg: 'rgba(202, 138, 4, 0.15)', color: '#ca8a04', border: 'rgba(202, 138, 4, 0.3)' }
                    }[s.paymentMethod] || { bg: 'var(--bg-hover)', color: 'var(--text-secondary)', border: 'var(--border)' };

                    return (
                      <tr key={s.id}>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--primary)', fontWeight: 700 }}>
                          {s.dailyTicketNumber ? `Ticket #${s.dailyTicketNumber}` : `#${s.id.slice(-6).toUpperCase()}`}
                          {s.dailyTicketNumber && (
                            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', fontWeight: 400 }}>
                              ref: #{s.id.slice(-6).toUpperCase()}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                          {new Date(s.date).toLocaleDateString('es-AR')} {new Date(s.date).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.85rem' }}>
                          {s.clientName || 'Consumidor Final'}
                          {s.notes && (
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                              Nota: {s.notes}
                            </div>
                          )}
                        </td>
                        <td style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', maxWidth: '240px' }}>
                          {s.items?.map(i => `${i.quantity}x ${i.product?.name}`).join(', ')}
                        </td>
                        <td>
                          <span 
                            style={{ 
                              padding: '3px 8px', 
                              borderRadius: '4px', 
                              fontSize: '0.72rem', 
                              textTransform: 'uppercase', 
                              fontWeight: 700,
                              backgroundColor: paymentBadgeColor.bg,
                              color: paymentBadgeColor.color,
                              border: `1px solid ${paymentBadgeColor.border}`
                            }}
                          >
                            {s.paymentMethod === 'fiado' ? 'Cta Cte' : s.paymentMethod}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16a34a' }}>
                          {formatCurrency(s.total)}
                        </td>
                        <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#2563eb', fontWeight: 600 }}>
                          +{formatCurrency(s.profit)}
                        </td>
                        <td style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                            <button
                              type="button"
                              onClick={() => setPrintingSale(s)}
                              title="Ver / Reimprimir Ticket"
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#eff6ff'; e.currentTarget.style.color = '#2563eb'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
                            >
                              <Printer size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setEditingSale(s)}
                              title="Modificar Venta (Medio de pago, cliente, fecha)"
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                color: '#475569',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fefce8'; e.currentTarget.style.color = '#ca8a04'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#475569'; }}
                            >
                              <Edit2 size={15} />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeletingSale(s)}
                              title="Anular / Borrar Venta (Devuelve stock y revierte deuda)"
                              style={{
                                background: '#f8fafc',
                                border: '1px solid #e2e8f0',
                                borderRadius: '4px',
                                padding: '4px 6px',
                                cursor: 'pointer',
                                color: '#94a3b8',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = '#fef2f2'; e.currentTarget.style.color = '#dc2626'; }}
                              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = '#f8fafc'; e.currentTarget.style.color = '#94a3b8'; }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {tableSales.length === 0 && (
                    <tr>
                      <td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: '#94a3b8' }}>
                        {filteredSales.length === 0 
                          ? `No hay ventas registradas para ${activePeriodLabel}.` 
                          : 'No se encontraron tickets con los filtros de búsqueda aplicados.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          );
        })()}
      </div>

      {/* Edit Sale Modal */}
      {editingSale && (
        <EditSaleModal
          isOpen={!!editingSale}
          onClose={() => setEditingSale(null)}
          sale={editingSale}
          clients={clients}
          onSave={onUpdateSale}
        />
      )}

      {/* Ticket Reprint Modal */}
      {printingSale && (
        <TicketModal
          isOpen={!!printingSale}
          onClose={() => setPrintingSale(null)}
          sale={printingSale}
          config={config}
        />
      )}

      {/* Delete Sale Confirmation Modal */}
      {deletingSale && (
        <ModalBackdrop onClose={() => setDeletingSale(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid #fee2e2', backgroundColor: '#fff5f5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <AlertTriangle size={20} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#991b1b' }}>
                  ¿Anular Venta {deletingSale.dailyTicketNumber ? `Ticket #${deletingSale.dailyTicketNumber}` : `#${deletingSale.id.slice(-6).toUpperCase()}`}?
                </h3>
              </div>
              <button 
                onClick={() => setDeletingSale(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                Esta acción eliminará el ticket por un total de <strong>{formatCurrency(deletingSale.total)}</strong>.
              </p>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '0.85rem' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#475569', marginBottom: '0.4rem', textTransform: 'uppercase' }}>
                  Impacto de la anulación:
                </div>
                <ul style={{ margin: 0, paddingLeft: '1.2rem', fontSize: '0.82rem', color: '#475569', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <li>
                    <strong>Devolución de Stock:</strong> Se reincorporarán automáticamente las unidades de {deletingSale.items?.length || 0} producto{(deletingSale.items?.length || 0) > 1 ? 's' : ''} al inventario.
                  </li>
                  {deletingSale.paymentMethod === 'fiado' && deletingSale.clientName && deletingSale.clientName !== 'Consumidor Final' ? (
                    <li>
                      <strong>Cuenta Corriente:</strong> Se cancelará la deuda de <strong>{formatCurrency(deletingSale.total)}</strong> a la cuenta de <strong>{deletingSale.clientName}</strong>.
                    </li>
                  ) : (
                    <li>
                      <strong>Medio de Pago:</strong> La venta figuraba como {deletingSale.paymentMethod.toUpperCase()}.
                    </li>
                  )}
                </ul>
              </div>

              <div style={{ fontSize: '0.78rem', color: '#ef4444', fontWeight: 600 }}>
                * Esta operación no se puede deshacer.
              </div>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setDeletingSale(null)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-danger"
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', backgroundColor: '#dc2626', color: '#ffffff', border: 'none' }}
                onClick={() => {
                  onDeleteSale(deletingSale.id);
                  setDeletingSale(null);
                }}
              >
                <Trash2 size={16} />
                <span>Confirmar Anulación</span>
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* Modal de Comparativa Histórica de Todos los Meses */}
      <MonthlyComparisonModal
        isOpen={isMonthlyComparisonOpen}
        onClose={() => setIsMonthlyComparisonOpen(false)}
        sales={sales}
      />
    </div>
  );
}
