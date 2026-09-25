import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Save, Barcode, AlertTriangle } from 'lucide-react';
import { CATEGORIES } from '../../data/initialData';
import { roundUpToHundred } from '../../data/storage';
import ModalBackdrop from '../Common/ModalBackdrop';

export default function ProductModal({ 
  isOpen, 
  onClose, 
  onSave, 
  productToEdit, 
  categories = CATEGORIES,
  products = [] 
}) {
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: 'despensa',
    costPrice: '',
    salePrice: '',
    wholesalePrice: '',
    marginPercent: 40,
    stock: '',
    minStock: 5,
    unit: 'Unidad',
    trackStock: true
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [duplicateAlert, setDuplicateAlert] = useState(null);

  const barcodeInputRef = useRef(null);
  const nameInputRef = useRef(null);

  const availableCategories = categories && categories.length > 0 ? categories : CATEGORIES;

  // Real-time duplicate barcode detection
  const cleanBarcode = (formData.barcode || '').trim().toLowerCase();
  const duplicateProduct = useMemo(() => {
    if (!cleanBarcode || !products || products.length === 0) return null;
    return products.find(
      (p) => p.id !== productToEdit?.id && p.barcode && String(p.barcode).trim().toLowerCase() === cleanBarcode
    );
  }, [cleanBarcode, products, productToEdit]);

  // Initialize or reset form data when modal opens or productToEdit changes
  useEffect(() => {
    if (!isOpen) {
      setDuplicateAlert(null);
      setErrorMsg('');
      return;
    }

    setErrorMsg('');
    setDuplicateAlert(null);

    if (productToEdit) {
      const cost = Number(productToEdit.costPrice) || 0;
      const sale = Number(productToEdit.salePrice) || 0;
      const margin = cost > 0 ? Math.round(((sale - cost) / cost) * 100) : 40;

      // Find matching category ID or fallback to raw category value
      const prodCat = productToEdit.category || 'despensa';
      const catMatch = availableCategories.find(
        (c) => c.id === prodCat || (c.name && c.name.toLowerCase() === String(prodCat).toLowerCase())
      );
      const normalizedCat = catMatch ? catMatch.id : prodCat;

      setFormData({
        ...productToEdit,
        category: normalizedCat,
        wholesalePrice: productToEdit.wholesalePrice || '',
        trackStock: productToEdit.trackStock !== false,
        marginPercent: margin
      });

      // Automatically focus and select product name when editing
      setTimeout(() => {
        if (nameInputRef.current) {
          nameInputRef.current.focus();
          nameInputRef.current.select();
        }
      }, 50);
    } else {
      const defaultCat = availableCategories.find(c => c.id !== 'todos')?.id || 'despensa';
      setFormData({
        barcode: '',
        name: '',
        category: defaultCat,
        costPrice: '',
        salePrice: '',
        wholesalePrice: '',
        marginPercent: 40,
        stock: '',
        minStock: 5,
        unit: 'Unidad',
        trackStock: true
      });

      // Automatically focus barcode when creating
      setTimeout(() => {
        barcodeInputRef.current?.focus();
      }, 50);
    }
  }, [productToEdit, isOpen]);

  if (!isOpen) return null;

  const handleCostChange = (val) => {
    const cost = Number(val) || 0;
    const margin = Number(formData.marginPercent) || 0;
    const calculatedSale = roundUpToHundred(cost * (1 + margin / 100));
    setFormData((prev) => ({
      ...prev,
      costPrice: val,
      salePrice: cost > 0 ? calculatedSale : prev.salePrice
    }));
  };

  const handleMarginChange = (val) => {
    const margin = Number(val) || 0;
    const cost = Number(formData.costPrice) || 0;
    const calculatedSale = roundUpToHundred(cost * (1 + margin / 100));
    setFormData((prev) => ({
      ...prev,
      marginPercent: val,
      salePrice: cost > 0 ? calculatedSale : prev.salePrice
    }));
  };

  const handleSaleChange = (val) => {
    const sale = Number(val) || 0;
    const cost = Number(formData.costPrice) || 0;
    const calculatedMargin = cost > 0 ? Math.round(((sale - cost) / cost) * 100) : formData.marginPercent;
    setFormData((prev) => ({
      ...prev,
      salePrice: val,
      marginPercent: calculatedMargin
    }));
  };

  const generateBarcode = () => {
    const randomCode = '779' + Math.floor(100000000 + Math.random() * 900000000);
    setFormData((prev) => ({ ...prev, barcode: randomCode }));
    setErrorMsg('');
    setDuplicateAlert(null);
  };

  const handleBarcodeBlur = () => {
    if (duplicateProduct) {
      setDuplicateAlert(duplicateProduct);
    }
  };

  const handleBarcodeKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (duplicateProduct) {
        setDuplicateAlert(duplicateProduct);
      } else {
        nameInputRef.current?.focus();
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!formData.name.trim()) return;

    if (duplicateProduct) {
      setDuplicateAlert(duplicateProduct);
      setErrorMsg(`No se puede guardar: El código de barras "${formData.barcode.trim()}" ya existe en "${duplicateProduct.name}".`);
      barcodeInputRef.current?.focus();
      barcodeInputRef.current?.select();
      return;
    }

    try {
      onSave({
        ...formData,
        barcode: formData.barcode.trim() || `GEN-${Date.now().toString().slice(-6)}`,
        costPrice: Number(formData.costPrice) || 0,
        salePrice: Number(formData.salePrice) || 0,
        wholesalePrice: Number(formData.wholesalePrice) || 0,
        stock: Number(formData.stock) || 0,
        minStock: formData.trackStock ? (Number(formData.minStock) || 0) : 0,
        trackStock: formData.trackStock !== false,
      });
    } catch (err) {
      setErrorMsg(err.message || 'Error al guardar el producto');
      if (err.message && err.message.toLowerCase().includes('código de barras')) {
        const found = products.find(p => p.barcode && String(p.barcode).trim().toLowerCase() === cleanBarcode);
        if (found) setDuplicateAlert(found);
      }
    }
  };

  return (
    <>
      <ModalBackdrop onClose={onClose}>
        <div 
          className="modal-card" 
          onClick={(e) => e.stopPropagation()} 
          onMouseDown={(e) => e.stopPropagation()} 
          style={{ maxWidth: '580px' }}
        >
          <div className="modal-header">
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              {productToEdit ? 'Editar Producto' : 'Nuevo Producto en Inventario'}
            </h3>
            <button 
              onClick={onClose} 
              style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
            >
              <X size={18} />
            </button>
          </div>

          {errorMsg && (
            <div style={{ margin: '0.75rem 1.25rem 0', padding: '0.65rem 0.85rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#dc2626', fontSize: '0.85rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {/* Barcode and Auto-generate */}
              <div className="form-group">
                <label className="form-label">Código de Barras</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    ref={barcodeInputRef}
                    type="text"
                    className="form-input"
                    placeholder="Escanear con pistola USB o escribir código..."
                    value={formData.barcode}
                    onChange={(e) => {
                      setFormData({ ...formData, barcode: e.target.value });
                      if (errorMsg) setErrorMsg('');
                    }}
                    onBlur={handleBarcodeBlur}
                    onKeyDown={handleBarcodeKeyDown}
                    style={{ 
                      fontFamily: 'var(--font-mono)',
                      borderColor: duplicateProduct ? '#ef4444' : undefined,
                      backgroundColor: duplicateProduct ? '#fff5f5' : undefined,
                      boxShadow: duplicateProduct ? '0 0 0 2px rgba(239, 68, 68, 0.2)' : undefined
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={generateBarcode}
                    title="Generar código interno automático"
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    <Barcode size={15} />
                    <span>Auto</span>
                  </button>
                </div>

                {/* Inline warning if duplicate detected */}
                {duplicateProduct && (
                  <div 
                    style={{ 
                      marginTop: '0.45rem', 
                      padding: '0.65rem 0.85rem', 
                      backgroundColor: '#fef2f2', 
                      border: '1px solid #fecaca', 
                      borderRadius: '6px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertTriangle size={17} color="#dc2626" style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.82rem', color: '#991b1b', lineHeight: 1.3 }}>
                        <strong>¡Código ya registrado!</strong> Pertenece a <strong>{duplicateProduct.name}</strong> (${duplicateProduct.salePrice}).
                      </span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => setDuplicateAlert(duplicateProduct)}
                      style={{ padding: '2px 8px', fontSize: '0.75rem', height: '26px', whiteSpace: 'nowrap', borderColor: '#fca5a5', color: '#dc2626' }}
                    >
                      Ver Detalle
                    </button>
                  </div>
                )}
              </div>

              {/* Product Name */}
              <div className="form-group">
                <label className="form-label">Nombre del Producto / Marca *</label>
                <input
                  ref={nameInputRef}
                  type="text"
                  className="form-input"
                  placeholder="Ej: Marlboro Box 20, Yerba Playadito 500g, etc."
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Category and Unit */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-group">
                <div>
                  <label className="form-label">Categoría / Rubro *</label>
                  <select
                    className="form-select"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    {Boolean(formData.category) && !availableCategories.some(c => c.id === formData.category || (c.name && c.name.toLowerCase() === String(formData.category).toLowerCase())) && (
                      <option value={formData.category}>
                        {formData.category}
                      </option>
                    )}
                    {availableCategories.filter((c) => c.id !== 'todos').map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">Unidad de Venta / Formato</label>
                  <select
                    className="form-select"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                  >
                    <option value="Unidad">Unidad (u. suelta / paquete)</option>
                    <option value="Cartón">Cartón (Cigarrillos)</option>
                    <option value="Pack">Pack (Cervezas / Latas / Gaseosas)</option>
                    <option value="Caja">Caja (Bulto cerrado)</option>
                    <option value="Atado">Atado (Cigarrillos individual)</option>
                    <option value="Kilo">Kilo (kg / peso fraccionado)</option>
                    <option value="Gramo">Gramo (g)</option>
                    <option value="Litro">Litro (L)</option>
                    <option value="Blíster">Blíster (Medicamentos / Golosinas)</option>
                  </select>
                </div>
              </div>

              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '-0.5rem', marginBottom: '1rem' }}>
                💡 <strong>¿Cómo funciona la unidad?</strong> Define cómo se descuenta del inventario y cómo sale en el ticket (ej. si vendés una lata es <em>Unidad</em>, si vendés el pack cerrado de 6 es <em>Pack</em>, si vendés la caja de 10 atados es <em>Cartón</em>).
              </div>

              {/* Pricing Section (Cost, Margin, Sale Price) */}
              <div style={{ padding: '1rem', backgroundColor: 'var(--bg-deep)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.75rem' }}>
                  Precios y Margen de Ganancia
                </span>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 1fr', gap: '0.75rem', alignItems: 'end' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Precio de Costo ($)</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="0"
                      value={formData.costPrice}
                      onChange={(e) => handleCostChange(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label" title="Margen de ganancia porcentual">Margen %</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="40"
                      value={formData.marginPercent}
                      onChange={(e) => handleMarginChange(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      style={{ textAlign: 'center', fontFamily: 'var(--font-mono)' }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Precio Venta Final ($) *</label>
                    <input
                      type="number"
                      step="any"
                      className="form-input"
                      placeholder="0"
                      value={formData.salePrice}
                      onChange={(e) => handleSaleChange(e.target.value)}
                      onFocus={(e) => e.target.select()}
                      required
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '1.05rem', color: 'var(--success)' }}
                    />
                  </div>
                </div>

                {/* Wholesale Price Field */}
                <div style={{ marginTop: '0.85rem', paddingTop: '0.85rem', borderTop: '1px dashed var(--border)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', alignItems: 'center' }}>
                    <div>
                      <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span>Precio Mayoreo ($)</span>
                        <span style={{ fontSize: '0.72rem', backgroundColor: 'var(--primary-light)', color: 'var(--primary)', padding: '1px 6px', borderRadius: '4px', fontWeight: 700 }}>Tecla F11</span>
                      </label>
                      <input
                        type="number"
                        step="any"
                        className="form-input"
                        placeholder="Ej: 950 (vacío = sin mayoreo)"
                        value={formData.wholesalePrice}
                        onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                        onFocus={(e) => e.target.select()}
                        style={{ fontFamily: 'var(--font-mono)' }}
                      />
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>
                      💡 <strong>¿Cómo funciona?</strong> Al presionar <strong>F11</strong> en el ticket de venta, este producto se cobrará automáticamente a este precio mayorista.
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  <span>
                    Ganancia neta por unidad: <strong style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>${Math.max(0, (Number(formData.salePrice) || 0) - (Number(formData.costPrice) || 0))}</strong>
                  </span>
                  <span style={{ color: 'var(--primary)' }}>Redondeo automático siempre a $100 hacia arriba</span>
                </div>
              </div>

              {/* Stock Tracking Toggle */}
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--bg-deep)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', marginBottom: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', margin: 0 }}>
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)', display: 'block' }}>
                      Controlar Stock de este Producto
                    </span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      {formData.trackStock ? 'Activado: las ventas descontarán unidades.' : 'Desactivado: venta ilimitada sin descontar unidades.'}
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.trackStock}
                    onChange={(e) => setFormData({ ...formData, trackStock: e.target.checked })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer', accentColor: 'var(--primary)' }}
                  />
                </label>
              </div>

              {/* Stock Controls (Only if trackStock is true) */}
              {formData.trackStock ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Stock Actual Disponible *</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="0"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      required={formData.trackStock}
                      style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                    />
                  </div>

                  <div className="form-group" style={{ marginBottom: 0 }}>
                    <label className="form-label">Stock Mínimo (Alerta reposición)</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="5"
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                      onFocus={(e) => e.target.select()}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ padding: '0.5rem 0.75rem', backgroundColor: 'var(--bg-deep)', borderRadius: 'var(--radius-sm)', border: '1px dashed var(--border)', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                  ℹ️ Control de stock desactivado para este producto. No se exige cantidad ni alertas de reposición.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={onClose}>
                Cancelar
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={Boolean(duplicateProduct)}
                style={{
                  opacity: duplicateProduct ? 0.6 : 1,
                  cursor: duplicateProduct ? 'not-allowed' : 'pointer',
                  backgroundColor: duplicateProduct ? '#94a3b8' : undefined,
                  borderColor: duplicateProduct ? '#94a3b8' : undefined
                }}
                title={duplicateProduct ? 'No se puede guardar: el código de barras ya existe' : undefined}
              >
                <Save size={16} />
                <span>{duplicateProduct ? '⚠️ Código Duplicado' : (productToEdit ? 'Guardar Cambios' : 'Agregar Producto')}</span>
              </button>
            </div>
          </form>
        </div>
      </ModalBackdrop>

      {/* Pop-up Alert Modal if duplicate barcode detected */}
      {duplicateAlert && (
        <ModalBackdrop onClose={() => setDuplicateAlert(null)} style={{ zIndex: 1100 }}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            style={{ maxWidth: '460px', borderTop: '4px solid #dc2626' }}
          >
            <div className="modal-header" style={{ backgroundColor: '#fff5f5', borderBottom: '1px solid #fee2e2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <AlertTriangle size={22} color="#dc2626" />
                <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#991b1b', fontWeight: 800 }}>
                  Código de Barras Ya Existe
                </h3>
              </div>
              <button 
                type="button"
                onClick={() => setDuplicateAlert(null)}
                style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1.25rem' }}>
              <p style={{ margin: 0, fontSize: '0.9rem', color: '#334155', lineHeight: 1.5 }}>
                El código de barras <strong>"{formData.barcode}"</strong> ya está registrado en el catálogo y pertenece a:
              </p>

              <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-md)', padding: '0.9rem' }}>
                <div style={{ fontSize: '1rem', fontWeight: 800, color: '#0f172a' }}>
                  📦 {duplicateAlert.name}
                </div>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.82rem', color: '#64748b' }}>
                  <span>Rubro: <strong>{duplicateAlert.category || 'General'}</strong></span>
                  <span>Precio: <strong style={{ color: '#16a34a', fontFamily: 'var(--font-mono)' }}>${duplicateAlert.salePrice}</strong></span>
                  <span>Stock: <strong>{duplicateAlert.stock ?? 0} un.</strong></span>
                </div>
              </div>

              <div style={{ fontSize: '0.82rem', color: '#b91c1c', backgroundColor: '#fef2f2', padding: '0.65rem 0.85rem', borderRadius: '6px', border: '1px solid #fecaca' }}>
                ⚠️ <strong>No se permite duplicar códigos de barras.</strong> Cada artículo debe tener un código único para que la pistola lectora USB y la búsqueda en el mostrador funcionen correctamente.
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.65rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setDuplicateAlert(null);
                  setTimeout(() => {
                    barcodeInputRef.current?.focus();
                    barcodeInputRef.current?.select();
                  }, 50);
                }}
              >
                Cambiar Código
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  generateBarcode();
                  setTimeout(() => {
                    nameInputRef.current?.focus();
                  }, 50);
                }}
                style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
              >
                <Barcode size={15} />
                <span>Generar Código Automático</span>
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}
    </>
  );
}
