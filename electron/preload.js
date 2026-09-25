const { contextBridge, ipcRenderer } = require("electron");

// Expose safe IPC bridge to renderer
contextBridge.exposeInMainWorld("electronAPI", {
  // Store operations
  store: {
    get:    (key, def)  => ipcRenderer.invoke("store:get", key, def),
    set:    (key, val)  => ipcRenderer.invoke("store:set", key, val),
    delete: (key)       => ipcRenderer.invoke("store:delete", key),
    getAll: ()          => ipcRenderer.invoke("store:getAll"),
    setAll: (data)      => ipcRenderer.invoke("store:setAll", data),
    clear:  ()          => ipcRenderer.invoke("store:clear"),
  },

  // App info
  getVersion: () => ipcRenderer.invoke("app:getVersion"),

  // File dialogs
  saveFileDialog: (opts) => ipcRenderer.invoke("dialog:saveFile", opts),
  openFileDialog: (opts) => ipcRenderer.invoke("dialog:openFile", opts),

  // File system
  writeFile: (opts) => ipcRenderer.invoke("fs:writeFile", opts),
  readFile:  (opts) => ipcRenderer.invoke("fs:readFile", opts),

  // App lifecycle
  closeApp:  () => ipcRenderer.invoke("app:close"),
});

// Signal to app that it is running inside Electron
contextBridge.exposeInMainWorld("__isElectron", true);
