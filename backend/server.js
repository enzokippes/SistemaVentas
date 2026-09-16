const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Database path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initial seed data if DB does not exist
const INITIAL_DATA = {
  config: {
    storeName: 'MiniMercado Kippes',
    address: 'Av. Principal 1234',
    phone: '351-555-1234',
    ticketFooter: '¡Gracias por su compra! Vuelva pronto.',
    currencySymbol: '$'
  },
  categories: [
    { id: 'todos', name: 'Todos los Productos', icon: 'LayoutGrid' },
    { id: 'despensa', name: 'Despensa / Almacén', icon: 'ShoppingBag' },
    { id: 'cigarrillos', name: 'Cigarrillos & Tabaco', icon: 'Flame' },
    { id: 'medicamentos', name: 'Medicamentos Venta Libre', icon: 'Pill' },
    { id: 'golosinas', name: 'Golosinas & Snacks', icon: 'Candy' },
    { id: 'bebidas', name: 'Bebidas & Frías', icon: 'Coffee' },
    { id: 'variedades', name: 'Variedades & Bazar', icon: 'Package' }
  ],
  products: [
    { id: 'cig-001', barcode: '779123456001', name: 'Marlboro Box 20', category: 'cigarrillos', costPrice: 2400, salePrice: 2800, stock: 25, minStock: 10, unit: 'Atado' },
    { id: 'cig-002', barcode: '779123456002', name: 'Philip Morris Box 20', category: 'cigarrillos', costPrice: 2100, salePrice: 2500, stock: 18, minStock: 10, unit: 'Atado' },
    { id: 'med-001', barcode: '779200001', name: 'Ibuprofeno 400mg (Blíster x10)', category: 'medicamentos', costPrice: 900, salePrice: 1600, stock: 20, minStock: 5, unit: 'Blíster' },
    { id: 'des-001', barcode: '779300001', name: 'Yerba Playadito 500g', category: 'despensa', costPrice: 1800, salePrice: 2500, stock: 15, minStock: 5, unit: 'Unidad' },
    { id: 'beb-001', barcode: '779400001', name: 'Coca Cola Original 500ml', category: 'bebidas', costPrice: 1100, salePrice: 1700, stock: 24, minStock: 12, unit: 'Botella' },
    { id: 'gol-001', barcode: '779500001', name: 'Alfajor Guaymallén Triple Chocolate', category: 'golosinas', costPrice: 350, salePrice: 600, stock: 48, minStock: 15, unit: 'Unidad' }
  ],
  sales: [],
  cashMovements: [],
  clients: [
    { id: 'cli-1', name: 'Don Carlos (Vecino)', phone: '351-555-4321', creditLimit: 25000, currentDebt: 5800, notes: 'Paga los días 5 de cada mes' },
    { id: 'cli-2', name: 'Mariana (Piso 3A)', phone: '351-555-8899', creditLimit: 15000, currentDebt: 2400, notes: 'Paga con transferencia' }
  ]
};

function readDatabase() {
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify(INITIAL_DATA, null, 2), 'utf-8');
    return INITIAL_DATA;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading database file:', err);
    return INITIAL_DATA;
  }
}

function writeDatabase(data) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing database file:', err);
    return false;
  }
}

/* ================= ROUTES ================= */

// Healthcheck
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', store: 'MiniMercado Kippes Backend' });
});

// Products
app.get('/api/products', (req, res) => {
  const db = readDatabase();
  res.json(db.products || []);
});

app.post('/api/products', (req, res) => {
  const db = readDatabase();
  const newProduct = {
    ...req.body,
    id: req.body.id || `prod_${Date.now()}`,
    stock: Number(req.body.stock) || 0,
    costPrice: Number(req.body.costPrice) || 0,
    salePrice: Number(req.body.salePrice) || 0
  };
  db.products.unshift(newProduct);
  writeDatabase(db);
  res.status(201).json(newProduct);
});

app.put('/api/products/:id', (req, res) => {
  const db = readDatabase();
  const index = db.products.findIndex(p => p.id === req.params.id);
  if (index !== -1) {
    db.products[index] = { ...db.products[index], ...req.body };
    writeDatabase(db);
    res.json(db.products[index]);
  } else {
    res.status(404).json({ error: 'Producto no encontrado' });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const db = readDatabase();
  db.products = db.products.filter(p => p.id !== req.params.id);
  writeDatabase(db);
  res.json({ success: true });
});

// Categories
app.get('/api/categories', (req, res) => {
  const db = readDatabase();
  res.json(db.categories || []);
});

app.post('/api/categories', (req, res) => {
  const db = readDatabase();
  const newCat = {
    ...req.body,
    id: req.body.id || `cat_${Date.now()}`
  };
  db.categories.push(newCat);
  writeDatabase(db);
  res.status(201).json(newCat);
});

app.put('/api/categories/:id', (req, res) => {
  const db = readDatabase();
  const index = db.categories.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    db.categories[index] = { ...db.categories[index], ...req.body };
    writeDatabase(db);
    res.json(db.categories[index]);
  } else {
    res.status(404).json({ error: 'Categoría no encontrada' });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  const db = readDatabase();
  db.categories = db.categories.filter(c => c.id !== req.params.id);
  writeDatabase(db);
  res.json({ success: true });
});

// Sales
app.get('/api/sales', (req, res) => {
  const db = readDatabase();
  res.json(db.sales || []);
});

app.post('/api/sales', (req, res) => {
  const db = readDatabase();
  const sale = {
    id: `sale_${Date.now()}`,
    date: new Date().toISOString(),
    ...req.body
  };

  // Decrement product stock
  if (Array.isArray(sale.items)) {
    sale.items.forEach(item => {
      const prod = db.products.find(p => p.id === item.product.id);
      if (prod) {
        prod.stock = Math.max(0, (prod.stock || 0) - item.quantity);
      }
    });
  }

  db.sales.unshift(sale);
  writeDatabase(db);
  res.status(201).json(sale);
});

// Clients
app.get('/api/clients', (req, res) => {
  const db = readDatabase();
  res.json(db.clients || []);
});

app.post('/api/clients', (req, res) => {
  const db = readDatabase();
  const newClient = {
    id: `cli_${Date.now()}`,
    ...req.body
  };
  db.clients.push(newClient);
  writeDatabase(db);
  res.status(201).json(newClient);
});

app.put('/api/clients/:id', (req, res) => {
  const db = readDatabase();
  const index = db.clients.findIndex(c => c.id === req.params.id);
  if (index !== -1) {
    db.clients[index] = { ...db.clients[index], ...req.body };
    writeDatabase(db);
    res.json(db.clients[index]);
  } else {
    res.status(404).json({ error: 'Cliente no encontrado' });
  }
});

// Cash movements
app.get('/api/cash/movements', (req, res) => {
  const db = readDatabase();
  res.json(db.cashMovements || []);
});

app.post('/api/cash/movements', (req, res) => {
  const db = readDatabase();
  const mov = {
    id: `mov_${Date.now()}`,
    date: new Date().toISOString(),
    ...req.body
  };
  db.cashMovements.unshift(mov);
  writeDatabase(db);
  res.status(201).json(mov);
});

// Config
app.get('/api/config', (req, res) => {
  const db = readDatabase();
  res.json(db.config || {});
});

app.post('/api/config', (req, res) => {
  const db = readDatabase();
  db.config = { ...db.config, ...req.body };
  writeDatabase(db);
  res.json(db.config);
});

app.listen(PORT, () => {
  console.log(`Backend MiniMercado Kippes corriendo en http://localhost:${PORT}`);
});
