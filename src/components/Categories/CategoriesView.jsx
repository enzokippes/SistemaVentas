import React, { useState, useEffect, useRef } from 'react';
import { 
  Tags, 
  Plus, 
  Edit3, 
  Trash2, 
  Package, 
  ArrowRight,
  X, 
  Check, 
  ShoppingBag, 
  Flame, 
  Pill, 
  Candy, 
  Coffee, 
  GitMerge 
} from 'lucide-react';
import ModalBackdrop from '../Common/ModalBackdrop';

export default function CategoriesView({ 
  categories, 
  products, 
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory, 
  onNavigateToProductsWithCategory, 
  onDeduplicateCategories 
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryIcon, setCategoryIcon] = useState('ShoppingBag');

  const categoryNameInputRef = useRef(null);

  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => {
        categoryNameInputRef.current?.focus();
        categoryNameInputRef.current?.select();
      }, 60);
    }
  }, [isModalOpen]);

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
    const otherCats = categories.filter(c => c.id !== 'todos' && c.id !== cat.id);
    const fallbackName = otherCats.length > 0 ? otherCats[0].name : 'General';

    if (productsInCat.length > 0) {
      const msg = `¿Deseas eliminar el rubro "${cat.name}"?\n\nTiene ${productsInCat.length} productos asociados.\n\n🛡️ IMPORTANTE: Tus productos NO se borrarán. Se mantendrán a salvo y pasarán automáticamente al rubro "${fallbackName}".`;
      if (!window.confirm(msg)) {
        return;
      }
    } else {
      if (!window.confirm(`¿Estás seguro de eliminar el rubro "${cat.name}"?`)) {
        return;
      }
    }
    onDeleteCategory(cat.id);
  };

  const getCategoryIconElement = (iconName) => {
    switch (iconName) {
      case 'Flame': return <Flame size={20} color="var(--danger)" />;
      case 'Pill': return <Pill size={20} color="var(--success)" />;
      case 'Candy': return <Candy size={20} color="var(--purple)" />;
      case 'Coffee': return <Coffee size={20} color="var(--primary)" />;
      case 'Package': return <Package size={20} color="var(--warning)" />;
      default: return <ShoppingBag size={20} color="var(--primary)" />;
    }
  };

  const nonTodosCategories = categories.filter(c => c.id !== 'todos');

  return (
    <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner & Action */}
      <div 
        style={{ 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--card-border)', 
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
              backgroundColor: 'var(--primary-light)', 
              border: '1px solid var(--primary-border)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: 'var(--primary)' 
            }}
          >
            <Tags size={22} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Administración de Categorías y Rubros
            </h2>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Organiza los artículos de tu kiosco. Si eliminas un rubro, tus productos nunca se pierden.
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          {typeof onDeduplicateCategories === 'function' && (
            <button
              className="btn btn-secondary"
              onClick={() => {
                const result = onDeduplicateCategories();
                if (result.removed === 0) {
                  alert('✅ No hay categorías duplicadas. Todo está limpio.');
                } else {
                  alert(`✅ Se combinaron ${result.removed} categoría${result.removed > 1 ? 's' : ''} duplicada${result.removed > 1 ? 's' : ''}. Los productos fueron reasignados correctamente.`);
                }
              }}
              title="Combinar categorías con el mismo nombre"
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <GitMerge size={16} color="var(--warning)" />
              <span>Limpiar Duplicados</span>
            </button>
          )}
          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={18} />
            <span>Nueva Categoría</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--card-shadow)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total de Categorías Activas
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
            {nonTodosCategories.length}
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-lg)', padding: '1.25rem', boxShadow: 'var(--card-shadow)' }}>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 600 }}>
            Total de Productos Clasificados
          </span>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)', marginTop: '0.25rem' }}>
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
                backgroundColor: 'var(--bg-surface)',
                border: '1px solid var(--card-border)',
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
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', backgroundColor: 'var(--bg-hover)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {getCategoryIconElement(cat.icon)}
                    </div>
                    <div>
                      <strong style={{ fontSize: '1rem', color: 'var(--text-main)', display: 'block' }}>{cat.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Categoría de productos</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <button
                      onClick={() => handleOpenEdit(cat)}
                      style={{ border: 'none', background: 'var(--bg-hover)', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: 'var(--text-secondary)' }}
                      title="Editar nombre"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(cat)}
                      style={{ border: 'none', background: 'var(--danger-light)', padding: '6px', borderRadius: '4px', cursor: 'pointer', color: 'var(--danger)' }}
                      title="Eliminar categoría"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                <div style={{ backgroundColor: 'var(--bg-hover)', padding: '0.75rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', margin: '0.75rem 0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Variedad de artículos:</span>
                    <strong style={{ color: 'var(--text-main)' }}>{catProducts.length} productos</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Stock total en góndola:</span>
                    <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{totalStockUnits} un.</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Valor a la venta:</span>
                    <strong style={{ color: 'var(--success)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(totalCategoryValue)}</strong>
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

      {/* Add / Edit Category Modal */}
      {isModalOpen && (
        <ModalBackdrop onClose={() => setIsModalOpen(false)}>
          <div 
            className="modal-card" 
            onClick={(e) => e.stopPropagation()} 
            onMouseDown={(e) => e.stopPropagation()} 
            style={{ maxWidth: '440px' }}
          >
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
                {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nombre de la Categoría *</label>
                  <input
                    ref={categoryNameInputRef}
                    type="text"
                    className="form-input"
                    placeholder="Ej: Lácteos, Panadería, Limpieza..."
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Ícono Representativo</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '0.5rem', marginTop: '0.5rem' }}>
                    {[
                      { id: 'ShoppingBag', label: 'Bolsa' },
                      { id: 'Flame', label: 'Fuego' },
                      { id: 'Pill', label: 'Píldora' },
                      { id: 'Candy', label: 'Dulce' },
                      { id: 'Coffee', label: 'Café' },
                      { id: 'Package', label: 'Caja' },
                    ].map((iconObj) => (
                      <button
                        key={iconObj.id}
                        type="button"
                        onClick={() => setCategoryIcon(iconObj.id)}
                        style={{
                          height: '42px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: 'var(--radius-sm)',
                          border: categoryIcon === iconObj.id ? '2px solid var(--primary)' : '1px solid var(--border)',
                          backgroundColor: categoryIcon === iconObj.id ? 'var(--primary-light)' : 'var(--bg-hover)',
                          cursor: 'pointer'
                        }}
                      >
                        {getCategoryIconElement(iconObj.id)}
                      </button>
                    ))}
                  </div>
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
        </ModalBackdrop>
      )}
    </div>
  );
}
