import React, { useState } from 'react';
import { X, TrendingUp, AlertTriangle, Check } from 'lucide-react';
import { CATEGORIES } from '../../data/initialData';

export default function BulkPriceModal({ isOpen, onClose, onApplyBulkUpdate }) {
  const [targetCategory, setTargetCategory] = useState('todos');
  const [percentage, setPercentage] = useState('10');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const numPercent = Number(percentage);
    if (!numPercent || isNaN(numPercent)) return;

    if (window.confirm(`¿Estás seguro de aumentar los precios de venta un ${numPercent}% para ${targetCategory === 'todos' ? 'TODOS los productos' : 'la categoría seleccionada'}?`)) {
      onApplyBulkUpdate(targetCategory, numPercent);
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} color="#f59e0b" />
            <h2 style={{ fontSize: '1.2rem', color: '#fff', margin: 0 }}>Aumento Masivo de Precios</h2>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-secondary)', cursor: 'pointer' }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Actualiza automáticamente los precios de venta de toda una categoría (ej. aumento de lista de cigarrillos o alimentos) sin tener que editar uno por uno.
            </p>

            <div className="form-group">
              <label className="form-label">Categoría a actualizar</label>
              <select
                className="form-select"
                value={targetCategory}
                onChange={(e) => setTargetCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Porcentaje de Aumento (%)</label>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <input
                  type="number"
                  step="0.5"
                  className="form-input"
                  placeholder="Ej: 10"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                  required
                />
                <span style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-secondary)' }}>%</span>
              </div>
            </div>

            {/* Quick Presets */}
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              {[5, 8, 10, 12, 15, 20].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setPercentage(val.toString())}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '4px',
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    cursor: 'pointer'
                  }}
                >
                  +{val}%
                </button>
              ))}
            </div>

            <div style={{ marginTop: '1.25rem', padding: '0.75rem', background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 'var(--radius-sm)', display: 'flex', gap: '0.5rem', alignItems: 'center', fontSize: '0.8rem', color: '#f59e0b' }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>Esta acción recalculará los precios de venta inmediatamente en la base de datos local.</span>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" style={{ background: '#f59e0b', color: '#000', fontWeight: 700 }}>
              <Check size={18} />
              <span>Aplicar Aumento</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
