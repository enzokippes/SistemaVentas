import React, { useState } from 'react';
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
  MinusCircle
} from 'lucide-react';
import ProductModal from './ProductModal';
import BulkPriceModal from './BulkPriceModal';

export default function InventoryView({ 
  products, 
  categories = [],
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onBulkUpdatePrices,
  initialCategoryFilter = 'todos'
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(initialCategoryFilter || 'todos');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  // Stock Valuation Metrics
  const totalItemsCount = products.reduce((acc, p) => acc + (p.stock || 0), 0);
  const totalCostValue = products.reduce((acc, p) => acc + (p.costPrice || 0) * (p.stock || 0), 0);
  const totalSaleValue = products.reduce((acc, p) => acc + (p.salePrice || 0) * (p.stock || 0), 0);
  const potentialProfit = totalSaleValue - totalCostValue;
  const criticalStockCount = products.filter((p) => (p.stock || 0) <= (p.minStock || 5)).length;

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesCategory = selectedCategory === 'todos' || p.category === selectedCategory;
    const matchesLowStock = !onlyLowStock || (p.stock || 0) <= (p.minStock || 5);
    const q = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      !q || 
      p.name.toLowerCase().includes(q) || 
      p.barcode.toLowerCase().includes(q) || 
      (p.category && p.category.toLowerCase().includes(q));
    return matchesCategory && matchesLowStock && matchesQuery;
  });

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setIsProductModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (productData) => {
    if (editingProduct) {
      onUpdateProduct(editingProduct.id, productData);
    } else {
      onAddProduct(productData);
    }
    setIsProductModalOpen(false);
  };

  const handleQuickStockDelta = (product, delta) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    onUpdateProduct(product.id, { stock: newStock });
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`¿Estás seguro de eliminar "${name}" del catálogo?`)) {
      onDeleteProduct(id);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', width: '100%' }}>
      {/* Top Metrics Cards (High Contrast White Cards) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              VARIEDAD DE PRODUCTOS
            </span>
            <Package size={18} color="#2563eb" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: '#0f172a' }}>
            {products.length} <span style={{ fontSize: '0.85rem', color: '#64748b', fontWeight: 500 }}>({totalItemsCount} en total)</span>
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              CAPITAL INVERTIDO (COSTO)
            </span>
            <DollarSign size={18} color="#64748b" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: '#475569' }}>
            {formatCurrency(totalCostValue)}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              VALOR TOTAL DE VENTA
            </span>
            <DollarSign size={18} color="#2563eb" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: '#2563eb' }}>
            {formatCurrency(totalSaleValue)}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: 'var(--radius-lg)', border: '1px solid #e2e8f0', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              GANANCIA POTENCIAL
            </span>
            <TrendingUp size={18} color="#16a34a" />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: '#16a34a' }}>
            {formatCurrency(potentialProfit)}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '1.15rem', borderRadius: 'var(--radius-lg)', border: criticalStockCount > 0 ? '1px solid #fef08a' : '1px solid #e2e8f0', boxShadow: 'var(--card-shadow)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>
              STOCK CRÍTICO / FALTANTE
            </span>
            <AlertTriangle size={18} color={criticalStockCount > 0 ? '#ca8a04' : '#16a34a'} />
          </div>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.75rem', fontWeight: 800, color: criticalStockCount > 0 ? '#ca8a04' : '#16a34a' }}>
            {criticalStockCount} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: '#64748b' }}>por reponer</span>
          </div>
        </div>
      </div>

      {/* Action Header & Search Controls */}
      <div 
        style={{ 
          backgroundColor: '#ffffff', 
          padding: '1rem 1.25rem', 
          borderRadius: 'var(--radius-lg)', 
          border: '1px solid #e2e8f0',
          boxShadow: 'var(--card-shadow)',
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          gap: '1rem', 
          flexWrap: 'wrap' 
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flex: 1, minWidth: '320px', alignItems: 'center' }}>
          <div className="barcode-input-wrap" style={{ flex: 1 }}>
            <Search size={16} color="#94a3b8" />
            <input
              type="text"
              className="barcode-input"
              placeholder="Buscar por nombre, código de barra o marca..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <label 
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem', 
              padding: '0.5rem 0.85rem', 
              backgroundColor: onlyLowStock ? '#fefce8' : '#f8fafc', 
              border: `1px solid ${onlyLowStock ? '#fef08a' : '#cbd5e1'}`, 
              borderRadius: 'var(--radius-md)', 
              cursor: 'pointer',
              fontSize: '0.825rem',
              fontWeight: 600,
              color: onlyLowStock ? '#a16207' : '#475569',
              whiteSpace: 'nowrap'
            }}
          >
            <input
              type="checkbox"
              checked={onlyLowStock}
              onChange={(e) => setOnlyLowStock(e.target.checked)}
              style={{ cursor: 'pointer' }}
            />
            <span>Solo Stock Crítico</span>
          </label>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => setIsBulkModalOpen(true)}
            title="Aumentar precios en masa por porcentaje"
          >
            <TrendingUp size={16} color="#ca8a04" />
            <span>Aumento Masivo %</span>
          </button>

          <button className="btn btn-primary" onClick={handleOpenAddModal}>
            <Plus size={18} />
            <span>Nuevo Producto</span>
          </button>
        </div>
      </div>

      {/* Category Filter Chips (Preserved and Beautified with Clear Contrast) */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '0.5rem', 
          overflowX: 'auto', 
          paddingBottom: '0.25rem' 
        }}
      >
        <button
          onClick={() => setSelectedCategory('todos')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            padding: '0.45rem 0.95rem',
            borderRadius: '9999px',
            fontSize: '0.825rem',
            fontWeight: 600,
            border: selectedCategory === 'todos' ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
            backgroundColor: selectedCategory === 'todos' ? '#2563eb' : '#ffffff',
            color: selectedCategory === 'todos' ? '#ffffff' : '#475569',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            boxShadow: selectedCategory === 'todos' ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
            transition: 'all 0.15s ease'
          }}
        >
          <span>Todos los Productos</span>
        </button>

        {categories.filter(c => c.id !== 'todos').map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.45rem 0.95rem',
              borderRadius: '9999px',
              fontSize: '0.825rem',
              fontWeight: 600,
              border: selectedCategory === cat.id ? '1.5px solid #2563eb' : '1px solid #cbd5e1',
              backgroundColor: selectedCategory === cat.id ? '#2563eb' : '#ffffff',
              color: selectedCategory === cat.id ? '#ffffff' : '#475569',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              boxShadow: selectedCategory === cat.id ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Inventory Table (Clean White Card) */}
      <div 
        style={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: 'var(--radius-lg)', 
          overflow: 'hidden',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <table className="mockup-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Producto</th>
              <th>Categoría</th>
              <th style={{ textAlign: 'center' }}>Stock Actual</th>
              <th style={{ textAlign: 'center' }}>Mínimo</th>
              <th style={{ textAlign: 'right' }}>P. Costo</th>
              <th style={{ textAlign: 'right' }}>P. Venta</th>
              <th style={{ textAlign: 'center' }}>Margen</th>
              <th style={{ textAlign: 'center' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((p) => {
              const isOutOfStock = (p.stock || 0) <= 0;
              const isLowStock = (p.stock || 0) > 0 && (p.stock || 0) <= (p.minStock || 5);
              const cost = Number(p.costPrice) || 0;
              const sale = Number(p.salePrice) || 0;
              const margin = cost > 0 ? Math.round(((sale - cost) / cost) * 100) : 0;

              return (
                <tr key={p.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748b' }}>
                    {p.barcode}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</div>
                    <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{p.unit || 'Unidad'}</span>
                  </td>
                  <td>
                    <span 
                      style={{ 
                        fontSize: '0.75rem', 
                        padding: '3px 8px', 
                        borderRadius: '4px', 
                        backgroundColor: '#f1f5f9',
                        color: '#334155',
                        fontWeight: 600,
                        textTransform: 'capitalize' 
                      }}
                    >
                      {p.category}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleQuickStockDelta(p, -1)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        title="Restar 1 unidad"
                      >
                        <MinusCircle size={16} />
                      </button>
                      <span 
                        style={{ 
                          minWidth: '45px', 
                          display: 'inline-block', 
                          textAlign: 'center',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontFamily: 'var(--font-mono)',
                          fontWeight: 700,
                          backgroundColor: isOutOfStock ? '#fee2e2' : isLowStock ? '#fef9c3' : '#dcfce7',
                          color: isOutOfStock ? '#dc2626' : isLowStock ? '#a16207' : '#16a34a'
                        }}
                      >
                        {p.stock}
                      </span>
                      <button
                        onClick={() => handleQuickStockDelta(p, 1)}
                        style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer' }}
                        title="Sumar 1 unidad"
                      >
                        <PlusCircle size={16} />
                      </button>
                    </div>
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                    {p.minStock || 5}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', color: '#64748b' }}>
                    {formatCurrency(p.costPrice)}
                  </td>
                  <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16a34a', fontSize: '0.95rem' }}>
                    {formatCurrency(p.salePrice)}
                  </td>
                  <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem' }}>
                    <span style={{ color: margin > 30 ? '#2563eb' : '#ca8a04', fontWeight: 600 }}>
                      +{margin}%
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleOpenEditModal(p)}
                        title="Editar producto"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button
                        className="btn btn-secondary"
                        style={{ padding: '4px 8px', color: '#dc2626', borderColor: '#fecaca' }}
                        onClick={() => handleDelete(p.id, p.name)}
                        title="Eliminar producto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
                  <Package size={36} style={{ opacity: 0.4, margin: '0 auto 0.5rem auto' }} />
                  <div>No se encontraron artículos con los filtros aplicados</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Product Modal */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSave={handleSaveProduct}
        productToEdit={editingProduct}
      />

      {/* Bulk Price Adjust Modal */}
      <BulkPriceModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onApplyBulkUpdate={onBulkUpdatePrices}
      />
    </div>
  );
}
