import React, { useEffect, useRef, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import { Search, X } from 'lucide-react';
import ModalBackdrop from '../Common/ModalBackdrop';

const ITEM_HEIGHT = 64;
const MAX_LIST_HEIGHT = 420;

export default function CatalogSearchModal({
  products = [],
  normalizeText,
  addToCart,
  formatCurrency,
  getCategoryDisplayName,
  catalogSearchQuery,
  setCatalogSearchQuery,
  catalogHighlightIndex,
  setCatalogHighlightIndex,
  onClose,
}) {
  const searchInputRef = useRef(null);
  const listRef = useRef(null);

  // Pre-index normalized search targets once per products catalog (eliminates repeated regex/normalize operations)
  const indexedProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.map((p) => ({
      product: p,
      searchTarget: normalizeText(`${p.name || ''} ${p.barcode || ''} ${p.category || ''}`)
    }));
  }, [products, normalizeText]);

  // Instant filtering using token matching against the pre-indexed list
  const filtered = useMemo(() => {
    const raw = (catalogSearchQuery || '').trim();
    if (!raw) return products || [];
    const tokens = normalizeText(raw).split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return products || [];

    const matches = [];
    for (let i = 0; i < indexedProducts.length; i++) {
      const item = indexedProducts[i];
      if (tokens.every((t) => item.searchTarget.includes(t))) {
        matches.push(item.product);
      }
    }
    return matches;
  }, [indexedProducts, products, catalogSearchQuery, normalizeText]);

  // Reset highlight to top when search query changes
  useEffect(() => {
    setCatalogHighlightIndex(0);
    listRef.current?.scrollToItem(0);
  }, [catalogSearchQuery, setCatalogHighlightIndex]);

  // Scroll virtual list to highlighted row on arrow navigation
  useEffect(() => {
    if (listRef.current && catalogHighlightIndex >= 0) {
      listRef.current.scrollToItem(catalogHighlightIndex, 'smart');
    }
  }, [catalogHighlightIndex]);

  // Ensure input gets auto-focused immediately on open
  useEffect(() => {
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 30);
    return () => clearTimeout(timer);
  }, []);

  // Select product, add to cart and close modal
  const handleSelectProduct = useCallback((prod) => {
    if (!prod) return;
    addToCart(prod);
    onClose();
  }, [addToCart, onClose]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setCatalogHighlightIndex((prev) => (prev >= filtered.length - 1 ? 0 : prev + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setCatalogHighlightIndex((prev) => (prev <= 0 ? filtered.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0) {
        const idx = Math.max(0, Math.min(catalogHighlightIndex, filtered.length - 1));
        handleSelectProduct(filtered[idx]);
      }
    }
  };

  // Virtualized row item renderer for high-speed rendering of thousands of products
  const Row = useCallback(({ index, style }) => {
    const prod = filtered[index];
    if (!prod) return null;
    const isHighlighted = index === catalogHighlightIndex;

    return (
      <div style={{ ...style, paddingBottom: '6px' }}>
        <div
          onClick={() => handleSelectProduct(prod)}
          onMouseEnter={() => setCatalogHighlightIndex(index)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0.55rem 0.85rem',
            backgroundColor: isHighlighted ? 'var(--primary, #2563eb)' : 'var(--bg-surface)',
            border: isHighlighted ? '1.5px solid var(--primary, #2563eb)' : '1px solid var(--border)',
            borderRadius: '6px',
            cursor: 'pointer',
            transition: 'background-color 0.08s ease',
            color: isHighlighted ? '#fff' : 'inherit',
            height: '100%',
            boxSizing: 'border-box'
          }}
        >
          <div style={{ minWidth: 0, flex: 1, paddingRight: '0.75rem' }}>
            <div style={{
              fontSize: '0.9rem',
              fontWeight: 700,
              color: isHighlighted ? '#fff' : 'var(--text-main)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              {prod.name}
            </div>
            <div style={{
              fontSize: '0.75rem',
              color: isHighlighted ? 'rgba(255,255,255,0.85)' : 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis'
            }}>
              Cód: {prod.barcode || 'S/C'} · Cat: {getCategoryDisplayName(prod.category)} · Stock: {prod.stock ?? 0} {prod.unit || 'un.'}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              color: isHighlighted ? '#fff' : 'var(--success, #16a34a)',
              fontSize: '1.05rem'
            }}>
              {formatCurrency(prod.salePrice)}
            </span>
          </div>
        </div>
      </div>
    );
  }, [filtered, catalogHighlightIndex, handleSelectProduct, getCategoryDisplayName, formatCurrency, setCatalogHighlightIndex]);

  const listHeight = Math.max(70, Math.min(filtered.length * ITEM_HEIGHT, MAX_LIST_HEIGHT));

  return (
    <ModalBackdrop onClose={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '700px', width: '95vw' }}
      >
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={18} color="#2563eb" />
            <h3 style={{ margin: 0, fontSize: '1.1rem' }}>Buscar Producto (F10)</h3>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', background: 'var(--bg-hover)', padding: '2px 8px', borderRadius: '999px', border: '1px solid var(--border)', marginLeft: '0.25rem' }}>
              ↑↓ navegar · Enter agregar al ticket · Esc salir
            </span>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ gap: '0.85rem', display: 'flex', flexDirection: 'column' }}>
          {/* Search input */}
          <div style={{ position: 'relative' }}>
            <input
              ref={searchInputRef}
              type="text"
              className="form-input"
              placeholder="Escribir nombre, marca o código de barra..."
              value={catalogSearchQuery}
              onChange={(e) => setCatalogSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
              style={{ paddingRight: catalogSearchQuery ? '36px' : undefined }}
            />
            {catalogSearchQuery && (
              <button
                type="button"
                onClick={() => setCatalogSearchQuery('')}
                style={{
                  position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)',
                  border: 'none', background: 'transparent', cursor: 'pointer',
                  color: 'var(--text-muted, #94a3b8)', display: 'flex', alignItems: 'center', padding: '4px'
                }}
                title="Limpiar búsqueda"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Results count hint */}
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '-0.5rem' }}>
            {filtered.length === 0
              ? 'Sin resultados'
              : `${filtered.length} producto${filtered.length !== 1 ? 's' : ''} encontrado${filtered.length !== 1 ? 's' : ''}`
            }
            {filtered.length > 0 && (
              <span style={{ marginLeft: '0.5rem', opacity: 0.8 }}>
                — Seleccionado: <strong>{filtered[Math.min(catalogHighlightIndex, filtered.length - 1)]?.name}</strong>
              </span>
            )}
          </div>

          {/* Virtualized product list */}
          <div style={{ width: '100%' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
                No se encontraron productos con ese término.
              </div>
            ) : (
              <List
                ref={listRef}
                height={listHeight}
                itemCount={filtered.length}
                itemSize={ITEM_HEIGHT}
                width="100%"
                overscanCount={6}
              >
                {Row}
              </List>
            )}
          </div>
        </div>

        <div className="modal-footer" style={{ justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Presioná <strong>Enter</strong> para agregar al ticket y cerrar
          </span>
          <button type="button" className="btn btn-secondary" onClick={onClose}>
            Cerrar (Esc)
          </button>
        </div>
      </div>
    </ModalBackdrop>
  );
}
