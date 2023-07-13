const electron = require("electron");
const path = require("path");
const fs = require("fs");

class Store {
  constructor(storeName) {
    const userDataPath = (electron.app || electron.remote.app).getPath(
      "userData"
    );

    this.path = path.join(userDataPath, storeName + ".json");

    this.data = parseDataFile(this.path);
  }

  get(key) {
    if (!(key in this.data)) {
      return false;
    }
    return this.data[key];
  }

  set(key, val) {
    this.data[key] = val;
    try {
      fs.writeFileSync(this.path, JSON.stringify(this.data));
      return true;
    } catch (error) {
      return false;
    }
  }
}

function parseDataFile(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath));
  } catch (error) {
    return {};
  }
}

module.exports = Store;
