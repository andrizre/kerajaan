// Akses SQLite via node:sqlite — satu-satunya tempat IO database.
import { DatabaseSync } from "node:sqlite";
import fs from "node:fs";
import path from "node:path";

import * as B from "@config/balance";

const DB_PATH = process.env.KERAJAAN_DB ?? path.join(process.cwd(), "db", "kerajaan.sqlite");

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (!db) {
    fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });
    db = new DatabaseSync(DB_PATH);
    const schema = fs.readFileSync(path.join(process.cwd(), "db", "schema.sql"), "utf8");
    db.exec(schema);
    seedIfEmpty(db);
  }
  return db;
}

function seedIfEmpty(db: DatabaseSync) {
  const row = db.prepare("SELECT COUNT(*) as c FROM save").get() as { c: number };
  if (row.c === 0) {
    db.prepare(
      "INSERT INTO save (id, kingdom_name, era, population, happiness, tax_percent, score, last_resolved_at) VALUES (1, 'Kerajaan Baru', 1, 10, 100, 20, 0, ?)"
    ).run(new Date().toISOString());
    for (const r of ["makanan", "kayu", "batu", "besi", "emas"]) {
      db.prepare("INSERT INTO resources (kingdom_id, resource, amount) VALUES (1, ?, ?)").run(r, 0);
    }
    for (const b of ["balai_kota", "ladang", "tempat_tebang", "pemecah_batu", "peleburan_besi", "tambang_emas", "gudang", "balai_pekerja", "barak", "tembok", "menara_jaga", "balai_rakyat", "pasar"]) {
      db.prepare("INSERT INTO buildings (kingdom_id, building_id, level, workers) VALUES (1, ?, 0, 0)").run(b);
    }
    // Beri pemain awal: balai kota 1, ladang 1, gudang 1, balai pekerja 1 + sumber daya pembuka
    db.prepare("UPDATE buildings SET level = 1 WHERE kingdom_id = 1 AND building_id IN ('balai_kota','ladang','gudang','balai_pekerja')").run();
    db.prepare("UPDATE resources SET amount = CASE resource WHEN 'makanan' THEN 100 WHEN 'kayu' THEN 80 WHEN 'batu' THEN 40 ELSE 0 END WHERE kingdom_id = 1").run();
  }
  // Seed NPC
  const npcRow = db.prepare("SELECT COUNT(*) as c FROM npc_kingdoms").get() as { c: number };
  if (npcRow.c === 0) {
    const insN = db.prepare("INSERT INTO npc_kingdoms (kingdom_id, npc_name, power, troops) VALUES (1, ?, ?, ?)");
    for (const n of B.NPC_KINGDOMS) insN.run(n.name, n.power, n.power);
  }
  // Seed harga pasar
  const mRow = db.prepare("SELECT COUNT(*) as c FROM market_prices").get() as { c: number };
  if (mRow.c === 0) {
    const insM = db.prepare("INSERT INTO market_prices (kingdom_id, resource, price) VALUES (1, ?, ?)");
    for (const [r, p] of Object.entries(B.MARKET_BASE_PRICES)) insM.run(r, p as number);
  }
}



export type SaveRow = {
  kingdom_name: string;
  era: number;
  population: number;
  happiness: number;
  tax_percent: number;
  score: number;
  last_resolved_at: string;
};

export function getSave(): SaveRow {
  return getDb().prepare("SELECT kingdom_name, era, population, happiness, tax_percent, score, last_resolved_at FROM save WHERE id = 1").get() as SaveRow;
}

export function touchLastResolved(iso: string) {
  getDb().prepare("UPDATE save SET last_resolved_at = ? WHERE id = 1").run(iso);
}
