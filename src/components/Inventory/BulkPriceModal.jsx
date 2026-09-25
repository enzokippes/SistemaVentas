import React, { useState, useEffect, useMemo } from 'react';
import { X, TrendingUp, AlertTriangle, Check, Search, CheckSquare, Layers, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../../data/initialData';
import { roundUpToHundred } from '../../data/storage';
import ModalBackdrop from '../Common/ModalBackdrop';

export default function BulkPriceModal({ 
  isOpen, 
  onClose, 
  onApplyBulkUpdate, 
  categories = CATEGORIES, 
  products = [], 
  initialSelectedIds = [] 
}) {
  const [mode, setMode] = useState('selected'); // 'selected' | 'category' | 'all'
  const [selectedProductIds, setSelectedProductIds] = useState(new Set());
  const [targetCategory, setTargetCategory] = useState('bebidas');
  const [percentage, setPercentage] = useState('10');
  const [searchFilter, setSearchFilter] = useState('');

  const categoriesList = categories && categories.length > 0 ? categories : CATEGORIES;

  // Initialize or update selection when modal opens
  useEffect(() => {
    if (isOpen) {
      if (initialSelectedIds && initialSelectedIds.length > 0) {
        setSelectedProductIds(new Set(initialSelectedIds));
        setMode('selected');
      } else {
        setSelectedProductIds(new Set());
        setMode('category');
      }
      setSearchFilter('');
    }
  }, [isOpen, initialSelectedIds]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const getCategoryDisplayName = (catIdOrName) => {
    if (!catIdOrName) return 'General';
    const found = categoriesList.find(
      (c) => c.id === catIdOrName || (c.name && c.name.toLowerCase() === catIdOrName.toLowerCase())
    );
    if (found) return found.name;
    const clean = catIdOrName.replace(/[_-]\d+$/, '').replace(/[_-]/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  // Products filtered for the manual selection list
  const filteredProductsList = useMemo(() => {
    const q = searchFilter.toLowerCase().trim();
    if (!q) return products;
    return products.filter((p) => 
      p.name.toLowerCase().includes(q) || 
      p.barcode.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q))
    );
  }, [products, searchFilter]);

  // Determine affected products based on mode
  const affectedProducts = useMemo(() => {
    if (mode === 'selected') {
      return products.filter((p) => selectedProductIds.has(p.id));
    } else if (mode === 'category') {
      return products.filter((p) => targetCategory === 'todos' || p.category === targetCategory);
    } else {
      return products;
    }
  }, [products, mode, selectedProductIds, targetCategory]);

  if (!isOpen) return null;

  const numPercent = Number(percentage) || 0;
  const factor = 1 + numPercent / 100;

  const handleToggleProduct = (id) => {
    const next = new Set(selectedProductIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedProductIds(next);
  };

  const handleSelectAllVisible = () => {
    const next = new Set(selectedProductIds);
    filteredProductsList.forEach((p) => next.add(p.id));
    setSelectedProductIds(next);
  };

  const handleDeselectAll = () => {
    setSelectedProductIds(new Set());
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!numPercent || isNaN(numPercent) || numPercent <= 0) {
      alert('Por favor ingresá un porcentaje de aumento válido mayor a 0%.');
      return;
    }

    let targetPayload;
    let descriptionText;

    if (mode === 'selected') {
      if (selectedProductIds.size === 0) {
        alert('Por favor seleccioná al menos un producto para aplicar el aumento.');
        return;
      }
      targetPayload = Array.from(selectedProductIds);
      descriptionText = `los ${selectedProductIds.size} productos seleccionados personalmente`;
    } else if (mode === 'category') {
      targetPayload = targetCategory;
      const catObj = categoriesList.find((c) => c.id === targetCategory);
      descriptionText = `la categoría "${catObj ? catObj.name : targetCategory}"`;
    } else {
      targetPayload = 'todos';
      descriptionText = 'TODOS los productos del catálogo';
    }

    const confirmMsg = `¿Estás seguro de aumentar un +${numPercent}% los precios de ${descriptionText}?\n\nLos precios finales se redondearán automáticamente hacia arriba a la centena ($100) más cercana.`;
    if (window.confirm(confirmMsg)) {
      onApplyBulkUpdate(targetPayload, numPercent);
      onClose();
    }
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '640px', width: '95vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className="modal-header" style={{ borderBottom: '1px solid var(--border)', paddingBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--warning-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Aumento Masivo de Precios
              </h2>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Ajuste por porcentaje con redondeo automático hacia arriba ($100)
              </span>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flex: 1 }}>
          <div className="modal-body" style={{ overflowY: 'auto', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            {/* Mode Selector Tabs */}
            <div>
              <label className="form-label" style={{ fontWeight: 700, marginBottom: '0.5rem', display: 'block' }}>
                ¿A qué productos querés aplicarle el aumento?
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                <button
                  type="button"
                  onClick={() => setMode('selected')}
                  style={{
                    padding: '0.6rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${mode === 'selected' ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: mode === 'selected' ? 'var(--primary-light)' : 'var(--bg-hover)',
                    color: mode === 'selected' ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: mode === 'selected' ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <CheckSquare size={16} />
                  <span>Productos Específicos</span>
                  <small style={{ fontSize: '0.7rem', opacity: 0.8 }}>({selectedProductIds.size} elegidos)</small>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('category')}
                  style={{
                    padding: '0.6rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${mode === 'category' ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: mode === 'category' ? 'var(--primary-light)' : 'var(--bg-hover)',
                    color: mode === 'category' ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: mode === 'category' ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Layers size={16} />
                  <span>Por Categoría</span>
                  <small style={{ fontSize: '0.7rem', opacity: 0.8 }}>Rubro completo</small>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('all')}
                  style={{
                    padding: '0.6rem 0.5rem',
                    borderRadius: 'var(--radius-md)',
                    border: `1.5px solid ${mode === 'all' ? 'var(--primary)' : 'var(--border)'}`,
                    backgroundColor: mode === 'all' ? 'var(--primary-light)' : 'var(--bg-hover)',
                    color: mode === 'all' ? 'var(--primary)' : 'var(--text-main)',
                    fontWeight: mode === 'all' ? 700 : 500,
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.25rem',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Sparkles size={16} />
                  <span>Todo el Catálogo</span>
                  <small style={{ fontSize: '0.7rem', opacity: 0.8 }}>({products.length} productos)</small>
                </button>
              </div>
            </div>

            {/* Target Selectors based on mode */}
            {mode === 'category' && (
              <div className="form-group" style={{ margin: 0 }}>
                <label className="form-label">Seleccionar Categoría / Rubro</label>
                <select
                  className="form-select"
                  value={targetCategory}
                  onChange={(e) => setTargetCategory(e.target.value)}
                >
                  {categoriesList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.id !== 'todos' ? `(${products.filter(p => p.category === c.id).length} productos)` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {mode === 'selected' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <label className="form-label" style={{ margin: 0, fontWeight: 700 }}>
                    Marcar productos a aumentar ({selectedProductIds.size} seleccionados):
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    <button
                      type="button"
                      onClick={handleSelectAllVisible}
                      style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', color: 'var(--primary)' }}
                    >
                      Marcar visibles
                    </button>
                    <button
                      type="button"
                      onClick={handleDeselectAll}
                      style={{ fontSize: '0.75rem', padding: '3px 8px', borderRadius: '4px', border: '1px solid var(--border)', background: 'var(--bg-surface)', cursor: 'pointer', color: 'var(--text-muted)' }}
                    >
                      Limpiar
                    </button>
                  </div>
                </div>

                {/* Live Search inside modal */}
                <div className="barcode-input-wrap" style={{ height: '36px' }}>
                  <Search size={15} color="var(--text-muted)" />
                  <input
                    type="text"
                    className="barcode-input"
                    placeholder="Filtrar por marca, bebida o producto (ej. Coca, Quilmes, Marlboro)..."
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    style={{ fontSize: '0.85rem' }}
                  />
                  {searchFilter && (
                    <button 
                      type="button"
                      onClick={() => setSearchFilter('')}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Product Selection Checklist */}
                <div style={{ maxHeight: '180px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', backgroundColor: 'var(--bg-surface)' }}>
                  {filteredProductsList.length === 0 ? (
                    <div style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No se encontraron productos que coincidan con la búsqueda.
                    </div>
                  ) : (
                    filteredProductsList.map((prod) => {
                      const isChecked = selectedProductIds.has(prod.id);
                      return (
                        <div
                          key={prod.id}
                          onClick={() => handleToggleProduct(prod.id)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.5rem 0.75rem',
                            borderBottom: '1px solid var(--border)',
                            cursor: 'pointer',
                            backgroundColor: isChecked ? 'var(--primary-light)' : 'transparent',
                            transition: 'background-color 0.1s'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => {}} // Handled by div click
                              style={{ cursor: 'pointer', accentColor: 'var(--primary)' }}
                            />
                            <div>
                              <strong style={{ fontSize: '0.85rem', color: 'var(--text-main)', display: 'block' }}>
                                {prod.name}
                              </strong>
                              <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)' }}>
                                {getCategoryDisplayName(prod.category)} | {prod.barcode}
                              </span>
                            </div>
                          </div>
                          <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                            {formatCurrency(prod.salePrice)}
                          </span>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}

            {/* Percentage Input & Quick Presets */}
            <div style={{ backgroundColor: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
              <label className="form-label" style={{ fontWeight: 700 }}>Porcentaje de Aumento (%)</label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flex: 1 }}>
                  <input
                    type="number"
                    step="0.5"
                    className="form-input"
                    placeholder="Ej: 10"
                    value={percentage}
                    onChange={(e) => setPercentage(e.target.value)}
                    onFocus={(e) => e.target.select()}
                    style={{ fontSize: '1.35rem', fontFamily: 'var(--font-mono)', fontWeight: 800, color: 'var(--primary)', textAlign: 'center', width: '120px' }}
                    required
                  />
                  <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-muted)' }}>%</span>
                </div>

                {/* Quick Presets */}
                <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                  {[5, 10, 15, 20, 25, 30].map((val) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setPercentage(val.toString())}
                      style={{
                        padding: '5px 9px',
                        borderRadius: '6px',
                        backgroundColor: percentage === val.toString() ? 'var(--primary)' : 'var(--bg-surface)',
                        color: percentage === val.toString() ? '#ffffff' : 'var(--text-main)',
                        border: '1px solid var(--border)',
                        fontSize: '0.8rem',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      +{val}%
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Preview Table */}
            {affectedProducts.length > 0 && numPercent > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    Vista Previa de Nuevos Precios ({affectedProducts.length} productos afectados):
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#16a34a', fontWeight: 600 }}>
                    ▲ Redondeo hacia arriba a $100
                  </span>
                </div>

                <div style={{ maxHeight: '140px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--bg-surface)' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-hover)', textAlign: 'left', color: 'var(--text-muted)' }}>
                        <th style={{ padding: '6px 10px' }}>Producto</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>Actual</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right' }}>+ {numPercent}%</th>
                        <th style={{ padding: '6px 10px', textAlign: 'right', color: '#16a34a' }}>Nuevo Precio</th>
                      </tr>
                    </thead>
                    <tbody>
                      {affectedProducts.slice(0, 10).map((p) => {
                        const rawNew = p.salePrice * factor;
                        const roundedNew = roundUpToHundred(rawNew);
                        return (
                          <tr key={p.id} style={{ borderBottom: '1px solid var(--border)' }}>
                            <td style={{ padding: '6px 10px', fontWeight: 600, color: 'var(--text-main)' }}>{p.name}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{formatCurrency(p.salePrice)}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>${Math.round(rawNew)}</td>
                            <td style={{ padding: '6px 10px', textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#16a34a' }}>{formatCurrency(roundedNew)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {affectedProducts.length > 10 && (
                  <span style={{ fontSize: '0.725rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                    ... y {affectedProducts.length - 10} productos más
                  </span>
                )}
              </div>
            )}

            {/* Note & Rounding guarantee */}
            <div style={{ padding: '0.75rem 1rem', background: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-md)', display: 'flex', gap: '0.6rem', alignItems: 'flex-start', fontSize: '0.8rem', color: 'var(--warning-hover)' }}>
              <AlertTriangle size={17} style={{ flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong>Redondeo automático garantizado:</strong> Todo precio resultante se redondea siempre para arriba al siguiente múltiplo de $100 (por ejemplo: $3.125 pasa a $3.200). Esto evita dar cambio en monedas o billetes chicos en el mostrador.
              </div>
            </div>

          </div>

          {/* Footer */}
          <div className="modal-footer" style={{ borderTop: '1px solid var(--border)', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ background: 'var(--warning, #f59e0b)', color: '#000', fontWeight: 800 }}
              disabled={affectedProducts.length === 0}
            >
              <Check size={18} />
              <span>Aplicar Aumento ({affectedProducts.length})</span>
            </button>
          </div>
        </form>
      </div>
    </ModalBackdrop>
  );
}
