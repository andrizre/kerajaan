// Untuk build Cloudflare Pages: sembunyikan API server (node:sqlite tidak
// tersedia di edge runtime). Versi server tetap utuh di lokal/VPS.
// Pemakaian: node scripts/pages-build.js          → sembunyikan API
//            node scripts/pages-build.js restore  → kembalikan API
const fs = require("fs");
const path = require("path");

const apiDir = path.join(__dirname, "..", "src", "app", "(web)", "api");
const stash = path.join(__dirname, "..", ".api-stash");

if (process.argv.includes("restore")) {
  if (fs.existsSync(stash) && !fs.existsSync(apiDir)) {
    fs.renameSync(stash, apiDir);
    console.log("[pages-build] API server dikembalikan");
  }
} else {
  if (fs.existsSync(apiDir) && !fs.existsSync(stash)) {
    fs.renameSync(apiDir, stash);
    console.log("[pages-build] API server disembunyikan (demo statis)");
  }
}
