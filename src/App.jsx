import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import BottomBar from './components/BottomBar';
import POSView from './components/POS/POSView';
import InventoryView from './components/Inventory/InventoryView';
import CategoriesView from './components/Categories/CategoriesView';
import ClientsView from './components/Customers/ClientsView';
import ReportsView from './components/Reports/ReportsView';
import CashRegisterView from './components/CashRegister/CashRegisterView';
import SettingsView from './components/Settings/SettingsView';
import TicketModal from './components/POS/TicketModal';
import ErrorBoundary from './components/Common/ErrorBoundary';

import {
  getCategories,
  addCategory,
  updateCategory,
  deleteCategory,
  getProducts,
  addProduct,
  updateProduct,
  deleteProduct,
  bulkUpdatePrices,
  getSales,
  recordSale,
  updateSale,
  deleteSale,
  getCashSession,
  getCashMovements,
  getCashClosings,
  addCashMovement,
  openCashSession,
  closeCashSession,
  getConfig,
  saveConfig,
  getClients,
  addClient,
  updateClient,
  deleteClient,
  deleteClientsBatch,
  payClientDebt,
  deleteProductsBatch,
  clearDatabaseForProduction,
  getActiveCart,
  saveActiveCart,
  deduplicateCategories,
} from './data/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [clients, setClients] = useState([]);
  const [activeCart, setActiveCart] = useState(() => getActiveCart());
  const [selectedCartIndex, setSelectedCartIndex] = useState(-1);
  const [sales, setSales] = useState([]);
  const [cashSession, setCashSession] = useState(null);
  const [cashMovements, setCashMovements] = useState([]);
  const [cashClosings, setCashClosings] = useState([]);
  const [config, setConfig] = useState(() => {
    const cfg = getConfig();
    if (cfg?.theme && cfg.theme !== 'default') {
      document.documentElement.setAttribute('data-theme', cfg.theme);
    }
    return cfg;
  });
  const [isLastTicketModalOpen, setIsLastTicketModalOpen] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState('todos');

  // Load all data on mount
  const loadAllData = () => {
    setCategories(getCategories());
    setProducts(getProducts());
    setClients(getClients());
    setSales(getSales());
    setCashSession(getCashSession());
    setCashMovements(getCashMovements());
    setCashClosings(getCashClosings());
    const storedConfig = getConfig();
    if (!storedConfig?.storeName || storedConfig.storeName === 'Mi Kiosco & Despensa') {
      storedConfig.storeName = 'MiniMercado Kippes';
    }
    setConfig(storedConfig);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // Global Keyboard Shortcuts (F1, F2, F3, F4, F5) active ANYWHERE in the app
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.defaultPrevented) return;
      // Do not switch tabs if any modal or dialog is currently open
      if (document.querySelector('.modal-backdrop, .modal-card')) return;

      // Do not switch tabs if user is actively focused on an input/textarea/select
      const isTyping = document.activeElement && 
        (document.activeElement.tagName === 'INPUT' || document.activeElement.tagName === 'TEXTAREA' || document.activeElement.tagName === 'SELECT' || document.activeElement.isContentEditable);
      if (isTyping) return;

      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('pos');
        setTimeout(() => {
          const barcodeInput = document.querySelector('.barcode-input');
          barcodeInput?.focus();
        }, 50);
      } else if (e.key === 'F2') {
        e.preventDefault();
        setActiveTab('inventory');
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('clients');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('cashregister');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setActiveTab('reports');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Sync activeCart to localStorage
  useEffect(() => {
    saveActiveCart(activeCart);
  }, [activeCart]);

  // Sync theme to document element
  useEffect(() => {
    if (config?.theme) {
      document.documentElement.setAttribute('data-theme', config.theme);
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [config?.theme]);

  // Handlers for POS & Sales
  const handleRecordSale = (saleData) => {
    const recorded = recordSale(saleData);
    setSales(getSales());
    setProducts(getProducts());
    setClients(getClients());
    setActiveCart([]);
    saveActiveCart([]);
    return recorded;
  };

  // Handlers for Clients & Fiados
  const handleAddClient = (clientData) => {
    const newCli = addClient(clientData);
    setClients(getClients());
    return newCli;
  };

  const handleUpdateClient = (id, fields) => {
    const updated = updateClient(id, fields);
    setClients(getClients());
    return updated;
  };

  const handleDeleteClient = (id) => {
    deleteClient(id);
    setClients(getClients());
  };

  const handleBatchDeleteClients = (ids) => {
    deleteClientsBatch(ids);
    setClients(getClients());
  };

  const handlePayDebt = (clientId, amount, method = 'efectivo') => {
    const res = payClientDebt(clientId, amount);
    if (res) {
      const isCash = method === 'efectivo';
      const reason = `Cobro fiado - ${res.name} (${isCash ? 'Efectivo' : 'Transferencia'})`;
      addCashMovement('ingreso', Number(amount) || 0, reason, method, 'debt_payment');
      setCashMovements(getCashMovements());
    }
    setClients(getClients());
    return res;
  };

  // Handlers for Categories
  const handleAddCategory = (catData) => {
    const newCat = addCategory(catData);
    setCategories(getCategories());
    return newCat;
  };

  const handleUpdateCategory = (id, fields) => {
    const updated = updateCategory(id, fields);
    setCategories(getCategories());
    return updated;
  };

  const handleDeleteCategory = (id) => {
    deleteCategory(id);
    setCategories(getCategories());
    setProducts(getProducts());
  };

  const handleNavigateToProductsCategory = (catId) => {
    setProductCategoryFilter(catId);
    setActiveTab('inventory');
  };

  // Handlers for Inventory
  const handleAddProduct = (productData) => {
    const newProd = addProduct(productData);
    setProducts(getProducts());
    return newProd;
  };

  const handleUpdateProduct = (id, fields) => {
    const updated = updateProduct(id, fields);
    setProducts(getProducts());
    return updated;
  };

  const handleDeleteProduct = (id) => {
    deleteProduct(id);
    setProducts(getProducts());
  };

  const handleBatchDeleteProducts = (ids) => {
    deleteProductsBatch(ids);
    setProducts(getProducts());
  };

  const handleClearDatabase = () => {
    clearDatabaseForProduction();
    loadAllData();
  };

  const handleBulkUpdatePrices = (category, percentage) => {
    const updated = bulkUpdatePrices(category, percentage);
    setProducts(updated);
  };

  // Cash Movements
  const handleAddCashMovement = (type, amount, reason) => {
    const mov = addCashMovement(type, amount, reason);
    setCashMovements(getCashMovements());
    return mov;
  };

  // Cash Session Open/Close
  const handleOpenCashSession = (initialCash, operator) => {
    const session = openCashSession(initialCash, operator);
    setCashSession(session);
  };

  const handleCloseCashSession = (countedCash, notes) => {
    const closing = closeCashSession(countedCash, notes);
    setCashSession(getCashSession());
    setCashClosings(getCashClosings());
    return closing;
  };

  // Settings & Live Store Name
  const handleSaveConfig = (newConfig) => {
    saveConfig(newConfig);
    setConfig(newConfig);
  };

  const handleUpdateLiveStoreName = (newName) => {
    setConfig((prev) => ({
      ...prev,
      storeName: newName
    }));
  };

  // Sales Modification & Deletion (Reports)
  const handleUpdateSale = (saleId, updatedFields) => {
    const res = updateSale(saleId, updatedFields);
    if (res) {
      setSales([...res.updatedSales]);
      setClients(getClients());
    }
  };

  const handleDeleteSale = (saleId) => {
    const res = deleteSale(saleId);
    if (res) {
      setSales([...res.updatedSales]);
      setProducts(getProducts());
      setClients(getClients());
    }
  };

  // Logout / Exit handler
  const handleLogout = () => {
    if (window.confirm('¿Deseas cerrar el sistema y salir?')) {
      if (window.electronAPI?.closeApp) {
        window.electronAPI.closeApp();
      } else {
        window.close();
      }
    }
  };

  const lastSale = sales && sales.length > 0 ? sales[0] : null;

  return (
    <div className="app-shell" data-theme={config?.theme || 'default'}>
      {/* Left Sidebar with live storeName */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        storeName={config?.storeName || 'MiniMercado Kippes'}
        config={config}
      />

      {/* Main Panel */}
      <div className="app-main">
        {/* Top Header Bar */}
        <TopHeader />

        {/* View Switcher */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          <ErrorBoundary>
            <div style={{ display: activeTab === 'pos' ? 'flex' : 'none', flex: 1, minHeight: 0, flexDirection: 'column' }}>
              <POSView
                isActive={activeTab === 'pos'}
                products={products}
                categories={categories}
                onRecordSale={handleRecordSale}
                config={config}
                sales={sales}
                clients={clients}
                onNavigateTab={setActiveTab}
                onAddCashMovement={handleAddCashMovement}
                onOpenDaySales={() => setActiveTab('reports')}
                cart={activeCart}
                setCart={setActiveCart}
                selectedCartIndex={selectedCartIndex}
                setSelectedCartIndex={setSelectedCartIndex}
              />
            </div>

            {activeTab === 'inventory' && (
              <div style={{ padding: '1.25rem' }}>
                <InventoryView
                  products={products}
                  categories={categories}
                  config={config}
                  onAddProduct={handleAddProduct}
                  onUpdateProduct={handleUpdateProduct}
                  onDeleteProduct={handleDeleteProduct}
                  onDeleteBatchProducts={handleBatchDeleteProducts}
                  onBulkUpdatePrices={handleBulkUpdatePrices}
                  initialCategoryFilter={productCategoryFilter}
                  onReloadData={loadAllData}
                />
              </div>
            )}

            {activeTab === 'categories' && (
              <CategoriesView
                categories={categories}
                products={products}
                onAddCategory={handleAddCategory}
                onUpdateCategory={handleUpdateCategory}
                onDeleteCategory={handleDeleteCategory}
                onNavigateToProductsWithCategory={handleNavigateToProductsCategory}
                onDeduplicateCategories={() => {
                  const result = deduplicateCategories();
                  setCategories(getCategories());
                  setProducts(getProducts());
                  return result;
                }}
              />
            )}

            {activeTab === 'clients' && (
              <ClientsView 
                clients={clients} 
                onAddClient={handleAddClient}
                onUpdateClient={handleUpdateClient}
                onDeleteClient={handleDeleteClient}
                onDeleteBatchClients={handleBatchDeleteClients}
                onPayDebt={handlePayDebt}
              />
            )}

            {activeTab === 'cashregister' && (
              <div style={{ padding: '1.25rem' }}>
                <CashRegisterView
                  cashSession={cashSession}
                  sales={sales}
                  cashMovements={cashMovements}
                  cashClosings={cashClosings}
                  onOpenSession={handleOpenCashSession}
                  onCloseSession={handleCloseCashSession}
                  onAddMovement={handleAddCashMovement}
                />
              </div>
            )}

            {activeTab === 'reports' && (
              <div style={{ padding: '1.25rem' }}>
                <ReportsView 
                  sales={sales}
                  clients={clients}
                  categories={categories}
                  cashMovements={cashMovements}
                  config={config}
                  onUpdateSale={handleUpdateSale}
                  onDeleteSale={handleDeleteSale}
                />
              </div>
            )}

            {activeTab === 'settings' && (
              <div style={{ padding: '1.25rem' }}>
                <SettingsView
                  config={config}
                  onSaveConfig={handleSaveConfig}
                  onReloadData={loadAllData}
                  onUpdateLiveStoreName={handleUpdateLiveStoreName}
                  onClearDatabase={handleClearDatabase}
                />
              </div>
            )}
          </ErrorBoundary>
        </div>

        {/* Bottom Bar ONLY visible on POS (Ventas) view */}
        {activeTab === 'pos' && (
          <BottomBar
            lastSale={lastSale}
            onPrintLastTicket={() => setIsLastTicketModalOpen(true)}
            onOpenDaySales={() => setActiveTab('reports')}
          />
        )}
      </div>

      {/* Modal to Reprint Last Ticket */}
      {isLastTicketModalOpen && lastSale && (
        <TicketModal
          isOpen={isLastTicketModalOpen}
          onClose={() => setIsLastTicketModalOpen(false)}
          sale={lastSale}
          config={config}
        />
      )}
    </div>
  );
}
