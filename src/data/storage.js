import { INITIAL_PRODUCTS, INITIAL_CONFIG, CATEGORIES } from './initialData';

const STORAGE_KEYS = {
  PRODUCTS: 'kiosco_productos_v1',
  CATEGORIES: 'kiosco_categorias_v1',
  SALES: 'kiosco_ventas_v1',
  CASH_SESSION: 'kiosco_caja_sesion_v1',
  CASH_MOVEMENTS: 'kiosco_movimientos_caja_v1',
  CONFIG: 'kiosco_configuracion_v1',
  CASH_CLOSINGS: 'kiosco_cierres_caja_v1',
  CLIENTS: 'kiosco_clientes_v1',
  ACTIVE_CART: 'kiosco_carrito_activo_v1',
  IS_INITIALIZED: 'kiosco_db_inicializada_v1',
  AUTO_BACKUP: 'kiosco_auto_backup_v1',
};

// Always rounds up to the nearest multiple of 100 (e.g. 3125 -> 3200, 3200 -> 3200)
export function roundUpToHundred(val) {
  const num = Number(val);
  if (isNaN(num) || num <= 0) return 0;
  return Math.ceil(num / 100) * 100;
}

// Robust unique ID generator to prevent Date.now() collisions
export function generateUniqueId(prefix = 'id') {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// Safe JSON parser
function getStoredItem(key, defaultValue) {
  try {
    const raw = localStorage.getItem(key);
    if (raw !== null && raw !== undefined) {
      return JSON.parse(raw);
    }
    return defaultValue;
  } catch (err) {
    console.error(`Error loading key ${key} from localStorage:`, err);
    return defaultValue;
  }
}

function setStoredItem(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (typeof window !== 'undefined' && window.electronAPI?.store?.set) {
      window.electronAPI.store.set(key, value);
    }
  } catch (err) {
    console.error(`Error saving key ${key} to localStorage:`, err);
  }
}

/* ==================== INICIALIZACIÓN ATÓMICA ==================== */
export function ensureDatabaseInitialized() {
  const isInitialized = getStoredItem(STORAGE_KEYS.IS_INITIALIZED, false);
  const storedCats = getStoredItem(STORAGE_KEYS.CATEGORIES, null);
  const storedProds = getStoredItem(STORAGE_KEYS.PRODUCTS, null);
  const storedClients = getStoredItem(STORAGE_KEYS.CLIENTS, null);

  // Auto-heal if database was affected by previous race condition bug
  const isCorruptedEmpty = (storedProds === null || (Array.isArray(storedProds) && storedProds.length === 0)) &&
                           (storedCats === null || (Array.isArray(storedCats) && storedCats.length === 0));

  if (!isInitialized || isCorruptedEmpty) {
    if (storedCats === null || storedCats.length === 0) {
      setStoredItem(STORAGE_KEYS.CATEGORIES, CATEGORIES);
    }
    if (storedProds === null || storedProds.length === 0) {
      setStoredItem(STORAGE_KEYS.PRODUCTS, INITIAL_PRODUCTS);
    }
    if (storedClients === null || storedClients.length === 0) {
      setStoredItem(STORAGE_KEYS.CLIENTS, INITIAL_CLIENTS);
    }
    if (getStoredItem(STORAGE_KEYS.CONFIG, null) === null) {
      setStoredItem(STORAGE_KEYS.CONFIG, INITIAL_CONFIG);
    }
    setStoredItem(STORAGE_KEYS.IS_INITIALIZED, true);
  }
}

/* ==================== CATEGORÍAS ==================== */
export function getCategories() {
  ensureDatabaseInitialized();
  let categories = getStoredItem(STORAGE_KEYS.CATEGORIES, null);
  if (!categories || categories.length === 0) {
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
    id: categoryData.id || generateUniqueId('cat'),
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

export function deleteCategory(id, fallbackCategoryId) {
  let categories = getCategories().filter((c) => c.id !== id);
  if (categories.length === 0 || (categories.length === 1 && categories[0].id === 'todos')) {
    const defaultCat = { id: 'general', name: 'General', icon: 'ShoppingBag', color: 'bg-blue-600 text-white' };
    categories.push(defaultCat);
  }
  saveCategories(categories);

  // Fallback category for products
  const fallback = fallbackCategoryId && categories.some((c) => c.id === fallbackCategoryId)
    ? fallbackCategoryId
    : (categories.find((c) => c.id !== 'todos')?.id || 'general');

  // Reassign products to fallback category
  const products = getProducts();
  let modified = false;
  products.forEach((p) => {
    if (p.category === id) {
      p.category = fallback;
      modified = true;
    }
  });

  if (modified) {
    saveProducts(products);
  }

  return { categories, products, fallback };
}

/**
 * Merge duplicate categories that share the same name (case-insensitive).
 * Keeps the category with the most products assigned (or the first one found).
 * Reassigns all products from discarded duplicates to the winner.
 * Returns the number of categories removed.
 */
export function deduplicateCategories() {
  const categories = getCategories();
  const products   = getProducts();

  // Group category IDs by normalized name
  const nameMap = new Map(); // normalizedName -> [cat, cat, ...]
  for (const cat of categories) {
    const key = cat.name.trim().toLowerCase();
    if (!nameMap.has(key)) nameMap.set(key, []);
    nameMap.get(key).push(cat);
  }

  const toRemoveIds = new Set();
  const reassignMap = new Map(); // oldId -> winnerId

  for (const [, group] of nameMap) {
    if (group.length <= 1) continue;

    // Count products per category
    const counts = group.map((cat) => ({
      cat,
      count: products.filter((p) => p.category === cat.id).length,
    }));
    counts.sort((a, b) => b.count - a.count);

    const winner = counts[0].cat;
    for (let i = 1; i < counts.length; i++) {
      const loser = counts[i].cat;
      toRemoveIds.add(loser.id);
      reassignMap.set(loser.id, winner.id);
    }
  }

  if (toRemoveIds.size === 0) return { removed: 0 };

  // Reassign products
  let modified = false;
  products.forEach((p) => {
    if (reassignMap.has(p.category)) {
      p.category = reassignMap.get(p.category);
      modified = true;
    }
  });
  if (modified) saveProducts(products);

  // Remove duplicate categories
  const cleanedCats = categories.filter((c) => !toRemoveIds.has(c.id));
  saveCategories(cleanedCats);

  return { removed: toRemoveIds.size };
}


/* ==================== PRODUCTOS ==================== */
export function getProducts() {
  ensureDatabaseInitialized();
  let products = getStoredItem(STORAGE_KEYS.PRODUCTS, null);
  if (products === null) {
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
  const cleanBarcode = String(productData.barcode || '').trim().toLowerCase();
  if (cleanBarcode) {
    const existing = products.find((p) => p.barcode && String(p.barcode).trim().toLowerCase() === cleanBarcode);
    if (existing) {
      throw new Error(`Ya existe un producto con el código de barras "${productData.barcode.trim()}" (${existing.name}).`);
    }
  }

  const newProduct = {
    ...productData,
    id: productData.id || generateUniqueId('prod'),
    stock: Number(productData.stock) || 0,
    minStock: productData.minStock !== undefined && productData.minStock !== '' ? (Number(productData.minStock) || 0) : 5,
    costPrice: Number(productData.costPrice) || 0,
    salePrice: Number(productData.salePrice) || 0,
    wholesalePrice: Number(productData.wholesalePrice) || 0,
    trackStock: productData.trackStock !== false,
  };
  products.unshift(newProduct);
  saveProducts(products);
  autoBackupDatabase();
  return newProduct;
}

export function updateProduct(id, productData) {
  const products = getProducts();
  const index = products.findIndex((p) => p.id === id);
  if (index !== -1) {
    if (productData.barcode) {
      const cleanBarcode = String(productData.barcode).trim();
      if (cleanBarcode) {
        const existing = products.find((p) => p.id !== id && p.barcode && String(p.barcode).trim().toLowerCase() === cleanBarcode.toLowerCase());
        if (existing) {
          throw new Error(`Ya existe otro producto con el código de barras "${cleanBarcode}" (${existing.name}).`);
        }
      }
    }

    products[index] = {
      ...products[index],
      ...productData,
      stock: Number(productData.stock ?? products[index].stock) || 0,
      minStock: Number(productData.minStock ?? products[index].minStock) || 0,
      costPrice: Number(productData.costPrice ?? products[index].costPrice) || 0,
      salePrice: Number(productData.salePrice ?? products[index].salePrice) || 0,
      wholesalePrice: productData.wholesalePrice !== undefined ? (Number(productData.wholesalePrice) || 0) : (products[index].wholesalePrice || 0),
      trackStock: productData.trackStock !== undefined ? productData.trackStock : (products[index].trackStock !== false),
    };
    saveProducts(products);
    autoBackupDatabase();
    return products[index];
  }
  return null;
}

export function deleteProduct(id) {
  const products = getProducts().filter((p) => p.id !== id);
  saveProducts(products);
  autoBackupDatabase();
  return products;
}

export function deleteProductsBatch(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return getProducts();
  const idSet = new Set(ids);
  const products = getProducts().filter((p) => !idSet.has(p.id));
  saveProducts(products);
  autoBackupDatabase();
  return products;
}

export function bulkUpdatePrices(target, percentage) {
  const products = getProducts();
  const factor = 1 + percentage / 100;
  const isTargetArray = Array.isArray(target);
  const targetSet = isTargetArray ? new Set(target) : null;

  const updated = products.map((p) => {
    let shouldUpdate = false;
    if (isTargetArray) {
      shouldUpdate = targetSet.has(p.id);
    } else if (target === 'todos') {
      shouldUpdate = true;
    } else {
      shouldUpdate = p.category === target;
    }

    if (shouldUpdate) {
      const calculated = p.salePrice * factor;
      const newPrice = roundUpToHundred(calculated);
      let newWholesale = p.wholesalePrice || 0;
      if (newWholesale > 0) {
        newWholesale = roundUpToHundred(newWholesale * factor);
      }
      return { ...p, salePrice: newPrice, wholesalePrice: newWholesale };
    }
    return p;
  });

  saveProducts(updated);
  autoBackupDatabase();
  return updated;
}

/* ==================== VENTAS ==================== */
/**
 * Calculates the next daily ticket number for a specific date (defaults to today).
 * Ticket numbers start at #1 at 00:00:00 every day and increment for that day's sales.
 */
export function getNextDailyTicketNumber(salesList = null, targetDate = new Date()) {
  const allSales = salesList !== null ? salesList : getSales();
  const d = targetDate instanceof Date ? targetDate : new Date(targetDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  const startOfDay = new Date(year, month, day, 0, 0, 0, 0).getTime();
  const endOfDay = new Date(year, month, day, 23, 59, 59, 999).getTime();

  const sameDaySales = (allSales || []).filter((s) => {
    if (!s?.date) return false;
    const t = new Date(s.date).getTime();
    return t >= startOfDay && t <= endOfDay;
  });

  const maxTicket = sameDaySales.reduce((max, s) => {
    const num = Number(s.dailyTicketNumber);
    return !isNaN(num) && num > max ? num : max;
  }, 0);

  return maxTicket + 1;
}

/**
 * Ensures all existing sales in history have a dailyTicketNumber.
 * Groups sales by day and assigns 1, 2, 3... chronologically if missing.
 */
export function backfillDailyTicketNumbers(salesList) {
  if (!Array.isArray(salesList) || salesList.length === 0) return salesList;

  const hasMissing = salesList.some((s) => s && s.dailyTicketNumber === undefined);
  if (!hasMissing) return salesList;

  // Group by local calendar date YYYY-MM-DD
  const daysMap = new Map();
  salesList.forEach((s) => {
    if (!s?.date) return;
    const d = new Date(s.date);
    if (isNaN(d.getTime())) return;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (!daysMap.has(key)) daysMap.set(key, []);
    daysMap.get(key).push(s);
  });

  daysMap.forEach((daySales) => {
    // Sort oldest first
    daySales.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let counter = 1;
    daySales.forEach((sale) => {
      if (sale.dailyTicketNumber != null && !isNaN(Number(sale.dailyTicketNumber))) {
        counter = Math.max(counter, Number(sale.dailyTicketNumber) + 1);
      } else {
        sale.dailyTicketNumber = counter++;
      }
    });
  });

  return salesList;
}

export function getSales() {
  const sales = getStoredItem(STORAGE_KEYS.SALES, []);
  if (Array.isArray(sales) && sales.some((s) => s && s.dailyTicketNumber === undefined)) {
    const upgraded = backfillDailyTicketNumbers(sales);
    setStoredItem(STORAGE_KEYS.SALES, upgraded);
    return upgraded;
  }
  return sales;
}

/* ==================== CLIENTES & CUENTAS CORRIENTES ==================== */
const INITIAL_CLIENTS = [];

export function getClients() {
  ensureDatabaseInitialized();
  let clients = getStoredItem(STORAGE_KEYS.CLIENTS, null);
  if (clients === null) {
    clients = INITIAL_CLIENTS;
    setStoredItem(STORAGE_KEYS.CLIENTS, clients);
  }
  return clients;
}

export function saveClients(clients) {
  setStoredItem(STORAGE_KEYS.CLIENTS, clients);
  return clients;
}

export function addClient(clientData) {
  const clients = getClients();
  const isUnlimited = Boolean(clientData.unlimitedCredit || clientData.creditLimit === null);
  const newClient = {
    id: clientData.id || generateUniqueId('cli'),
    name: clientData.name.trim(),
    phone: (clientData.phone || '').trim(),
    creditLimit: isUnlimited ? null : (Number(clientData.creditLimit) || 10000),
    unlimitedCredit: isUnlimited,
    currentDebt: Number(clientData.currentDebt) || 0,
    notes: (clientData.notes || '').trim(),
  };
  clients.push(newClient);
  saveClients(clients);
  return newClient;
}

export function updateClient(id, updatedFields) {
  const clients = getClients();
  const index = clients.findIndex((c) => c.id === id);
  if (index !== -1) {
    const isUnlimited = updatedFields.unlimitedCredit !== undefined
      ? Boolean(updatedFields.unlimitedCredit)
      : Boolean(clients[index].unlimitedCredit || clients[index].creditLimit === null);

    clients[index] = {
      ...clients[index],
      ...updatedFields,
      unlimitedCredit: isUnlimited,
      creditLimit: isUnlimited
        ? null
        : (updatedFields.creditLimit !== undefined ? Number(updatedFields.creditLimit) : clients[index].creditLimit),
      currentDebt: Number(updatedFields.currentDebt ?? clients[index].currentDebt) || 0,
    };
    saveClients(clients);
    return clients[index];
  }
  return null;
}

export function deleteClient(id) {
  const clients = getClients().filter((c) => c.id !== id);
  saveClients(clients);
  return clients;
}

export function deleteClientsBatch(ids) {
  if (!Array.isArray(ids) || ids.length === 0) return getClients();
  const idSet = new Set(ids);
  const clients = getClients().filter((c) => !idSet.has(c.id));
  saveClients(clients);
  return clients;
}

export function payClientDebt(clientNameOrId, amount) {
  const clients = getClients();
  const index = clients.findIndex((c) => c.id === clientNameOrId || (typeof clientNameOrId === 'string' && c.name.toLowerCase() === clientNameOrId.trim().toLowerCase()));
  if (index !== -1) {
    const paid = Number(amount) || 0;
    clients[index].currentDebt = Math.max(0, clients[index].currentDebt - paid);
    saveClients(clients);
    autoBackupDatabase();
    return clients[index];
  }
  return null;
}

export function addClientDebt(clientNameOrId, amount) {
  const clients = getClients();
  const numericAmount = Number(amount) || 0;
  if (numericAmount <= 0) return null;

  // Search by ID or name
  let target = clients.find((c) => c.id === clientNameOrId || c.name.toLowerCase() === clientNameOrId.trim().toLowerCase());
  
  if (target) {
    target.currentDebt = (target.currentDebt || 0) + numericAmount;
  } else {
    // If not found, create a new client record for this debtor
    target = {
      id: generateUniqueId('cli'),
      name: clientNameOrId.trim(),
      phone: '',
      creditLimit: 20000,
      currentDebt: numericAmount,
      notes: 'Creado automáticamente desde venta fiada'
    };
    clients.push(target);
  }
  saveClients(clients);
  return target;
}

export function recordSale(saleData) {
  const sales = getSales();
  const products = getProducts();
  const config = getConfig();
  const trackInventoryGlobal = config.trackInventory !== false;

  const saleDate = new Date();
  const dailyTicketNumber = getNextDailyTicketNumber(sales, saleDate);

  // Create new sale record
  const newSale = {
    id: generateUniqueId('sale'),
    dailyTicketNumber,
    date: saleDate.toISOString(),
    items: saleData.items, // [{ product, quantity, unitPrice, costPrice, subtotal }]
    total: saleData.total,
    totalCost: saleData.totalCost || 0,
    profit: (saleData.total || 0) - (saleData.totalCost || 0),
    paymentMethod: saleData.paymentMethod || 'efectivo', // efectivo, tarjeta, transferencia, fiado
    clientName: saleData.clientName || 'Consumidor Final',
    cashGiven: saleData.cashGiven || 0,
    changeGiven: saleData.changeGiven || 0,
    notes: saleData.notes || '',
  };

  // Decrement stock for each product sold (only if inventory tracking is enabled globally and for product)
  saleData.items.forEach((item) => {
    const prodIndex = products.findIndex((p) => p.id === item.product.id);
    if (prodIndex !== -1) {
      const prod = products[prodIndex];
      const shouldTrack = trackInventoryGlobal && prod.trackStock !== false;
      if (shouldTrack) {
        prod.stock = Math.max(0, (prod.stock || 0) - item.quantity);
      }
    }
  });

  saveProducts(products);

  // If sale was on credit (fiado), record debt for client
  if (newSale.paymentMethod === 'fiado' && newSale.clientName && newSale.clientName !== 'Consumidor Final') {
    addClientDebt(newSale.clientName, newSale.total);
  }

  sales.unshift(newSale);
  setStoredItem(STORAGE_KEYS.SALES, sales);
  autoBackupDatabase({ sales, products });

  return newSale;
}

export function updateSale(saleId, updatedFields) {
  const sales = getSales();
  const index = sales.findIndex((s) => s.id === saleId);
  if (index === -1) return null;

  const oldSale = sales[index];
  const oldMethod = oldSale.paymentMethod;
  const oldClient = oldSale.clientName || 'Consumidor Final';
  // Total is fixed to original sale total to maintain exact debt and inventory consistency
  const total = Number(oldSale.total) || 0;

  const newMethod = updatedFields.paymentMethod ?? oldMethod;
  const newClient = (updatedFields.clientName ?? oldClient).trim() || 'Consumidor Final';

  // Handle client debt synchronization
  const wasFiado = oldMethod === 'fiado' && oldClient && oldClient !== 'Consumidor Final';
  const isFiado = newMethod === 'fiado' && newClient && newClient !== 'Consumidor Final';

  if (wasFiado && !isFiado) {
    // Revert debt from old client
    payClientDebt(oldClient, oldSale.total);
  } else if (!wasFiado && isFiado) {
    // Add debt to new client
    addClientDebt(newClient, total);
  } else if (wasFiado && isFiado) {
    if (oldClient.toLowerCase() !== newClient.toLowerCase()) {
      // Transferred debt from old client to new client
      payClientDebt(oldClient, oldSale.total);
      addClientDebt(newClient, total);
    } else if (oldSale.total !== total) {
      // Difference in total amount for the same client
      const diff = total - oldSale.total;
      if (diff > 0) {
        addClientDebt(newClient, diff);
      } else if (diff < 0) {
        payClientDebt(newClient, Math.abs(diff));
      }
    }
  }

  // Update sale record
  sales[index] = {
    ...oldSale,
    ...updatedFields,
    paymentMethod: newMethod,
    clientName: newClient,
    total: total,
    date: updatedFields.date || oldSale.date,
    notes: updatedFields.notes !== undefined ? updatedFields.notes : (oldSale.notes || '')
  };

  setStoredItem(STORAGE_KEYS.SALES, sales);
  autoBackupDatabase({ sales });
  return { updatedSale: sales[index], updatedSales: sales };
}

export function deleteSale(saleId) {
  const sales = getSales();
  const index = sales.findIndex((s) => s.id === saleId);
  if (index === -1) return null;

  const sale = sales[index];

  // 1. Restock products in inventory if tracking was active
  const products = getProducts();
  const config = getConfig();
  const trackInventoryGlobal = config.trackInventory !== false;

  if (sale.items && Array.isArray(sale.items)) {
    sale.items.forEach((item) => {
      const prodIndex = products.findIndex((p) => p.id === item.product?.id);
      if (prodIndex !== -1) {
        const prod = products[prodIndex];
        const shouldTrack = trackInventoryGlobal && prod.trackStock !== false;
        if (shouldTrack) {
          prod.stock = (prod.stock || 0) + (Number(item.quantity) || 0);
        }
      }
    });
    saveProducts(products);
  }

  // 2. Revert debt if it was fiado
  if (sale.paymentMethod === 'fiado' && sale.clientName && sale.clientName !== 'Consumidor Final') {
    payClientDebt(sale.clientName, sale.total);
  }

  // 3. Remove sale from sales list
  sales.splice(index, 1);
  setStoredItem(STORAGE_KEYS.SALES, sales);
  autoBackupDatabase({ sales, products });

  return { success: true, updatedSales: sales };
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

  const creditSalesTotal = sessionSales
    .filter((s) => s.paymentMethod === 'fiado')
    .reduce((acc, s) => acc + s.total, 0);

  const totalExpenses = sessionMovements
    .filter((m) => m.type === 'salida')
    .reduce((acc, m) => acc + m.amount, 0);

  // Incomes by payment method: Cash goes into physical drawer, digital does not
  const cashIncomes = sessionMovements
    .filter((m) => m.type === 'ingreso' && (m.paymentMethod === 'efectivo' || !m.paymentMethod))
    .reduce((acc, m) => acc + m.amount, 0);

  const digitalIncomes = sessionMovements
    .filter((m) => m.type === 'ingreso' && m.paymentMethod !== 'efectivo')
    .reduce((acc, m) => acc + m.amount, 0);

  const totalIncomes = cashIncomes + digitalIncomes;

  // Specific debt collections breakdown
  const debtCollectionsCash = sessionMovements
    .filter((m) => m.type === 'ingreso' && m.category === 'debt_payment' && (m.paymentMethod === 'efectivo' || !m.paymentMethod))
    .reduce((acc, m) => acc + m.amount, 0);

  const debtCollectionsDigital = sessionMovements
    .filter((m) => m.type === 'ingreso' && m.category === 'debt_payment' && m.paymentMethod !== 'efectivo')
    .reduce((acc, m) => acc + m.amount, 0);

  const expectedCashInDrawer = session.initialCash + cashSalesTotal + cashIncomes - totalExpenses;
  const difference = Number(countedCash) - expectedCashInDrawer;

  const closingRecord = {
    id: generateUniqueId('close'),
    openedAt: session.openedAt,
    closedAt: new Date().toISOString(),
    operator: session.operator,
    initialCash: session.initialCash,
    cashSalesTotal,
    digitalSalesTotal,
    creditSalesTotal,
    totalSales: cashSalesTotal + digitalSalesTotal + creditSalesTotal,
    totalExpenses,
    cashIncomes,
    digitalIncomes,
    totalIncomes,
    debtCollectionsCash,
    debtCollectionsDigital,
    debtCollectionsTotal: debtCollectionsCash + debtCollectionsDigital,
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
  autoBackupDatabase();

  return closingRecord;
}

export function getCashClosings() {
  return getStoredItem(STORAGE_KEYS.CASH_CLOSINGS, []);
}

export function getCashMovements() {
  return getStoredItem(STORAGE_KEYS.CASH_MOVEMENTS, []);
}

export function addCashMovement(type, amount, reason, paymentMethod = 'efectivo', category = 'general') {
  const movements = getCashMovements();
  const movement = {
    id: generateUniqueId('mov'),
    date: new Date().toISOString(),
    type, // 'ingreso' or 'salida'
    amount: Number(amount) || 0,
    reason: reason || (type === 'salida' ? 'Gasto menor' : 'Ingreso adicional'),
    paymentMethod: paymentMethod || 'efectivo',
    category: category || 'general',
  };
  movements.unshift(movement);
  setStoredItem(STORAGE_KEYS.CASH_MOVEMENTS, movements);
  autoBackupDatabase();
  return movement;
}

/* ==================== CONFIGURACIÓN ==================== */
export function getConfig() {
  ensureDatabaseInitialized();
  const cfg = getStoredItem(STORAGE_KEYS.CONFIG, null);
  if (!cfg) return INITIAL_CONFIG;
  return { ...INITIAL_CONFIG, ...cfg };
}

export function saveConfig(newConfig) {
  const current = getConfig();
  const merged = { ...current, ...newConfig };
  setStoredItem(STORAGE_KEYS.CONFIG, merged);
  return merged;
}

/* ==================== BACKUP & RESTORE ==================== */
export function exportDatabaseJSON() {
  const data = {
    categories: getCategories(),
    products: getProducts(),
    clients: getClients(),
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
    if (data.categories && Array.isArray(data.categories)) {
      setStoredItem(STORAGE_KEYS.CATEGORIES, data.categories);
    }
    if (data.products && Array.isArray(data.products)) {
      setStoredItem(STORAGE_KEYS.PRODUCTS, data.products);
    }
    if (data.clients && Array.isArray(data.clients)) {
      setStoredItem(STORAGE_KEYS.CLIENTS, data.clients);
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

/* ==================== COPIA DE SEGURIDAD AUTOMÁTICA ==================== */
export function autoBackupDatabase(overrides = {}) {
  try {
    const backupData = {
      categories: overrides.categories || getCategories(),
      products: overrides.products || getProducts(),
      clients: overrides.clients || getClients(),
      sales: overrides.sales || getSales(),
      cashSession: overrides.cashSession || getCashSession(),
      cashMovements: overrides.cashMovements || getCashMovements(),
      cashClosings: overrides.cashClosings || getCashClosings(),
      config: overrides.config || getConfig(),
      timestamp: new Date().toISOString(),
      version: '1.0.0',
    };
    setStoredItem(STORAGE_KEYS.AUTO_BACKUP, backupData);
    return backupData;
  } catch (err) {
    console.error('Error during auto backup:', err);
    return null;
  }
}

export function getLatestAutoBackup() {
  return getStoredItem(STORAGE_KEYS.AUTO_BACKUP, null);
}

export function restoreAutoBackup() {
  const backup = getLatestAutoBackup();
  if (!backup) {
    return { success: false, error: 'No se encontró ninguna copia de seguridad automática.' };
  }
  return importDatabaseJSON(JSON.stringify(backup));
}

export function resetDatabase() {
  localStorage.removeItem(STORAGE_KEYS.IS_INITIALIZED);
  localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
  localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
  localStorage.removeItem(STORAGE_KEYS.CLIENTS);
  localStorage.removeItem(STORAGE_KEYS.SALES);
  localStorage.removeItem(STORAGE_KEYS.CASH_SESSION);
  localStorage.removeItem(STORAGE_KEYS.CASH_MOVEMENTS);
  localStorage.removeItem(STORAGE_KEYS.CASH_CLOSINGS);
  localStorage.removeItem(STORAGE_KEYS.CONFIG);
  localStorage.removeItem(STORAGE_KEYS.ACTIVE_CART);
  return getProducts();
}

export function clearDatabaseForProduction() {
  // Mark as initialized so demo data will NEVER re-populate
  setStoredItem(STORAGE_KEYS.IS_INITIALIZED, true);
  // Empty all collections
  setStoredItem(STORAGE_KEYS.PRODUCTS, []);
  setStoredItem(STORAGE_KEYS.CLIENTS, []);
  setStoredItem(STORAGE_KEYS.SALES, []);
  setStoredItem(STORAGE_KEYS.CASH_MOVEMENTS, []);
  setStoredItem(STORAGE_KEYS.CASH_CLOSINGS, []);
  setStoredItem(STORAGE_KEYS.ACTIVE_CART, []);
  // Keep categories and clean cash session
  const cleanSession = {
    isOpen: true,
    openedAt: new Date().toISOString(),
    initialCash: 0,
    operator: 'Turno Mañana',
  };
  setStoredItem(STORAGE_KEYS.CASH_SESSION, cleanSession);
  return { success: true };
}

/* ==================== CARRITO / TICKET ACTIVO ==================== */
export function getActiveCart() {
  return getStoredItem(STORAGE_KEYS.ACTIVE_CART, []);
}

export function saveActiveCart(cart) {
  setStoredItem(STORAGE_KEYS.ACTIVE_CART, cart || []);
}

/* ==================== IMPORTACIÓN MASIVA (CSV / EXCEL / ABARROTES) ==================== */
export function importProductsBulk(importedProducts, mode = 'update-existing') {
  if (!Array.isArray(importedProducts) || importedProducts.length === 0) {
    return { success: false, message: 'No se encontraron productos para importar.' };
  }

  let currentProducts = mode === 'replace-all' ? [] : getProducts();
  const currentCategories = getCategories();
  const categoryMap = new Map();
  currentCategories.forEach((c) => {
    categoryMap.set(c.id.toLowerCase(), c.id);
    categoryMap.set(c.name.toLowerCase(), c.id);
  });

  let addedCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;

  // Map existing barcodes to indices
  const barcodeToIndex = new Map();
  currentProducts.forEach((p, idx) => {
    if (p.barcode && String(p.barcode).trim()) {
      barcodeToIndex.set(String(p.barcode).trim().toLowerCase(), idx);
    }
  });

  const newCategoriesToAdd = [];

  for (const item of importedProducts) {
    if (!item.name || !String(item.name).trim()) {
      skippedCount++;
      continue;
    }

    const cleanBarcode = item.barcode ? String(item.barcode).trim() : '';
    const barcodeKey = cleanBarcode.toLowerCase();

    // Resolve or automatically create category
    let targetCatId = 'general';
    if (item.category && String(item.category).trim()) {
      const catRaw = String(item.category).trim();
      const catKey = catRaw.toLowerCase();
      if (categoryMap.has(catKey)) {
        targetCatId = categoryMap.get(catKey);
      } else {
        // Deterministic ID: based on the slug, not random — prevents creating duplicates on repeated imports
        const slug = catKey.replace(/[^a-z0-9]/gi, '_').slice(0, 20);
        const newCatId = `cat_${slug}`;
        const newCat = {
          id: newCatId,
          name: catRaw,
          icon: 'ShoppingBag'
        };
        newCategoriesToAdd.push(newCat);
        categoryMap.set(catKey, newCatId);
        categoryMap.set(newCatId, newCatId);
        targetCatId = newCatId;
      }
    }

    const existingIndex = barcodeKey ? barcodeToIndex.get(barcodeKey) : undefined;

    if (existingIndex !== undefined && mode !== 'replace-all') {
      if (mode === 'add-only') {
        skippedCount++;
        continue;
      }

      // mode === 'update-existing': Update product fields
      const existing = currentProducts[existingIndex];
      currentProducts[existingIndex] = {
        ...existing,
        name: item.name ? String(item.name).trim() : existing.name,
        category: (targetCatId && targetCatId !== 'general') ? targetCatId : existing.category,
        costPrice: item.costPrice !== undefined && item.costPrice !== '' ? (Number(item.costPrice) || 0) : existing.costPrice,
        salePrice: item.salePrice !== undefined && item.salePrice !== '' ? (Number(item.salePrice) || 0) : existing.salePrice,
        wholesalePrice: item.wholesalePrice !== undefined && item.wholesalePrice !== '' ? (Number(item.wholesalePrice) || 0) : (existing.wholesalePrice || 0),
        stock: item.stock !== undefined && item.stock !== '' ? (Number(item.stock) || 0) : existing.stock,
        minStock: item.minStock !== undefined && item.minStock !== '' ? (Number(item.minStock) || 0) : (existing.minStock || 5),
        unit: item.unit || existing.unit || 'Unidad',
        trackStock: item.trackStock !== undefined ? item.trackStock : (existing.trackStock !== false),
      };
      updatedCount++;
    } else {
      // Add as new product
      const newProduct = {
        id: item.id || generateUniqueId('prod'),
        barcode: cleanBarcode || `GEN-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`,
        name: String(item.name).trim(),
        category: targetCatId,
        costPrice: Number(item.costPrice) || 0,
        salePrice: Number(item.salePrice) || 0,
        wholesalePrice: Number(item.wholesalePrice) || 0,
        stock: Number(item.stock) || 0,
        minStock: item.minStock !== undefined && item.minStock !== '' ? (Number(item.minStock) || 0) : 5,
        unit: item.unit || 'Unidad',
        trackStock: item.trackStock !== false,
      };

      currentProducts.push(newProduct);
      if (cleanBarcode) {
        barcodeToIndex.set(barcodeKey, currentProducts.length - 1);
      }
      addedCount++;
    }
  }

  // Save new categories if any were created
  if (newCategoriesToAdd.length > 0) {
    const updatedCategories = [...currentCategories, ...newCategoriesToAdd];
    saveCategories(updatedCategories);
  }

  saveProducts(currentProducts);
  autoBackupDatabase();

  return {
    success: true,
    addedCount,
    updatedCount,
    skippedCount,
    totalProcessed: importedProducts.length
  };
}

