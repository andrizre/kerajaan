// resolve.ts — mesin tick evaluasi malas. Dipanggil DI SETIAP akses API sebelum respons.
import * as B from "@config/balance";
import { getDb, touchLastResolved } from "@/lib/db";
import {
  advance,
  buildingCost,
  computeScore,
  eraName,
  marketPrices,
  npcDefenseLevels,
  renderWarChronicle,
  resolveBattle,
  type KingdomState,
  type Resources,
  zeroResources,
} from "@/lib/game/engine";

export type ResolveResult = {
  now: string;
  hoursElapsed: number;
  cappedHours: boolean;
  state: KingdomState;
  era: number;
  score: number;
  kingdomName: string;
  completed: string[]; // judul laporan yang lahir dari resolusi ini
};

function nowIso() {
  return new Date().toISOString();
}

export function loadState(db = getDb()): { state: KingdomState; era: number; kingdomName: string; lastResolved: string; score: number } {
  const save = db.prepare("SELECT kingdom_name, era, population, happiness, tax_percent, score, last_resolved_at FROM save WHERE id = 1").get() as any;
  const resources = zeroResources();
  for (const r of db.prepare("SELECT resource, amount FROM resources WHERE kingdom_id = 1").all() as any[]) {
    resources[r.resource as B.Resource] = r.amount;
  }
  const levels: Record<string, number> = {};
  const workers: Record<string, number> = {};
  for (const b of db.prepare("SELECT building_id, level, workers FROM buildings WHERE kingdom_id = 1").all() as any[]) {
    levels[b.building_id] = b.level;
    workers[b.building_id] = b.workers;
  }
  const unitCounts: Record<string, number> = {};
  for (const u of db.prepare("SELECT unit_id, count FROM units WHERE kingdom_id = 1").all() as any[]) {
    unitCounts[u.unit_id] = u.count;
  }
  return {
    state: {
      population: save.population,
      happiness: save.happiness,
      taxPercent: save.tax_percent,
      resources,
      levels,
      workersPerBuilding: workers,
      unitCounts,
    },
    era: save.era,
    kingdomName: save.kingdom_name,
    lastResolved: save.last_resolved_at,
    score: save.score,
  };
}

function addReport(db: any, kind: string, title: string, body: string) {
  db.prepare("INSERT INTO reports (kingdom_id, kind, title, body, created_at, is_read) VALUES (1, ?, ?, ?, ?, 0)").run(
    kind, title, body, nowIso()
  );
}

export function resolveKingdom(): ResolveResult {
  const db = getDb();
  const { state, era, kingdomName } = loadState(db);
  const completed: string[] = [];

  // 1) Waktu berjalan — dibatasi cap offline
  const last = db.prepare("SELECT last_resolved_at FROM save WHERE id = 1").get() as { last_resolved_at: string };
  const nowMs = Date.now();
  let hoursElapsed = (nowMs - new Date(last.last_resolved_at).getTime()) / 3_600_000;
  let cappedHours = false;
  if (hoursElapsed < 0) hoursElapsed = 0;
  if (hoursElapsed > B.OFFLINE_CAP_HOURS) {
    hoursElapsed = B.OFFLINE_CAP_HOURS;
    cappedHours = true;
  }

  // 2) Produksi & upkeep
  const tick = advance(state, hoursElapsed, nowMs);
  let st = tick.state;

  // 3) Selesaikan antrean konstruksi yang lewat waktu
  const doneC = db.prepare("SELECT id, building_id, target_level FROM construction_queue WHERE kingdom_id = 1 AND finishes_at <= ?").all(nowIso()) as any[];
  for (const row of doneC) {
    db.prepare("UPDATE buildings SET level = ? WHERE kingdom_id = 1 AND building_id = ?").run(row.target_level, row.building_id);
    const def = B.BUILDINGS.find((b) => b.id === row.building_id);
    const line = `${def?.name ?? row.building_id} kini berdiri di level ${row.target_level}.`;
    addReport(db, "construction", `Pembangunan selesai: ${def?.name ?? row.building_id}`, `${line} Para tukang menepuk debu dari tangan mereka dan kembali ke rumah.`);
    completed.push(`Pembangunan selesai: ${def?.name ?? row.building_id} lv${row.target_level}`);
  }
  if (doneC.length) db.prepare("DELETE FROM construction_queue WHERE kingdom_id = 1 AND finishes_at <= ?").run(nowIso());

  // 4) Riset
  const doneR = db.prepare("SELECT id, tech_id FROM research_queue WHERE kingdom_id = 1 AND finishes_at <= ?").all(nowIso()) as any[];
  for (const row of doneR) {
    db.prepare("INSERT OR IGNORE INTO techs (kingdom_id, tech_id, completed_at) VALUES (1, ?, ?)").run(row.tech_id, nowIso());
    const def = B.TECHS.find((t) => t.id === row.tech_id);
    addReport(db, "system", `Riset selesai: ${def?.name ?? row.tech_id}`, `Juru tulis menutup gulungan ${def?.name ?? row.tech_id} dan menyimpannya ke rak arsip kerajaan.`);
    completed.push(`Riset selesai: ${def?.name ?? row.tech_id}`);
  }
  if (doneR.length) db.prepare("DELETE FROM research_queue WHERE kingdom_id = 1 AND finishes_at <= ?").run(nowIso());

  // 5) Latihan unit
  const doneT = db.prepare("SELECT id, unit_id, quantity FROM training_queue WHERE kingdom_id = 1 AND finishes_at <= ?").all(nowIso()) as any[];
  for (const row of doneT) {
    st.unitCounts[row.unit_id] = (st.unitCounts[row.unit_id] ?? 0) + row.quantity; // ikut write-back
    db.prepare("INSERT INTO units (kingdom_id, unit_id, count) VALUES (1, ?, ?) ON CONFLICT(kingdom_id, unit_id) DO UPDATE SET count = count + ?")
      .run(row.unit_id, row.quantity, row.quantity);
    const def = B.UNITS.find((u) => u.id === row.unit_id);
    addReport(db, "system", `Latihan selesai: ${def?.name ?? row.unit_id}`, `${row.quantity} ${def?.name ?? row.unit_id} berbaris di halaman barak, siap dipanggil.`);
    completed.push(`Latihan selesai: ${row.quantity} ${def?.name ?? row.unit_id}`);
  }
  if (doneT.length) db.prepare("DELETE FROM training_queue WHERE kingdom_id = 1 AND finishes_at <= ?").run(nowIso());

  // 6) Armada: yang tiba di tujuan → resolusi; yang sudah kembali → kembali
  const marches = db.prepare("SELECT * FROM marches WHERE kingdom_id = 1 AND resolved = 0").all() as any[];
  const pendingBattles: number[] = [];
  for (const m of marches) {
    const arrivesMs = new Date(m.arrives_at).getTime();
    if (m.kind === "attack" && m.returns_at && nowMs >= new Date(m.returns_at).getTime()) {
      pendingBattles.push(m.id); // diselesaikan setelah write-back state
    } else if (arrivesMs <= nowMs && m.kind === "scout") {
      // laporan intai
      const npc = db.prepare("SELECT npc_name, power, troops FROM npc_kingdoms WHERE kingdom_id = 1 AND npc_name = ?").get(m.target_npc) as any;
      const body = npc
        ? `Pengintai kita kembali dari ${npc.npc_name}. Mereka melaporkan pasukan sekitar ${Math.floor(npc.troops)} orang dan kekuatan perkiraan ${npc.power}. Tembok tampak ${npc.power > 700 ? "tebal dan tinggi" : "sederhana"}.`
        : `Pengintai kita kembali tanpa menemukan ${m.target_npc}.`;
      addReport(db, "war", `Laporan intai: ${m.target_npc}`, body);
      db.prepare("UPDATE marches SET resolved = 1 WHERE id = ?").run(m.id);
    }
  }

  // 7) Pemulihan pasukan NPC
  const npcs = db.prepare("SELECT * FROM npc_kingdoms WHERE kingdom_id = 1").all() as any[];
  for (const n of npcs) {
    if (n.troops < n.power && n.last_raided_at) {
      const hrs = (nowMs - new Date(n.last_raided_at).getTime()) / 3_600_000;
      const healed = Math.floor((n.power / B.NPC_RECOVERY_HOURS) * hrs);
      const newTroops = Math.min(n.power, n.troops + Math.max(0, healed));
      if (newTroops !== n.troops) db.prepare("UPDATE npc_kingdoms SET troops = ? WHERE kingdom_id = 1 AND npc_name = ?").run(newTroops, n.npc_name);
    }
  }

  // 8) Harga pasar diperbarui per jam
  const hourSeed = Math.floor(nowMs / 3_600_000);
  const prices = marketPrices(hourSeed);
  for (const r of B.RESOURCES) {
    db.prepare("UPDATE market_prices SET price = ?, updated_at = ? WHERE kingdom_id = 1 AND resource = ?").run(prices[r], nowIso(), r);
  }

  // 9) Acara acak: hanya bila cukup waktu berlalu
  maybeSpawnEvent(db, hoursElapsed);

  // 10) Tulis state kembali
  db.prepare("UPDATE save SET population = ?, happiness = ? WHERE id = 1").run(
    Math.floor(st.population * 100) / 100,
    Math.round(st.happiness * 10) / 10
  );
  for (const r of B.RESOURCES) {
    db.prepare("UPDATE resources SET amount = ? WHERE kingdom_id = 1 AND resource = ?").run(Math.round(st.resources[r] * 100) / 100, r);
  }
  for (const [id, c] of Object.entries(st.unitCounts)) {
    db.prepare("UPDATE units SET count = ? WHERE kingdom_id = 1 AND unit_id = ?").run(c, id);
  }

  // 11) Skor (sebelum pertempuran agar perubahan pasukan ikut tercatat berikutnya)
  const techCount = (db.prepare("SELECT COUNT(*) as c FROM techs WHERE kingdom_id = 1").get() as any).c;
  const score = computeScore(st.population, st.levels, st.unitCounts, techCount, era);
  db.prepare("UPDATE save SET score = ? WHERE id = 1").run(score);

  touchLastResolved(nowIso());

  // 12) Pertempuran yang pulang — setelah write-back, agar kerugian & jarahan tidak tertimpa
  for (const id of pendingBattles) resolveBattleAtReturn(id);

  // Kelaparan → laporan
  if (tick.starvedUnitsKilled > 0) {
    addReport(db, "system", "Kelaparan di barak", `${tick.starvedUnitsKilled} prajurit meninggalkan barisan karena lumbung kosong. Juru tulis mencatat ini dengan tinta yang berat.`);
    completed.push(`Kelaparan: ${tick.starvedUnitsKilled} prajurit gugur`);
  }

  return { now: nowIso(), hoursElapsed, cappedHours, state: { ...st, population: st.population }, era, score, kingdomName, completed };
}

export function resolveBattleAtReturn(marchId: number): { report: string; title: string } | null {
  const db = getDb();
  const m = db.prepare("SELECT * FROM marches WHERE id = ?").get(marchId) as any;
  if (!m || m.kind !== "attack") return null;
  const npc = db.prepare("SELECT * FROM npc_kingdoms WHERE kingdom_id = 1 AND npc_name = ?").get(m.target_npc) as any;
  if (!npc) return null;

  const attackerUnits = JSON.parse(m.units_json);
  // Pertahanan NPC ditentukan kekuatannya sendiri — bukan tembok/menara pemain.
  const { wallLevel, towerLevel } = npcDefenseLevels(npc.power);
  const npcResources = zeroResources();
  // sumber daya NPC proporsional kekuatannya
  for (const r of B.RESOURCES) npcResources[r] = Math.floor(npc.power * (r === "emas" ? 2 : 8));

  const result = resolveBattle({
    attackerUnits,
    npcTroops: npc.troops,
    wallLevel,
    towerLevel,
    npcResources,
  });

  // terapkan kerugian pemain
  for (const [unitId, lost] of Object.entries(result.attackerLosses)) {
    if (lost > 0) db.prepare("UPDATE units SET count = MAX(0, count - ?) WHERE kingdom_id = 1 AND unit_id = ?").run(lost, unitId);
  }
  // jarahan
  for (const r of B.RESOURCES) {
    if (result.loot[r] > 0) db.prepare("UPDATE resources SET amount = amount + ? WHERE kingdom_id = 1 AND resource = ?").run(result.loot[r], r);
  }
  // NPC
  db.prepare("UPDATE npc_kingdoms SET troops = MAX(0, troops - ?), last_raided_at = ? WHERE kingdom_id = 1 AND npc_name = ?")
    .run(result.defenderLosses, nowIso(), m.target_npc);

  const body = renderWarChronicle(npc.npc_name, result, attackerUnits);
  const title = result.attackerWon ? `Kemenangan atas ${npc.npc_name}` : `Serangan ke ${npc.npc_name} gagal`;
  addReport(db, "war", title, body);
  db.prepare("UPDATE marches SET resolved = 1 WHERE id = ?").run(m.id);
  return { report: body, title };
}

function maybeSpawnEvent(db: any, hoursElapsed: number) {
  if (hoursElapsed < 0.5) return;
  const recent = db.prepare("SELECT COUNT(*) as c FROM events WHERE kingdom_id = 1 AND created_at > ?").get(new Date(Date.now() - 3_600_000).toISOString()) as any;
  if (recent.c > 0) return;
  const roll = Math.random();
  if (roll > 1 / B.EVENT_BASE_INTERVAL_HOURS) return;
  const events = [
    { id: "kemarau", choices: [{ id: "irigasi", label: "Buka irigasi (50 kayu)" }, { id: "doa", label: "Doa bersama" }] },
    { id: "pedagang", choices: [{ id: "beli", label: "Beli makanan (100 emas)" }, { id: "tolak", label: "Tolak" }] },
    { id: "pemberontakan", choices: [{ id: "tekan", label: "Tekan dengan pajak" }, { id: "ampuni", label: "Ampuni dan turunkan pajak" }] },
  ];
  const ev = events[Math.floor(Math.random() * events.length)];
  db.prepare("INSERT INTO events (kingdom_id, event_id, choices_json, created_at, resolved) VALUES (1, ?, ?, ?, 0)").run(
    ev.id, JSON.stringify(ev.choices), nowIso()
  );
}

export function eraInfo() {
  return B.ERAS.map((e) => ({ ...e, name: eraName(e.id) }));
}
