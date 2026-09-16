import React, { useState, useRef, useEffect } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  Barcode, 
  FileText, 
  LayoutGrid, 
  CreditCard, 
  Banknote, 
  QrCode, 
  UserCheck, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Truck, 
  ChevronDown,
  X,
  Package
} from 'lucide-react';
import CheckoutModal from './CheckoutModal';
import TicketModal from './TicketModal';

export default function POSView({ 
  products, 
  onRecordSale, 
  config, 
  sales,
  onNavigateTab,
  onAddCashMovement,
  onOpenDaySales
}) {
  const [cart, setCart] = useState([]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('efectivo');
  const [selectedCartIndex, setSelectedCartIndex] = useState(-1);
  const [isWholesale, setIsWholesale] = useState(false);

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [isSearchCatalogOpen, setIsSearchCatalogOpen] = useState(false);
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [cashMovementType, setCashMovementType] = useState('salida');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');

  const barcodeInputRef = useRef(null);

  // Focus barcode input on mount
  useEffect(() => {
    barcodeInputRef.current?.focus();
  }, []);

  // Global Keyboard Shortcuts (F1, F2, F3, F4, F5, F7, F8, F10, F11, F12, Delete)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F1') {
        e.preventDefault();
        onNavigateTab?.('pos');
      } else if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
        barcodeInputRef.current?.select();
      } else if (e.key === 'F3' || e.key === 'F4') {
        e.preventDefault();
        onNavigateTab?.('inventory');
      } else if (e.key === 'F5') {
        e.preventDefault();
        onNavigateTab?.('clients');
      } else if (e.key === 'F7') {
        e.preventDefault();
        setCashMovementType('ingreso');
        setIsCashMovementModalOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        setCashMovementType('salida');
        setIsCashMovementModalOpen(true);
      } else if (e.key === 'F10') {
        e.preventDefault();
        setIsSearchCatalogOpen(true);
      } else if (e.key === 'F11') {
        e.preventDefault();
        setIsWholesale((prev) => !prev);
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsCheckoutOpen(true);
        }
      } else if (e.key === 'Delete') {
        if (cart.length > 0) {
          e.preventDefault();
          handleRemoveLastOrSelected();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, onNavigateTab]);

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  // Add Product to Cart
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((item) => item.product.id === product.id);
      const unitPrice = isWholesale ? Math.round(product.salePrice * 0.9) : product.salePrice;

      if (existingIndex !== -1) {
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += 1;
        newCart[existingIndex].subtotal = newCart[existingIndex].quantity * newCart[existingIndex].unitPrice;
        setSelectedCartIndex(existingIndex);
        return newCart;
      } else {
        const newItem = {
          product,
          quantity: 1,
          unitPrice,
          costPrice: product.costPrice,
          subtotal: unitPrice
        };
        setSelectedCartIndex(prevCart.length);
        return [...prevCart, newItem];
      }
    });
  };

  // Update Cart Quantity
  const updateQuantity = (index, delta) => {
    setCart((prevCart) => {
      const newCart = [...prevCart];
      const target = newCart[index];
      if (!target) return prevCart;

      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        newCart.splice(index, 1);
        setSelectedCartIndex(-1);
      } else {
        target.quantity = newQty;
        target.subtotal = newQty * target.unitPrice;
      }
      return newCart;
    });
  };

  // Delete specific item or last item
  const handleRemoveLastOrSelected = () => {
    if (cart.length === 0) return;
    setCart((prevCart) => {
      const newCart = [...prevCart];
      if (selectedCartIndex >= 0 && selectedCartIndex < newCart.length) {
        newCart.splice(selectedCartIndex, 1);
      } else {
        newCart.pop();
      }
      return newCart;
    });
    setSelectedCartIndex(-1);
  };

  // Barcode / Name Input Handler (Enter key)
  const handleBarcodeSubmit = (e) => {
    if (e.key === 'Enter' && barcodeInput.trim()) {
      e.preventDefault();
      const query = barcodeInput.trim().toLowerCase();

      // Exact barcode match
      const exactMatch = products.find(
        (p) => p.barcode.toLowerCase() === query
      );

      if (exactMatch) {
        addToCart(exactMatch);
        setBarcodeInput('');
        return;
      }

      // Partial name match
      const partialMatches = products.filter(
        (p) => p.name.toLowerCase().includes(query) || p.barcode.toLowerCase().includes(query)
      );

      if (partialMatches.length === 1) {
        addToCart(partialMatches[0]);
        setBarcodeInput('');
      } else if (partialMatches.length > 1) {
        setIsSearchCatalogOpen(true);
      } else {
        alert(`No se encontró ningún producto con el código o nombre: "${barcodeInput}"`);
      }
    }
  };

  // Calculations
  const distinctProductsCount = cart.length;
  const totalItemsCount = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalAmount = cart.reduce((acc, item) => acc + item.subtotal, 0);
  const totalCost = cart.reduce((acc, item) => acc + item.costPrice * item.quantity, 0);

  // Handle Cash Movement (Entradas F7 / Salidas F8)
  const handleSaveCashMovement = (e) => {
    e.preventDefault();
    const numAmount = Number(movementAmount);
    if (!numAmount || numAmount <= 0) return;

    onAddCashMovement?.(cashMovementType, numAmount, movementReason.trim() || (cashMovementType === 'ingreso' ? 'Ingreso F7' : 'Salida F8'));
    setIsCashMovementModalOpen(false);
    setMovementAmount('');
    setMovementReason('');
  };

  // Complete Sale
  const handleSaleComplete = (saleDetails) => {
    const salePayload = {
      items: cart,
      total: totalAmount,
      totalCost,
      paymentMethod: selectedPaymentMethod,
      ...saleDetails
    };

    const recorded = onRecordSale(salePayload);
    setIsCheckoutOpen(false);
    setCart([]);
    setSelectedCartIndex(-1);
    setCompletedSale(recorded);
    setIsTicketOpen(true);
    barcodeInputRef.current?.focus();
  };

  const nextTicketNumber = (sales?.length || 0) + 1;

  return (
    <div className="pos-workspace">
      {/* LEFT COLUMN: Main Sales Workspace */}
      <div className="pos-main-card">
        {/* Card Header: Venta de Productos | Ticket #N | + Agregar Producto */}
        <div className="pos-card-header">
          <div className="pos-header-left">
            <div className="pos-header-icon-box">
              <ShoppingCart size={20} />
            </div>
            <div className="pos-title-wrap">
              <h2>Venta de Productos</h2>
              <span className="pos-ticket-badge">Ticket #{nextTicketNumber}</span>
            </div>
          </div>

          <button 
            className="btn-add-product"
            onClick={() => setIsSearchCatalogOpen(true)}
            title="Abrir catálogo para agregar productos (F2)"
          >
            <Plus size={16} />
            <span>Agregar Producto (F2)</span>
          </button>
        </div>

        {/* Action Bar Row 1: Barcode Input & F1-F5 Navigation */}
        <div className="pos-action-bar-1">
          <div className="barcode-input-wrap">
            <Search size={16} color="#94a3b8" />
            <input
              ref={barcodeInputRef}
              type="text"
              className="barcode-input"
              placeholder="Código de barras o nombre del producto..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              onKeyDown={handleBarcodeSubmit}
            />
          </div>

          <button className="btn-shortcut-tab" onClick={() => onNavigateTab?.('pos')}>
            <span>⌨️ F1 - Ventas</span>
          </button>

          <button className="btn-shortcut-tab" onClick={() => onNavigateTab?.('inventory')}>
            <span>📦 F3 - Productos</span>
          </button>

          <button className="btn-shortcut-tab" onClick={() => onNavigateTab?.('clients')}>
            <span>👤 F5 - Clientes</span>
          </button>

          <button className="btn-shortcut-tab" onClick={() => onNavigateTab?.('reports')}>
            <span>Más</span>
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Action Bar Row 2: Pastel Pill Buttons (F10 Buscar, F11 Mayoreo, F7 Entradas, F8 Salidas, DEL) */}
        <div className="pos-action-bar-2">
          <button 
            className="btn-pill-pastel btn-pastel-purple"
            onClick={() => setIsSearchCatalogOpen(true)}
            title="Buscar en catálogo [F10]"
          >
            <Search size={14} />
            <span>F10 - Buscar</span>
          </button>

          <button 
            className="btn-pill-pastel btn-pastel-blue"
            onClick={() => setIsWholesale((prev) => !prev)}
            title="Activar precio mayoreo (-10%) [F11]"
            style={{ 
              backgroundColor: isWholesale ? '#2563eb' : undefined,
              color: isWholesale ? '#ffffff' : undefined 
            }}
          >
            <Truck size={14} />
            <span>F11 - Mayoreo {isWholesale && '✓'}</span>
          </button>

          <button 
            className="btn-pill-pastel btn-pastel-green"
            onClick={() => {
              setCashMovementType('ingreso');
              setIsCashMovementModalOpen(true);
            }}
            title="Registrar ingreso de dinero a la caja [F7]"
          >
            <ArrowUpCircle size={14} />
            <span>F7 - Entradas</span>
          </button>

          <button 
            className="btn-pill-pastel btn-pastel-yellow"
            onClick={() => {
              setCashMovementType('salida');
              setIsCashMovementModalOpen(true);
            }}
            title="Registrar salida o gasto de caja [F8]"
          >
            <ArrowDownCircle size={14} />
            <span>F8 - Salidas</span>
          </button>

          <button 
            className="btn-pill-pastel btn-pastel-red"
            onClick={handleRemoveLastOrSelected}
            disabled={cart.length === 0}
            title="Eliminar artículo del ticket [Supr / Del]"
            style={{ opacity: cart.length > 0 ? 1 : 0.5 }}
          >
            <Trash2 size={14} />
            <span>DEL - Borrar Art.</span>
          </button>
        </div>

        {/* Ticket Table */}
        <div className="pos-table-wrap">
          <table className="mockup-table">
            <thead>
              <tr>
                <th style={{ width: '160px' }}>Código de Barras</th>
                <th>Descripción del Producto</th>
                <th style={{ textAlign: 'right', width: '130px' }}>Precio Venta</th>
                <th style={{ textAlign: 'center', width: '120px' }}>Cant.</th>
                <th style={{ textAlign: 'right', width: '130px' }}>Importe</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Existencia</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, index) => {
                const isSelected = selectedCartIndex === index;
                const remainingStock = Math.max(0, (item.product.stock || 0) - item.quantity);

                return (
                  <tr 
                    key={item.product.id}
                    onClick={() => setSelectedCartIndex(index)}
                    style={{ 
                      backgroundColor: isSelected ? '#eff6ff' : undefined,
                      cursor: 'pointer'
                    }}
                  >
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: '#64748b' }}>
                      {item.product.barcode}
                    </td>
                    <td>
                      <strong style={{ color: '#0f172a' }}>{item.product.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: '#94a3b8', display: 'block' }}>
                        {item.product.category}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                      {formatCurrency(item.unitPrice)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '4px', padding: '2px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateQuantity(index, -1); }}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ minWidth: '22px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateQuantity(index, 1); }}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#64748b' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16a34a', fontSize: '0.95rem' }}>
                      {formatCurrency(item.subtotal)}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: remainingStock <= 5 ? '#eab308' : '#64748b' }}>
                      {remainingStock} un.
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Empty Ticket Placeholder */}
          {cart.length === 0 && (
            <div className="empty-ticket-placeholder">
              <div className="empty-ticket-icon">
                <FileText size={28} />
              </div>
              <div className="empty-ticket-title">No hay productos en el ticket</div>
              <div className="empty-ticket-subtitle">
                Buscá un producto o escaneá el código de barras para comenzar.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Resumen de Venta, Método de Pago, Botón F12 - Cobrar */}
      <div className="pos-right-column">
        {/* Card 1: Resumen de Venta */}
        <div className="summary-card">
          <div className="summary-card-header">
            <LayoutGrid size={18} color="#2563eb" />
            <span>Resumen de Venta</span>
          </div>

          <div className="summary-stat-row">
            <div className="summary-stat-label">
              <ShoppingCart size={15} />
              <span>Productos</span>
            </div>
            <span className="summary-stat-val">{distinctProductsCount}</span>
          </div>

          <div className="summary-stat-row">
            <div className="summary-stat-label">
              <Package size={15} />
              <span>Total de items</span>
            </div>
            <span className="summary-stat-val">{totalItemsCount}</span>
          </div>

          <div className="summary-divider"></div>

          <div className="summary-total-row">
            <div className="summary-total-label">
              <span style={{ fontSize: '1.2rem', color: '#16a34a' }}>$</span>
              <span>Importe total</span>
            </div>
            <span className="summary-total-amount">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Card 2: Método de pago (2x2 Grid) */}
        <div className="payment-card">
          <div className="payment-card-header">
            <CreditCard size={17} color="#2563eb" />
            <span>Método de pago</span>
          </div>

          <div className="payment-methods-2x2">
            <div 
              className={`pm-tile ${selectedPaymentMethod === 'efectivo' ? 'active-cash' : ''}`}
              onClick={() => setSelectedPaymentMethod('efectivo')}
            >
              <Banknote size={16} color="#16a34a" />
              <span>Efectivo</span>
            </div>

            <div 
              className={`pm-tile ${selectedPaymentMethod === 'tarjeta' ? 'active-card' : ''}`}
              onClick={() => setSelectedPaymentMethod('tarjeta')}
            >
              <CreditCard size={16} color="#2563eb" />
              <span>Tarjeta</span>
            </div>

            <div 
              className={`pm-tile ${selectedPaymentMethod === 'transferencia' ? 'active-transfer' : ''}`}
              onClick={() => setSelectedPaymentMethod('transferencia')}
            >
              <QrCode size={16} color="#9333ea" />
              <span>Transferencia</span>
            </div>

            <div 
              className={`pm-tile ${selectedPaymentMethod === 'fiado' ? 'active-credit' : ''}`}
              onClick={() => setSelectedPaymentMethod('fiado')}
            >
              <UserCheck size={16} color="#ca8a04" />
              <span>Cuenta Corriente</span>
            </div>
          </div>
        </div>

        {/* Big Action Button: F12 - Cobrar */}
        <button 
          className="btn-f12-cobrar"
          disabled={cart.length === 0}
          onClick={() => setIsCheckoutOpen(true)}
        >
          <CreditCard size={20} />
          <span>F12 - Cobrar</span>
        </button>
      </div>

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        total={totalAmount}
        initialPaymentMethod={selectedPaymentMethod}
        onConfirmSale={handleSaleComplete}
        storeConfig={config}
      />

      {/* Printable Ticket Receipt Modal */}
      <TicketModal
        isOpen={isTicketOpen}
        onClose={() => setIsTicketOpen(false)}
        sale={completedSale}
        config={config}
      />

      {/* Cash Movement (Entradas F7 / Salidas F8) Modal */}
      {isCashMovementModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsCashMovementModalOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                {cashMovementType === 'ingreso' ? (
                  <ArrowUpCircle size={20} color="#16a34a" />
                ) : (
                  <ArrowDownCircle size={20} color="#ca8a04" />
                )}
                <h3 style={{ margin: 0, fontSize: '1.1rem' }}>
                  {cashMovementType === 'ingreso' ? 'Registrar Entrada de Dinero (F7)' : 'Registrar Salida de Dinero (F8)'}
                </h3>
              </div>
              <button 
                onClick={() => setIsCashMovementModalOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCashMovement}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Monto ($) *</label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Ej: 3500"
                    value={movementAmount}
                    onChange={(e) => setMovementAmount(e.target.value)}
                    autoFocus
                    required
                    style={{ fontSize: '1.25rem', fontFamily: 'var(--font-mono)', fontWeight: 700 }}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Motivo / Proveedor / Descripción *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder={cashMovementType === 'ingreso' ? 'Ej: Reposición de cambio, caja chica' : 'Ej: Pago al repartidor de pan, hielo, soda, etc.'}
                    value={movementReason}
                    onChange={(e) => setMovementReason(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setIsCashMovementModalOpen(false)}>
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className={`btn ${cashMovementType === 'ingreso' ? 'btn-success' : 'btn-primary'}`}
                >
                  <span>Guardar Movimiento</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Catalog Search & Add Modal (F10 / F2) */}
      {isSearchCatalogOpen && (
        <div className="modal-backdrop" onClick={() => setIsSearchCatalogOpen(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px' }}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Search size={18} color="#2563eb" />
                <h3 style={{ margin: 0, fontSize: '1.15rem' }}>Buscar y Agregar Producto (F10 / F2)</h3>
              </div>
              <button 
                onClick={() => setIsSearchCatalogOpen(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Escribir nombre, marca o código de barra..."
                  defaultValue={barcodeInput}
                  onChange={(e) => setBarcodeInput(e.target.value)}
                  autoFocus
                />
              </div>

              <div style={{ maxHeight: '350px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {products
                  .filter((p) => {
                    const q = barcodeInput.toLowerCase().trim();
                    return !q || p.name.toLowerCase().includes(q) || p.barcode.toLowerCase().includes(q) || p.category.toLowerCase().includes(q);
                  })
                  .map((prod) => (
                    <div
                      key={prod.id}
                      onClick={() => {
                        addToCart(prod);
                        setIsSearchCatalogOpen(false);
                        setBarcodeInput('');
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 0.85rem',
                        border: '1px solid #e2e8f0',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        transition: 'background-color 0.15s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#eff6ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#ffffff'}
                    >
                      <div>
                        <strong style={{ fontSize: '0.9rem', color: '#0f172a' }}>{prod.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          Código: {prod.barcode} | Cat: {prod.category} | Stock: {prod.stock} {prod.unit || 'un.'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#16a34a', fontSize: '1rem' }}>
                          {formatCurrency(prod.salePrice)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsSearchCatalogOpen(false)}>
                Cerrar (Esc)
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
