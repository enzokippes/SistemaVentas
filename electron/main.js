const { app, BrowserWindow, shell, ipcMain, dialog } = require("electron");
const path = require("path");
const Store = require("electron-store");

// Disable GPU sandbox issues on Windows
app.commandLine.appendSwitch("no-sandbox");

const store = new Store({ name: "minimercado-kippes-data" });

const fs = require("fs");

let mainWindow;

function createWindow() {
  const iconPath = path.join(__dirname, "../build/icon.png");
  const fallbackIcon = path.join(__dirname, "../public/favicon.ico");

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 768,
    minWidth: 1024,
    minHeight: 640,
    title: "MiniMercado Kippes - Sistema POS",
    icon: fs.existsSync(iconPath) ? iconPath : fallbackIcon,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    backgroundColor: "#F8FAFC",
    show: false,
    autoHideMenuBar: true,
  });

  const distPath = path.join(__dirname, "../dist/index.html");
  const isDevMode = process.env.ELECTRON_DEV === "1";

  if (isDevMode) {
    mainWindow.loadURL("http://localhost:5173").catch(() => {
      if (fs.existsSync(distPath)) mainWindow.loadFile(distPath);
    });
    mainWindow.webContents.openDevTools({ mode: "detach" });
  } else if (fs.existsSync(distPath)) {
    mainWindow.loadFile(distPath);
  } else {
    mainWindow.loadURL("http://localhost:5173");
  }

  mainWindow.once("ready-to-show", () => {
    mainWindow.show();
    mainWindow.maximize();
  });

  // Open external links in system browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ============================================================
// IPC HANDLERS — electron-store bridge
// ============================================================
ipcMain.handle("store:get", (_event, key, defaultValue) => {
  return store.get(key, defaultValue);
});

ipcMain.handle("store:set", (_event, key, value) => {
  store.set(key, value);
  return true;
});

ipcMain.handle("store:delete", (_event, key) => {
  store.delete(key);
  return true;
});

ipcMain.handle("store:getAll", () => {
  return store.store;
});

ipcMain.handle("store:setAll", (_event, data) => {
  store.store = data;
  return true;
});

ipcMain.handle("store:clear", () => {
  store.clear();
  return true;
});

// App version and lifecycle
ipcMain.handle("app:getVersion", () => app.getVersion());
ipcMain.handle("app:close", () => {
  app.quit();
  return true;
});

// Show save dialog for backup export
ipcMain.handle("dialog:saveFile", async (_event, { defaultPath, filters }) => {
  const { canceled, filePath } = await dialog.showSaveDialog(mainWindow, {
    defaultPath,
    filters,
  });
  if (canceled || !filePath) return null;
  return filePath;
});

// Show open dialog for backup import
ipcMain.handle("dialog:openFile", async (_event, { filters }) => {
  const { canceled, filePaths } = await dialog.showOpenDialog(mainWindow, {
    filters,
    properties: ["openFile"],
  });
  if (canceled || !filePaths.length) return null;
  return filePaths[0];
});

// Write file (for backup export)
ipcMain.handle("fs:writeFile", async (_event, { filePath, content }) => {
  const fs = require("fs");
  try {
    fs.writeFileSync(filePath, content, "utf8");
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
});

// Read file (for backup import)
ipcMain.handle("fs:readFile", async (_event, { filePath }) => {
  const fs = require("fs");
  try {
    const content = fs.readFileSync(filePath, "utf8");
    return { success: true, content };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
