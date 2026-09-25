import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search, 
  FileText, 
  LayoutGrid, 
  CreditCard, 
  Banknote, 
  QrCode, 
  UserCheck, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Truck, 
  X,
  Package,
  CheckCircle,
  AlertTriangle,
  Printer
} from 'lucide-react';
import CheckoutModal from './CheckoutModal';
import TicketModal from './TicketModal';
import ModalBackdrop from '../Common/ModalBackdrop';
import CatalogSearchModal from './CatalogSearchModal';
import { getNextDailyTicketNumber } from '../../data/storage';

export default function POSView({ 
  isActive = true,
  products, 
  categories = [],
  onRecordSale, 
  config, 
  sales, 
  clients = [],
  onNavigateTab,
  onAddCashMovement,
  cart: externalCart,
  setCart: externalSetCart,
  selectedCartIndex: externalSelectedCartIndex,
  setSelectedCartIndex: externalSetSelectedCartIndex,
}) {
  const [internalCart, setInternalCart] = useState([]);
  const cart = externalCart !== undefined ? externalCart : internalCart;
  const setCart = externalSetCart !== undefined ? externalSetCart : setInternalCart;

  const [internalSelectedIndex, setInternalSelectedIndex] = useState(-1);
  const selectedCartIndex = externalSelectedCartIndex !== undefined ? externalSelectedCartIndex : internalSelectedIndex;
  const setSelectedCartIndex = externalSetSelectedCartIndex !== undefined ? externalSetSelectedCartIndex : setInternalSelectedIndex;

  const [barcodeInput, setBarcodeInput] = useState('');
  const [searchError, setSearchError] = useState('');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('efectivo');
  const [isWholesale, setIsWholesale] = useState(() => {
    return Array.isArray(cart) && cart.some((item) => Boolean(item.isWholesale));
  });
  const [catalogSearchQuery, setCatalogSearchQuery] = useState('');
  const [catalogHighlightIndex, setCatalogHighlightIndex] = useState(0);

  // Modals state
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isTicketOpen, setIsTicketOpen] = useState(false);
  const [completedSale, setCompletedSale] = useState(null);
  const [saleSuccessNotification, setSaleSuccessNotification] = useState(null);
  const [posAlert, setPosAlert] = useState(null);
  const [isSearchCatalogOpen, setIsSearchCatalogOpen] = useState(false);
  const [isCashMovementModalOpen, setIsCashMovementModalOpen] = useState(false);
  const [cashMovementType, setCashMovementType] = useState('salida');
  const [movementAmount, setMovementAmount] = useState('');
  const [movementReason, setMovementReason] = useState('');
  const [itemToDelete, setItemToDelete] = useState(null);

  const barcodeInputRef = useRef(null);

  // Keep isWholesale in sync when an active cart with wholesale items is restored
  useEffect(() => {
    if (Array.isArray(cart) && cart.length > 0 && cart.some((item) => item.isWholesale) && !isWholesale) {
      setIsWholesale(true);
    }
  }, [cart, isWholesale]);

  // Auto-focus barcode input when POS view becomes active, on mount, and after any modal closes
  useEffect(() => {
    if (isActive) {
      const isAnyModalOpen = isSearchCatalogOpen || isCheckoutOpen || isCashMovementModalOpen || isTicketOpen || Boolean(itemToDelete) || Boolean(document.querySelector('.modal-backdrop, .modal-card'));
      if (!isAnyModalOpen) {
        const focusInput = () => {
          if (!isActive) return;
          if (document.querySelector('.modal-backdrop, .modal-card')) return;
          if (barcodeInputRef.current && document.activeElement !== barcodeInputRef.current) {
            barcodeInputRef.current.focus();
          }
        };
        focusInput();
        const t1 = setTimeout(focusInput, 40);
        const t2 = setTimeout(focusInput, 160);
        return () => {
          clearTimeout(t1);
          clearTimeout(t2);
        };
      }
    }
  }, [isActive, isSearchCatalogOpen, isCheckoutOpen, isCashMovementModalOpen, isTicketOpen, itemToDelete]);

  // Refocus barcode input when window regains focus (e.g. returning to the app)
  useEffect(() => {
    const handleWindowFocus = () => {
      const isAnyModalOpen = isSearchCatalogOpen || isCheckoutOpen || isCashMovementModalOpen || isTicketOpen || Boolean(itemToDelete) || Boolean(document.querySelector('.modal-backdrop, .modal-card'));
      if (isActive && !isAnyModalOpen) {
        barcodeInputRef.current?.focus();
      }
    };
    window.addEventListener('focus', handleWindowFocus);
    return () => window.removeEventListener('focus', handleWindowFocus);
  }, [isActive, isSearchCatalogOpen, isCheckoutOpen, isCashMovementModalOpen, isTicketOpen, itemToDelete]);

  // Auto-dismiss sale success notification
  useEffect(() => {
    if (saleSuccessNotification) {
      const timer = setTimeout(() => {
        setSaleSuccessNotification(null);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [saleSuccessNotification]);

  // Auto-dismiss general POS alert (e.g. Mayoreo F11)
  useEffect(() => {
    if (posAlert) {
      const timer = setTimeout(() => {
        setPosAlert(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [posAlert]);

  // Delete specific item or last item (solicita confirmación)
  const handleRemoveLastOrSelected = useCallback(() => {
    setCart((prevCart) => {
      if (prevCart.length === 0) return prevCart;
      const targetIndex = (selectedCartIndex >= 0 && selectedCartIndex < prevCart.length)
        ? selectedCartIndex
        : prevCart.length - 1;
      const targetItem = prevCart[targetIndex];
      if (targetItem) {
        setItemToDelete({ index: targetIndex, item: targetItem });
      }
      return prevCart;
    });
  }, [selectedCartIndex, setCart]);

  // Confirmar eliminación del artículo
  const handleConfirmDeleteItem = useCallback(() => {
    if (!itemToDelete) return;
    const deleteIndex = itemToDelete.index;
    setCart((prevCart) => prevCart.filter((_, i) => i !== deleteIndex));
    setSelectedCartIndex(-1);
    setItemToDelete(null);
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  }, [itemToDelete, setCart, setSelectedCartIndex]);

  // Cancelar eliminación del artículo
  const handleCancelDeleteItem = useCallback(() => {
    setItemToDelete(null);
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  }, []);

  // Format Currency
  const formatCurrency = (val) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
      maximumFractionDigits: 2
    }).format(val || 0);
  };

  const getCategoryDisplayName = (catIdOrName) => {
    if (!catIdOrName) return 'General';
    const found = (categories || []).find(
      (c) => c.id === catIdOrName || (c.name && c.name.toLowerCase() === catIdOrName.toLowerCase())
    );
    if (found) return found.name;
    const clean = catIdOrName.replace(/[_-]\d+$/, '').replace(/[_-]/g, ' ');
    return clean.charAt(0).toUpperCase() + clean.slice(1);
  };

  // Add Product to Cart
  const addToCart = useCallback((product) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    const hasWholesale = (Number(product.wholesalePrice) || 0) > 0;
    const itemIsWholesale = isWholesale && hasWholesale;
    const unitPrice = itemIsWholesale ? Number(product.wholesalePrice) : product.salePrice;

    if (existingIndex !== -1) {
      setCart((prevCart) => {
        const newCart = [...prevCart];
        if (newCart[existingIndex]) {
          const currentItem = newCart[existingIndex];
          const updatedQty = currentItem.quantity + 1;
          const effectivePrice = itemIsWholesale ? unitPrice : currentItem.unitPrice;
          const effectiveIsWholesale = itemIsWholesale ? true : currentItem.isWholesale;
          newCart[existingIndex] = {
            ...currentItem,
            quantity: updatedQty,
            unitPrice: effectivePrice,
            subtotal: updatedQty * effectivePrice,
            isWholesale: effectiveIsWholesale
          };
        }
        return newCart;
      });
      setSelectedCartIndex(existingIndex);
      return existingIndex;
    } else {
      const newItem = {
        product,
        quantity: 1,
        unitPrice,
        costPrice: product.costPrice,
        subtotal: unitPrice,
        isWholesale: itemIsWholesale
      };
      const newIndex = cart.length;
      setCart((prevCart) => [...prevCart, newItem]);
      setSelectedCartIndex(newIndex);
      return newIndex;
    }
  }, [cart, isWholesale, setCart, setSelectedCartIndex]);

  // Helper to normalize strings (lowercase, remove accents)
  const normalizeText = useCallback((str) =>
    (str || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim(), []);

  // Execute Barcode Scan or Multi-Token Name Search
  const executeBarcodeOrSearch = useCallback((query) => {
    const raw = (query || '').trim();
    if (!raw) return;
    const queryNorm = normalizeText(raw);

    // 1. Exact barcode match
    const exactMatch = (products || []).find(
      (p) => normalizeText(p.barcode) === queryNorm
    );

    if (exactMatch) {
      addToCart(exactMatch);
      setBarcodeInput('');
      setSearchError('');
      setTimeout(() => barcodeInputRef.current?.focus(), 30);
      return;
    }

    // 2. Barcode prefix match
    const barcodePrefixMatches = (products || []).filter(
      (p) => normalizeText(p.barcode).startsWith(queryNorm)
    );
    if (barcodePrefixMatches.length === 1) {
      addToCart(barcodePrefixMatches[0]);
      setBarcodeInput('');
      setSearchError('');
      setTimeout(() => barcodeInputRef.current?.focus(), 30);
      return;
    }

    // 3. Multi-token search (all words in any order, e.g. "coca retornable 2l")
    const tokens = queryNorm.split(/\s+/).filter(Boolean);
    const matches = (products || []).filter((p) => {
      const haystack = normalizeText(`${p.name} ${p.barcode} ${p.category || ''}`);
      return tokens.every((token) => haystack.includes(token));
    });

    if (matches.length === 1) {
      addToCart(matches[0]);
      setBarcodeInput('');
      setSearchError('');
      setTimeout(() => barcodeInputRef.current?.focus(), 30);
    } else if (matches.length > 1) {
      setCatalogSearchQuery(raw);
      setIsSearchCatalogOpen(true);
      setSearchError('');
      setBarcodeInput('');
    } else {
      setSearchError(`No se encontró "${raw}". Presioná F10 para catálogo completo.`);
      setTimeout(() => {
        barcodeInputRef.current?.select();
        barcodeInputRef.current?.focus();
      }, 50);
    }
  }, [products, normalizeText, addToCart, setCatalogSearchQuery, setIsSearchCatalogOpen]);

  // Click on background workspace refocuses barcode input if not clicking buttons/inputs
  const handleWorkspaceClick = useCallback((e) => {
    if (e.target.closest('button, input, textarea, a, select, [role="button"], .modal-card, .client-modal-card')) {
      return;
    }
    const isModalOpen = isSearchCatalogOpen || isCheckoutOpen || isCashMovementModalOpen || isTicketOpen || Boolean(itemToDelete);
    if (!isModalOpen) {
      barcodeInputRef.current?.focus();
    }
  }, [isSearchCatalogOpen, isCheckoutOpen, isCashMovementModalOpen, isTicketOpen, itemToDelete]);

  // Wholesale (F11) Toggle Handler
  const handleToggleWholesale = useCallback(() => {
    if (cart.length === 0) {
      setIsWholesale((prev) => {
        const next = !prev;
        setPosAlert({
          type: 'info',
          message: next
            ? 'Modo Mayoreo activado para los próximos productos que agregues.'
            : 'Modo Mayoreo desactivado.'
        });
        return next;
      });
      return;
    }

    if (!isWholesale) {
      // Verificar si alguno de los productos en el ticket tiene mayoreo configurado
      const itemsWithWholesale = cart.filter((item) => (Number(item.product.wholesalePrice) || 0) > 0);

      if (itemsWithWholesale.length === 0) {
        setPosAlert({
          type: 'warning',
          message: 'Los productos actuales en el ticket no tienen precio de mayoreo configurado.'
        });
        return;
      }

      // Aplicar precio mayoreo a los que tienen
      setCart((prevCart) =>
        prevCart.map((item) => {
          const wholesale = Number(item.product.wholesalePrice) || 0;
          if (wholesale > 0) {
            return {
              ...item,
              unitPrice: wholesale,
              subtotal: item.quantity * wholesale,
              isWholesale: true
            };
          }
          return item;
        })
      );
      setIsWholesale(true);

      const count = itemsWithWholesale.length;
      setPosAlert({
        type: 'success',
        message: count === cart.length
          ? `¡Precio de mayoreo aplicado a los ${count} producto(s) del ticket! (F11)`
          : `¡Precio de mayoreo aplicado a ${count} producto(s)! Los demás conservan su precio normal.`
      });
    } else {
      // Desactivar y restablecer precio normal
      setCart((prevCart) =>
        prevCart.map((item) => ({
          ...item,
          unitPrice: item.product.salePrice,
          subtotal: item.quantity * item.product.salePrice,
          isWholesale: false
        }))
      );
      setIsWholesale(false);
      setPosAlert({
        type: 'info',
        message: 'Se restablecieron los precios de venta normales en el ticket.'
      });
    }
  }, [cart, isWholesale, setCart]);

  // Update Cart Quantity
  const updateQuantity = useCallback((index, delta) => {
    setCart((prevCart) => {
      const target = prevCart[index];
      if (!target) return prevCart;

      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        // Al intentar reducir la cantidad a 0, pedir confirmación antes de borrar
        setItemToDelete({ index, item: target });
        return prevCart;
      }

      const newCart = [...prevCart];
      newCart[index] = {
        ...target,
        quantity: newQty,
        subtotal: newQty * target.unitPrice
      };
      return newCart;
    });
  }, [setCart]);

  // Global Keyboard Shortcuts (F1-F5, F7, F8, F10, F11, F12, Delete, +, -, Arrows)
  useEffect(() => {
    const handleKeyDown = (e) => {
      // SI NO ESTAMOS EN LA PESTAÑA POS O SI HAY CUALQUIER MODAL/DIÁLOGO ABIERTO EN LA APP, NO INTERCEPTAR NADA
      if (!isActive) return;
      if (document.querySelector('.modal-backdrop, .modal-card')) return;
      if (e.defaultPrevented) return;

      // Si el cartel de confirmación de eliminación está abierto
      if (itemToDelete) {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleCancelDeleteItem();
          return;
        }
        if (e.key === 'Enter') {
          e.preventDefault();
          handleConfirmDeleteItem();
          return;
        }
        return;
      }

      if (saleSuccessNotification && (e.key === 'Escape' || e.key === 'Enter')) {
        e.preventDefault();
        setSaleSuccessNotification(null);
        return;
      }

      if (e.key === 'Escape') {
        if (isSearchCatalogOpen) {
          e.preventDefault();
          setIsSearchCatalogOpen(false);
          setCatalogSearchQuery('');
          setBarcodeInput('');
          setTimeout(() => barcodeInputRef.current?.focus(), 50);
          return;
        }
        if (isCheckoutOpen) {
          e.preventDefault();
          setIsCheckoutOpen(false);
          setTimeout(() => barcodeInputRef.current?.focus(), 50);
          return;
        }
        if (isCashMovementModalOpen) {
          e.preventDefault();
          setIsCashMovementModalOpen(false);
          setTimeout(() => barcodeInputRef.current?.focus(), 50);
          return;
        }
        if (isTicketOpen) {
          e.preventDefault();
          setIsTicketOpen(false);
          setTimeout(() => barcodeInputRef.current?.focus(), 50);
          return;
        }
      }

      const isModalOpen = isSearchCatalogOpen || isCheckoutOpen || isCashMovementModalOpen || isTicketOpen || Boolean(itemToDelete);
      const isInputFocused = document.activeElement &&
        (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT' || document.activeElement.isContentEditable);

      // Quick + / - and ArrowUp / ArrowDown navigation (only when NOT focused on an input, to prevent double firing)
      if (!isModalOpen && cart.length > 0 && !isInputFocused) {
        const isPlus = e.key === '+' || e.code === 'NumpadAdd' || e.key === 'Add';
        const isMinus = e.key === '-' || e.code === 'NumpadSubtract' || e.key === 'Subtract';

        if (isPlus || isMinus) {
          e.preventDefault();
          const targetIndex = (selectedCartIndex >= 0 && selectedCartIndex < cart.length)
            ? selectedCartIndex
            : cart.length - 1;
          setSelectedCartIndex(targetIndex);
          updateQuantity(targetIndex, isPlus ? 1 : -1);
          return;
        }

        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          e.preventDefault();
          const nextIndex = e.key === 'ArrowUp'
            ? (selectedCartIndex <= 0 ? cart.length - 1 : selectedCartIndex - 1)
            : (selectedCartIndex >= cart.length - 1 ? 0 : selectedCartIndex + 1);
          setSelectedCartIndex(nextIndex);
          setTimeout(() => document.getElementById(`cart-row-${nextIndex}`)?.focus(), 20);
          return;
        }
      }

      if (e.key === 'F7') {
        e.preventDefault();
        setCashMovementType('ingreso');
        setIsCashMovementModalOpen(true);
        return;
      } else if (e.key === 'F8') {
        e.preventDefault();
        setCashMovementType('salida');
        setIsCashMovementModalOpen(true);
        return;
      } else if (e.key === 'F10') {
        e.preventDefault();
        setIsSearchCatalogOpen(true);
        return;
      } else if (e.key === 'F11') {
        e.preventDefault();
        handleToggleWholesale();
        return;
      } else if (e.key === 'F12') {
        e.preventDefault();
        if (cart.length > 0) {
          setIsCheckoutOpen(true);
        }
        return;
      } else if (e.key === 'Delete') {
        const canDelete = !isInputFocused || (document.activeElement === barcodeInputRef.current && !barcodeInput.trim());
        if (cart.length > 0 && canDelete) {
          e.preventDefault();
          handleRemoveLastOrSelected();
          return;
        }
      }

      // Smart Barcode Scanner & Keystroke Auto-Catcher:
      // If user scans with barcode gun or types without having manually clicked the barcode input
      if (!isModalOpen && isActive) {
        const isAnotherInput = document.activeElement && 
          (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT' || document.activeElement.isContentEditable) &&
          document.activeElement !== barcodeInputRef.current;

        if (!isAnotherInput && document.activeElement !== barcodeInputRef.current) {
          if (e.key === 'Enter') {
            const query = barcodeInputRef.current?.value || barcodeInput;
            if (query.trim()) {
              e.preventDefault();
              executeBarcodeOrSearch(query);
            } else {
              barcodeInputRef.current?.focus();
            }
            return;
          }

          if (e.key.length === 1 && !e.ctrlKey && !e.altKey && !e.metaKey) {
            const isPlusOrMinus = (e.key === '+' || e.key === '-');
            const hasCartItems = cart.length > 0;
            const hasInputValue = Boolean(barcodeInputRef.current?.value || barcodeInput);

            // If it's + or - to modify quantity on an empty input with items in cart, let quantity logic handle it
            if (isPlusOrMinus && hasCartItems && !hasInputValue) {
              return;
            }

            e.preventDefault();
            if (barcodeInputRef.current) {
              barcodeInputRef.current.focus();
              const currentVal = barcodeInputRef.current.value || '';
              const newVal = currentVal + e.key;
              barcodeInputRef.current.value = newVal;
              setBarcodeInput(newVal);
              if (searchError) setSearchError('');
            }
            return;
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [cart, selectedCartIndex, onNavigateTab, isSearchCatalogOpen, isCheckoutOpen, isCashMovementModalOpen, isTicketOpen, isWholesale, handleToggleWholesale, handleRemoveLastOrSelected, updateQuantity, setSelectedCartIndex, barcodeInput, saleSuccessNotification, itemToDelete, handleConfirmDeleteItem, handleCancelDeleteItem, isActive, executeBarcodeOrSearch, searchError]);

  // Barcode / Name Input Handler (Enter key) & Quick + / - adjustment
  const handleBarcodeSubmit = (e) => {
    if (e.defaultPrevented) return;

    const isPlus = e.key === '+' || e.code === 'NumpadAdd' || e.key === 'Add';
    const isMinus = e.key === '-' || e.code === 'NumpadSubtract' || e.key === 'Subtract';

    if ((isPlus || isMinus) && !barcodeInput.trim() && cart.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      const targetIndex = (selectedCartIndex >= 0 && selectedCartIndex < cart.length)
        ? selectedCartIndex
        : cart.length - 1;
      setSelectedCartIndex(targetIndex);
      updateQuantity(targetIndex, isPlus ? 1 : -1);
      return;
    }

    if (e.key === 'ArrowUp' && !barcodeInput.trim() && cart.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedCartIndex((prev) => (prev <= 0 ? cart.length - 1 : prev - 1));
      return;
    }

    if (e.key === 'ArrowDown' && !barcodeInput.trim() && cart.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      setSelectedCartIndex((prev) => (prev >= cart.length - 1 ? 0 : prev + 1));
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      executeBarcodeOrSearch(barcodeInput);
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
      paymentMethod: saleDetails.paymentMethod || selectedPaymentMethod || 'efectivo',
      ...saleDetails
    };

    const recorded = onRecordSale(salePayload);
    setIsCheckoutOpen(false);
    // Reset payment method to default "efectivo" for the next sale
    setSelectedPaymentMethod('efectivo');
    setCart([]);
    setSelectedCartIndex(-1);
    setIsWholesale(false);
    setCompletedSale(recorded);
    // User requested not auto-opening the ticket, but showing a friendly success toast with change
    setSaleSuccessNotification(recorded);
    setTimeout(() => {
      barcodeInputRef.current?.focus();
    }, 50);
  };

  // Live date tracking so at midnight (00:00:00) nextTicketNumber automatically flips to #1 without touching anything
  const [currentDateKey, setCurrentDateKey] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  });

  useEffect(() => {
    const checkMidnight = () => {
      const d = new Date();
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      setCurrentDateKey((prev) => (prev !== key ? key : prev));
    };

    const timer = setInterval(checkMidnight, 5000);
    window.addEventListener('focus', checkMidnight);

    return () => {
      clearInterval(timer);
      window.removeEventListener('focus', checkMidnight);
    };
  }, []);

  const nextTicketNumber = useMemo(() => {
    // currentDateKey forces recalculation at midnight (00:00:00) so a new day starts at Ticket #1 automatically
    return getNextDailyTicketNumber(sales);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sales, currentDateKey]);

  return (
    <div className="pos-workspace" onClick={handleWorkspaceClick}>
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
            className="btn-header-add"
            onClick={() => onNavigateTab?.('inventory')}
          >
            <Plus size={16} />
            <span>Nuevo Producto</span>
          </button>
        </div>

        {/* Action Bar Row 1: Barcode Input & F1-F4 Navigation */}
        <div className="pos-action-bar-1">
          <div style={{ flex: 1, minWidth: '260px', display: 'flex', flexDirection: 'column' }}>
            <div 
              className="barcode-input-wrap"
              style={{ borderColor: searchError ? '#ef4444' : undefined }}
            >
              <Search size={16} color={searchError ? '#ef4444' : '#94a3b8'} />
              <input
                ref={barcodeInputRef}
                type="text"
                className="barcode-input"
                placeholder="Código de barras o nombre (Ej: coca retornable 2l)..."
                value={barcodeInput}
                onChange={(e) => {
                  setBarcodeInput(e.target.value);
                  if (searchError) setSearchError('');
                }}
                onKeyDown={handleBarcodeSubmit}
              />
              {barcodeInput && (
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeInput('');
                    setSearchError('');
                    barcodeInputRef.current?.focus();
                  }}
                  style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: '0 4px', display: 'flex', alignItems: 'center' }}
                  title="Limpiar"
                >
                  <X size={14} />
                </button>
              )}
            </div>
            {searchError && (
              <div style={{ fontSize: '0.74rem', color: '#dc2626', fontWeight: 600, marginTop: '3px', paddingLeft: '4px' }}>
                ⚠️ {searchError}
              </div>
            )}
          </div>

          <button className="btn-shortcut-tab active" onClick={() => onNavigateTab?.('pos')}>
            <span>F1 · Ventas</span>
          </button>

          <button className="btn-shortcut-tab" onClick={() => onNavigateTab?.('inventory')}>
            <span>F2 · Productos</span>
          </button>

          <button className="btn-shortcut-tab" onClick={() => onNavigateTab?.('clients')}>
            <span>F3 · Clientes</span>
          </button>

          {config?.showCashModule !== false && (
            <button className="btn-shortcut-tab" onClick={() => onNavigateTab?.('cashregister')}>
              <span>F4 · Caja</span>
            </button>
          )}

          <button className="btn-shortcut-tab" onClick={() => onNavigateTab?.('reports')}>
            <span>F5 · Reportes</span>
          </button>
        </div>

        {/* Action Bar Row 2: Unified Minimalist Action Tags */}
        <div className="pos-action-bar-2">
          <button 
            className="btn-action-tag"
            onClick={() => setIsSearchCatalogOpen(true)}
            title="Buscar en catálogo [F10]"
          >
            <Search size={13} />
            <span>F10 · Catálogo</span>
          </button>

          <button 
            className={`btn-action-tag ${isWholesale ? 'active-tag' : ''}`}
            onClick={handleToggleWholesale}
            title="Aplicar precio mayoreo a los productos del ticket [F11]"
          >
            <Truck size={13} />
            <span>F11 · Mayoreo {isWholesale && '✓'}</span>
          </button>

          {config?.showCashModule !== false && (
            <>
              <button 
                className="btn-action-tag"
                onClick={() => {
                  setCashMovementType('ingreso');
                  setIsCashMovementModalOpen(true);
                }}
                title="Registrar ingreso de dinero a la caja [F7]"
              >
                <ArrowUpCircle size={13} />
                <span>F7 · Entrada Caja</span>
              </button>

              <button 
                className="btn-action-tag"
                onClick={() => {
                  setCashMovementType('salida');
                  setIsCashMovementModalOpen(true);
                }}
                title="Registrar salida o gasto de caja [F8]"
              >
                <ArrowDownCircle size={13} />
                <span>F8 · Salida Caja</span>
              </button>
            </>
          )}

          <button 
            className="btn-action-tag"
            onClick={() => {
              if (cart.length > 0) {
                const targetIndex = (selectedCartIndex >= 0 && selectedCartIndex < cart.length) ? selectedCartIndex : cart.length - 1;
                setSelectedCartIndex(targetIndex);
                updateQuantity(targetIndex, 1);
              }
            }}
            disabled={cart.length === 0}
            title="Aumentar cantidad del producto (+ o - en el teclado)"
            style={{ opacity: cart.length > 0 ? 1 : 0.4 }}
          >
            <Plus size={13} />
            <span>+ / - · Cantidad</span>
          </button>

          <button 
            className="btn-action-tag btn-action-tag-danger"
            onClick={handleRemoveLastOrSelected}
            disabled={cart.length === 0}
            title="Eliminar artículo del ticket [Supr / Del]"
            style={{ opacity: cart.length > 0 ? 1 : 0.4 }}
          >
            <Trash2 size={13} />
            <span>DEL · Quitar</span>
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
                <th style={{ textAlign: 'center', width: '130px' }}>Cant. (+ / -)</th>
                <th style={{ textAlign: 'right', width: '130px' }}>Importe</th>
                <th style={{ textAlign: 'center', width: '100px' }}>Existencia</th>
              </tr>
            </thead>
            <tbody>
              {cart.map((item, index) => {
                const isSelected = selectedCartIndex === index;
                const trackInventoryGlobal = config?.trackInventory !== false;
                const tracksStock = trackInventoryGlobal && item.product.trackStock !== false;
                const remainingStock = tracksStock ? Math.max(0, (item.product.stock || 0) - item.quantity) : null;

                return (
                  <tr 
                    key={item.product.id}
                    id={`cart-row-${index}`}
                    tabIndex={0}
                    onClick={() => setSelectedCartIndex(index)}
                    onFocus={() => setSelectedCartIndex(index)}
                    style={{ 
                      backgroundColor: isSelected ? 'var(--primary-light)' : undefined,
                      cursor: 'pointer',
                      outline: isSelected ? '2px solid var(--primary)' : 'none',
                      outlineOffset: '-2px'
                    }}
                  >
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      {item.product.barcode}
                    </td>
                    <td>
                      <strong style={{ color: 'var(--text-main)' }}>{item.product.name}</strong>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block' }}>
                        {getCategoryDisplayName(item.product.category)}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {formatCurrency(item.unitPrice)}
                      </div>
                      {(item.isWholesale || (Number(item.product.wholesalePrice) > 0 && item.unitPrice === Number(item.product.wholesalePrice))) && (
                        <span style={{ fontSize: '0.68rem', backgroundColor: 'rgba(56, 189, 248, 0.15)', color: '#0284c7', padding: '1px 5px', borderRadius: '3px', fontWeight: 700 }}>
                          MAYOREO
                        </span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: 'var(--bg-hover)', border: '1px solid var(--border)', borderRadius: '4px', padding: '2px' }}>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateQuantity(index, -1); }}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                          <Minus size={12} />
                        </button>
                        <span style={{ minWidth: '22px', textAlign: 'center', fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                          {item.quantity}
                        </span>
                        <button
                          onClick={(e) => { e.stopPropagation(); updateQuantity(index, 1); }}
                          style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-secondary)' }}
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                    </td>
                    <td style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--success)', fontSize: '0.95rem' }}>
                      {formatCurrency(item.subtotal)}
                    </td>
                    <td style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: (tracksStock && remainingStock <= 5) ? 'var(--warning)' : 'var(--text-muted)' }}>
                      {tracksStock ? `${remainingStock} un.` : '—'}
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
              <div className="empty-ticket-title" style={{ color: 'var(--text-main)' }}>No hay productos en el ticket</div>
              <div className="empty-ticket-subtitle" style={{ color: 'var(--text-muted)' }}>
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
            <LayoutGrid size={18} color="var(--primary)" />
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
              <span style={{ fontSize: '1.2rem', color: 'var(--success)' }}>$</span>
              <span>Importe total</span>
            </div>
            <span className="summary-total-amount">{formatCurrency(totalAmount)}</span>
          </div>
        </div>

        {/* Card 2: Método de pago (2x2 Grid) */}
        <div className="payment-card">
          <div className="payment-card-header">
            <CreditCard size={17} color="var(--primary)" />
            <span>Método de pago</span>
          </div>

          <div className="payment-methods-2x2">
            <div 
              className={`pm-tile ${selectedPaymentMethod === 'efectivo' ? 'active-cash' : ''}`}
              onClick={() => setSelectedPaymentMethod('efectivo')}
            >
              <Banknote size={16} color="var(--success)" />
              <span>Efectivo</span>
            </div>

            <div 
              className={`pm-tile ${selectedPaymentMethod === 'tarjeta' ? 'active-card' : ''}`}
              onClick={() => setSelectedPaymentMethod('tarjeta')}
            >
              <CreditCard size={16} color="var(--primary)" />
              <span>Tarjeta</span>
            </div>

            <div 
              className={`pm-tile ${selectedPaymentMethod === 'transferencia' ? 'active-transfer' : ''}`}
              onClick={() => setSelectedPaymentMethod('transferencia')}
            >
              <QrCode size={16} color="var(--purple)" />
              <span>Transferencia</span>
            </div>

            <div 
              className={`pm-tile ${selectedPaymentMethod === 'fiado' ? 'active-credit' : ''}`}
              onClick={() => setSelectedPaymentMethod('fiado')}
            >
              <UserCheck size={16} color="var(--warning)" />
              <span>Cta. Cte. (Fiado)</span>
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
        onClose={() => {
          setIsCheckoutOpen(false);
          setSelectedPaymentMethod('efectivo');
          setTimeout(() => barcodeInputRef.current?.focus(), 50);
        }}
        total={totalAmount}
        initialPaymentMethod={selectedPaymentMethod}
        onConfirmSale={handleSaleComplete}
        clients={clients}
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
        <ModalBackdrop onClose={() => setIsCashMovementModalOpen(false)}>
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
                    onFocus={(e) => e.target.select()}
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
        </ModalBackdrop>
      )}

      {/* Catalog Search & Add Modal (F10) */}
      {isSearchCatalogOpen && (
        <CatalogSearchModal
          products={products}
          normalizeText={normalizeText}
          addToCart={addToCart}
          formatCurrency={formatCurrency}
          getCategoryDisplayName={getCategoryDisplayName}
          catalogSearchQuery={catalogSearchQuery}
          setCatalogSearchQuery={setCatalogSearchQuery}
          catalogHighlightIndex={catalogHighlightIndex}
          setCatalogHighlightIndex={setCatalogHighlightIndex}
          onClose={() => {
            setIsSearchCatalogOpen(false);
            setCatalogSearchQuery('');
            setCatalogHighlightIndex(0);
            setBarcodeInput('');
            setTimeout(() => barcodeInputRef.current?.focus(), 50);
          }}
        />
      )}

      {/* Modal de Confirmación de Eliminación de Artículo */}
      {itemToDelete && (
        <ModalBackdrop onClose={handleCancelDeleteItem}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px', width: '92vw' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: 'rgba(239, 68, 68, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', flexShrink: 0 }}>
                  <Trash2 size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-main)' }}>
                    ¿Eliminar artículo del ticket?
                  </h3>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    Confirmación de seguridad
                  </span>
                </div>
              </div>
              <button 
                onClick={handleCancelDeleteItem}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8' }}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', padding: '1.25rem 1rem' }}>
              <div style={{ background: 'var(--bg-hover)', padding: '0.9rem 1rem', borderRadius: '8px', border: '1px solid var(--border)' }}>
                <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                  {itemToDelete.item?.product?.name}
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <span>Código de barras: <strong style={{ fontFamily: 'var(--font-mono)' }}>{itemToDelete.item?.product?.barcode || '—'}</strong></span>
                  <span>Cantidad actual en ticket: <strong style={{ color: 'var(--text-main)' }}>{itemToDelete.item?.quantity}</strong> · Subtotal: <strong style={{ color: 'var(--success)' }}>{formatCurrency(itemToDelete.item?.subtotal)}</strong></span>
                </div>
              </div>

              <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                ¿Estás seguro de que deseás quitar este artículo del ticket de venta?
              </p>
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem' }}>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleCancelDeleteItem}
              >
                Cancelar (Esc)
              </button>
              <button 
                type="button" 
                className="btn btn-danger" 
                onClick={handleConfirmDeleteItem}
                autoFocus
                style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: 700, padding: '0.6rem 1.25rem' }}
              >
                <Trash2 size={16} />
                <span>Sí, Quitar Artículo (Enter)</span>
              </button>
            </div>
          </div>
        </ModalBackdrop>
      )}

      {/* Venta Realizada - Floating Notification Toast */}
      {saleSuccessNotification && (
        <div 
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: 'var(--bg-surface)',
            border: '2px solid #16a34a',
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '1.25rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            minWidth: '420px',
            maxWidth: '92vw',
            animation: 'fadeIn 0.2s ease-out'
          }}
          onClick={() => setSaleSuccessNotification(null)}
        >
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(22, 163, 74, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a', flexShrink: 0 }}>
            <CheckCircle size={30} />
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
              <strong style={{ fontSize: '1.15rem', color: 'var(--text-main)', fontWeight: 800 }}>
                ¡Venta Realizada con Éxito!
              </strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                {saleSuccessNotification.dailyTicketNumber 
                  ? `Ticket #${saleSuccessNotification.dailyTicketNumber}` 
                  : `Ticket #${saleSuccessNotification.id?.slice(-6).toUpperCase()}`}
              </span>
            </div>

            {saleSuccessNotification.changeGiven > 0 ? (
              <div style={{ marginTop: '0.35rem', padding: '0.45rem 0.85rem', backgroundColor: 'rgba(22, 163, 74, 0.1)', borderRadius: '6px', border: '1px solid rgba(22, 163, 74, 0.25)' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block' }}>Vuelto a entregar al cliente:</span>
                <strong style={{ fontSize: '1.5rem', color: '#16a34a', fontFamily: 'var(--font-mono)', fontWeight: 800 }}>
                  {formatCurrency(saleSuccessNotification.changeGiven)}
                </strong>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.6rem' }}>
                  (Pagó con {formatCurrency(saleSuccessNotification.cashGiven)} | Total: {formatCurrency(saleSuccessNotification.total)})
                </span>
              </div>
            ) : (
              <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                Total cobrado: <strong style={{ color: 'var(--text-main)', fontFamily: 'var(--font-mono)' }}>{formatCurrency(saleSuccessNotification.total)}</strong> ({saleSuccessNotification.paymentMethod?.toUpperCase()})
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.6rem' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Podés imprimirlo cuando quieras desde <em>"Imprimir Último Ticket"</em>
              </span>
              <button
                type="button"
                className="btn btn-secondary"
                style={{ padding: '3px 9px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSaleSuccessNotification(null);
                  setIsTicketOpen(true);
                }}
              >
                <Printer size={13} />
                <span>Imprimir ahora</span>
              </button>
            </div>
          </div>

          <button 
            type="button" 
            onClick={() => setSaleSuccessNotification(null)}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px', alignSelf: 'flex-start' }}
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* POS Alert Notification Toast (e.g. Mayoreo F11) */}
      {posAlert && (
        <div 
          style={{
            position: 'fixed',
            top: '24px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 9999,
            backgroundColor: 'var(--bg-surface)',
            border: `2px solid ${posAlert.type === 'warning' ? '#f59e0b' : posAlert.type === 'success' ? '#16a34a' : '#0284c7'}`,
            boxShadow: '0 20px 45px rgba(0, 0, 0, 0.35)',
            borderRadius: 'var(--radius-lg, 12px)',
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            minWidth: '400px',
            maxWidth: '92vw',
            animation: 'fadeIn 0.2s ease-out',
            cursor: 'pointer'
          }}
          onClick={() => setPosAlert(null)}
        >
          <div 
            style={{ 
              width: '42px', 
              height: '42px', 
              borderRadius: '50%', 
              backgroundColor: posAlert.type === 'warning' ? 'rgba(245, 158, 11, 0.15)' : posAlert.type === 'success' ? 'rgba(22, 163, 74, 0.15)' : 'rgba(2, 132, 199, 0.15)', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: posAlert.type === 'warning' ? '#f59e0b' : posAlert.type === 'success' ? '#16a34a' : '#0284c7', 
              flexShrink: 0 
            }}
          >
            {posAlert.type === 'warning' ? <AlertTriangle size={22} /> : posAlert.type === 'success' ? <CheckCircle size={22} /> : <Truck size={22} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
              {posAlert.type === 'warning' ? 'Aviso de Mayoreo (F11)' : posAlert.type === 'success' ? 'Precio de Mayoreo Aplicado' : 'Modo Mayoreo (F11)'}
            </div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              {posAlert.message}
            </div>
          </div>
          <button 
            type="button" 
            onClick={(e) => { e.stopPropagation(); setPosAlert(null); }}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
