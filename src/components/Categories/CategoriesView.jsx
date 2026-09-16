import React, { useState } from 'react';
import { 
  Tags, 
  Plus, 
  Edit3, 
  Trash2, 
  Package, 
  DollarSign, 
  ArrowRight,
  X,
  Check,
  ShoppingBag,
  Flame,
  Pill,
  Candy,
  Coffee,
  Layers
} from 'lucide-react';

export default function CategoriesView({ 
  categories, 
  products, 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory,
  onNavigateToProductsWithCategory 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('ShoppingBag');

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const handleOpenAdd = () => {
    setEditingCategory(null);
    setCategoryName('');
    setCategoryIcon('ShoppingBag');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cat) => {
    setEditingCategory(cat);
    setCategoryName(cat.name);
    setCategoryIcon(cat.icon || 'ShoppingBag');
    setIsModalOpen(true);
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!categoryName.trim()) return;

    if (editingCategory) {
      onUpdateCategory(editingCategory.id, {
        name: categoryName.trim(),
        icon: categoryIcon
      });
    } else {
      const newId = categoryName
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]/g, '_');

      onAddCategory({
        id: `${newId}_${Date.now().toString().slice(-4)}`,
        name: categoryName.trim(),
        icon: categoryIcon
      });
    }
    setIsModalOpen(false);
  };

  const handleDelete = (cat) => {
    const productsInCat = products.filter(p => p.category === cat.id);
    if (productsInCat.length > 0) {
      if (!window.confirm(`La categoría "${cat.name}" tiene ${productsInCat.length} productos asociados. ¿Deseas eliminarla igualmente? Los productos quedarán sin rubro asignado.`)) {
        return;
      }
    } else {
      if (!window.confirm(`¿Estás seguro de eliminar la categoría "${cat.name}"?`)) {
        return;
      }
    }
    onDeleteCategory(cat.id);
  };

  const getCategoryIconElement = (iconName) => {
    switch (iconName) {
      case 'Flame': return <Flame size={20} color="#dc2626" />;
      case 'Pill': return <Pill size={20} color="#16a34a" />;
      case 'Candy': return <Candy size={20} color="#9333ea" />;
      case 'Coffee': return <Coffee size={20} color="#2563eb" />;
      case 'Package': return <Package size={20} color="#ca8a04" />;
      default: return <ShoppingBag size={20} color="#2563eb" />;
    }
  };

  const nonTodosCategories = categories.filter(c => c.id !== 'todos');

  return (
    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner & Action */}
      <div 
        style={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.25rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div 
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: 'var(--radius-md)', 
              backgroundColor: '#eff6ff', 
              border: '1px solid #bfdbfe',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#2563eb' 
            }}
          >
            <Tags size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Administración de Categorías y Rubros
            </h2>
            <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
              Organiza los artículos de tu kiosco (Despensa, Cigarrillos, Medicamentos, etc.)
            </span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={18} />
          <span>+ Nueva Categoría</span>
        </button>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--card-shadow)' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Total de Categorías Activas
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.85rem', fontWeight: 800, color: '#0f172a', marginTop: '0.25rem' }}>
            {nonTodosCategories.length}
          </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--card-shadow)' }}>
          <span style={{ fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 600 }}>
            Total de Productos Clasificados
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.85rem', fontWeight: 800, color: '#2563eb', marginTop: '0.25rem' }}>
            {products.length}
          </div>
        </div>
      </div>

      {/* Grid of Categories */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
        {nonTodosCategories.map((cat) => {
          const catProducts = products.filter(p => p.category === cat.id);
          const totalStockUnits = catProducts.reduce((acc, p) => acc + (p.stock || 0), 0);
          const totalCategoryValue = catProducts.reduce((acc, p) => acc + (p.salePrice * (p.stock || 0)), 0);

          return (
            <div 
              key={cat.id}
              style={{
                backgroundColor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                boxShadow: 'var(--card-shadow)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getCategoryIconElement(cat.icon)}
                    </div>
                    <div>
                      <strong style={{ fontSize: '1rem', color: '#0f172a', display: 'block' }}>{cat.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#64748b', fontFamily: 'var(--font-mono)' }}>id: {cat.id}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      style={{ border: 'none', background: '#f1f5f9', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: '#475569' }}
                      title="Editar nombre"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      style={{ border: 'none', background: '#fef2f2', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: '#dc2626' }}
                      title="Eliminar categoría"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div style={{ backgroundColor: '#f8fafc', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', margin: '0.75rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#64748b' }}>Variedad de artículos:</span>
                    <strong style={{ color: '#0f172a' }}>{catProducts.length} productos</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: '#64748b' }}>Stock total en góndola:</span>
                    <strong style={{ color: '#0f172a', fontFamily: 'var(--font-mono)' }}>{totalStockUnits} un.</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: '#64748b' }}>Valor a la venta:</span>
                    <strong style={{ color: '#16a34a', fontFamily: 'var(--font-mono)' }}>{formatCurrency(totalCategoryValue)}</strong>
                  </div>
                </div>
              </div>

              <button
                className="btn-shortcut-tab"
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }}
                onClick={() => onNavigateToProductsWithCategory(cat.id)}
              >
                <span>Ver productos de {cat.name}</span>
                <ArrowRight size={14} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal for Add / Edit Category */}
      {isModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: '1.15rem', color: '#0f172a' }}>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre del Rubro / Categoría *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Ej: Lácteos & Quesos, Panadería, Limpieza..."
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ícono Representativo</label>
                  <select 
                    className="form-select"
                    value={categoryIcon}
                    onChange={(e) => setCategoryIcon(e.target.value)}
                  >
                    <option value="ShoppingBag">Almacén / Compras (Bolsa)</option>
                    <option value="Flame">Cigarrillos / Fuego</option>
                    <option value="Pill">Medicamentos / Farmacia</option>
                    <option value="Candy">Golosinas / Dulces</option>
                    <option value="Coffee">Bebidas / Café</option>
                    <option value="Package">Variedades / Paquete</option>
                  </select>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  <span>{editingCategory ? 'Guardar Cambios' : 'Crear Categoría'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
