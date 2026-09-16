import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import BottomBar from './components/BottomBar';
import POSView from './components/POS/POSView';
import InventoryView from './components/Inventory/InventoryView';
import CategoriesView from './components/Categories/CategoriesView';
import ClientsView from './components/Customers/ClientsView';
import ReportsView from './components/Reports/ReportsView';
import SettingsView from './components/Settings/SettingsView';
import TicketModal from './components/POS/TicketModal';

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
  getCashSession,
  getCashMovements,
  addCashMovement,
  getConfig,
  saveConfig,
} from './data/storage';

export default function App() {
  const [activeTab, setActiveTab] = useState('pos');
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [cashSession, setCashSession] = useState(null);
  const [cashMovements, setCashMovements] = useState([]);
  const [config, setConfig] = useState(null);
  const [isLastTicketModalOpen, setIsLastTicketModalOpen] = useState(false);
  const [productCategoryFilter, setProductCategoryFilter] = useState('todos');

  // Load all data on mount
  const loadAllData = () => {
    setCategories(getCategories());
    setProducts(getProducts());
    setSales(getSales());
    setCashSession(getCashSession());
    setCashMovements(getCashMovements());
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
      if (e.key === 'F1') {
        e.preventDefault();
        setActiveTab('pos');
        setTimeout(() => {
          const barcodeInput = document.querySelector('.barcode-input');
          barcodeInput?.focus();
        }, 50);
      } else if (e.key === 'F2') {
        e.preventDefault();
        const barcodeInput = document.querySelector('.barcode-input');
        const globalSearch = document.getElementById('global-search-input');
        if (barcodeInput) {
          barcodeInput.focus();
          barcodeInput.select();
        } else if (globalSearch) {
          globalSearch.focus();
          globalSearch.select();
        }
      } else if (e.key === 'F3') {
        e.preventDefault();
        setActiveTab('inventory');
      } else if (e.key === 'F4') {
        e.preventDefault();
        setActiveTab('categories');
      } else if (e.key === 'F5') {
        e.preventDefault();
        setActiveTab('clients');
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, []);

  // Handlers for POS & Sales
  const handleRecordSale = (saleData) => {
    const recorded = recordSale(saleData);
    setSales(getSales());
    setProducts(getProducts());
    return recorded;
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

  // Logout / Exit handler
  const handleLogout = () => {
    if (window.confirm('¿Deseas salir del sistema?')) {
      setActiveTab('pos');
    }
  };

  const lastSale = sales && sales.length > 0 ? sales[0] : null;

  return (
    <div className="app-shell">
      {/* Left Sidebar with live storeName */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onLogout={handleLogout}
        storeName={config?.storeName || 'MiniMercado Kippes'}
      />

      {/* Main Panel */}
      <div className="app-main">
        {/* Top Header Bar */}
        <TopHeader
          onFocusSearch={() => {
            const input = document.querySelector('.barcode-input');
            input?.focus();
          }}
        />

        {/* View Switcher */}
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          {activeTab === 'pos' && (
            <POSView
              products={products}
              categories={categories}
              onRecordSale={handleRecordSale}
              config={config}
              sales={sales}
              onNavigateTab={setActiveTab}
              onAddCashMovement={handleAddCashMovement}
              onOpenDaySales={() => setActiveTab('reports')}
            />
          )}

          {activeTab === 'inventory' && (
            <div style={{ padding: '1.25rem' }}>
              <InventoryView
                products={products}
                categories={categories}
                onAddProduct={handleAddProduct}
                onUpdateProduct={handleUpdateProduct}
                onDeleteProduct={handleDeleteProduct}
                onBulkUpdatePrices={handleBulkUpdatePrices}
                initialCategoryFilter={productCategoryFilter}
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
            />
          )}

          {activeTab === 'clients' && (
            <ClientsView sales={sales} />
          )}

          {activeTab === 'reports' && (
            <div style={{ padding: '1.25rem' }}>
              <ReportsView sales={sales} />
            </div>
          )}

          {activeTab === 'settings' && (
            <div style={{ padding: '1.25rem' }}>
              <SettingsView
                config={config}
                onSaveConfig={handleSaveConfig}
                onReloadData={loadAllData}
                onUpdateLiveStoreName={handleUpdateLiveStoreName}
              />
            </div>
          )}
        </div>

        {/* Bottom Bar matching Mockup */}
        <BottomBar
          lastSale={lastSale}
          onPrintLastTicket={() => setIsLastTicketModalOpen(true)}
          onOpenDaySales={() => setActiveTab('reports')}
        />
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
