const nameCompany = document.querySelector("#name");
const code = document.querySelector("#code");
const email = document.querySelector("#email");
const telephone = document.querySelector("#telephone");
const street = document.querySelector("#street");
const city = document.querySelector("#city");
const country = document.querySelector("#country");
const logo = document.querySelector("#logo-img");
const saveNotifier = document.querySelector(".notification-container");

window.api.getCompanyInfo((_event, result) => {
  if (result === false || result === undefined) {
    return;
  }
  nameCompany.value = result.name === undefined ? "" : result.name;
  code.value = result.code === undefined ? "" : result.code;
  email.value = result.email === undefined ? "" : result.email;
  telephone.value = result.phone === undefined ? "" : result.phone;
  street.value = result.address === undefined ? "" : result.address;
  city.value = result.city === undefined ? "" : result.city;
  country.value = result.country === undefined ? "" : result.country;
  if (result.logoBase64 !== "" && result.logoBase64 !== undefined) {
    logo.src = `data:image/jgp;base64,${result.logoBase64}`;
  }
});

async function saveCompany() {
  const companyInfo = {
    name: nameCompany.value,
    code: code.value,
    email: email.value,
    phone: telephone.value,
    address: street.value,
    city: city.value,
    country: country.value,
  };
  const result = await window.api.sendCompanyInfo(companyInfo);
  saveNotifier.innerText = result.description;
  if (result.error) {
    saveNotifier.setAttribute("data-info", "error");
    setInterval(
      (notifier) => {
        notifier.setAttribute("data-info", "none");
      },
      2000,
      saveNotifier
    );
  } else {
    saveNotifier.setAttribute("data-info", "saved");
    setInterval(
      (notifier) => {
        notifier.setAttribute("data-info", "none");
      },
      2000,
      saveNotifier
    );
  }
}

function reloadCompany() {
  nameCompany.value = "";
  code.value = "";
  email.value = "";
  telephone.value = "";
  street.value = "";
  city.value = "";
  country.value = "";
  logo.src = "";

  window.api.sendCompanyInfo(undefined);
}

function selectLogo() {
  window.api.getLogo().then((result) => {
    if (result !== "" && result !== undefined) {
      logo.src = `data:image/jgp;base64,${result}`;
    }
  });
}
