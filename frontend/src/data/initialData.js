export const CATEGORIES = [
  { id: 'todos', name: 'Todos los Productos', icon: 'LayoutGrid', color: 'bg-slate-700 text-white' },
  { id: 'despensa', name: 'Despensa / Almacén', icon: 'ShoppingBag', color: 'bg-amber-600 text-white' },
  { id: 'cigarrillos', name: 'Cigarrillos & Tabaco', icon: 'Flame', color: 'bg-rose-600 text-white' },
  { id: 'medicamentos', name: 'Medicamentos Venta Libre', icon: 'Pill', color: 'bg-emerald-600 text-white' },
  { id: 'golosinas', name: 'Golosinas & Snacks', icon: 'Candy', color: 'bg-purple-600 text-white' },
  { id: 'bebidas', name: 'Bebidas & Frías', icon: 'Coffee', color: 'bg-blue-600 text-white' },
  { id: 'variedades', name: 'Variedades & Bazar', icon: 'Package', color: 'bg-teal-600 text-white' },
];

export const INITIAL_PRODUCTS = [
  // CIGARRILLOS
  {
    id: 'cig-001',
    barcode: '779123456001',
    name: 'Marlboro Box 20',
    category: 'cigarrillos',
    costPrice: 2400,
    salePrice: 2800,
    stock: 25,
    minStock: 10,
    unit: 'Atado'
  },
  {
    id: 'cig-002',
    barcode: '779123456002',
    name: 'Philip Morris Box 20',
    category: 'cigarrillos',
    costPrice: 2100,
    salePrice: 2500,
    stock: 18,
    minStock: 10,
    unit: 'Atado'
  },
  {
    id: 'cig-003',
    barcode: '779123456003',
    name: 'Chesterfield Original 20',
    category: 'cigarrillos',
    costPrice: 1700,
    salePrice: 2100,
    stock: 8,
    minStock: 10,
    unit: 'Atado'
  },
  {
    id: 'cig-004',
    barcode: '779123456004',
    name: 'Lucky Strike Convert Box 20',
    category: 'cigarrillos',
    costPrice: 1900,
    salePrice: 2300,
    stock: 14,
    minStock: 8,
    unit: 'Atado'
  },

  // MEDICAMENTOS
  {
    id: 'med-001',
    barcode: '779200001',
    name: 'Ibuprofeno 400mg (Blíster x10)',
    category: 'medicamentos',
    costPrice: 900,
    salePrice: 1600,
    stock: 20,
    minStock: 5,
    unit: 'Blíster'
  },
  {
    id: 'med-002',
    barcode: '779200002',
    name: 'Paracetamol 500mg (Blíster x10)',
    category: 'medicamentos',
    costPrice: 800,
    salePrice: 1400,
    stock: 15,
    minStock: 5,
    unit: 'Blíster'
  },
  {
    id: 'med-003',
    barcode: '779200003',
    name: 'Bayaspirina 500mg (Blíster x10)',
    category: 'medicamentos',
    costPrice: 1100,
    salePrice: 1800,
    stock: 12,
    minStock: 5,
    unit: 'Blíster'
  },
  {
    id: 'med-004',
    barcode: '779200004',
    name: 'Curitas Adhesivas Sanitarias (Pack x10)',
    category: 'medicamentos',
    costPrice: 600,
    salePrice: 1200,
    stock: 4,
    minStock: 6,
    unit: 'Pack'
  },
  {
    id: 'med-005',
    barcode: '779200005',
    name: 'Alikal Sobres Efervescentes',
    category: 'medicamentos',
    costPrice: 450,
    salePrice: 900,
    stock: 30,
    minStock: 10,
    unit: 'Sobre'
  },

  // DESPENSA / ALMACEN
  {
    id: 'des-001',
    barcode: '779300001',
    name: 'Yerba Playadito 500g',
    category: 'despensa',
    costPrice: 1800,
    salePrice: 2500,
    stock: 15,
    minStock: 5,
    unit: 'Unidad'
  },
  {
    id: 'des-002',
    barcode: '779300002',
    name: 'Azúcar Ledesma Clásica 1kg',
    category: 'despensa',
    costPrice: 850,
    salePrice: 1250,
    stock: 20,
    minStock: 8,
    unit: 'Paquete'
  },
  {
    id: 'des-003',
    barcode: '779300003',
    name: 'Fideos Lucchetti Guiseros 500g',
    category: 'despensa',
    costPrice: 800,
    salePrice: 1200,
    stock: 22,
    minStock: 10,
    unit: 'Paquete'
  },
  {
    id: 'des-004',
    barcode: '779300004',
    name: 'Puré de Tomate Arcor 520g',
    category: 'despensa',
    costPrice: 600,
    salePrice: 950,
    stock: 18,
    minStock: 6,
    unit: 'Caja'
  },
  {
    id: 'des-005',
    barcode: '779300005',
    name: 'Leche Entera La Serenísima 1L',
    category: 'despensa',
    costPrice: 1100,
    salePrice: 1500,
    stock: 12,
    minStock: 6,
    unit: 'Sachet'
  },
  {
    id: 'des-006',
    barcode: '779300006',
    name: 'Galletitas Chocolinas 250g',
    category: 'despensa',
    costPrice: 1300,
    salePrice: 1900,
    stock: 16,
    minStock: 6,
    unit: 'Paquete'
  },

  // BEBIDAS
  {
    id: 'beb-001',
    barcode: '779400001',
    name: 'Coca Cola Original 500ml',
    category: 'bebidas',
    costPrice: 1100,
    salePrice: 1700,
    stock: 24,
    minStock: 12,
    unit: 'Botella'
  },
  {
    id: 'beb-002',
    barcode: '779400002',
    name: 'Coca Cola Original 1.5L',
    category: 'bebidas',
    costPrice: 1800,
    salePrice: 2600,
    stock: 14,
    minStock: 6,
    unit: 'Botella'
  },
  {
    id: 'beb-003',
    barcode: '779400003',
    name: 'Agua Mineral Villavicencio sin gas 500ml',
    category: 'bebidas',
    costPrice: 650,
    salePrice: 1100,
    stock: 20,
    minStock: 8,
    unit: 'Botella'
  },
  {
    id: 'beb-004',
    barcode: '779400004',
    name: 'Cerveza Quilmes Clásica Lata 473ml',
    category: 'bebidas',
    costPrice: 1200,
    salePrice: 1800,
    stock: 30,
    minStock: 12,
    unit: 'Lata'
  },

  // GOLOSINAS & SNACKS
  {
    id: 'gol-001',
    barcode: '779500001',
    name: 'Alfajor Guaymallén Triple Chocolate',
    category: 'golosinas',
    costPrice: 350,
    salePrice: 600,
    stock: 48,
    minStock: 15,
    unit: 'Unidad'
  },
  {
    id: 'gol-002',
    barcode: '779500002',
    name: 'Alfajor Havanna / Milka Mousse',
    category: 'golosinas',
    costPrice: 900,
    salePrice: 1500,
    stock: 20,
    minStock: 10,
    unit: 'Unidad'
  },
  {
    id: 'gol-003',
    barcode: '779500003',
    name: 'Chicles Beldent Menta Fuerte',
    category: 'golosinas',
    costPrice: 400,
    salePrice: 750,
    stock: 35,
    minStock: 15,
    unit: 'Pack'
  },
  {
    id: 'gol-004',
    barcode: '779500004',
    name: 'Papas Fritas Lays Clásicas 85g',
    category: 'golosinas',
    costPrice: 1200,
    salePrice: 1800,
    stock: 10,
    minStock: 6,
    unit: 'Bolsa'
  },

  // VARIEDADES & BAZAR
  {
    id: 'var-001',
    barcode: '779600001',
    name: 'Encendedor Bic Chico',
    category: 'variedades',
    costPrice: 800,
    salePrice: 1400,
    stock: 25,
    minStock: 8,
    unit: 'Unidad'
  },
  {
    id: 'var-002',
    barcode: '779600002',
    name: 'Pilas Energizer AA (Pack x2)',
    category: 'variedades',
    costPrice: 1400,
    salePrice: 2200,
    stock: 12,
    minStock: 5,
    unit: 'Pack'
  },
  {
    id: 'var-003',
    barcode: '779600003',
    name: 'Pegamento La Gotita 2ml',
    category: 'variedades',
    costPrice: 950,
    salePrice: 1600,
    stock: 8,
    minStock: 4,
    unit: 'Unidad'
  },
  {
    id: 'var-004',
    barcode: '779600004',
    name: 'Preservativos Prime Clásicos (Pack x3)',
    category: 'variedades',
    costPrice: 2200,
    salePrice: 3400,
    stock: 9,
    minStock: 4,
    unit: 'Caja'
  },
  {
    id: 'var-005',
    barcode: '779600005',
    name: 'Pañuelos Descartables Elite (Pack)',
    category: 'variedades',
    costPrice: 350,
    salePrice: 650,
    stock: 16,
    minStock: 6,
    unit: 'Paquete'
  }
];

export const INITIAL_CONFIG = {
  storeName: 'Mi Kiosco & Despensa',
  address: 'Av. Principal 1234',
  phone: '351-555-1234',
  ticketFooter: '¡Gracias por su compra! Vuelva pronto.',
  currencySymbol: '$',
  alertLowStock: true
};
