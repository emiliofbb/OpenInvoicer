const { ipcRenderer, contextBridge } = require("electron");

contextBridge.exposeInMainWorld("api", {
  getCompanyInfo: (callback) => ipcRenderer.on("get-company", callback),

  getLogo: (args) => ipcRenderer.invoke("select-logo", args),

  sendCompanyInfo: (args) => ipcRenderer.invoke("company-info", args),

  createInvoice: (args) => ipcRenderer.invoke("create-invoice", args),

  saveInvoice: (args) => ipcRenderer.invoke("save-invoice", args),

  openWindow: (args) => ipcRenderer.send("open-window", args),

  handleGetInvoiceInfo: (callback) =>
    ipcRenderer.on("get-invoice-info", callback),

  loadInvoices: (callback) => ipcRenderer.on("load-invoices", callback),
});
