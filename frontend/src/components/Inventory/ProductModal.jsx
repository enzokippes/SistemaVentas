import React, { useState, useEffect } from 'react';
import { X, Save, Barcode } from 'lucide-react';
import { CATEGORIES } from '../../data/initialData';

export default function ProductModal({ isOpen, onClose, onSave, productToEdit, categories = CATEGORIES }) {
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: 'despensa',
    costPrice: '',
    salePrice: '',
    marginPercent: 40,
    stock: '',
    minStock: 5,
    unit: 'Unidad'
  });

  const availableCategories = categories && categories.length > 0 ? categories : CATEGORIES;

  useEffect(() => {
    if (productToEdit) {
      const cost = Number(productToEdit.costPrice) || 0;
      const sale = Number(productToEdit.salePrice) || 0;
      const margin = cost > 0 ? Math.round(((sale - cost) / cost) * 100) : 40;
      setFormData({
        ...productToEdit,
        marginPercent: margin
      });
    } else {
      setFormData({
        barcode: '',
        name: '',
        category: availableCategories.find(c => c.id !== 'todos')?.id || 'despensa',
        costPrice: '',
        salePrice: '',
        marginPercent: 40,
        stock: '',
        minStock: 5,
        unit: 'Unidad'
      });
    }
  }, [productToEdit, isOpen, availableCategories]);

  if (!isOpen) return null;

  const handleCostChange = (val) => {
    const cost = Number(val) || 0;
    const margin = Number(formData.marginPercent) || 0;
    const calculatedSale = Math.round(cost * (1 + margin / 100));
    setFormData((prev) => ({
      ...prev,
      costPrice: val,
      salePrice: cost > 0 ? calculatedSale : prev.salePrice
    }));
  };

  const handleMarginChange = (val) => {
    const margin = Number(val) || 0;
    const cost = Number(formData.costPrice) || 0;
    const calculatedSale = Math.round(cost * (1 + margin / 100));
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
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    onSave({
      ...formData,
      barcode: formData.barcode.trim() || `GEN-${Date.now().toString().slice(-6)}`,
      costPrice: Number(formData.costPrice) || 0,
      salePrice: Number(formData.salePrice) || 0,
      stock: Number(formData.stock) || 0,
      minStock: Number(formData.minStock) || 0,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '580px' }}>
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

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Barcode and Auto-generate */}
            <div className="form-group">
              <label className="form-label">Código de Barras</label>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Escanear con pistola USB o escribir código..."
                  value={formData.barcode}
                  onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)' }}
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
            </div>

            {/* Product Name */}
            <div className="form-group">
              <label className="form-label">Nombre del Producto / Marca *</label>
              <input
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
                  {availableCategories.filter((c) => c.id !== 'todos').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="form-label">Unidad de Medida</label>
                <select
                  className="form-select"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                >
                  <option value="Unidad">Unidad / Paquete</option>
                  <option value="Atado">Atado (Cigarrillos)</option>
                  <option value="Blíster">Blíster (Medicamentos)</option>
                  <option value="Botella">Botella / Lata</option>
                  <option value="Caja">Caja</option>
                  <option value="Kilo">Kilo / Fraccionado</option>
                </select>
              </div>
            </div>

            {/* Pricing Section (Cost, Margin %, Sale) */}
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', marginBottom: '1.25rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#2563eb', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
                Precios y Margen de Ganancia
              </span>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 90px 1fr', gap: '0.75rem', alignItems: 'center' }}>
                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Precio de Costo ($)</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={formData.costPrice}
                    onChange={(e) => handleCostChange(e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Margen %</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="%"
                    value={formData.marginPercent}
                    onChange={(e) => handleMarginChange(e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)', textAlign: 'center', fontWeight: 700, color: '#2563eb' }}
                  />
                </div>

                <div>
                  <label className="form-label" style={{ fontSize: '0.75rem' }}>Precio Venta Final ($) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="0"
                    value={formData.salePrice}
                    onChange={(e) => handleSaleChange(e.target.value)}
                    style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, color: '#16a34a', fontSize: '1.15rem' }}
                    required
                  />
                </div>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
                Ganancia neta por unidad: <strong style={{ color: '#16a34a' }}>${Math.max(0, (Number(formData.salePrice) || 0) - (Number(formData.costPrice) || 0))}</strong>
              </div>
            </div>

            {/* Stock and Min Stock */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-group">
              <div>
                <label className="form-label">Stock Actual Disponible *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="0"
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                  required
                />
              </div>

              <div>
                <label className="form-label">Stock Mínimo (Alerta reposición)</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="5"
                  value={formData.minStock}
                  onChange={(e) => setFormData({ ...formData, minStock: e.target.value })}
                  style={{ fontFamily: 'var(--font-mono)' }}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary">
              <Save size={16} />
              <span>{productToEdit ? 'Guardar Cambios' : 'Agregar Producto'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
