const { app, BrowserWindow, ipcMain, dialog } = require("electron");
const path = require("path");
const fs = require("fs");
let cheerio = require("cheerio");
const puppeteer = require("puppeteer");
const currency = require("currency.js");

const Store = require("./utils/Store.js");

const companyStore = new Store("company-store");
const invoicesStore = new Store("invoices-store");

//Manage first boot problems
if (require("electron-squirrel-startup")) app.quit();

let homeWin = null;

if (invoicesStore.get("last-id") === false) {
  invoicesStore.set("last-id", 0);
}

function handleSaveCompanyInfo(event, args) {
  if (args === undefined) {
    companyStore.set("company-info", args);
    return;
  }
  args.logoBase64 = companyStore.get("company-info").logoBase64;
  if (!companyStore.set("company-info", args)) {
    return {
      error: true,
      description: "Error en el guardado. Inténtelo de nuevo más tarde.",
    };
  }

  return {
    error: false,
    description: "Información guardada correctamente.",
  };
}

function getCompanyInfo(event, args) {
  return companyStore.get("company-info");
}

async function handleLogoSelection(event, args) {
  const rest = await dialog
    .showOpenDialog({
      title: "Seleccione un Logo",
      properties: ["openFile"],
      filters: [{ name: "Images", extensions: ["jpg", "png"] }],
    })
    .then((result) => {
      if (result.filePaths.length === 0 || result.canceled) {
        return "";
      } else {
        return result.filePaths[0];
      }
    });

  if (rest === "") {
    return "";
  }
  var companyInfo = companyStore.get("company-info");
  if (companyInfo === false) {
    companyInfo = {};
  }
  const logoBase64 = fs.readFileSync(rest).toString("base64");
  companyInfo.logoBase64 = logoBase64;
  companyStore.set("company-info", companyInfo);
  return logoBase64;
}

async function handleOpenWindow(event, args) {
  createWindow(args.window, args.dependencies);
}

function createAddress(address, city, country) {
  var addressTotal = address;

  if (city !== "" && country !== "") {
    addressTotal = addressTotal + ", <br/>" + city + ", " + country;
  }
  if (city === "" && country !== "") {
    addressTotal = addressTotal + ", <br/>" + country;
  }
  if (country === "" && city !== "") {
    addressTotal = addressTotal + ", <br/>" + city;
  }

  return addressTotal;
}

async function createPDF(html, path) {
  // Create a browser instance
  const browser = await puppeteer.launch();

  // Create a new page
  const page = await browser.newPage();

  //Get HTML content from HTML
  await page.setContent(html, { waitUntil: "domcontentloaded" });

  // To reflect CSS used for screens instead of print
  await page.emulateMediaType("screen");

  // Downlaod the PDF
  const pdf = await page.pdf({
    path: path,
    margin: { top: "10px", right: "50px", bottom: "10px", left: "50px" },
    printBackground: true,
    format: "A4",
  });

  // Close the browser instance
  await browser.close();
}

function saveInvoice(args) {
  const id = invoicesStore.get("last-id");
  var idReturned = id;
  var invoices = invoicesStore.get("invoices");
  var isNewInvoice = true;
  if (!invoices) {
    invoices = {};
  }
  if (args.id in invoices && args.id !== -1 && args.id !== undefined) {
    idReturned = args.id;
    isNewInvoice = false;
    invoices[args.id] = args;
  } else {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = "0" + dd;
    if (mm < 10) mm = "0" + mm;
    args.creationDate = dd + "/" + mm + "/" + yyyy;
    args.id = id;
    invoices[id] = args;
    const idSaveResult = invoicesStore.set("last-id", id + 1);
    if (!idSaveResult) {
      return {
        id: -1,
        error: true,
        description: "Error en el guardado. Inténtelo de nuevo más tarde.",
      };
    }
  }
  const invoiceIsSaved = invoicesStore.set("invoices", invoices);
  if (!invoiceIsSaved) {
    invoicesStore.set("last-id", id);
    if (isNewInvoice) {
      return {
        id: -1,
        error: true,
        description: "Error en el guardado. Inténtelo de nuevo más tarde.",
      };
    } else {
      return {
        id: args.id,
        error: true,
        description: "Error en el guardado. Inténtelo de nuevo más tarde.",
      };
    }
  }

  if (homeWin) {
    homeWin.webContents.send("load-invoices", loadInvoices());
  }

  return {
    id: args.id,
    error: false,
    description: "Documento guardado correctamente.",
  };
}

async function handleSaveInvoice(event, args) {
  return saveInvoice(args);
}

async function generateInvoice(event, args) {
  const companyInfo = getCompanyInfo();
  const docType = args.docType;
  const customer = args.client;
  const products = args.products;

  const today = new Date();
  const yyyy = today.getFullYear();
  let mm = today.getMonth() + 1; // Months start at 0!
  let dd = today.getDate();

  if (dd < 10) dd = "0" + dd;
  if (mm < 10) mm = "0" + mm;

  const rest = await dialog
    .showSaveDialog({
      title: "Guardado",
      filters: [{ name: "Document", extensions: ["pdf"] }],
    })
    .then((result) => {
      if (result.filePath.length === 0 || result.canceled) {
        return "";
      } else {
        return result.filePath;
      }
    });

  let invoiceName = customer.name + dd + mm + yyyy + ".pdf";
  if (rest !== "") {
    invoiceName = rest;
  }

  const htmlString = fs.readFileSync(
    path.join(app.getAppPath(), "./invoices/index.html"),
    "utf-8"
  );

  const $ = cheerio.load(htmlString);

  $("#doc-type").text(docType);

  // Company info insert

  const addressTotal = createAddress(
    companyInfo.address,
    companyInfo.city,
    companyInfo.country
  );
  $("#logo-img").attr("src", `data:image/jgp;base64,${companyInfo.logoBase64}`);
  $("#company-name").text(companyInfo.name);
  $("#company-address").append(addressTotal);
  $("#company-tel").text(companyInfo.phone);
  $("#company-mail").text(companyInfo.email);
  $("#company-mail").attr("href", "mailto:" + companyInfo.email);

  //Customer info insert
  const finalCustomerAddress = createAddress(
    customer.address,
    customer.city,
    customer.country
  );
  $("#client-name").append("<span>CLIENTE:</span> " + customer.name);
  $("#client-address").append(
    "<span>DIRECCIÓN:</span> " + finalCustomerAddress
  );
  $("#emision-date").append(
    "<span>FECHA:</span> " + dd + "/" + mm + "/" + yyyy
  );

  const currencyOptions = { symbol: "€", decimal: ",", separator: "." };

  var subtotal = currency(0, currencyOptions);

  //PRODS info insert
  products.forEach((prod, i) => {
    const unitPrice = currency(prod.price, currencyOptions);
    const prodPrice = unitPrice.multiply(prod.quantity);
    subtotal = subtotal.add(prodPrice);
    const row = `<tr>
      <td class="service">${i}</td>
      <td class="desc">
        ${prod.description}
      </td>
      <td class="unit">${unitPrice.format()}</td>
      <td class="qty">${prod.quantity}</td>
      <td class="total">${prodPrice.format()}</td>
  </tr>`;
    $("#row-nt").before(row);
  });

  const taxValue = subtotal.multiply(0.21);
  $("#total-no-tax").text(subtotal.format());
  $("#tax-val").text(taxValue.format());
  $("#total-final").text(subtotal.add(taxValue).format());

  await createPDF($.html(), invoiceName);

  return saveInvoice(args);
}

function loadInvoices() {
  return invoicesStore.get("invoices");
}

const createWindow = (windowName, dependencies) => {
  const win = new BrowserWindow({
    width: 1100,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
    },
  });

  win.menuBarVisible = false;
  win.autoHideMenuBar = false;

  switch (windowName) {
    case "home-window":
      //win.webContents.send("get-lasts-invoices", getLastsInvoices());
      win.loadFile("./src/home/index.html");
      win.webContents.addListener("did-finish-load", (ev, input) => {
        win.webContents.send("load-invoices", loadInvoices());
      });
      break;
    case "new-invoice-window":
      win.loadFile("./src/invoice-form/index.html");
      break;
    case "company-info-window":
      win.loadFile("./src/company-form/index.html");
      win.webContents.addListener("did-finish-load", (ev, input) => {
        win.webContents.send("get-company", getCompanyInfo());
      });
      break;
    case "invoice-window":
      win.loadFile("./src/invoice-form/index.html");
      win.webContents.addListener("did-finish-load", (ev, input) => {
        win.webContents.send(
          "get-invoice-info",
          invoicesStore.get("invoices")[dependencies]
        );
      });
      break;
    default:
      break;
  }
  //win.webContents.openDevTools();

  return win;
};

app.whenReady().then(() => {
  ipcMain.handle("company-info", handleSaveCompanyInfo);
  ipcMain.handle("create-invoice", generateInvoice);
  ipcMain.handle("select-logo", handleLogoSelection);
  ipcMain.on("open-window", handleOpenWindow);
  ipcMain.handle("save-invoice", handleSaveInvoice);

  homeWin = createWindow("home-window", null);
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
