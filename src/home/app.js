const invoicesContainer = document.querySelector("#lasts-invoices-container");

function openNewInvoiceWindow() {
  const args = {};
  args.window = "new-invoice-window";

  window.api.openWindow(args);
}

function openCompanyInfoWindow() {
  const args = {};
  args.window = "company-info-window";
  window.api.openWindow(args);
}

function openAllInvoicesWindow() {
  //window.api.openWindow("new-invoice-window");
}

function openInvoiceWindow(id) {
  const args = {};
  args.window = "invoice-window";
  args.dependencies = id;
  window.api.openWindow(args);
}

window.api.loadInvoices((event, invoices) => {
  if (invoices === undefined || invoices === false) {
    return;
  }
  invoicesContainer.innerHTML = "";
  Object.values(invoices).forEach((invoice) => {
    let address = invoice.client.address;
    if (address === undefined) {
      address = "";
    }
    if (address.length > 25) {
      address = address.slice(0, 25 - 1) + "...";
    }
    const invoiceCard = document.createElement("div");
    invoiceCard.className = "invoice-card";
    invoiceCard.innerHTML = `
    <button class="button-card" onclick="openInvoiceWindow(${invoice.id})">
      <h2>${invoice.client.name}</h2>
      <p>
        Fecha Creación: <span class="value-highligth">${
          invoice.creationDate === undefined ? "" : invoice.creationDate
        }</span>
      </p>
      <p>Código de Factura: <span class="value-highligth">${
        invoice.id
      }</span></p>
      <p>
        Dirección del Cliente:
        <span class="value-highligth">${address}</span>
      </p>
    </button>`;
    invoicesContainer.appendChild(invoiceCard);
  });
});
