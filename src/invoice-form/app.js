const productsContainer = document.querySelector("#products-container");
const productName = document.querySelector("#product-name");
const productQty = document.querySelector("#product-qty");
const productPrice = document.querySelector("#product-price");
const clientName = document.querySelector("#name");
const clientAddress = document.querySelector("#street");
const clientCity = document.querySelector("#city");
const clientCountry = document.querySelector("#country");
const btnAddProd = document.querySelector("#add-prod");
const btnModifyProd = document.querySelector("#modify-prod");
const btnDeleteProd = document.querySelector("#delete-prod");
const docType = document.querySelector("#doc-type");
const saveNotifier = document.querySelector(".notification-container");

const rowNoProductAdded = `<tr class="product-row">
  <td colspan="3" style="text-align: center">
    Sin Productos Añadidos
  </td>
</tr>`;

var invoice = {};

var idCounter = 0;
var idSelected = "prod+1";
disableEdit();

const currencyOptions = { symbol: "€", decimal: ",", separator: "." };

productsContainer.addEventListener("click", (ev) => {
  const products = productsContainer.children;

  for (let i = 0; i < products.length; i++) {
    if (products.item(i).id === ev.target.parentNode.id) {
      continue;
    }
    products.item(i).style.backgroundColor = "white";
    products.item(i).style.color = "black";
  }

  const rowSelected = ev.target.parentNode;

  const columns = rowSelected.children;

  if (columns.length !== 3) {
    return;
  }

  if (idSelected !== rowSelected.id) {
    idSelected = rowSelected.id;
    enableEdit();
  } else {
    idSelected = "prod+1";
    disableEdit();
  }

  //console.log(rowSelected);
  if (rowSelected.style.backgroundColor === "black") {
    productName.value = "";
    productQty.value = "";
    productPrice.value = "";
    rowSelected.style.backgroundColor = "white";
    rowSelected.style.color = "black";
  } else {
    productName.value = columns.item(0).innerText;
    productQty.value = columns.item(1).innerText;
    productPrice.value = columns.item(2).innerText;
    rowSelected.style.backgroundColor = "black";
    rowSelected.style.color = "white";
  }
});

function enableEdit() {
  btnAddProd.disabled = true;
  btnAddProd.ariaDisabled = true;
  btnAddProd.className = "btn-disabled";
  btnDeleteProd.disabled = false;
  btnDeleteProd.ariaDisabled = false;
  btnDeleteProd.className = "form-btn product-btn";
  btnModifyProd.disabled = false;
  btnModifyProd.ariaDisabled = false;
  btnModifyProd.className = "form-btn product-btn";
}

function disableEdit() {
  btnAddProd.disabled = false;
  btnAddProd.ariaDisabled = false;
  btnAddProd.className = "form-btn product-btn";
  btnDeleteProd.disabled = true;
  btnDeleteProd.ariaDisabled = true;
  btnDeleteProd.className = "btn-disabled";
  btnModifyProd.disabled = true;
  btnModifyProd.ariaDisabled = true;
  btnModifyProd.className = "btn-disabled";
}

function updateInvoiceObj() {
  invoice.client = {
    name: clientName.value,
    address: clientAddress.value,
    city: clientCity.value,
    country: clientCountry.value,
  };
  var products = [];
  const prods = productsContainer.children;
  if (prods.item(0).children.length === 3) {
    for (let i = 0; i < prods.length; i++) {
      const prod = {
        price: prods.item(i).children.item(2).innerText,
        quantity: prods.item(i).children.item(1).innerText,
        description: prods.item(i).children.item(0).innerText,
      };

      products.push(prod);
    }
  }

  invoice.products = products;

  invoice.docType = docType.value;
}

function validateClientFields() {
  if (clientName.value === "") {
    clientName.setAttribute("data-error", true);
    setInterval(() => {
      clientName.setAttribute("data-error", false);
    }, 5000);
    return false;
  }
  return true;
}

async function saveInvoice() {
  if (!validateClientFields()) {
    return;
  }
  updateInvoiceObj();

  const result = await window.api.saveInvoice(invoice);

  if (result.error) {
    saveNotifier.innerText = result.description;
    saveNotifier.setAttribute("data-info", "error");
    setInterval(
      (notifier) => {
        notifier.setAttribute("data-info", "none");
      },
      2000,
      saveNotifier
    );
  } else {
    saveNotifier.innerText = result.description;
    saveNotifier.setAttribute("data-info", "saved");
    setInterval(
      (notifier) => {
        notifier.setAttribute("data-info", "none");
      },
      2000,
      saveNotifier
    );
    invoice.id = result.id;
  }
}

async function exportInvoice() {
  if (!validateClientFields()) {
    return;
  }
  updateInvoiceObj();

  const result = await window.api.createInvoice(invoice);

  if (result.error) {
    saveNotifier.innerText = result.description;
    saveNotifier.setAttribute("data-info", "error");
    setInterval(
      (notifier) => {
        notifier.setAttribute("data-info", "none");
      },
      2000,
      saveNotifier
    );
  } else {
    saveNotifier.innerText = result.description;
    saveNotifier.setAttribute("data-info", "saved");
    setInterval(
      (notifier) => {
        notifier.setAttribute("data-info", "none");
      },
      2000,
      saveNotifier
    );
    invoice.id = result.id;
  }
}

function cleanFields() {
  productName.value = "";
  productQty.value = "";
  productPrice.value = "";
  clientName.value = "";
  clientAddress.value = "";
  clientCity.value = "";
  clientCountry.value = "";
  idSelected = "prod+1";
  disableEdit();
  if (productsContainer.children.item(0).children === 3) {
    productsContainer.innerHTML = rowNoProductAdded;
  }
}

function validateProductFields(name, qty, price) {
  let hasError = false;
  if (name === "") {
    productName.setAttribute("data-error", true);
    setInterval(() => {
      productName.setAttribute("data-error", false);
    }, 5000);
    hasError = true;
  }

  const priceRegex = /^[0-9]+(,[0-9]+)?$/;
  const matches = priceRegex.exec(price);
  if (!priceRegex.test(price)) {
    productPrice.setAttribute("data-error", true);
    setInterval(() => {
      productPrice.setAttribute("data-error", false);
    }, 5000);
    hasError = true;
  }

  const qtyRegex = /^[0-9]+$/;
  if (!qtyRegex.test(qty)) {
    productQty.setAttribute("data-error", true);
    setInterval(() => {
      productQty.setAttribute("data-error", false);
    }, 5000);
    hasError = true;
  }

  if (hasError) {
    return false;
  }

  return true;
}

btnAddProd.addEventListener("click", (e) => {
  e.preventDefault();
  const added = addProduct();
  if (added) {
    if (productsContainer.children.item(0).children.length !== 3) {
      productsContainer.removeChild(productsContainer.children.item(0));
    }
    calculateTotalAmount();
    productName.value = "";
    productPrice.value = "";
    productQty.value = "";
  }
});

function addProduct() {
  if (
    !validateProductFields(
      productName.value,
      productQty.value,
      productPrice.value
    )
  ) {
    return false;
  }

  const newRow = document.createElement("tr");
  newRow.id = "prod-" + idCounter++;
  newRow.className = "product-row";

  const cols = `
  <td style="text-align: center">
    ${productName.value}
  </td>
  <td style="text-align: center">
    ${productQty.value}
  </td>
  <td style="text-align: center">
    ${productPrice.value}
  </td>
  `;

  newRow.innerHTML = cols;
  productsContainer.appendChild(newRow);

  return true;
}

btnModifyProd.addEventListener("click", (e) => {
  e.preventDefault();

  if (idSelected === "prod+1") {
    return false;
  }

  if (
    !validateProductFields(
      productName.value,
      productQty.value,
      productPrice.value
    )
  ) {
    return false;
  }

  const rowSelected = document.querySelector("#" + idSelected);

  const cols = `
  <td style="text-align: center">
    ${productName.value}
  </td>
  <td style="text-align: center">
    ${productQty.value}
  </td>
  <td style="text-align: center">
    ${productPrice.value}
  </td>
  `;

  rowSelected.innerHTML = cols;
  rowSelected.style.backgroundColor = "white";
  rowSelected.style.color = "black";

  idSelected = "prod+1";
  disableEdit();

  productName.value = "";
  productPrice.value = "";
  productQty.value = "";

  calculateTotalAmount();
});

btnDeleteProd.addEventListener("click", (e) => {
  e.preventDefault();

  if (idSelected === "prod+1") {
    return false;
  }

  productName.value = "";
  productPrice.value = "";
  productQty.value = "";

  if (productsContainer.children.length === 1) {
    productsContainer.innerHTML = rowNoProductAdded;
    document.querySelector("#total-price").innerText = "0";
    idSelected = "prod+1";
    disableEdit();
    return true;
  }

  const rowSelected = document.querySelector("#" + idSelected);

  productsContainer.removeChild(rowSelected);

  idSelected = "prod+1";
  disableEdit();

  calculateTotalAmount();
});

function calculateTotalAmount() {
  var total = currency(0, currencyOptions);
  const prods = productsContainer.children;
  for (let i = 0; i < prods.length; i++) {
    const subtotal = currency(
      prods.item(i).children.item(1).innerText,
      currencyOptions
    ).multiply(prods.item(i).children.item(2).innerText.replace(",", "."));
    total = total.add(subtotal);
    // total = currency(prods.item(i).children.item(1).innerText, currencyOptions)
    //   .multiply(prods.item(i).children.item(2).innerText)
    //   .add(total);
  }
  const iva = total.multiply(0.21);
  document.querySelector("#total-price").innerText = total.add(iva).format();
}

window.api.handleGetInvoiceInfo((event, invoiceReq) => {
  invoice = invoiceReq;

  docType.value = invoiceReq.docType;

  if (invoiceReq !== false) {
    clientName.value = invoiceReq.client.name;
    clientAddress.value = invoiceReq.client.address;
    clientCity.value = invoiceReq.client.city;
    clientCountry.value = invoiceReq.client.country;
  }
  if (invoiceReq.products.length === 0) {
    return;
  }
  productsContainer.innerHTML = "";
  invoiceReq.products.forEach((prod) => {
    const newRow = document.createElement("tr");
    newRow.id = "prod-" + idCounter++;
    newRow.className = "product-row";

    const cols = `
    <td style="text-align: center">
      ${prod.description}
    </td>
    <td style="text-align: center">
      ${prod.quantity}
    </td>
    <td style="text-align: center">
      ${prod.price}
    </td>
    `;

    newRow.innerHTML = cols;
    productsContainer.appendChild(newRow);
  });
  calculateTotalAmount();
});
