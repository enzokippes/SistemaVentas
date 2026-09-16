import React, { useState } from 'react';
import { 
  Settings, 
  Download, 
  Upload, 
  Save, 
  RefreshCw, 
  ShieldCheck, 
  Store, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';
import { exportDatabaseJSON, importDatabaseJSON, resetDatabase } from '../../data/storage';

export default function SettingsView({ config, onSaveConfig, onReloadData }) {
  const [formData, setFormData] = useState({ ...config });
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportBackup = () => {
    const jsonStr = exportDatabaseJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `backup_minimercado_kippes_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportBackup = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        const res = importDatabaseJSON(content);
        if (res.success) {
          alert('¡Copia de seguridad restaurada exitosamente!');
          onReloadData();
        } else {
          alert('Error al leer el archivo de copia de seguridad: ' + res.error);
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleResetData = () => {
    if (window.confirm('¿ATENCIÓN: Esto restaurará los datos de prueba originales? Asegúrate de tener una copia si tienes datos reales cargados.')) {
      resetDatabase();
      onReloadData();
      alert('Sistema reiniciado con datos de demostración.');
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '960px', margin: '0 auto', width: '100%' }}>
      {/* Store Information Card */}
      <div 
        style={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.5rem',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
            <Store size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Datos del Negocio (MiniMercado Kippes)
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Información que se imprime en los comprobantes y tickets térmicos
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-group">
            <div>
              <label className="form-label">Nombre del Negocio</label>
              <input
                type="text"
                className="form-input"
                value={formData.storeName || 'MiniMercado Kippes'}
                onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Teléfono / WhatsApp</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Dirección / Localidad</label>
            <input
              type="text"
              className="form-input"
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Mensaje al pie del Ticket / Comprobante</label>
            <input
              type="text"
              className="form-input"
              value={formData.ticketFooter || '¡Gracias por su compra! Vuelva pronto.'}
              onChange={(e) => setFormData({ ...formData, ticketFooter: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            {saveSuccess ? (
              <span style={{ color: '#16a34a', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CheckCircle size={16} /> ¡Configuración guardada correctamente!
              </span>
            ) : <span />}

            <button type="submit" className="btn btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
              <Save size={18} />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>
      </div>

      {/* Backup & Data Security Card */}
      <div 
        style={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.5rem',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#f0fdf4', border: '1px solid #86efac', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Copias de Seguridad (Backups en Pendrive)
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Guarda un respaldo completo de productos, stock y ventas con un solo clic
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: '#475569', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          El sistema opera 100% de manera local en tu computadora sin depender de internet. Te recomendamos exportar una copia periódica y guardarla en un pendrive para total tranquilidad.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                Descargar Copia de Seguridad
              </strong>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Genera un archivo <code>.json</code> con todo el inventario, precios y ventas registradas.
              </p>
            </div>
            <button 
              type="button" 
              className="btn btn-success" 
              onClick={handleExportBackup}
              style={{ marginTop: '1rem' }}
            >
              <Download size={18} />
              <span>Exportar Backup a Archivo</span>
            </button>
          </div>

          <div style={{ backgroundColor: '#f8fafc', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: '#0f172a', marginBottom: '0.25rem' }}>
                Restaurar desde Copia
              </strong>
              <p style={{ fontSize: '0.8rem', color: '#64748b' }}>
                Carga un archivo de respaldo previo para restaurar todos los datos en esta o cualquier otra PC.
              </p>
            </div>
            <label className="btn btn-secondary" style={{ marginTop: '1rem', cursor: 'pointer' }}>
              <Upload size={18} />
              <span>Cargar Archivo de Respaldo</span>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportBackup} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>
        </div>
      </div>

      {/* Demo / Reset Card */}
      <div 
        style={{ 
          backgroundColor: '#ffffff', 
          border: '1px solid #e2e8f0', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.5rem',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: '#fefce8', border: '1px solid #fef08a', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ca8a04' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: '#0f172a', margin: 0 }}>
              Zona de Reinicio
            </h2>
            <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
              Restablecer el sistema al catálogo inicial de demostración
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1rem' }}>
          Restaura la base de datos a los productos de muestra (marcas de cigarrillos, golosinas, medicamentos, bebidas y despensa).
        </p>

        <button type="button" className="btn btn-secondary" onClick={handleResetData} style={{ color: '#dc2626' }}>
          <RefreshCw size={16} />
          <span>Restablecer Datos de Demostración</span>
        </button>
      </div>
    </div>
  );
}
