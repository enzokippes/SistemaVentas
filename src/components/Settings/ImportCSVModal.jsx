import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { 
  Upload, 
  FileSpreadsheet, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  RefreshCw, 
  X, 
  HelpCircle,
  Package,
  Layers,
  FileText
} from 'lucide-react';
import ModalBackdrop from '../Common/ModalBackdrop';
import { importProductsBulk } from '../../data/storage';

const SYSTEM_FIELDS = [
  { key: 'barcode', label: 'Código de Barras', required: false, hints: ['codigo', 'código', 'barcode', 'clave', 'cod', 'código de barras', 'codigo de barras'] },
  { key: 'name', label: 'Nombre / Descripción', required: true, hints: ['nombre', 'descripcion', 'descripción', 'producto', 'articulo', 'artículo', 'description'] },
  { key: 'salePrice', label: 'Precio de Venta', required: true, hints: ['precio', 'precio venta', 'precio de venta', 'precioventa', 'p. venta', 'p.venta', 'pvp', 'venta', 'sale price'] },
  { key: 'costPrice', label: 'Precio de Costo', required: false, hints: ['costo', 'precio costo', 'precio de costo', 'preciocosto', 'p. costo', 'p.costo', 'cost price'] },
  { key: 'wholesalePrice', label: 'Precio Mayoreo', required: false, hints: ['mayoreo', 'precio mayoreo', 'preciomayoreo', 'wholesale'] },
  { key: 'stock', label: 'Stock / Cantidad', required: false, hints: ['existencia', 'existencias', 'stock', 'cantidad', 'inventario', 'cant'] },
  { key: 'minStock', label: 'Stock Mínimo', required: false, hints: ['minimo', 'mínimo', 'stock minimo', 'stock mínimo', 'min'] },
  { key: 'category', label: 'Categoría / Rubro', required: false, hints: ['categoria', 'categoría', 'departamento', 'rubro', 'familia', 'depto', 'category'] },
  { key: 'unit', label: 'Unidad de Medida', required: false, hints: ['unidad', 'unidad de medida', 'u.m.', 'um', 'unit'] },
];

export default function ImportCSVModal({ isOpen, onClose, onSuccess }) {
  const [step, setStep] = useState('upload'); // 'upload' | 'mapping' | 'importing' | 'completed'
  const [fileName, setFileName] = useState('');
  const [fileHeaders, setFileHeaders] = useState([]);
  const [rawRows, setRawRows] = useState([]);
  const [fieldMapping, setFieldMapping] = useState({});
  const [importMode, setImportMode] = useState('update-existing'); // 'update-existing' | 'add-only' | 'replace-all'
  const [errorMsg, setErrorMsg] = useState('');
  const [showAbarrotesHelp, setShowAbarrotesHelp] = useState(false);
  const [importResults, setImportResults] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleReset = () => {
    setStep('upload');
    setFileName('');
    setFileHeaders([]);
    setRawRows([]);
    setFieldMapping({});
    setImportMode('update-existing');
    setErrorMsg('');
    setImportResults(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processFile(file);
  };

  const processFile = (file) => {
    setErrorMsg('');
    setFileName(file.name);

    const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');
    const isCsv = file.name.endsWith('.csv') || file.name.endsWith('.txt');

    if (!isExcel && !isCsv) {
      setErrorMsg('Formato de archivo no soportado. Por favor selecciona un archivo .xlsx, .xls o .csv.');
      return;
    }

    const reader = new FileReader();

    if (isExcel) {
      reader.onload = (evt) => {
        try {
          const data = new Uint8Array(evt.target.result);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheet = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheet];
          const sheetData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

          if (!sheetData || sheetData.length < 2) {
            setErrorMsg('El archivo parece estar vacío o no contiene filas de datos.');
            return;
          }

          processParsedTable(sheetData);
        } catch (err) {
          setErrorMsg('Error al procesar el archivo Excel: ' + err.message);
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV reading with delimiter detection
      reader.onload = (evt) => {
        try {
          const text = evt.target.result;
          const rows = parseCSVText(text);
          if (!rows || rows.length < 2) {
            setErrorMsg('El archivo CSV no contiene suficientes filas.');
            return;
          }
          processParsedTable(rows);
        } catch (err) {
          setErrorMsg('Error al procesar el archivo CSV: ' + err.message);
        }
      };
      reader.readAsText(file, 'ISO-8859-1'); // Common encoding for Windows software like Abarrotes
    }
  };

  // CSV text parser handling delimiters and quoted strings
  const parseCSVText = (text) => {
    const lines = text.split(/\r\n|\n|\r/).filter((l) => l.trim().length > 0);
    if (lines.length === 0) return [];

    // Auto-detect delimiter from header line
    const firstLine = lines[0];
    const commas = (firstLine.match(/,/g) || []).length;
    const semicolons = (firstLine.match(/;/g) || []).length;
    const tabs = (firstLine.match(/\t/g) || []).length;

    let delimiter = ',';
    if (semicolons > commas && semicolons > tabs) delimiter = ';';
    else if (tabs > commas && tabs > semicolons) delimiter = '\t';

    const parseLine = (line) => {
      const result = [];
      let current = '';
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"' || char === "'") {
          inQuotes = !inQuotes;
        } else if (char === delimiter && !inQuotes) {
          result.push(current.trim().replace(/^["']|["']$/g, ''));
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      return result;
    };

    return lines.map(parseLine);
  };

  const processParsedTable = (rows) => {
    const headers = rows[0].map((h, idx) => (h !== undefined && h !== null ? String(h).trim() : `Columna ${idx + 1}`));
    const dataRows = rows.slice(1).filter((r) => r.some((c) => c !== '' && c !== null && c !== undefined));

    setFileHeaders(headers);
    setRawRows(dataRows);

    // Auto-map headers with intelligent priority matching
    const initialMapping = {};

    headers.forEach((h, idx) => {
      const clean = h.toLowerCase().trim();

      // Barcode / Código
      if (initialMapping.barcode === undefined) {
        if (clean === 'codigo' || clean === 'código' || clean === 'barcode' || clean === 'clave' || clean === 'cod' || clean.includes('codigo') || clean.includes('código')) {
          initialMapping.barcode = idx;
        }
      }

      // Name / Descripción
      if (initialMapping.name === undefined) {
        if (clean.includes('descripcion') || clean.includes('descripción') || clean.includes('nombre') || clean.includes('producto') || clean.includes('articulo') || clean.includes('artículo')) {
          initialMapping.name = idx;
        }
      }

      // Cost Price (must contain costo / compra)
      if (initialMapping.costPrice === undefined) {
        if (clean.includes('costo') || clean.includes('compra')) {
          initialMapping.costPrice = idx;
        }
      }

      // Sale Price (must contain venta / pvp, and NOT costo / mayoreo)
      if (initialMapping.salePrice === undefined) {
        if ((clean.includes('venta') || clean === 'precio' || clean === 'pvp') && !clean.includes('costo') && !clean.includes('mayoreo')) {
          initialMapping.salePrice = idx;
        }
      }

      // Wholesale Price
      if (initialMapping.wholesalePrice === undefined) {
        if (clean.includes('mayoreo') || clean.includes('mayorista')) {
          initialMapping.wholesalePrice = idx;
        }
      }

      // Stock / Existencia (must NOT be minStock / minimo)
      if (initialMapping.stock === undefined) {
        if ((clean.includes('existencia') || clean === 'stock' || clean === 'cantidad' || clean === 'inventario') && !clean.includes('min')) {
          initialMapping.stock = idx;
        }
      }

      // Min Stock
      if (initialMapping.minStock === undefined) {
        if (clean.includes('minimo') || clean.includes('mínimo') || clean.includes('min')) {
          initialMapping.minStock = idx;
        }
      }

      // Category / Departamento
      if (initialMapping.category === undefined) {
        if (clean.includes('departamento') || clean.includes('categoria') || clean.includes('categoría') || clean.includes('rubro') || clean.includes('depto') || clean.includes('familia')) {
          initialMapping.category = idx;
        }
      }

      // Unit
      if (initialMapping.unit === undefined) {
        if (clean.includes('unidad') || clean.includes('u.m.') || clean.includes('medida')) {
          initialMapping.unit = idx;
        }
      }
    });

    setFieldMapping(initialMapping);
    setStep('mapping');
  };

  const handleExecuteImport = () => {
    // Validate required fields
    if (fieldMapping.name === undefined || fieldMapping.name === '') {
      setErrorMsg('Debes asignar la columna correspondiente a "Nombre / Descripción" para poder importar.');
      return;
    }

    setStep('importing');

    setTimeout(() => {
      try {
        const productsToImport = rawRows.map((row) => {
          const getValue = (fieldKey) => {
            const colIndex = fieldMapping[fieldKey];
            if (colIndex === undefined || colIndex === '' || colIndex < 0) return undefined;
            return row[colIndex];
          };

          const parseMoney = (val) => {
            if (val === undefined || val === null || val === '') return 0;
            const clean = String(val).replace(/[$€\s]/g, '').replace(/,/g, '.');
            const num = parseFloat(clean);
            return isNaN(num) ? 0 : num;
          };

          const parseNumber = (val, defaultVal = 0) => {
            if (val === undefined || val === null || val === '') return defaultVal;
            const clean = String(val).replace(/[^\d.-]/g, '');
            const num = parseFloat(clean);
            return isNaN(num) ? defaultVal : num;
          };

          const rawBarcode = getValue('barcode');
          const cleanBarcode = rawBarcode !== undefined && rawBarcode !== null ? String(rawBarcode).trim() : '';
          const rawName = String(getValue('name') || '').trim();

          // Intelligent fallback: if description column was blank in Abarrotes, use the text in barcode
          const finalName = rawName || cleanBarcode || 'Producto sin nombre';

          return {
            barcode: cleanBarcode,
            name: finalName,
            salePrice: parseMoney(getValue('salePrice')),
            costPrice: parseMoney(getValue('costPrice')),
            wholesalePrice: parseMoney(getValue('wholesalePrice')),
            stock: parseNumber(getValue('stock'), 0),
            minStock: parseNumber(getValue('minStock'), 5),
            category: getValue('category') ? String(getValue('category')).trim() : 'general',
            unit: getValue('unit') ? String(getValue('unit')).trim() : 'Unidad',
            trackStock: true
          };
        }).filter((p) => p.name.length > 0);

        const result = importProductsBulk(productsToImport, importMode);

        setImportResults(result);
        setStep('completed');
        onSuccess?.();
      } catch (err) {
        setErrorMsg('Error durante la importación: ' + err.message);
        setStep('mapping');
      }
    }, 150);
  };

  return (
    <ModalBackdrop onClose={onClose}>
      <div 
        className="modal-card" 
        onClick={(e) => e.stopPropagation()} 
        style={{ maxWidth: '820px', width: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}
      >
        {/* Header */}
        <div className="modal-header" style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(37,99,235,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', margin: 0 }}>
                Importar Productos desde Excel / Abarrotes PDV
              </h3>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '0.15rem 0 0 0' }}>
                Migración masiva de catálogo, precios, stock y códigos de barra
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {errorMsg && (
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 'var(--radius-md)', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem' }}>
              <AlertCircle size={18} />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Upload */}
          {step === 'upload' && (
            <div>
              <div 
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                style={{
                  border: '2px dashed var(--primary)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2.5rem 1.5rem',
                  textAlign: 'center',
                  backgroundColor: 'var(--bg-hover)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <div style={{ width: '56px', height: '56px', borderRadius: '50%', backgroundColor: 'var(--bg-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)', boxShadow: 'var(--card-shadow)' }}>
                  <Upload size={28} />
                </div>
                <div>
                  <strong style={{ fontSize: '1.05rem', color: 'var(--text-main)', display: 'block' }}>
                    Haz clic aquí o arrastra tu archivo
                  </strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Formatos soportados: Excel (<strong>.xlsx</strong>, <strong>.xls</strong>) o <strong>.csv</strong>
                  </span>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept=".xlsx,.xls,.csv,.txt" 
                  style={{ display: 'none' }} 
                />
              </div>

              {/* Guía para Abarrotes Punto de Venta */}
              <div style={{ marginTop: '1.25rem', padding: '1rem', backgroundColor: 'var(--bg-surface)', border: '1px solid var(--card-border)', borderRadius: 'var(--radius-md)' }}>
                <div 
                  onClick={() => setShowAbarrotesHelp(!showAbarrotesHelp)}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', userSelect: 'none' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-main)', fontWeight: 600, fontSize: '0.9rem' }}>
                    <HelpCircle size={17} color="var(--primary)" />
                    <span>¿Cómo sacar tus productos de "Abarrotes Punto de Venta" (Bambú Code)?</span>
                  </div>
                  <span style={{ fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                    {showAbarrotesHelp ? 'Ocultar' : 'Ver instrucciones'}
                  </span>
                </div>

                {showAbarrotesHelp && (
                  <div style={{ marginTop: '0.75rem', fontSize: '0.825rem', color: 'var(--text-secondary)', lineHeight: 1.6, borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                    <ol style={{ paddingLeft: '1.25rem', margin: 0 }}>
                      <li>Abre tu programa <strong>Abarrotes Punto de Venta</strong> en tu computadora.</li>
                      <li>Haz clic en el botón superior <strong>PRODUCTOS (F3)</strong>.</li>
                      <li>En el menú de la izquierda, selecciona <strong>Catálogo</strong> o <strong>Reportes de Productos</strong>.</li>
                      <li>Haz clic en el botón <strong>Exportar a Excel</strong> o <strong>Guardar en Excel / CSV</strong>.</li>
                      <li>Guarda el archivo en tu Escritorio o carpeta de Documentos.</li>
                      <li>¡Vuelve aquí y selecciónalo! El sistema detectará automáticamente los códigos de barra, precios y existencias.</li>
                    </ol>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: Mapping & Preview */}
          {step === 'mapping' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <strong style={{ fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FileText size={16} color="var(--primary)" /> Archivo: {fileName}
                  </strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Se detectaron <strong>{rawRows.length}</strong> productos listos para importar
                  </span>
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleReset}
                  style={{ fontSize: '0.8rem', padding: '0.35rem 0.75rem' }}
                >
                  <RefreshCw size={14} /> Cambiar archivo
                </button>
              </div>

              {/* Mode Selection */}
              <div style={{ marginBottom: '1.5rem', backgroundColor: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'block', marginBottom: '0.5rem' }}>
                  Modo de Importación:
                </label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="update-existing" 
                      checked={importMode === 'update-existing'} 
                      onChange={(e) => setImportMode(e.target.value)} 
                    />
                    <span>
                      <strong>Actualizar existentes y agregar nuevos (Recomendado):</strong> Si el código de barras ya existe, actualiza sus precios y stock. Si no existe, lo agrega.
                    </span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--text-main)', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="add-only" 
                      checked={importMode === 'add-only'} 
                      onChange={(e) => setImportMode(e.target.value)} 
                    />
                    <span>
                      <strong>Solo agregar nuevos:</strong> Si un producto ya tiene el mismo código de barras en el sistema, lo ignora para no sobreescribirlo.
                    </span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem', color: 'var(--danger)', cursor: 'pointer' }}>
                    <input 
                      type="radio" 
                      name="importMode" 
                      value="replace-all" 
                      checked={importMode === 'replace-all'} 
                      onChange={(e) => setImportMode(e.target.value)} 
                    />
                    <span>
                      <strong>Reemplazar catálogo completo:</strong> Borra los productos actuales y carga únicamente los de este archivo (ideal para migración inicial limpia).
                    </span>
                  </label>
                </div>
              </div>

              {/* Column Mapping Grid */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Layers size={16} /> Mapeo de Columnas (¿Qué columna corresponde a cada dato?)
              </h4>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
                {SYSTEM_FIELDS.map((field) => (
                  <div key={field.key} style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                    <label style={{ fontSize: '0.775rem', fontWeight: 600, color: field.required ? 'var(--primary)' : 'var(--text-secondary)' }}>
                      {field.label} {field.required && <span style={{ color: 'var(--danger)' }}>*</span>}
                    </label>
                    <select
                      className="form-input"
                      style={{ fontSize: '0.825rem', padding: '0.4rem 0.6rem' }}
                      value={fieldMapping[field.key] !== undefined ? fieldMapping[field.key] : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFieldMapping((prev) => ({
                          ...prev,
                          [field.key]: val === '' ? undefined : parseInt(val, 10)
                        }));
                      }}
                    >
                      <option value="">-- No asignar / Omitir --</option>
                      {fileHeaders.map((h, idx) => (
                        <option key={idx} value={idx}>
                          Columna {idx + 1}: {h}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>

              {/* Preview Table */}
              <h4 style={{ fontSize: '0.95rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Package size={16} /> Vista Previa de los Primeros 5 Productos a Importar
              </h4>
              <div style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', marginBottom: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--bg-hover)', borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Código</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Nombre / Descripción</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Precio Venta</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Costo</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Stock</th>
                      <th style={{ padding: '0.5rem 0.75rem' }}>Categoría</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawRows.slice(0, 5).map((row, rIdx) => {
                      const getVal = (key) => {
                        const idx = fieldMapping[key];
                        return idx !== undefined && idx >= 0 ? row[idx] : '-';
                      };
                      return (
                        <tr key={rIdx} style={{ borderBottom: '1px solid var(--border)' }}>
                          <td style={{ padding: '0.5rem 0.75rem', fontFamily: 'var(--font-mono)' }}>{getVal('barcode') || '(Auto)'}</td>
                          <td style={{ padding: '0.5rem 0.75rem', fontWeight: 600 }}>{getVal('name')}</td>
                          <td style={{ padding: '0.5rem 0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                            {getVal('salePrice') !== '-' ? `$${getVal('salePrice')}` : '-'}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>
                            {getVal('costPrice') !== '-' ? `$${getVal('costPrice')}` : '-'}
                          </td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>{getVal('stock')}</td>
                          <td style={{ padding: '0.5rem 0.75rem' }}>{getVal('category')}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* STEP 3: Importing in progress */}
          {step === 'importing' && (
            <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
              <RefreshCw size={40} className="spin" style={{ color: 'var(--primary)', margin: '0 auto 1rem auto' }} />
              <h4 style={{ fontSize: '1.15rem', color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
                Importando catálogo de productos...
              </h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Procesando y respaldando base de datos localmente.
              </p>
            </div>
          )}

          {/* STEP 4: Completed */}
          {step === 'completed' && importResults && (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '50%', backgroundColor: 'rgba(22, 163, 74, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', margin: '0 auto 1.25rem auto' }}>
                <CheckCircle size={36} />
              </div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: '0 0 0.5rem 0' }}>
                ¡Importación Exitosa!
              </h3>
              <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1.75rem' }}>
                El catálogo fue actualizado correctamente en la base de datos del sistema.
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', maxWidth: '500px', margin: '0 auto 2rem auto' }}>
                <div style={{ backgroundColor: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                    Nuevos Agregados
                  </span>
                  <strong style={{ fontSize: '1.6rem', color: '#16a34a', fontFamily: 'var(--font-mono)' }}>
                    +{importResults.addedCount}
                  </strong>
                </div>

                <div style={{ backgroundColor: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                    Actualizados
                  </span>
                  <strong style={{ fontSize: '1.6rem', color: 'var(--primary)', fontFamily: 'var(--font-mono)' }}>
                    {importResults.updatedCount}
                  </strong>
                </div>

                <div style={{ backgroundColor: 'var(--bg-hover)', padding: '1rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', fontWeight: 700 }}>
                    Omitidos / Sin cambio
                  </span>
                  <strong style={{ fontSize: '1.6rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {importResults.skippedCount}
                  </strong>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer" style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
          {step === 'upload' && (
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancelar
            </button>
          )}

          {step === 'mapping' && (
            <>
              <button type="button" className="btn btn-secondary" onClick={handleReset}>
                Atrás
              </button>
              <button 
                type="button" 
                className="btn btn-primary" 
                onClick={handleExecuteImport}
                style={{ padding: '0.6rem 1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <span>Confirmar e Importar ({rawRows.length})</span>
                <ArrowRight size={17} />
              </button>
            </>
          )}

          {step === 'completed' && (
            <button type="button" className="btn btn-primary" onClick={onClose} style={{ padding: '0.6rem 2rem' }}>
              Finalizar y Ver Productos
            </button>
          )}
        </div>
      </div>
    </ModalBackdrop>
  );
}
