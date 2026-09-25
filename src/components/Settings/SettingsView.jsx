import React, { useState, useEffect } from 'react';
import { 
  Download, 
  Upload, 
  Save, 
  RefreshCw, 
  ShieldCheck, 
  Store, 
  CheckCircle, 
  AlertTriangle,
  Palette,
  Boxes,
  Trash2,
  Sparkles,
  Check,
  FileSpreadsheet
} from 'lucide-react';
import ImportCSVModal from './ImportCSVModal';
import { 
  exportDatabaseJSON, 
  importDatabaseJSON, 
  resetDatabase,
  autoBackupDatabase,
  getLatestAutoBackup,
  restoreAutoBackup
} from '../../data/storage';

const THEMES = [
  {
    id: 'default',
    name: 'Slate Clásico',
    subtitle: 'Diseño original sobrio y equilibrado',
    isDark: false,
    colors: ['#0F172A', '#2563EB', '#F8FAFC', '#16A34A'],
    borderPreview: '#E2E8F0',
    bgPreview: '#F8FAFC',
  },
  {
    id: 'modern-dark',
    name: 'Modern Dark',
    subtitle: 'Grafito profundo, cian y esmeralda',
    isDark: true,
    colors: ['#0B0F17', '#38BDF8', '#151D2A', '#10B981'],
    borderPreview: '#1E293B',
    bgPreview: '#0B0F17',
  },
  {
    id: 'nordic-clean',
    name: 'Nordic Clean',
    subtitle: 'Blanco ártico, gris suave y azul zafiro',
    isDark: false,
    colors: ['#1F2937', '#2563EB', '#FFFFFF', '#059669'],
    borderPreview: '#E5E7EB',
    bgPreview: '#F3F4F6',
  },
  {
    id: 'vibrant-retail',
    name: 'Vibrant Retail',
    subtitle: 'Índigo comercial, blanco vivo y ámbar',
    isDark: false,
    colors: ['#1E1B4B', '#4F46E5', '#FFFFFF', '#F59E0B'],
    borderPreview: '#C7D2FE',
    bgPreview: '#F8FAFC',
  },
  {
    id: 'aurora-glass',
    name: 'Aurora Glass',
    subtitle: 'Obsidiana nocturno con violeta y acento cian',
    isDark: true,
    colors: ['#090D16', '#8B5CF6', '#111625', '#10B981'],
    borderPreview: '#25324D',
    bgPreview: '#090D16',
  },
  {
    id: 'industrial-compact',
    name: 'Industrial Compact',
    subtitle: 'Carbón mate de alto contraste y ámbar táctico',
    isDark: true,
    colors: ['#181A1B', '#F59E0B', '#222629', '#22C55E'],
    borderPreview: '#343A40',
    bgPreview: '#181A1B',
  },
];

export default function SettingsView({ 
  config, 
  onSaveConfig, 
  onReloadData, 
  onUpdateLiveStoreName,
  onClearDatabase 
}) {
  const [formData, setFormData] = useState({
    storeName: config?.storeName ?? 'MiniMercado Kippes',
    address: config?.address ?? 'Av. Principal 1234',
    phone: config?.phone ?? '351-555-1234',
    ticketFooter: config?.ticketFooter ?? '¡Gracias por su compra! Vuelva pronto.',
    trackInventory: config?.trackInventory !== false,
    showCashModule: config?.showCashModule !== false,
    theme: config?.theme || 'default',
  });
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [showClearModal, setShowClearModal] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [autoBackupInfo, setAutoBackupInfo] = useState(() => getLatestAutoBackup());

  useEffect(() => {
    if (config) {
      setFormData({
        storeName: config.storeName ?? 'MiniMercado Kippes',
        address: config.address ?? '',
        phone: config.phone ?? '',
        ticketFooter: config.ticketFooter ?? '',
        trackInventory: config.trackInventory !== false,
        showCashModule: config.showCashModule !== false,
        theme: config.theme || 'default',
      });
    }
  }, [config]);

  const handleNameChange = (e) => {
    const newName = e.target.value;
    setFormData((prev) => ({ ...prev, storeName: newName }));
    onUpdateLiveStoreName?.(newName);
  };

  const handleThemeSelect = (themeId) => {
    const updated = { ...formData, theme: themeId };
    setFormData(updated);
    onSaveConfig(updated);
    if (themeId && themeId !== 'default') {
      document.documentElement.setAttribute('data-theme', themeId);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  };

  const handleToggleInventory = (e) => {
    const checked = e.target.checked;
    const updated = { ...formData, trackInventory: checked };
    setFormData(updated);
    onSaveConfig(updated);
  };

  const handleToggleCashModule = (e) => {
    const checked = e.target.checked;
    const updated = { ...formData, showCashModule: checked };
    setFormData(updated);
    onSaveConfig(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveConfig(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleExportBackup = async () => {
    const jsonStr = exportDatabaseJSON();
    const dateStr = new Date().toISOString().slice(0, 10);
    const defaultName = `backup_minimercado_kippes_${dateStr}.json`;

    if (window.electronAPI?.saveFileDialog && window.electronAPI?.writeFile) {
      try {
        const filePath = await window.electronAPI.saveFileDialog({
          defaultPath: defaultName,
          filters: [{ name: 'Copia de Seguridad JSON', extensions: ['json'] }]
        });
        if (filePath) {
          const res = await window.electronAPI.writeFile({ filePath, content: jsonStr });
          if (res.success) {
            alert('¡Copia de seguridad guardada correctamente en:\n' + filePath);
            return;
          }
        } else {
          return;
        }
      } catch (err) {
        console.warn('Native dialog failed, falling back to download', err);
      }
    }

    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = defaultName;
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

  const handleTriggerAutoBackup = () => {
    const backup = autoBackupDatabase();
    setAutoBackupInfo(backup);
    alert('¡Respaldo automático generado y guardado en esta computadora con éxito!');
  };

  const handleRestoreAutoBackup = () => {
    const backup = getLatestAutoBackup();
    if (!backup) {
      alert('No se encontró ninguna copia automática guardada.');
      return;
    }
    const backupDate = backup.timestamp ? new Date(backup.timestamp).toLocaleString('es-AR') : 'reciente';
    if (window.confirm(`¿Deseas restaurar la copia de seguridad automática del ${backupDate}?\n\nSe recuperará el catálogo de productos, clientes y ventas registradas hasta ese momento.`)) {
      const res = restoreAutoBackup();
      if (res.success) {
        alert('¡Copia automática restaurada exitosamente!');
        onReloadData();
      } else {
        alert('Error al restaurar: ' + res.error);
      }
    }
  };

  const handleConfirmCleanDatabase = () => {
    onClearDatabase?.();
    setShowClearModal(false);
    alert('✅ Sistema preparado para entrega: clientes, productos y ventas han sido vaciados. No se regenerarán datos automáticamente.');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '960px', margin: '0 auto', width: '100%', paddingBottom: '3rem' }}>
      
      {/* 1. Selector de Temas Visuales */}
      <div 
        style={{ 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--card-border)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.5rem',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Palette size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Diseño y Paleta de Colores
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Elige el estilo visual que mejor se adapte a tu local. El formato y distribución se mantienen idénticos.
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
          {THEMES.map((theme) => {
            const isSelected = formData.theme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleThemeSelect(theme.id)}
                style={{
                  border: isSelected ? '2px solid var(--primary)' : '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  backgroundColor: isSelected ? 'var(--primary-light)' : 'var(--bg-hover)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.6rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                      {theme.name}
                    </span>
                    {theme.isDark && (
                      <span style={{ fontSize: '0.65rem', padding: '0.15rem 0.45rem', borderRadius: '4px', backgroundColor: '#0f172a', color: '#94a3b8', fontWeight: 600 }}>
                        OSCURO
                      </span>
                    )}
                  </div>
                  {isSelected && (
                    <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '22px', height: '22px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: '#ffffff' }}>
                      <Check size={14} strokeWidth={3} />
                    </span>
                  )}
                </div>

                <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.3 }}>
                  {theme.subtitle}
                </p>

                {/* Swatches preview */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.25rem' }}>
                  {theme.colors.map((c, idx) => (
                    <div 
                      key={idx} 
                      style={{ 
                        width: '24px', 
                        height: '24px', 
                        borderRadius: '50%', 
                        backgroundColor: c, 
                        border: '1.5px solid rgba(0,0,0,0.1)',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.1)'
                      }} 
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. Control de Inventario y Stock */}
      <div 
        style={{ 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--card-border)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.5rem',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Boxes size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Inventario de Productos & Control de Stock
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Configuración de control de existencias para ventas rápidas o locales sin conteo de unidades
            </span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--bg-hover)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ maxWidth: '650px' }}>
            <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Control General de Stock en Ventas
            </strong>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              {formData.trackInventory 
                ? 'Activado: Las ventas restarán unidades del inventario para los productos que tengan el control activado. También puedes desactivar el control por producto individualmente.' 
                : 'Desactivado: Puedes vender libremente cualquier producto sin importar el stock. No se descontarán unidades ni se bloquearán ventas por falta de existencias.'}
            </p>
          </div>

          <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={formData.trackInventory} 
              onChange={handleToggleInventory}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
            <span style={{ marginLeft: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              {formData.trackInventory ? 'Habilitado' : 'Deshabilitado'}
            </span>
          </label>
        </div>

        {/* Módulo de Caja Toggle */}
        <div style={{ marginTop: '1rem', backgroundColor: 'var(--bg-hover)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div style={{ maxWidth: '650px' }}>
            <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.35rem' }}>
              Módulo de Caja y Arqueos de Turno (F4)
            </strong>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
              {formData.showCashModule 
                ? 'Activado: Muestra la sección de Caja (F4), apertura y cierre de turnos, y botones de entradas/salidas de efectivo (F7 y F8).' 
                : 'Desactivado (Recomendado para negocios familiares): Oculta la sección de Caja de la barra lateral y los botones de arqueo para una interfaz más simple y limpia, usando directamente el módulo de Reportes para ver las ventas.'}
            </p>
          </div>

          <label style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', cursor: 'pointer' }}>
            <input 
              type="checkbox" 
              checked={formData.showCashModule} 
              onChange={handleToggleCashModule}
              style={{ width: '20px', height: '20px', cursor: 'pointer', accentColor: 'var(--primary)' }}
            />
            <span style={{ marginLeft: '0.5rem', fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-main)' }}>
              {formData.showCashModule ? 'Habilitado' : 'Deshabilitado'}
            </span>
          </label>
        </div>
      </div>

      {/* 3. Datos del Negocio Card */}
      <div 
        style={{ 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--card-border)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.5rem',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--primary-light)', border: '1px solid var(--primary-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
            <Store size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Datos del Negocio ({formData.storeName || 'MiniMercado Kippes'})
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Información que se imprime en los comprobantes y tickets térmicos
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }} className="form-group">
            <div>
              <label className="form-label" style={{ color: 'var(--text-main)' }}>Nombre del Negocio</label>
              <input
                type="text"
                className="form-input"
                value={formData.storeName}
                onChange={handleNameChange}
                placeholder="Escribe el nombre del negocio..."
                required
              />
            </div>

            <div>
              <label className="form-label" style={{ color: 'var(--text-main)' }}>Teléfono / WhatsApp</label>
              <input
                type="text"
                className="form-input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--text-main)' }}>Dirección / Localidad</label>
            <input
              type="text"
              className="form-input"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label className="form-label" style={{ color: 'var(--text-main)' }}>Mensaje al pie del Ticket / Comprobante</label>
            <input
              type="text"
              className="form-input"
              value={formData.ticketFooter}
              onChange={(e) => setFormData({ ...formData, ticketFooter: e.target.value })}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem' }}>
            {saveSuccess ? (
              <span style={{ color: 'var(--success)', fontSize: '0.9rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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

      {/* 4. Backup & Data Security Card */}
      <div 
        style={{ 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--card-border)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.5rem',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--success-light)', border: '1px solid var(--success-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--success)' }}>
            <ShieldCheck size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Copias de Seguridad (Backups en Pendrive)
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Guarda un respaldo completo de productos, stock y ventas con un solo clic
            </span>
          </div>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '1.25rem', lineHeight: 1.5 }}>
          El sistema opera 100% de manera local en tu computadora sin depender de internet. Genera copias automáticas en segundo plano y también te permite exportar copias a un archivo o pendrive para máxima seguridad.
        </p>

        {/* Auto-backup live status card */}
        <div style={{ backgroundColor: 'var(--bg-hover)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1.5px solid var(--primary)', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div style={{ width: '42px', height: '42px', borderRadius: '50%', backgroundColor: 'rgba(37, 99, 235, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <ShieldCheck size={22} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <strong style={{ fontSize: '1rem', color: 'var(--text-main)' }}>
                  Protección Automática Anti-Cierre
                </strong>
                <span style={{ fontSize: '0.725rem', backgroundColor: 'rgba(22, 163, 74, 0.15)', color: '#16a34a', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                  Activo
                </span>
              </div>
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', margin: '0.2rem 0 0 0' }}>
                {autoBackupInfo?.timestamp 
                  ? `Último respaldo automático: ${new Date(autoBackupInfo.timestamp).toLocaleString('es-AR')}`
                  : 'Se actualiza automáticamente con cada venta realizada y cada modificación.'}
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handleRestoreAutoBackup}
              title="Restaurar el último estado guardado automáticamente"
            >
              <RefreshCw size={15} />
              <span>Restaurar Copia Automática</span>
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleTriggerAutoBackup}
              title="Crear un punto de respaldo de seguridad ahora mismo"
            >
              <Save size={15} />
              <span>Respaldar Ahora</span>
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
          <div style={{ backgroundColor: 'var(--bg-hover)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Descargar Copia de Seguridad
              </strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
              <span>Exportar Backup</span>
            </button>
          </div>

          <div style={{ backgroundColor: 'var(--bg-hover)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Restaurar desde Copia
              </strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Carga un archivo <code>.json</code> previo para restaurar todos los datos en esta o cualquier otra PC.
              </p>
            </div>
            <label className="btn btn-secondary" style={{ marginTop: '1rem', cursor: 'pointer' }}>
              <Upload size={18} />
              <span>Cargar Archivo JSON</span>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportBackup} 
                style={{ display: 'none' }} 
              />
            </label>
          </div>

          <div style={{ backgroundColor: 'var(--bg-hover)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Importar de Excel / Abarrotes
              </strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                Migra o actualiza productos masivamente desde <code>.xlsx</code>, <code>.xls</code> o <code>.csv</code>.
              </p>
            </div>
            <button 
              type="button" 
              className="btn btn-primary" 
              onClick={() => setIsImportModalOpen(true)}
              style={{ marginTop: '1rem' }}
            >
              <FileSpreadsheet size={18} />
              <span>Importar Excel / Abarrotes</span>
            </button>
          </div>
        </div>
      </div>

      {/* 5. Zona de Mantenimiento & Entrega */}
      <div 
        style={{ 
          backgroundColor: 'var(--bg-surface)', 
          border: '1px solid var(--card-border)', 
          borderRadius: 'var(--radius-lg)', 
          padding: '1.5rem',
          boxShadow: 'var(--card-shadow)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
          <div style={{ width: '38px', height: '38px', borderRadius: '8px', backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--warning)' }}>
            <AlertTriangle size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
              Zona de Mantenimiento y Entrega al Cliente
            </h2>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Acciones para entregar el software limpio o restaurar muestras
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          {/* Entrega limpia */}
          <div style={{ backgroundColor: 'var(--bg-hover)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                <Sparkles size={16} color="var(--primary)" /> Entregar Sistema Limpio (0 Datos)
              </strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Vacía todos los productos, clientes, ventas y deudas para entregar el programa 100% limpio a un negocio real. <strong>No se regenerarán productos ni clientes solos.</strong>
              </p>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={() => setShowClearModal(true)} 
              style={{ marginTop: '1rem', color: 'var(--danger)' }}
            >
              <Trash2 size={16} />
              <span>Vaciar Base de Datos para Entrega</span>
            </button>
          </div>

          {/* Restablecer Demo */}
          <div style={{ backgroundColor: 'var(--bg-hover)', padding: '1.25rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <strong style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.95rem', color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                <RefreshCw size={16} color="var(--text-muted)" /> Restaurar Catálogo de Muestra
              </strong>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                Restaura los 24 productos y clientes de prueba iniciales (cigarrillos, bebidas, golosinas) para hacer demostraciones de venta.
              </p>
            </div>
            <button 
              type="button" 
              className="btn btn-secondary" 
              onClick={handleResetData} 
              style={{ marginTop: '1rem', color: 'var(--text-secondary)' }}
            >
              <RefreshCw size={16} />
              <span>Restablecer Datos de Demostración</span>
            </button>
          </div>
        </div>
      </div>

      {/* Modal Confirmación de Vaciar para Entrega */}
      {showClearModal && (
        <div 
          className="modal-overlay"
          onClick={() => setShowClearModal(false)}
        >
          <div 
            className="modal-card" 
            style={{ maxWidth: '480px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
                <AlertTriangle size={22} />
                <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  ¿Vaciar Sistema para Entrega?
                </h3>
              </div>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '1.25rem 0' }}>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: 1.5, margin: 0 }}>
                Esta acción eliminará de forma permanente:
              </p>
              <ul style={{ paddingLeft: '1.25rem', fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                <li>Todos los productos y categorías de prueba</li>
                <li>Todos los clientes y cuentas corrientes registradas</li>
                <li>Todas las ventas y movimientos de caja previos</li>
              </ul>
              <div style={{ backgroundColor: 'var(--warning-light)', border: '1px solid var(--warning-border)', borderRadius: 'var(--radius-sm)', padding: '0.75rem', marginTop: '0.5rem' }}>
                <strong style={{ fontSize: '0.825rem', color: 'var(--warning-hover)', display: 'block', marginBottom: '0.2rem' }}>
                  Listo para producción
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-main)' }}>
                  El sistema quedará 100% en blanco. Los datos no se volverán a regenerar automáticamente.
                </span>
              </div>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={() => setShowClearModal(false)}
              >
                Cancelar
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleConfirmCleanDatabase}
                style={{ backgroundColor: 'var(--danger)', color: '#ffffff' }}
              >
                <Trash2 size={16} />
                <span>Confirmar y Vaciar Todo</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
