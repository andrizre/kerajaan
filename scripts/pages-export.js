// Ekspor statis khusus demo untuk Cloudflare (tanpa server/DB).
// Pemakaian: node scripts/pages-export.js
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const root = path.join(__dirname, "..");
const appDir = path.join(root, "src", "app");
const webGroup = path.join(appDir, "(web)");
const webStash = path.join(root, ".web-stash");
const rootPage = path.join(appDir, "page.tsx");
const rootPageStash = path.join(root, ".root-page-stash.tsx");

function run() {
  try {
    // 1) sembunyikan halaman server (pakai node:sqlite — tidak jalan di edge)
    if (fs.existsSync(webGroup)) fs.renameSync(webGroup, webStash);
    // 2) ganti halaman root dengan pengalih ke /demo
    if (fs.existsSync(rootPage)) fs.renameSync(rootPage, rootPageStash);
    fs.writeFileSync(rootPage, `import { redirect } from "next/navigation";
export default function Home() { redirect("/demo"); }
`);

    fs.rmSync(path.join(root, "out"), { recursive: true, force: true });
    fs.rmSync(path.join(root, ".next"), { recursive: true, force: true });
    execSync("npx next build", {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, KE_PAGES_EXPORT: "1" },
    });
    console.log("[pages-export] Selesai → folder out/");
  } finally {
    // 3) kembalikan apa pun yang terjadi
    if (fs.existsSync(rootPage)) fs.unlinkSync(rootPage);
    if (fs.existsSync(rootPageStash)) fs.renameSync(rootPageStash, rootPage);
    if (fs.existsSync(webStash)) fs.renameSync(webStash, webGroup);
    console.log("[pages-export] Sumber dikembalikan");
  }
}

run();
