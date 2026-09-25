import initialCatalog from './initialCatalog.json';

export const CATEGORIES = initialCatalog.categories && initialCatalog.categories.length > 0 
  ? initialCatalog.categories 
  : [
      { id: 'todos', name: 'Todos los Productos', icon: 'LayoutGrid' },
      { id: 'general', name: 'General', icon: 'ShoppingBag' }
    ];

export const INITIAL_PRODUCTS = initialCatalog.products && initialCatalog.products.length > 0 
  ? initialCatalog.products 
  : [];

export const INITIAL_CONFIG = {
  storeName: 'MiniMercado Kippes',
  address: 'Av. Principal 1234',
  phone: '351-555-1234',
  ticketFooter: '¡Gracias por su compra! Vuelva pronto.',
  currencySymbol: '$',
  alertLowStock: true,
  trackInventory: true,
  showCashModule: true,
  theme: 'default'
};
