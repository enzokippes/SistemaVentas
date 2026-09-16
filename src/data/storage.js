import { INITIAL_PRODUCTS, INITIAL_CONFIG, CATEGORIES } from './initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'kiosco_productos_v1',
  CATEGORIES: 'kiosco_categorias_v1',
  SALES: 'kiosco_ventas_v1',
  CASH_SESSION: 'kiosco_caja_sesion_v1',
  CASH_MOVEMENTS: 'kiosco_movimientos_caja_v1',
  CONFIG: 'kiosco_configuracion_v1',
  CASH_CLOSINGS: 'kiosco_cierres_caja_v1',
};

// Safe JSON parser
function getStoredItem(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading key ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function setStoredItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (err) {
    console.error(`Error saving key ${key} to localStorage:`, err);
  }
}

/* ==================== CATEGORÍAS ==================== */
export function getCategories() {
  let categories = getStoredItem(STORAGE_KEYS.CATEGORIES, null);
  if (!categories || !Array.isArray(categories) || categories.length === 0) {
    categories = CATEGORIES;
    setStoredItem(STORAGE_KEYS.CATEGORIES, categories);
  }
  return categories;
}

export function saveCategories(categories) {
  setStoredItem(STORAGE_KEYS.CATEGORIES, categories);
  return categories;
}

export function addCategory(categoryData) {
  const categories = getCategories();
  const newCat = {
    ...categoryData,
    id: categoryData.id || `cat_${Date.now()}`,
    name: categoryData.name,
    icon: categoryData.icon || 'ShoppingBag'
  };
  categories.push(newCat);
  saveCategories(categories);
  return newCat;
}

export function updateCategory(id, updatedFields) {
  const categories = getCategories();
  const index = categories.findIndex(c => c.id === id);
  if (index !== -1) {
    categories[index] = { ...categories[index], ...updatedFields };
    saveCategories(categories);
    return categories[index];
  }
  return null;
}

export function deleteCategory(id) {
  const categories = getCategories().filter(c => c.id !== id);
  saveCategories(categories);
  return categories;
}

/* ==================== PRODUCTOS ==================== */
export function getProducts() {
  let products = getStoredItem(STORAGE_KEYS.PRODUCTS, null);
  if (!products || !Array.isArray(products) || products.length === 0) {
    products = INITIAL_PRODUCTS;
    setStoredItem(STORAGE_KEYS.PRODUCTS, products);
  }
  return products;
}

export function saveProducts(products) {
  setStoredItem(STORAGE_KEYS.PRODUCTS, products);
  return products;
}

export function addProduct(productData) {
  const products = getProducts();
  const newProduct = {
    ...productData,
    id: productData.id || `prod-${Date.now()}`,
    stock: Number(productData.stock) || 0,
    minStock: Number(productData.minStock) || 5,
    costPrice: Number(productData.costPrice) || 0,
    salePrice: Number(productData.salePrice) || 0,
  };
  products.unshift(newProduct);
  saveProducts(products);
  return newProduct;
}

export function updateProduct(id, productData) {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index !== -1) {
    products[index] = {
      ...products[index],
      ...productData,
      stock: Number(productData.stock ?? products[index].stock) || 0,
      minStock: Number(productData.minStock ?? products[index].minStock) || 0,
      costPrice: Number(productData.costPrice ?? products[index].costPrice) || 0,
      salePrice: Number(productData.salePrice ?? products[index].salePrice) || 0,
    };
    saveProducts(products);
    return products[index];
  }
  return null;
}

export function deleteProduct(id) {
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
  return products;
}

export function bulkUpdatePrices(categoryId, percentage) {
  const products = getProducts();
  const factor = 1 + percentage / 100;
  const updated = products.map((p) => {
    if (categoryId === 'todos' || p.category === categoryId) {
      const newPrice = Math.round(p.salePrice * factor);
      return { ...p, salePrice: newPrice };
    }
    return p;
  });
  saveProducts(updated);
  return updated;
}

/* ==================== VENTAS ==================== */
export function getSales() {
  return getStoredItem(STORAGE_KEYS.SALES, []);
}

export function recordSale(saleData) {
  const sales = getSales();
  const products = getProducts();

  // Create new sale record
  const newSale = {
    id: `sale-${Date.now()}`,
    date: new Date().toISOString(),
    items: saleData.items, // [{ product, quantity, unitPrice, costPrice, subtotal }]
    total: saleData.total,
    totalCost: saleData.totalCost || 0,
    profit: (saleData.total || 0) - (saleData.totalCost || 0),
    paymentMethod: saleData.paymentMethod || 'efectivo', // efectivo, mercadopago, debito, credito, fiado
    clientName: saleData.clientName || 'Consumidor Final',
    cashGiven: saleData.cashGiven || 0,
    changeGiven: saleData.changeGiven || 0,
  };

  // Decrement stock for each product sold
  saleData.items.forEach((item) => {
    const prodIndex = products.findIndex((p) => p.id === item.product.id);
    if (prodIndex !== -1) {
      products[prodIndex].stock = Math.max(0, products[prodIndex].stock - item.quantity);
    }
  });

  saveProducts(products);

  sales.unshift(newSale);
  setStoredItem(STORAGE_KEYS.SALES, sales);

  return newSale;
}

/* ==================== CAJA DIARIA ==================== */
export function getCashSession() {
  const defaultSession = {
    isOpen: true,
    openedAt: new Date().toISOString(),
    initialCash: 10000,
    operator: 'Turno Mañana',
  };
  return getStoredItem(STORAGE_KEYS.CASH_SESSION, defaultSession);
}

export function openCashSession(initialCash, operator = 'Cajero') {
  const session = {
    isOpen: true,
    openedAt: new Date().toISOString(),
    initialCash: Number(initialCash) || 0,
    operator,
  };
  setStoredItem(STORAGE_KEYS.CASH_SESSION, session);
  return session;
}

export function closeCashSession(countedCash, notes = '') {
  const session = getCashSession();
  const sales = getSales();
  const movements = getCashMovements();

  // Filter sales and movements since session open
  const sessionStartTime = new Date(session.openedAt).getTime();
  const sessionSales = sales.filter((s) => new Date(s.date).getTime() >= sessionStartTime);
  const sessionMovements = movements.filter((m) => new Date(m.date).getTime() >= sessionStartTime);

  const cashSalesTotal = sessionSales
    .filter((s) => s.paymentMethod === 'efectivo')
    .reduce((acc, s) => acc + s.total, 0);

  const digitalSalesTotal = sessionSales
    .filter((s) => s.paymentMethod !== 'efectivo' && s.paymentMethod !== 'fiado')
    .reduce((acc, s) => acc + s.total, 0);

  const totalExpenses = sessionMovements
    .filter((m) => m.type === 'salida')
    .reduce((acc, m) => acc + m.amount, 0);

  const totalIncomes = sessionMovements
    .filter((m) => m.type === 'ingreso')
    .reduce((acc, m) => acc + m.amount, 0);

  const expectedCashInDrawer = session.initialCash + cashSalesTotal + totalIncomes - totalExpenses;
  const difference = Number(countedCash) - expectedCashInDrawer;

  const closingRecord = {
    id: `close-${Date.now()}`,
    openedAt: session.openedAt,
    closedAt: new Date().toISOString(),
    operator: session.operator,
    initialCash: session.initialCash,
    cashSalesTotal,
    digitalSalesTotal,
    totalSales: cashSalesTotal + digitalSalesTotal,
    totalExpenses,
    totalIncomes,
    expectedCashInDrawer,
    countedCash: Number(countedCash),
    difference,
    notes,
    salesCount: sessionSales.length,
  };

  const closings = getStoredItem(STORAGE_KEYS.CASH_CLOSINGS, []);
  closings.unshift(closingRecord);
  setStoredItem(STORAGE_KEYS.CASH_CLOSINGS, closings);

  // Set session as closed
  const closedSession = {
    isOpen: false,
    closedAt: closingRecord.closedAt,
    initialCash: 0,
    operator: session.operator,
  };
  setStoredItem(STORAGE_KEYS.CASH_SESSION, closedSession);

  return closingRecord;
}

export function getCashClosings() {
  return getStoredItem(STORAGE_KEYS.CASH_CLOSINGS, []);
}

export function getCashMovements() {
  return getStoredItem(STORAGE_KEYS.CASH_MOVEMENTS, []);
}

export function addCashMovement(type, amount, reason) {
  const movements = getCashMovements();
  const movement = {
    id: `mov-${Date.now()}`,
    date: new Date().toISOString(),
    type, // 'ingreso' or 'salida'
    amount: Number(amount) || 0,
    reason: reason || (type === 'salida' ? 'Gasto menor' : 'Ingreso adicional'),
  };
  movements.unshift(movement);
  setStoredItem(STORAGE_KEYS.CASH_MOVEMENTS, movements);
  return movement;
}

/* ==================== CONFIGURACIÓN ==================== */
export function getConfig() {
  return getStoredItem(STORAGE_KEYS.CONFIG, INITIAL_CONFIG);
}

export function saveConfig(newConfig) {
  setStoredItem(STORAGE_KEYS.CONFIG, newConfig);
  return newConfig;
}

/* ==================== BACKUP & RESTORE ==================== */
export function exportDatabaseJSON() {
  const data = {
    products: getProducts(),
    sales: getSales(),
    cashSession: getCashSession(),
    cashMovements: getCashMovements(),
    cashClosings: getCashClosings(),
    config: getConfig(),
    exportedAt: new Date().toISOString(),
    version: '1.0.0',
  };
  return JSON.stringify(data, null, 2);
}

export function importDatabaseJSON(jsonString) {
  try {
    const data = JSON.parse(jsonString);
    if (data.products && Array.isArray(data.products)) {
      setStoredItem(STORAGE_KEYS.PRODUCTS, data.products);
    }
    if (data.sales && Array.isArray(data.sales)) {
      setStoredItem(STORAGE_KEYS.SALES, data.sales);
    }
    if (data.cashMovements && Array.isArray(data.cashMovements)) {
      setStoredItem(STORAGE_KEYS.CASH_MOVEMENTS, data.cashMovements);
    }
    if (data.cashClosings && Array.isArray(data.cashClosings)) {
      setStoredItem(STORAGE_KEYS.CASH_CLOSINGS, data.cashClosings);
    }
    if (data.config) {
      setStoredItem(STORAGE_KEYS.CONFIG, data.config);
    }
    return { success: true };
  } catch (err) {
    console.error('Error importing backup:', err);
    return { success: false, error: err.message };
  }
}

export function resetDatabase() {
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  localStorage.removeItem(STORAGE_KEYS.SALES);
  localStorage.removeItem(STORAGE_KEYS.CASH_SESSION);
  localStorage.removeItem(STORAGE_KEYS.CASH_MOVEMENTS);
  localStorage.removeItem(STORAGE_KEYS.CASH_CLOSINGS);
  localStorage.removeItem(STORAGE_KEYS.CONFIG);
  return getProducts();
}
