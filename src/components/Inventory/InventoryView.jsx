import React, { useState, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  Edit3, 
  Trash2, 
  AlertTriangle, 
  Package, 
  DollarSign, 
  PlusCircle,
  MinusCircle,
  X,
  FileSpreadsheet
} from 'lucide-react';
import ProductModal from './ProductModal';
import BulkPriceModal from './BulkPriceModal';
import ImportCSVModal from '../Settings/ImportCSVModal';

// Column widths (must add up to 100% or use flex)
const COL_WIDTHS = {
  check:    40,
  barcode:  120,
  name:     '1fr',
  category: 110,
  stock:    130,
  minstock: 70,
  cost:     100,
  sale:     110,
  margin:   80,
  actions:  88,
};

const ROW_HEIGHT = 58; // px

export default function InventoryView({ 
  products, 
  categories = [],
  config,
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onDeleteBatchProducts,
  onBulkUpdatePrices,
  initialCategoryFilter = 'todos',
  onReloadData
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryFilter || 'todos');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [selectedIds, setSelectedIds] = useState(new Set());

  const trackInventoryGlobal = config?.trackInventory !== false;

  React.useEffect(() => {
    setSelectedCategory(initialCategoryFilter || 'todos');
  }, [initialCategoryFilter]);

  const formatCurrency = useCallback((val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  }, []);

  const getCategoryDisplayName = useCallback((catIdOrName) => {
    if (!catIdOrName) return 'General';
    const found = categories.find(
      (c) => c.id === catIdOrName || (c.name && c.name.toLowerCase() === catIdOrName.toLowerCase())
    );
    if (found) return found.name;
    const clean = catIdOrName.replace(/[_-]\d+$/, '').replace(/[_-]/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  }, [categories]);

  // --- Memoized metrics (avoid recalculating on every search keystroke) ---
  const metrics = useMemo(() => {
    const withStock = products.filter(p => p.trackStock !== false);
    return {
      totalItemsCount: withStock.reduce((acc, p) => acc + (p.stock || 0), 0),
      totalCostValue:  withStock.reduce((acc, p) => acc + (p.costPrice || 0) * (p.stock || 0), 0),
      totalSaleValue:  withStock.reduce((acc, p) => acc + (p.salePrice || 0) * (p.stock || 0), 0),
      potentialProfit: withStock.reduce((acc, p) => acc + ((p.salePrice || 0) - (p.costPrice || 0)) * (p.stock || 0), 0),
      criticalCount:   withStock.filter(p => (p.stock || 0) <= (p.minStock || 5)).length,
    };
  }, [products]);

  // --- Memoized filtered list (only recalculates when search/filter changes) ---
  const filteredProducts = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return products.filter((p) => {
      if (selectedCategory !== 'todos' && p.category !== selectedCategory) return false;
      if (onlyLowStock && !(p.trackStock !== false && (p.stock || 0) <= (p.minStock || 5))) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        (p.category && p.category.toLowerCase().includes(q))
      );
    });
  }, [products, selectedCategory, onlyLowStock, searchQuery]);

  // --- Batch selection helpers ---
  const allFilteredSelected = filteredProducts.length > 0 && filteredProducts.every(p => selectedIds.has(p.id));
  const someFilteredSelected = filteredProducts.some(p => selectedIds.has(p.id));

  const handleToggleSelectAll = useCallback(() => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (filteredProducts.every(p => next.has(p.id))) {
        filteredProducts.forEach(p => next.delete(p.id));
      } else {
        filteredProducts.forEach(p => next.add(p.id));
      }
      return next;
    });
  }, [filteredProducts]);

  const handleToggleSelectOne = useCallback((id) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleBatchDelete = useCallback(() => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (window.confirm(`¿Estás seguro de eliminar los ${ids.length} productos seleccionados del catálogo?`)) {
      if (onDeleteBatchProducts) {
        onDeleteBatchProducts(ids);
      } else {
        ids.forEach(id => onDeleteProduct(id));
      }
      setSelectedIds(new Set());
    }
  }, [selectedIds, onDeleteBatchProducts, onDeleteProduct]);

  const handleOpenAddModal = useCallback(() => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  }, []);

  const handleOpenEditModal = useCallback((product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  }, []);

  const handleSaveProduct = useCallback((productData) => {
    if (editingProduct) {
      onUpdateProduct(editingProduct.id, productData);
    } else {
      onAddProduct(productData);
    }
    setIsProductModalOpen(false);
  }, [editingProduct, onAddProduct, onUpdateProduct]);

  const handleQuickStockDelta = useCallback((product, delta) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    onUpdateProduct(product.id, { stock: newStock });
  }, [onUpdateProduct]);

  const handleDelete = useCallback((id, name) => {
    if (window.confirm(`¿Estás seguro de eliminar "${name}" del catálogo?`)) {
      onDeleteProduct(id);
      setSelectedIds(prev => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [onDeleteProduct]);

  // --- Virtual row renderer ---
  const VirtualRow = useCallback(({ index, style }) => {
    const p = filteredProducts[index];
    const tracksStock = trackInventoryGlobal && p.trackStock !== false;
    const isOutOfStock = tracksStock && (p.stock || 0) <= 0;
    const isLowStock   = tracksStock && (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 5);
    const cost   = Number(p.costPrice) || 0;
    const sale   = Number(p.salePrice) || 0;
    const margin = cost > 0 ? Math.round(((sale - cost) / cost) * 100) : 0;
    const isSelected = selectedIds.has(p.id);

    return (
      <div
        style={{
          ...style,
          display: 'grid',
          gridTemplateColumns: `${COL_WIDTHS.check}px ${COL_WIDTHS.barcode}px ${COL_WIDTHS.name} ${COL_WIDTHS.category}px ${COL_WIDTHS.stock}px ${COL_WIDTHS.minstock}px ${COL_WIDTHS.cost}px ${COL_WIDTHS.sale}px ${COL_WIDTHS.margin}px ${COL_WIDTHS.actions}px`,
          alignItems: 'center',
          padding: '0 0.75rem',
          borderBottom: '1px solid var(--border)',
          backgroundColor: isSelected ? 'var(--bg-selected, rgba(37,99,235,0.07))' : (index % 2 === 0 ? 'var(--bg-surface)' : 'var(--bg-hover, rgba(0,0,0,0.02))'),
          transition: 'background-color 0.1s ease',
          gap: '0.5rem',
          boxSizing: 'border-box',
        }}
      >
        {/* Checkbox */}
        <div style={{ textAlign: 'center' }}>
          <input 
            type="checkbox"
            checked={isSelected}
            onChange={() => handleToggleSelectOne(p.id)}
            style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
          />
        </div>

        {/* Barcode */}
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {p.barcode}
        </div>

        {/* Name + unit */}
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontWeight: 600, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.875rem' }}>{p.name}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{p.unit || 'Unidad'}</span>
            {!tracksStock && (
              <span style={{ fontSize: '0.68rem', padding: '1px 5px', borderRadius: '4px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>
                {trackInventoryGlobal ? 'Sin control stock' : 'Inv. desact.'}
              </span>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <span style={{ fontSize: '0.72rem', padding: '3px 7px', borderRadius: '4px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
            {getCategoryDisplayName(p.category)}
          </span>
        </div>

        {/* Stock */}
        <div style={{ textAlign: 'center' }}>
          {tracksStock ? (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={() => handleQuickStockDelta(p, -1)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                title="Restar 1"
              >
                <MinusCircle size={15} />
              </button>
              <span style={{
                minWidth: '42px', display: 'inline-block', textAlign: 'center',
                padding: '2px 5px', borderRadius: '4px', fontSize: '0.82rem',
                fontFamily: 'var(--font-mono)', fontWeight: 700,
                backgroundColor: isOutOfStock ? 'var(--danger-light)' : isLowStock ? 'var(--warning-light)' : 'var(--success-light)',
                color: isOutOfStock ? 'var(--danger)' : isLowStock ? 'var(--warning-hover)' : 'var(--success)'
              }}>
                {p.stock}
              </span>
              <button
                onClick={() => handleQuickStockDelta(p, 1)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '2px', display: 'flex' }}
                title="Sumar 1"
              >
                <PlusCircle size={15} />
              </button>
            </div>
          ) : (
            <span style={{ fontSize: '0.72rem', padding: '3px 7px', borderRadius: '4px', backgroundColor: 'var(--bg-hover)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontWeight: 500 }}>
              Sin inv.
            </span>
          )}
        </div>

        {/* Min Stock */}
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {tracksStock ? (p.minStock || 5) : '—'}
        </div>

        {/* Cost */}
        <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          {formatCurrency(p.costPrice)}
        </div>

        {/* Sale price */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontWeight: 700, color: 'var(--success)', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}>
            {formatCurrency(p.salePrice)}
          </div>
          {p.wholesalePrice > 0 && (
            <span style={{ display: 'block', fontSize: '0.68rem', color: '#0284c7', fontWeight: 600 }} title="Precio Mayoreo (F11)">
              May: {formatCurrency(p.wholesalePrice)}
            </span>
          )}
        </div>

        {/* Margin */}
        <div style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.82rem' }}>
          <span style={{ color: margin > 30 ? 'var(--primary)' : 'var(--warning)', fontWeight: 600 }}>
            +{margin}%
          </span>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '0.3rem', justifyContent: 'center' }}>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 7px' }}
            onClick={() => handleOpenEditModal(p)}
            title="Editar"
          >
            <Edit3 size={13} />
          </button>
          <button
            className="btn btn-secondary"
            style={{ padding: '4px 7px', color: 'var(--danger)' }}
            onClick={() => handleDelete(p.id, p.name)}
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>
    );
  }, [filteredProducts, selectedIds, trackInventoryGlobal, formatCurrency, getCategoryDisplayName, handleToggleSelectOne, handleQuickStockDelta, handleOpenEditModal, handleDelete]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      
      {/* Stock Tracking Status Banner if disabled globally */}
      {!trackInventoryGlobal && (
        <div style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--warning-hover)', fontSize: '0.85rem' }}>
          <AlertTriangle size={16} />
          <span>
            <strong>Aviso:</strong> El control de inventario general está desactivado en Configuración. Las ventas se realizan de manera ilimitada sin descontar stock.
          </span>
        </div>
      )}

      {/* Top Metrics Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.15rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>VARIEDAD DE PRODUCTOS</span>
            <Package size={18} color="var(--primary)" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {products.length} {trackInventoryGlobal ? (
              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>({metrics.totalItemsCount} en stock)</span>
            ) : (
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>(Sin límite de stock)</span>
            )}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.15rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>CAPITAL INVERTIDO (COSTO)</span>
            <DollarSign size={18} color="var(--text-muted)" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-secondary)' }}>
            {formatCurrency(metrics.totalCostValue)}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.15rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>VALOR TOTAL DE VENTA</span>
            <DollarSign size={18} color="var(--primary)" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--primary)' }}>
            {formatCurrency(metrics.totalSaleValue)}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.15rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>GANANCIA POTENCIAL</span>
            <TrendingUp size={18} color="var(--success)" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: 'var(--success)' }}>
            {formatCurrency(metrics.potentialProfit)}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1.15rem', borderRadius: 'var(--radius-lg)', border: (trackInventoryGlobal && metrics.criticalCount > 0) ? '1px solid var(--warning-border)' : '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              {trackInventoryGlobal ? 'STOCK CRÍTICO / FALTANTE' : 'ESTADO DE STOCK'}
            </span>
            <AlertTriangle size={18} color={trackInventoryGlobal && metrics.criticalCount > 0 ? 'var(--warning)' : 'var(--text-muted)'} />
          </div>
          {trackInventoryGlobal ? (
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: metrics.criticalCount > 0 ? 'var(--warning)' : 'var(--success)' }}>
              {metrics.criticalCount} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-muted)' }}>por reponer</span>
            </div>
          ) : (
            <div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-muted)' }}>Desactivado</div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ventas libres sin descontar</span>
            </div>
          )}
        </div>
      </div>

      {/* Action Header & Search Controls */}
      <div style={{ backgroundColor: 'var(--bg-surface)', padding: '1rem 1.25rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--card-border)', boxShadow: 'var(--card-shadow)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '320px', alignItems: 'center' }}>
          <div className="barcode-input-wrap" style={{ flex: 1 }}>
            <Search size={16} color="var(--text-muted)" />
            <input
              type="text"
              className="barcode-input"
              placeholder="Buscar por nombre, código de barra o marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Escape') setSearchQuery(''); }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                title="Limpiar búsqueda (Esc)"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 0.85rem', backgroundColor: onlyLowStock ? 'var(--warning-light)' : 'var(--bg-hover)', border: `1px solid ${onlyLowStock ? 'var(--warning-border)' : 'var(--border)'}`, borderRadius: 'var(--radius-md)', cursor: 'pointer', fontSize: '0.825rem', fontWeight: 600, color: onlyLowStock ? 'var(--warning-hover)' : 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
            <input type="checkbox" checked={onlyLowStock} onChange={(e) => setOnlyLowStock(e.target.checked)} style={{ cursor: 'pointer', accentColor: 'var(--warning)' }} />
            <span>Solo Stock Crítico</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-secondary" onClick={() => setIsImportModalOpen(true)} title="Importar productos desde Excel, CSV o Abarrotes PDV" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <FileSpreadsheet size={16} color="var(--success)" />
            <span>Importar Excel / Abarrotes</span>
          </button>
          <button className="btn btn-secondary" onClick={() => setIsBulkModalOpen(true)} title="Aumentar precios en masa por porcentaje">
            <TrendingUp size={16} color="var(--warning)" />
            <span>Aumento Masivo %</span>
          </button>
          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Category Filter Chips */}
      <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {[{ id: 'todos', name: 'Todos los Productos' }, ...categories.filter(c => c.id !== 'todos')].map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '0.4rem',
              padding: '0.45rem 0.95rem', borderRadius: '9999px', fontSize: '0.825rem', fontWeight: 600,
              border: selectedCategory === cat.id ? '1.5px solid var(--primary)' : '1px solid var(--border)',
              backgroundColor: selectedCategory === cat.id ? 'var(--primary)' : 'var(--bg-surface)',
              color: selectedCategory === cat.id ? '#ffffff' : 'var(--text-secondary)',
              cursor: 'pointer', whiteSpace: 'nowrap',
              boxShadow: selectedCategory === cat.id ? 'var(--shadow-glow)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Batch Action Floating Bar */}
      {selectedIds.size > 0 && (
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '2px solid var(--primary)', borderRadius: 'var(--radius-md)', padding: '0.75rem 1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: 'var(--modal-shadow)', animation: 'fadeIn 0.2s ease-in-out' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {selectedIds.size} producto{selectedIds.size > 1 ? 's' : ''} seleccionado{selectedIds.size > 1 ? 's' : ''}
            </span>
            <button className="btn btn-secondary" style={{ padding: '4px 10px', fontSize: '0.8rem' }} onClick={() => setSelectedIds(new Set())}>
              <X size={14} />
              <span>Deseleccionar todos</span>
            </button>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button type="button" className="btn btn-primary" onClick={() => setIsBulkModalOpen(true)} style={{ backgroundColor: 'var(--warning, #f59e0b)', color: '#000', fontWeight: 700, padding: '0.5rem 1.25rem' }}>
              <TrendingUp size={16} />
              <span>Aumentar Precios ({selectedIds.size})</span>
            </button>
            <button type="button" className="btn btn-danger" onClick={handleBatchDelete} style={{ backgroundColor: 'var(--danger)', color: '#ffffff', padding: '0.5rem 1.25rem' }}>
              <Trash2 size={16} />
              <span>Eliminar {selectedIds.size} Seleccionado{selectedIds.size > 1 ? 's' : ''}</span>
            </button>
          </div>
        </div>
      )}

      {/* Virtualized Inventory Table */}
      <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', boxShadow: 'var(--card-shadow)' }}>
        {/* Table Header */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: `${COL_WIDTHS.check}px ${COL_WIDTHS.barcode}px ${COL_WIDTHS.name} ${COL_WIDTHS.category}px ${COL_WIDTHS.stock}px ${COL_WIDTHS.minstock}px ${COL_WIDTHS.cost}px ${COL_WIDTHS.sale}px ${COL_WIDTHS.margin}px ${COL_WIDTHS.actions}px`,
          padding: '0 0.75rem',
          paddingTop: '0.6rem',
          paddingBottom: '0.6rem',
          backgroundColor: 'var(--bg-hover)',
          borderBottom: '2px solid var(--border)',
          gap: '0.5rem',
          fontSize: '0.72rem',
          fontWeight: 700,
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
        }}>
          <div style={{ textAlign: 'center' }}>
            <input
              type="checkbox"
              checked={allFilteredSelected}
              ref={el => { if (el) el.indeterminate = someFilteredSelected && !allFilteredSelected; }}
              onChange={handleToggleSelectAll}
              style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
              title="Seleccionar todos los visibles"
            />
          </div>
          <div>Código</div>
          <div>Producto</div>
          <div>Categoría</div>
          <div style={{ textAlign: 'center' }}>Stock Actual</div>
          <div style={{ textAlign: 'center' }}>Mín.</div>
          <div style={{ textAlign: 'right' }}>P. Costo</div>
          <div style={{ textAlign: 'right' }}>P. Venta</div>
          <div style={{ textAlign: 'center' }}>Margen</div>
          <div style={{ textAlign: 'center' }}>Acciones</div>
        </div>

        {/* Virtual rows */}
        {filteredProducts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <Package size={36} style={{ opacity: 0.4, margin: '0 auto 0.5rem auto' }} />
            <div>No se encontraron artículos con los filtros aplicados</div>
          </div>
        ) : (
          <List
            height={Math.min(filteredProducts.length * ROW_HEIGHT, 520)}
            itemCount={filteredProducts.length}
            itemSize={ROW_HEIGHT}
            width="100%"
            overscanCount={5}
          >
            {VirtualRow}
          </List>
        )}

        {/* Footer count */}
        {filteredProducts.length > 0 && (
          <div style={{ padding: '0.5rem 1rem', borderTop: '1px solid var(--border)', fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', justifyContent: 'space-between' }}>
            <span>Mostrando <strong>{filteredProducts.length}</strong> de <strong>{products.length}</strong> productos</span>
            {selectedIds.size > 0 && <span><strong>{selectedIds.size}</strong> seleccionado{selectedIds.size > 1 ? 's' : ''}</span>}
          </div>
        )}
      </div>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
        categories={categories}
        products={products}
      />

      {/* Bulk Price Adjust Modal */}
      <BulkPriceModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onApplyBulkUpdate={(target, pct) => {
          onBulkUpdatePrices(target, pct);
          setSelectedIds(new Set());
        }}
        categories={categories}
        products={products}
        initialSelectedIds={Array.from(selectedIds)}
      />

      {/* Bulk Import Modal */}
      <ImportCSVModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          onReloadData?.();
          setIsImportModalOpen(false);
        }}
      />
    </div>
  );
}
