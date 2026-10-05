// view.ts — bentuk data untuk server components. Selalu resolve dulu.
import * as B from "@config/balance";
import { getDb } from "@/lib/db";
import { resolveKingdom, loadState } from "@/lib/resolve";
import { buildingCost, buildingDurationHours, techCost, unitCost, warehouseCapacity, housingCapacity } from "@/lib/game/engine";

export type KingdomView = ReturnType<typeof loadView>;

export function loadView() {
  const r = resolveKingdom();
  const db = getDb();
  const { state, era, kingdomName, score } = loadState(db);

  const cap = warehouseCapacity(state.levels);
  const housing = housingCapacity(state.levels);
  const usedWorkers = Object.values(state.workersPerBuilding).reduce((a, b) => a + b, 0);

  const construction = db
    .prepare("SELECT id, building_id, target_level, started_at, finishes_at FROM construction_queue WHERE kingdom_id = 1 ORDER BY finishes_at")
    .all() as any[];
  const research = db
    .prepare("SELECT id, tech_id, started_at, finishes_at FROM research_queue WHERE kingdom_id = 1 ORDER BY finishes_at")
    .all() as any[];
  const training = db
    .prepare("SELECT id, unit_id, quantity, started_at, finishes_at FROM training_queue WHERE kingdom_id = 1 ORDER BY finishes_at")
    .all() as any[];
  const marches = db
    .prepare("SELECT id, target_npc, kind, units_json, departed_at, arrives_at, returns_at, resolved FROM marches WHERE kingdom_id = 1 AND resolved = 0 ORDER BY arrives_at")
    .all() as any[];
  const unread = (db.prepare("SELECT COUNT(*) as c FROM reports WHERE kingdom_id = 1 AND is_read = 0").get() as any).c;
  const completedTechs = (db.prepare("SELECT tech_id FROM techs WHERE kingdom_id = 1").all() as any[]).map((r) => r.tech_id);
  const activeEvent = db
    .prepare("SELECT id, event_id, choices_json FROM events WHERE kingdom_id = 1 AND resolved = 0 ORDER BY created_at DESC LIMIT 1")
    .get() as any;

  return {
    resolved: r,
    kingdomName,
    era,
    eraName: B.ERAS.find((e) => e.id === era)?.name ?? "-",
    score,
    state,
    cap,
    housing,
    usedWorkers,
    construction,
    research,
    training,
    marches,
    unread,
    completedTechs,
    activeEvent,
  };
}

export function buildingsView() {
  const v = loadView();
  const list = B.BUILDINGS.map((def) => {
    const level = v.state.levels[def.id] ?? 0;
    const workers = v.state.workersPerBuilding[def.id] ?? 0;
    const slots = def.workerSlotsPerLevel * level;
    const locked = def.era > v.era;
    const queued = v.construction.some((c) => c.building_id === def.id);
    return {
      def,
      level,
      workers,
      slots,
      locked,
      queued,
      cost: buildingCost(def.id, level),
      hours: buildingDurationHours(def.id, level),
      maxed: level >= B.MAX_BUILDING_LEVEL,
    };
  });
  return { ...v, list };
}

export function techsView() {
  const v = loadView();
  const list = B.TECHS.map((def) => ({
    def,
    done: v.completedTechs.includes(def.id),
    locked: def.era > v.era,
    queued: v.research.some((r) => r.tech_id === def.id),
    cost: techCost(def.id),
  }));
  const nextEra = B.ERAS.find((e) => e.id === v.era + 1);
  return { ...v, list, nextEra };
}

export function militaryView() {
  const v = loadView();
  const list = B.UNITS.map((def) => ({
    def,
    count: v.state.unitCounts[def.id] ?? 0,
    locked: def.era > v.era,
    cost: unitCost(def.id, 1),
    queued: v.training.filter((t) => t.unit_id === def.id).reduce((a, t) => a + t.quantity, 0),
  }));
  return { ...v, list };
}

export function mapView() {
  const v = loadView();
  const db = getDb();
  const npcs = db.prepare("SELECT npc_name, power, troops, last_raided_at FROM npc_kingdoms WHERE kingdom_id = 1 ORDER BY power").all() as any[];
  return { ...v, npcs, defs: B.NPC_KINGDOMS };
}

export function chronicleView() {
  const v = loadView();
  const db = getDb();
  const reports = db
    .prepare("SELECT id, kind, title, body, created_at, is_read FROM reports WHERE kingdom_id = 1 ORDER BY created_at DESC LIMIT 60")
    .all() as any[];
  return { ...v, reports };
}

export function marketView() {
  const v = loadView();
  const db = getDb();
  const prices = db.prepare("SELECT resource, price FROM market_prices WHERE kingdom_id = 1").all() as any[];
  return { ...v, prices };
}

export function rankingView() {
  const v = loadView();
  const db = getDb();
  const npcs = db.prepare("SELECT npc_name, power FROM npc_kingdoms WHERE kingdom_id = 1 ORDER BY power DESC").all() as any[];
  // skor NPC diturunkan dari kekuatan (deterministik) agar peringkat bermakna
  const rows = [
    ...npcs.map((n) => ({ name: n.npc_name, score: Math.floor(n.power * 1.2), isPlayer: false })),
    { name: v.kingdomName, score: v.score, isPlayer: true },
  ].sort((a, b) => b.score - a.score);
  const rank = rows.findIndex((x) => x.isPlayer) + 1;
  return { ...v, rows, rank };
}
