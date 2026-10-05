const fs = require("fs");
const path = require("path");
const apiDir = path.join(__dirname, "..", "src", "app", "api");
const stash = path.join(__dirname, "..", ".api-stash");
if (fs.existsSync(stash) && !fs.existsSync(apiDir)) {
  fs.renameSync(stash, apiDir);
  console.log("API dikembalikan");
}
