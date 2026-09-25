# MiniMercado Kippes — Retail Point of Sale (POS) & Store Management

[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-purple.svg)](https://vitejs.dev/)
[![Electron](https://img.shields.io/badge/Electron-44-teal.svg)](https://www.electronjs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red.svg)]()

A modern, keyboard-first, offline-ready Point of Sale (POS) and inventory management desktop system designed for retail stores, mini-markets, kiosks, and convenience stores. Built with **React 19**, **Vite**, and **Electron**, featuring instant barcode scanning, dual-tier pricing (retail & wholesale), credit account tracking (*fiados*), and native receipt printing.

---

## 🚀 Key Features

### 🛒 Point of Sale (POS) & Fast Checkout
* **Keyboard-First Workflow:** Optimized for cashier efficiency — complete an entire sale without touching the mouse via hotkeys (`F1` through `F12`).
* **High-Speed Barcode Scanner Support:** Automatic focus and debounced scanner input with intelligent prefix recognition.
* **Wholesale Mode (F11):** Toggle wholesale prices on demand for single items or the entire cart; automatically resets to retail pricing upon checkout to prevent cashier mistakes.
* **Instant Keyboard Checkout (F2):** Auto-focuses and selects the cash input so the cashier can type the payment amount immediately and press `Enter` to finalize.
* **Thermal Ticket Printing:** Compatible with 80mm and 58mm thermal receipt printers via standard print dialog and printable ticket modals.
* **Sequential Daily Ticket Numbers:** Daily consecutive counter (`Ticket #1`, `#2`, ...) that automatically rolls over at midnight without requiring application restarts.

### 🔍 Instant Catalog Search (F10)
* **Virtualized Performance:** Integrated with `react-window` (`FixedSizeList`) to effortlessly render and scroll through 3,800+ products with 0ms delay and 60 FPS smooth scrolling.
* **Pre-Indexed Memory Search:** Token-based searching with accent-insensitive and case-insensitive matching across barcodes, product names, and categories.

### 📦 Inventory & Stock Management
* **Preloaded Catalog:** Includes a comprehensive baseline catalog of over 3,800 retail items classified into standard supermarket categories.
* **Real-Time Stock Tracking:** Automatic inventory decrement on sales, automatic stock restoration upon sale cancellation/deletion, and low-stock warning badges.
* **Bulk Price Adjustments:** Increase or adjust prices by percentage or fixed amount across selected products or entire categories simultaneously.
* **CSV / Excel Import & Export:** Bulk import products from spreadsheet files with conflict resolution (update existing or replace catalog).

### 👥 Customer Accounts & Store Credit (*Cuentas Corrientes / Fiados*)
* **Store Credit Management:** Full support for *fiado* (customer credit accounts) with configurable credit limits and debt tracking.
* **Debt Payments:** Dedicated debt collection modal with payment method selection (cash, transfer, debit).
* **Automatic Ledger Balance:** Seamless debt recalculation when editing or deleting past transactions.

### 💵 Daily Cash Register & Shift Auditing (*Caja Diaria*)
* **Shift Opening & Closing:** Record opening cash float, view live totals, and track expected vs. physical cash with difference breakdown.
* **Cash Movements:** Quick keyboard shortcuts for cash inflows (`F7`) and cash withdrawals (`F8`) with custom descriptions.
* **Historical Closings Log:** Audit past shifts and print closing reports.

### 📊 Reports & Sales Analytics
* **Daily & Periodic Breakdown:** Filter sales by custom date range, cashier shift, or payment method.
* **Profit Margin Analysis:** Calculates revenue, estimated merchandise cost, and gross profit margins.
* **Monthly Comparison Modal:** Compare sales performance across different calendar months.
* **Safe Transaction Editing:** Modify payment method or customer association on closed tickets with strict total immutability to protect debt balances.

### 🛡️ Data Security & Dual Persistence
* **Offline-First Storage:** Operates completely offline without external cloud dependencies.
* **Dual Persistence Layer:** Seamlessly synchronizes state across browser `localStorage` and native `electron-store` files.
* **Instant Automatic Backups:** Creates memory-safe JSON backups on every critical operation (sales, inventory changes, debt payments).
* **Pendrive / External Backup:** One-click JSON backup export and restore directly from Settings.
* **Production Factory Reset:** Clean slate reset option to clear test records while keeping product catalog structures intact.

---

## ⌨️ Keyboard Shortcuts (Atajos de Teclado)

| Key | Module / Action | Description |
|:---:|:---|:---|
| **F1** | POS Workspace | Switch to sales screen / focus barcode input |
| **F2** | Complete Sale | Open checkout modal / confirm sale |
| **F3** | Inventory | Open inventory and stock table |
| **F4** | Customers | Open customer accounts and store credit (*fiados*) |
| **F5** | Cash Register | Open daily cash shift and movements |
| **F6** | Reports | Open sales history and metrics |
| **F7** | Cash Inflow | Register cash entering the till (*Ingreso*) |
| **F8** | Cash Outflow | Register cash leaving the till (*Salida / Retiro*) |
| **F9** | Close Cash Register | Trigger quick cash shift closing |
| **F10** | Catalog Search | Open instant virtualized product lookup |
| **F11** | Wholesale Toggle | Toggle wholesale pricing mode on active ticket |
| **F12** | Direct Checkout | Quick access to payment method dialog |
| **+ / -** | Quantity Adjustment | Increment / decrement selected ticket item |
| **Del** | Remove Item | Delete selected or last product from cart |
| **Esc** | Close / Cancel | Dismiss active modal or clear selection |

---

## 🛠️ Tech Stack

* **Frontend Framework:** [React 19](https://react.dev/)
* **Build Tool & Bundler:** [Vite 8](https://vitejs.dev/)
* **Desktop Wrapper:** [Electron 44](https://www.electronjs.org/)
* **Application Packager:** [electron-builder 26](https://www.electron.build/)
* **Virtualization:** [react-window](https://github.com/bvaughn/react-window)
* **Icons:** [Lucide React](https://lucide.dev/)
* **Spreadsheet Processing:** [SheetJS (xlsx)](https://sheetjs.com/)
* **Code Linter:** [Oxlint](https://oxc.rs/)
* **Styles:** Custom Vanilla CSS Design System with high-contrast retail tokens

---

## 📦 Getting Started

### Prerequisites
* [Node.js](https://nodejs.org/) (version 18 or higher recommended)
* [npm](https://www.npmjs.com/)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/enzokippes/SistemaVentas.git
   cd SistemaVentas
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

### Development
* **Run in browser mode (Vite Dev Server):**
  ```bash
  npm run dev
  ```
* **Run in desktop mode (Electron):**
  ```bash
  npm run electron:dev
  ```

### Production Build
* **Compile web bundle:**
  ```bash
  npm run build
  ```
* **Build standalone Windows unpacked executable:**
  ```bash
  npm run dist:dir
  ```
  *Output binary located at:* `dist-electron/win-unpacked/MiniMercado Kippes.exe`

* **Build Windows NSIS installer and portable executable:**
  ```bash
  npm run dist
  ```
  *Installers generated inside:* `dist-electron/`

---

## 📁 Project Structure

```text
SistemaVentas/
├── build/                     # Application icons and NSIS installer resources
├── electron/                  # Electron main and preload scripts
│   ├── main.js                # App lifecycle, window configuration & store IPC
│   └── preload.js             # Safe context bridge for native storage APIs
├── public/                    # Static assets and favicons
├── src/
│   ├── components/
│   │   ├── CashRegister/      # Daily cash float, session management & closings
│   │   ├── Categories/        # Category administration and badge filters
│   │   ├── Common/            # Reusable modal backdrops and error boundaries
│   │   ├── Customers/         # Customer database, credit limits & debt repayment
│   │   ├── Inventory/         # Stock table, bulk pricing & product modals
│   │   ├── POS/               # Checkout, F10 virtual catalog, ticket receipt & POS
│   │   ├── Reports/           # Analytics, monthly comparisons & sale editor
│   │   ├── Settings/          # Store profile, CSV import, backups & factory reset
│   │   ├── Sidebar.jsx        # Navigation sidebar with status badges
│   │   └── TopHeader.jsx      # Top header with time, active shift and quick actions
│   ├── data/
│   │   ├── initialCatalog.json# 3,800+ item master catalog
│   │   ├── initialData.js     # Default category structures & store configuration
│   │   └── storage.js         # Unified persistence, business logic & debt ledgers
│   ├── App.jsx                # Core state container, global hotkeys & tab router
│   ├── index.css              # Retail design system with high-contrast tokens
│   └── main.jsx               # Application entry point
├── electron-builder.yml       # Electron distribution configuration
├── package.json               # Project manifest and scripts
├── vite.config.mjs            # Vite configuration
└── README.md                  # Project documentation
```

---

## 📄 License
Proprietary software developed for MiniMercado Kippes / BarbaNegra. All rights reserved.
