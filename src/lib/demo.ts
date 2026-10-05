"use client";
// Mode demo tanpa server: mesin game murni + localStorage.
// Dipakai otomatis bila /api/state tidak tersedia (deploy statis).
import * as B from "@config/balance";
import {
  advance, buildingCost, buildingDurationHours, techCost, unitCost, canAfford,
  canAdvanceEra, computeScore, marketPrices, resolveBattle, renderWarChronicle,
  zeroResources, warehouseCapacity, housingCapacity, type KingdomState, type Resources,
} from "@/lib/game/engine";

export type DemoState = {
  kingdomName: string;
  era: number;
  taxPercent: number;
  population: number;
  state: KingdomState;
  techs: string[];
  construction: { id: number; building_id: string; target_level: number; started_at: string; finishes_at: string }[];
  research: { id: number; tech_id: string; started_at: string; finishes_at: string }[];
  training: { id: number; unit_id: string; quantity: number; started_at: string; finishes_at: string }[];
  marches: { id: number; target_npc: string; kind: "scout" | "attack"; units_json: string; departed_at: string; arrives_at: string; returns_at?: string; resolved: boolean }[];
  npcs: { name: string; power: number; troops: number; last_raided_at: string | null }[];
  reports: { id: number; kind: string; title: string; body: string; created_at: string; is_read: number }[];
  events: { id: number; event_id: string; choices_json: string; resolved: boolean }[];
  nextId: number;
  lastResolved: string;
};

const KEY = "kk-demo-save-v1";

export function freshDemo(): DemoState {
  const levels: Record<string, number> = {};
  for (const b of B.BUILDINGS) levels[b.id] = 0;
  levels["balai_kota"] = 1; levels["ladang"] = 1; levels["gudang"] = 1; levels["balai_pekerja"] = 1;
  return {
    kingdomName: "Kerajaan Baru",
    era: 1,
    taxPercent: 20,
    population: 10,
    state: {
      population: 10,
      happiness: 100,
      taxPercent: 20,
      resources: { makanan: 100, kayu: 80, batu: 40, besi: 0, emas: 0 },
      levels,
      workersPerBuilding: {},
      unitCounts: {},
    },
    techs: [],
    construction: [], research: [], training: [], marches: [],
    npcs: B.NPC_KINGDOMS.map((n) => ({ name: n.name, power: n.power, troops: n.power, last_raided_at: null })),
    reports: [{
      id: 1, kind: "system", title: "Kronik dibuka",
      body: "Sebuah desa kecil di tepi hutan menuliskan lembar pertamanya. Membangunlah, dan kronik ini akan tumbuh.",
      created_at: new Date().toISOString(), is_read: 0,
    }],
    events: [],
    nextId: 2,
    lastResolved: new Date().toISOString(),
  };
}

export function loadDemo(): DemoState {
  if (typeof window === "undefined") return freshDemo();
  const raw = localStorage.getItem(KEY);
  if (!raw) return freshDemo();
  try { return JSON.parse(raw) as DemoState; } catch { return freshDemo(); }
}

export function saveDemo(s: DemoState) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

function report(s: DemoState, kind: string, title: string, body: string) {
  s.reports.unshift({ id: s.nextId++, kind, title, body, created_at: new Date().toISOString(), is_read: 0 });
}

export function demoTick(s: DemoState): DemoState {
  const now = Date.now();
  let hours = (now - new Date(s.lastResolved).getTime()) / 3_600_000;
  if (hours <= 0) return s;
  let capped = false;
  if (hours > B.OFFLINE_CAP_HOURS) { hours = B.OFFLINE_CAP_HOURS; capped = true; }
  void capped;

  const tick = advance(s.state, hours, now);
  s.state = tick.state;
  s.population = s.state.population;

  const nowIso = new Date(now).toISOString();
  for (const c of s.construction.filter((q) => new Date(q.finishes_at).getTime() <= now)) {
    s.state.levels[c.building_id] = c.target_level;
    const def = B.BUILDINGS.find((b) => b.id === c.building_id);
    report(s, "construction", `Pembangunan selesai: ${def?.name ?? c.building_id}`,
      `${def?.name ?? c.building_id} kini berdiri di level ${c.target_level}. Para tukang menepuk debu dari tangan mereka.`);
  }
  s.construction = s.construction.filter((q) => new Date(q.finishes_at).getTime() > now);

  for (const r of s.research.filter((q) => new Date(q.finishes_at).getTime() <= now)) {
    if (!s.techs.includes(r.tech_id)) s.techs.push(r.tech_id);
    const def = B.TECHS.find((t) => t.id === r.tech_id);
    report(s, "system", `Riset selesai: ${def?.name ?? r.tech_id}`, `Juru tulis menutup gulungan ${def?.name ?? r.tech_id} dan menyimpannya ke rak arsip.`);
  }
  s.research = s.research.filter((q) => new Date(q.finishes_at).getTime() > now);

  for (const t of s.training.filter((q) => new Date(q.finishes_at).getTime() <= now)) {
    s.state.unitCounts[t.unit_id] = (s.state.unitCounts[t.unit_id] ?? 0) + t.quantity;
    const def = B.UNITS.find((u) => u.id === t.unit_id);
    report(s, "system", `Latihan selesai: ${def?.name ?? t.unit_id}`, `${t.quantity} ${def?.name ?? t.unit_id} berbaris di halaman barak, siap dipanggil.`);
  }
  s.training = s.training.filter((q) => new Date(q.finishes_at).getTime() > now);

  for (const m of s.marches.filter((m) => !m.resolved)) {
    if (m.kind === "scout" && new Date(m.arrives_at).getTime() <= now) {
      const npc = s.npcs.find((n) => n.name === m.target_npc);
      report(s, "war", `Laporan intai: ${m.target_npc}`,
        npc ? `Pengintai kita kembali dari ${npc.name}. Mereka melaporkan pasukan sekitar ${Math.floor(npc.troops)} orang dan kekuatan perkiraan ${npc.power}.` : `Pengintai tersesat.`);
      m.resolved = true;
    } else if (m.kind === "attack" && m.returns_at && new Date(m.returns_at).getTime() <= now) {
      const npc = s.npcs.find((n) => n.name === m.target_npc);
      if (npc) {
        const units: Record<string, number> = JSON.parse(m.units_json);
        const npcRes = zeroResources();
        for (const r of B.RESOURCES) npcRes[r] = Math.floor(npc.power * (r === "emas" ? 2 : 8));
        const result = resolveBattle({
          attackerUnits: units, npcTroops: npc.troops,
          wallLevel: s.state.levels["tembok"] ?? 0, towerLevel: s.state.levels["menara_jaga"] ?? 0,
          npcResources: npcRes,
        });
        for (const [uid, lost] of Object.entries(result.attackerLosses)) {
          s.state.unitCounts[uid] = Math.max(0, (s.state.unitCounts[uid] ?? 0) - lost);
        }
        for (const r of B.RESOURCES) s.state.resources[r] += result.loot[r];
        npc.troops = Math.max(0, npc.troops - result.defenderLosses);
        npc.last_raided_at = nowIso;
        report(s, "war",
          result.attackerWon ? `Kemenangan atas ${npc.name}` : `Serangan ke ${npc.name} gagal`,
          renderWarChronicle(npc.name, result, units));
      }
      m.resolved = true;
    }
  }
  s.marches = s.marches.filter((m) => !m.resolved);

  for (const n of s.npcs) {
    if (n.troops < n.power && n.last_raided_at) {
      const hrs = (now - new Date(n.last_raided_at).getTime()) / 3_600_000;
      n.troops = Math.min(n.power, n.troops + Math.floor((n.power / B.NPC_RECOVERY_HOURS) * Math.max(0, hrs)));
    }
  }

  s.lastResolved = nowIso;
  return s;
}

const COST_FIELDS = (cost: Resources) => Object.fromEntries(B.RESOURCES.map((r) => [r, cost[r]])) as Record<B.Resource, number>;

export type ActResult = { ok: boolean; message?: string; error?: string };

export function demoAct(input: DemoState, action: string, p: Record<string, any>): { state: DemoState; result: ActResult } {
  const s = demoTick(input);
  const st = s.state;
  const pay = (cost: Partial<Record<B.Resource, number>>) => {
    const full = { ...zeroResources(), ...cost } as Resources;
    if (!canAfford(st.resources, full)) return false;
    for (const r of B.RESOURCES) st.resources[r] -= full[r];
    return true;
  };
  const nowD = new Date();

  switch (action) {
    case "upgrade_building": {
      const def = B.BUILDINGS.find((b) => b.id === p.buildingId);
      if (!def) return { state: s, result: { ok: false, error: "Bangunan tidak dikenal" } };
      if (def.era > s.era) return { state: s, result: { ok: false, error: `${def.name} belum terbuka di zaman ini` } };
      const level = st.levels[def.id] ?? 0;
      if (level >= B.MAX_BUILDING_LEVEL) return { state: s, result: { ok: false, error: "Level maksimum tercapai" } };
      if (def.id !== "balai_kota" && level >= (st.levels["balai_kota"] ?? 0) + 1)
        return { state: s, result: { ok: false, error: "Naikkan Balai Kota dulu" } };
      if (s.construction.some((c) => c.building_id === def.id))
        return { state: s, result: { ok: false, error: `${def.name} sedang dibangun` } };
      const cost = buildingCost(def.id, level);
      if (!pay(cost)) return { state: s, result: { ok: false, error: "Sumber daya tidak cukup" } };
      s.construction.push({ id: s.nextId++, building_id: def.id, target_level: level + 1, started_at: nowD.toISOString(), finishes_at: new Date(nowD.getTime() + buildingDurationHours(def.id, level) * 3_600_000).toISOString() });
      return { state: s, result: { ok: true, message: `${def.name} mulai dibangun ke level ${level + 1}.` } };
    }
    case "start_research": {
      const def = B.TECHS.find((t) => t.id === p.techId);
      if (!def) return { state: s, result: { ok: false, error: "Riset tidak dikenal" } };
      if (def.era > s.era) return { state: s, result: { ok: false, error: `${def.name} belum terbuka di zaman ini` } };
      if (s.research.length > 0) return { state: s, result: { ok: false, error: "Riset lain sedang berjalan" } };
      if (s.techs.includes(def.id)) return { state: s, result: { ok: false, error: "Riset ini sudah selesai" } };
      if (!pay(def.cost)) return { state: s, result: { ok: false, error: "Sumber daya tidak cukup" } };
      s.research.push({ id: s.nextId++, tech_id: def.id, started_at: nowD.toISOString(), finishes_at: new Date(nowD.getTime() + def.durationHours * 3_600_000).toISOString() });
      return { state: s, result: { ok: true, message: `Juru tulis mulai menggarap ${def.name}.` } };
    }
    case "advance_era": {
      if (!canAdvanceEra(st.levels, s.techs, s.era)) return { state: s, result: { ok: false, error: "Syarat naik era belum terpenuhi" } };
      s.era += 1;
      st.taxPercent = s.taxPercent;
      const name = B.ERAS.find((e) => e.id === s.era)?.name;
      report(s, "system", `Memasuki ${name}`, `Lonceng istana berbunyi. Kerajaan resmi memasuki ${name}.`);
      return { state: s, result: { ok: true, message: `Kerajaan memasuki ${name}!` } };
    }
    case "train_units": {
      const def = B.UNITS.find((u) => u.id === p.unitId);
      if (!def) return { state: s, result: { ok: false, error: "Unit tidak dikenal" } };
      if (def.era > s.era) return { state: s, result: { ok: false, error: `${def.name} belum terbuka di zaman ini` } };
      const total = Object.values(st.unitCounts).reduce((a, b) => a + b, 0) + s.training.reduce((a, t) => a + t.quantity, 0);
      if (total + (p.quantity ?? 1) > (st.levels["barak"] ?? 0) * B.BARRACK_CAPACITY_PER_LEVEL)
        return { state: s, result: { ok: false, error: "Barak penuh — tingkatkan Barak dulu" } };
      if (!pay(unitCost(def.id, p.quantity ?? 1))) return { state: s, result: { ok: false, error: "Sumber daya tidak cukup" } };
      s.training.push({ id: s.nextId++, unit_id: def.id, quantity: p.quantity ?? 1, started_at: nowD.toISOString(), finishes_at: new Date(nowD.getTime() + def.trainMinutes * 60_000 * (p.quantity ?? 1)).toISOString() });
      return { state: s, result: { ok: true, message: `Melatih ${p.quantity ?? 1} ${def.name}.` } };
    }
    case "scout": {
      const npc = s.npcs.find((n) => n.name === p.npcName);
      if (!npc) return { state: s, result: { ok: false, error: "Kerajaan tidak dikenal" } };
      s.marches.push({ id: s.nextId++, target_npc: npc.name, kind: "scout", units_json: "{}", departed_at: nowD.toISOString(), arrives_at: new Date(nowD.getTime() + (B.SCOUT_MINUTES + npc.power / 50) * 60_000).toISOString(), resolved: false });
      report(s, "war", `Pengintai berangkat ke ${npc.name}`, `Sesuatu bergerak di jalan setapak menuju ${npc.name}.`);
      return { state: s, result: { ok: true, message: `Pengintai berangkat ke ${npc.name}.` } };
    }
    case "attack": {
      const npc = s.npcs.find((n) => n.name === p.npcName);
      if (!npc) return { state: s, result: { ok: false, error: "Kerajaan tidak dikenal" } };
      const units: Record<string, number> = p.units ?? {};
      if (Object.values(units).reduce((a, b) => a + b, 0) <= 0) return { state: s, result: { ok: false, error: "Tidak ada pasukan yang dikirim" } };
      for (const [uid, n] of Object.entries(units)) if ((st.unitCounts[uid] ?? 0) < n) return { state: s, result: { ok: false, error: "Pasukan tidak cukup" } };
      const dist = B.NPC_KINGDOMS.find((k) => k.name === npc.name)?.distance ?? 5;
      const travel = B.TRAVEL_MINUTES_PER_DISTANCE * dist * 60_000;
      s.marches.push({ id: s.nextId++, target_npc: npc.name, kind: "attack", units_json: JSON.stringify(units), departed_at: nowD.toISOString(), arrives_at: new Date(nowD.getTime() + travel).toISOString(), returns_at: new Date(nowD.getTime() + travel * 2).toISOString(), resolved: false });
      report(s, "war", `Armada berangkat ke ${npc.name}`, `Prajurit berbaris menuju ${npc.name}. Kronik menunggu kabar mereka pulang.`);
      return { state: s, result: { ok: true, message: `Armada berangkat ke ${npc.name}.` } };
    }
    case "set_tax": {
      s.taxPercent = p.taxPercent ?? 20;
      st.taxPercent = s.taxPercent;
      return { state: s, result: { ok: true, message: "Pajak diperbarui." } };
    }
    case "assign_workers": {
      const def = B.BUILDINGS.find((b) => b.id === p.buildingId);
      if (!def) return { state: s, result: { ok: false, error: "Bangunan tidak dikenal" } };
      const slots = def.workerSlotsPerLevel * (st.levels[def.id] ?? 0);
      const cur = st.workersPerBuilding[def.id] ?? 0;
      const next = Math.max(0, Math.min(slots, cur + (p.workerDelta ?? 0)));
      const usedElse = Object.entries(st.workersPerBuilding).filter(([k]) => k !== def.id).reduce((a, [, v]) => a + v, 0);
      if (next - cur > Math.max(0, Math.floor(st.population) - usedElse))
        return { state: s, result: { ok: false, error: "Tidak cukup penduduk menganggur" } };
      st.workersPerBuilding[def.id] = next;
      return { state: s, result: { ok: true, message: `Pekerja ${def.name}: ${next}/${slots}.` } };
    }
    case "market_trade": {
      const res = p.resource as B.Resource;
      if (!res || res === "emas" || !p.choiceId || !p.amount) return { state: s, result: { ok: false, error: "Perdagangan tidak sah" } };
      const price = marketPrices(Math.floor(Date.now() / 3_600_000))[res];
      if (p.choiceId === "sell") {
        if (st.resources[res] < p.amount) return { state: s, result: { ok: false, error: "Stok tidak cukup" } };
        const gold = Math.floor(p.amount * price * (1 - B.MARKET_SPREAD));
        st.resources[res] -= p.amount; st.resources.emas += gold;
        return { state: s, result: { ok: true, message: `Terjual ${p.amount} ${res} seharga ${gold} emas.` } };
      }
      const goldCost = Math.ceil(p.amount * price * (1 + B.MARKET_SPREAD));
      if (st.resources.emas < goldCost) return { state: s, result: { ok: false, error: "Emas tidak cukup" } };
      st.resources.emas -= goldCost; st.resources[res] += p.amount;
      return { state: s, result: { ok: true, message: `Dibeli ${p.amount} ${res} seharga ${goldCost} emas.` } };
    }
    case "resolve_event": {
      const ev = s.events.filter((e) => !e.resolved).at(-1);
      if (!ev) return { state: s, result: { ok: false, error: "Tidak ada acara" } };
      ev.resolved = true;
      let msg = "Keputusan dicatat dalam kronik.";
      if (ev.event_id === "kemarau") {
        if (p.choiceId === "irigasi" && st.resources.kayu >= 50) { st.resources.kayu -= 50; msg = "Irigasi dibuka; ladang selamat."; }
        else { st.resources.makanan = Math.max(0, st.resources.makanan - 60); msg = "Kemarau merenggut sebagian panen."; }
      } else if (ev.event_id === "pedagang") {
        if (p.choiceId === "beli" && st.resources.emas >= 100) { st.resources.emas -= 100; st.resources.makanan += 150; msg = "Pedagang menyerahkan karung makanan."; }
        else msg = "Emas tidak cukup; pedagang pergi.";
      } else if (ev.event_id === "pemberontakan") {
        if (p.choiceId === "ampuni") { s.state.happiness = Math.min(100, s.state.happiness + 10); msg = "Pengampunan raja dielu-elukan rakyat."; }
        else { s.state.happiness = Math.max(0, s.state.happiness - 10); msg = "Ketegangan ditekan; hati rakyat menjadi dingin."; }
      }
      report(s, "event", "Acara selesai", msg);
      return { state: s, result: { ok: true, message: msg } };
    }
    case "mark_read": {
      for (const r of s.reports) r.is_read = 1;
      return { state: s, result: { ok: true } };
    }
    case "rename_kingdom": {
      const name = p.name;
      if (typeof name === "string" && name.trim().length >= 3 && name.trim().length <= 32) {
        s.kingdomName = name.trim();
        return { state: s, result: { ok: true, message: "Nama kerajaan diganti." } };
      }
      return { state: s, result: { ok: false, error: "Nama 3–32 huruf" } };
    }
    case "reset_game": {
      if (!p.confirm) return { state: s, result: { ok: false, error: "Konfirmasi diperlukan" } };
      return { state: freshDemo(), result: { ok: true, message: "Kerajaan dimulai ulang dari nol." } };
    }
    default:
      return { state: s, result: { ok: false, error: "Aksi tidak dikenal" } };
  }
}

// Bentuk "view" identik dengan server (src/lib/view.ts) supaya UI seragam.
export function demoView(s: DemoState) {
  const ticked = demoTick({ ...s, state: { ...s.state, resources: { ...s.state.resources } } });
  const score = computeScore(ticked.state.population, ticked.state.levels, ticked.state.unitCounts, ticked.techs.length, ticked.era);
  const cap = warehouseCapacity(ticked.state.levels);
  return {
    resolved: { now: new Date().toISOString(), hoursElapsed: 0, cappedHours: false, completed: [] },
    kingdomName: ticked.kingdomName,
    era: ticked.era,
    eraName: B.ERAS.find((e) => e.id === ticked.era)?.name ?? "-",
    score,
    state: ticked.state,
    cap,
    housing: housingCapacity(ticked.state.levels),
    usedWorkers: Object.values(ticked.state.workersPerBuilding).reduce((a, b) => a + b, 0),
    construction: ticked.construction,
    research: ticked.research,
    training: ticked.training,
    marches: ticked.marches.map((m) => ({ ...m, resolved: m.resolved ? 1 : 0 })),
    unread: ticked.reports.filter((r) => !r.is_read).length,
    completedTechs: ticked.techs,
    activeEvent: ticked.events.filter((e) => !e.resolved).at(-1) ?? null,
    prices: B.RESOURCES.filter((r) => r !== "emas").map((r) => ({ resource: r, price: marketPrices(Math.floor(Date.now() / 3_600_000))[r] })),
    reports: ticked.reports,
    npcs: [...ticked.npcs].sort((a, b) => a.power - b.power),
    rankRows: [
      ...ticked.npcs.map((n) => ({ name: n.name, score: Math.floor(n.power * 1.2), isPlayer: false })),
      { name: ticked.kingdomName, score, isPlayer: true },
    ].sort((a, b) => b.score - a.score),
    rank: 0,
    _demo: ticked,
  };
}

export { COST_FIELDS };
