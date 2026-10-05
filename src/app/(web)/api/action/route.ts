// Aksi pemain: bangun, riset, latih, serang, intai, pasar, pajak, pekerja, era, event.
// Setiap mutasi: validasi Zod → resolveKingdom() dulu → validasi aturan → tulis.
import { NextResponse } from "next/server";
import { z } from "zod";
import * as B from "@config/balance";
import { getDb } from "@/lib/db";
import { resolveKingdom, loadState, resolveBattleAtReturn } from "@/lib/resolve";
import {
  buildingCost, buildingDurationHours, techCost, unitCost,
  canAfford, subtract, zeroResources,
  canAdvanceEra, computeScore, maxBuildingLevelAllowed,
} from "@/lib/game/engine";

const fail = (msg: string, code = 400) => NextResponse.json({ ok: false, error: msg }, { status: code });

function addReport(db: any, kind: string, title: string, body: string) {
  db.prepare("INSERT INTO reports (kingdom_id, kind, title, body, created_at, is_read) VALUES (1, ?, ?, ?, ?, 0)").run(kind, title, body, new Date().toISOString());
}

export async function POST(req: Request) {
  const payload = await req.json().catch(() => null);
  const parsed = z
    .object({
      action: z.string(),
      buildingId: z.string().optional(),
      techId: z.string().optional(),
      unitId: z.string().optional(),
      quantity: z.number().int().positive().optional(),
      npcName: z.string().optional(),
      units: z.record(z.string(), z.number().int().nonnegative()).optional(),
      resource: z.enum(["makanan", "kayu", "batu", "besi", "emas"]).optional(),
      amount: z.number().positive().optional(),
      taxPercent: z.number().int().min(0).max(100).optional(),
      workerDelta: z.number().int().optional(),
      choiceId: z.string().optional(),
      confirm: z.boolean().optional(),
    })
    .safeParse(payload);
  if (!parsed.success) return fail("Data tidak sah");
  const a = parsed.data;

  const res = resolveKingdom(); // tick evaluasi malas dulu
  const db = getDb();
  const { state, era } = loadState(db);

  switch (a.action) {
    // ---------- Konstruksi ----------
    case "upgrade_building": {
      const def = B.BUILDINGS.find((b) => b.id === a.buildingId);
      if (!def) return fail("Bangunan tidak dikenal");
      if (def.era > era) return fail(`${def.name} belum terbuka di zaman ini`);
      const level = state.levels[def.id] ?? 0;
      if (level >= B.MAX_BUILDING_LEVEL) return fail("Level maksimum tercapai");
      if (level >= maxBuildingLevelAllowed(state.levels) && def.id !== "balai_kota")
        return fail("Naikkan Balai Kota dulu");
      const queued = (db.prepare("SELECT COUNT(*) c FROM construction_queue WHERE kingdom_id=1 AND building_id=?").get(def.id) as any).c;
      if (queued > 0)
        return fail(`${def.name} sedang dibangun`);
      const cost = buildingCost(def.id, level);
      if (!canAfford(state.resources, cost)) return fail("Sumber daya tidak cukup");
      const hours = buildingDurationHours(def.id, level);
      const now = new Date();
      const finishes = new Date(now.getTime() + hours * 3_600_000);
      db.prepare("UPDATE resources SET amount = ? WHERE kingdom_id=1 AND resource=?");
      for (const r of B.RESOURCES) {
        db.prepare("UPDATE resources SET amount = ? WHERE kingdom_id = 1 AND resource = ?").run(Math.round((state.resources[r] - cost[r]) * 100) / 100, r);
      }
      db.prepare("INSERT INTO construction_queue (kingdom_id, building_id, target_level, started_at, finishes_at) VALUES (1, ?, ?, ?, ?)").run(def.id, level + 1, now.toISOString(), finishes.toISOString());
      return NextResponse.json({ ok: true, message: `${def.name} mulai dibangun ke level ${level + 1}.` });
    }

    // ---------- Riset ----------
    case "start_research": {
      const def = B.TECHS.find((t) => t.id === a.techId);
      if (!def) return fail("Riset tidak dikenal");
      if (def.era > era) return fail(`${def.name} belum terbuka di zaman ini`);
      if (((db.prepare("SELECT COUNT(*) c FROM research_queue WHERE kingdom_id=1").get() as any).c) > 0)
        return fail("Riset lain sedang berjalan");
      if (db.prepare("SELECT 1 FROM techs WHERE kingdom_id=1 AND tech_id=?").get(def.id) !== undefined)
        return fail("Riset ini sudah selesai");
      const cost = techCost(def.id);
      if (!canAfford(state.resources, cost)) return fail("Sumber daya tidak cukup");
      for (const r of B.RESOURCES) {
        db.prepare("UPDATE resources SET amount = ? WHERE kingdom_id = 1 AND resource = ?").run(Math.round((state.resources[r] - cost[r]) * 100) / 100, r);
      }
      const now = new Date();
      db.prepare("INSERT INTO research_queue (kingdom_id, tech_id, started_at, finishes_at) VALUES (1, ?, ?, ?)").run(def.id, now.toISOString(), new Date(now.getTime() + def.durationHours * 3_600_000).toISOString());
      return NextResponse.json({ ok: true, message: `Juru tulis mulai menggarap ${def.name}.` });
    }

    // ---------- Naik era ----------
    case "advance_era": {
      if (!canAdvanceEra(state.levels, (db.prepare("SELECT tech_id FROM techs WHERE kingdom_id=1").all() as any[]).map((r) => r.tech_id), era))
        return fail("Syarat naik era belum terpenuhi");
      db.prepare("UPDATE save SET era = ? WHERE id = 1").run(era + 1);
      const name = B.ERAS.find((e) => e.id === era + 1)?.name;
      addReport(db, "system", `Memasuki ${name}`, `Lonceng istana berbunyi. Kerajaan kita resmi memasuki ${name}. Juru tulis membuka babak baru pada kronik.`);
      return NextResponse.json({ ok: true, message: `Kerajaan memasuki ${name}!` });
    }

    // ---------- Militer ----------
    case "train_units": {
      const def = B.UNITS.find((u) => u.id === a.unitId);
      if (!def) return fail("Unit tidak dikenal");
      if (def.era > era) return fail(`${def.name} belum terbuka di zaman ini`);
      const barrack = state.levels["barak"] ?? 0;
      const totalUnits = Object.values(state.unitCounts).reduce((x, y) => x + y, 0);
      const queued = (db.prepare("SELECT COALESCE(SUM(quantity),0) q FROM training_queue WHERE kingdom_id=1").get() as any).q;
      if (totalUnits + queued + (a.quantity ?? 0) > barrack * B.BARRACK_CAPACITY_PER_LEVEL)
        return fail("Barak penuh — tingkatkan Barak dulu");
      const cost = unitCost(def.id, a.quantity ?? 1);
      if (!canAfford(state.resources, cost)) return fail("Sumber daya tidak cukup");
      for (const r of B.RESOURCES) {
        db.prepare("UPDATE resources SET amount = ? WHERE kingdom_id = 1 AND resource = ?").run(Math.round((state.resources[r] - cost[r]) * 100) / 100, r);
      }
      const now = new Date();
      const finishes = new Date(now.getTime() + def.trainMinutes * 60_000 * (a.quantity ?? 1));
      db.prepare("INSERT INTO training_queue (kingdom_id, unit_id, quantity, started_at, finishes_at) VALUES (1, ?, ?, ?, ?)").run(def.id, a.quantity ?? 1, now.toISOString(), finishes.toISOString());
      return NextResponse.json({ ok: true, message: `Melatih ${a.quantity ?? 1} ${def.name}.` });
    }

    // ---------- Peta: intai & serang ----------
    case "scout": {
      if (!a.npcName) return fail("Kerajaan tidak disebutkan");
      const npc = db.prepare("SELECT * FROM npc_kingdoms WHERE kingdom_id=1 AND npc_name=?").get(a.npcName) as any;
      if (!npc) return fail("Kerajaan tidak dikenal");
      const travelMin = B.SCOUT_MINUTES + npc.power / 50;
      const now = new Date();
      db.prepare("INSERT INTO marches (kingdom_id, target_npc, kind, units_json, departed_at, arrives_at, resolved) VALUES (1, ?, 'scout', '{}', ?, ?, 0)").run(npc.npc_name, now.toISOString(), new Date(now.getTime() + travelMin * 60_000).toISOString());
      addReport(db, "war", `Pengintai berangkat ke ${npc.npc_name}`, `Sesuatu bergerak di jalan setapak menuju ${npc.npc_name}. Pengintai kita menunggu kabar.`);
      return NextResponse.json({ ok: true, message: `Pengintai berangkat ke ${npc.npc_name}.` });
    }
    case "attack": {
      if (!a.npcName) return fail("Kerajaan tidak disebutkan");
      const npc = db.prepare("SELECT * FROM npc_kingdoms WHERE kingdom_id=1 AND npc_name=?").get(a.npcName) as any;
      if (!npc) return fail("Kerajaan tidak dikenal");
      const units = a.units ?? {};
      const total = Object.values(units).reduce((x, y) => x + y, 0);
      if (total <= 0) return fail("Tidak ada pasukan yang dikirim");
      for (const [uid, n] of Object.entries(units)) {
        if ((state.unitCounts[uid] ?? 0) < n) return fail("Pasukan tidak cukup");
      }
      const carry = Object.entries(units).reduce((s, [uid, n]) => s + n * (B.UNITS.find((u) => u.id === uid)?.carryCapacity ?? 0), 0);
      const travelMin = B.TRAVEL_MINUTES_PER_DISTANCE * (B.NPC_KINGDOMS.find((k) => k.name === npc.npc_name)?.distance ?? 5);
      const now = new Date();
      db.prepare("INSERT INTO marches (kingdom_id, target_npc, kind, units_json, departed_at, arrives_at, returns_at, resolved) VALUES (1, ?, 'attack', ?, ?, ?, ?, 0)").run(
        npc.npc_name, JSON.stringify(units), now.toISOString(),
        new Date(now.getTime() + travelMin * 60_000).toISOString(),
        new Date(now.getTime() + travelMin * 2 * 60_000).toISOString()
      );
      addReport(db, "war", `Armada berangkat ke ${npc.npc_name}`, `${total} prajurit berbaris menuju ${npc.npc_name} dengan angkut ${carry}. Kronik menunggu kabar mereka pulang.`);
      return NextResponse.json({ ok: true, message: `Armada berangkat ke ${npc.npc_name}.` });
    }

    // ---------- Pajak & pekerja ----------
    case "set_tax": {
      db.prepare("UPDATE save SET tax_percent = ? WHERE id = 1").run(a.taxPercent ?? 20);
      return NextResponse.json({ ok: true, message: "Pajak diperbarui." });
    }
    case "assign_workers": {
      const def = B.BUILDINGS.find((b) => b.id === a.buildingId);
      if (!def) return fail("Bangunan tidak dikenal");
      const level = state.levels[def.id] ?? 0;
      const slots = def.workerSlotsPerLevel * level;
      const current = state.workersPerBuilding[def.id] ?? 0;
      const next = Math.max(0, Math.min(slots, current + (a.workerDelta ?? 0)));
      const usedElse = Object.entries(state.workersPerBuilding).filter(([k]) => k !== def.id).reduce((s, [, v]) => s + v, 0);
      const free = Math.max(0, Math.floor(state.population) - usedElse);
      if (next - current > free) return fail("Tidak cukup penduduk menganggur");
      db.prepare("UPDATE buildings SET workers = ? WHERE kingdom_id=1 AND building_id=?").run(next, def.id);
      return NextResponse.json({ ok: true, message: `Pekerja ${def.name}: ${next}/${slots}.` });
    }

    // ---------- Pasar ----------
    case "market_trade": {
      const resource = a.resource;
      if (!resource || resource === "emas" || !a.choiceId || !a.amount) return fail("Perdagangan tidak sah");
      const price = (db.prepare("SELECT price FROM market_prices WHERE kingdom_id=1 AND resource=?").get(resource) as any)?.price;
      if (!price) return fail("Perdagangan tidak sah");
      if (a.choiceId === "sell") {
        if (state.resources[resource] < a.amount) return fail("Stok tidak cukup");
        const gold = Math.floor(a.amount * price * (1 - B.MARKET_SPREAD));
        db.prepare("UPDATE resources SET amount = amount - ? WHERE kingdom_id=1 AND resource=?").run(a.amount, resource);
        db.prepare("UPDATE resources SET amount = amount + ? WHERE kingdom_id=1 AND resource='emas'").run(gold);
        return NextResponse.json({ ok: true, message: `Terjual ${a.amount} ${resource} seharga ${gold} emas.` });
      } else {
        const goldCost = Math.ceil(a.amount * price * (1 + B.MARKET_SPREAD));
        if (state.resources.emas < goldCost) return fail("Emas tidak cukup");
        db.prepare("UPDATE resources SET amount = amount - ? WHERE kingdom_id=1 AND resource='emas'").run(goldCost);
        db.prepare("UPDATE resources SET amount = amount + ? WHERE kingdom_id=1 AND resource=?").run(a.amount, resource);
        return NextResponse.json({ ok: true, message: `Dibeli ${a.amount} ${resource} seharga ${goldCost} emas.` });
      }
    }

    // ---------- Acara ----------
    case "resolve_event": {
      const ev = db.prepare("SELECT * FROM events WHERE kingdom_id=1 AND resolved=0 ORDER BY created_at DESC LIMIT 1").get() as any;
      if (!ev) return fail("Tidak ada acara");
      db.prepare("UPDATE events SET resolved=1, resolved_choice=? WHERE id=?").run(a.choiceId ?? "", ev.id);
      let msg = "Keputusan dicatat dalam kronik.";
      if (ev.event_id === "kemarau") {
        if (a.choiceId === "irigasi") {
          if (state.resources.kayu >= 50) {
            db.prepare("UPDATE resources SET amount = amount - 50 WHERE kingdom_id=1 AND resource='kayu'");
            db.prepare("UPDATE resources SET amount = amount - 50 WHERE kingdom_id=1 AND resource='kayu'").run();
            msg = "Irigasi dibuka; ladang selamat dari kemarau.";
          } else msg = "Kayu tidak cukup untuk irigasi; sebagian panen gagal.";
        } else {
          db.prepare("UPDATE resources SET amount = MAX(0, amount - 60) WHERE kingdom_id=1 AND resource='makanan'").run();
          msg = "Doa dipanjatkan; kemarau merenggut sebagian panen.";
        }
      } else if (ev.event_id === "pedagang") {
        if (a.choiceId === "beli") {
          if (state.resources.emas >= 100) {
            db.prepare("UPDATE resources SET amount = amount - 100 WHERE kingdom_id=1 AND resource='emas'").run();
            db.prepare("UPDATE resources SET amount = amount + 150 WHERE kingdom_id=1 AND resource='makanan'").run();
            msg = "Pedagang menyerahkan karung makanan.";
          } else msg = "Emas tidak cukup; pedagang pergi.";
        }
      } else if (ev.event_id === "pemberontakan") {
        if (a.choiceId === "ampuni") {
          db.prepare("UPDATE save SET happiness = MIN(100, happiness + 10) WHERE id=1").run();
          msg = "Pengampunan raja dielu-elukan rakyat.";
        } else {
          db.prepare("UPDATE save SET happiness = MAX(0, happiness - 10) WHERE id=1").run();
          msg = "Ketegangan ditekan; hati rakyat menjadi dingin.";
        }
      }
      addReport(db, "event", "Acara selesai", msg);
      return NextResponse.json({ ok: true, message: msg });
    }

    // ---------- Pengaturan ----------
    case "rename_kingdom": {
      const name = (a as any).name;
      if (typeof name === "string" && name.trim().length >= 3 && name.trim().length <= 32) {
        db.prepare("UPDATE save SET kingdom_name = ? WHERE id = 1").run(name.trim());
        return NextResponse.json({ ok: true, message: "Nama kerajaan diganti." });
      }
      return fail("Nama 3–32 huruf");
    }
    case "reset_game": {
      if (!a.confirm) return fail("Konfirmasi diperlukan");
      const tables = ["save", "resources", "buildings", "construction_queue", "research_queue", "training_queue", "units", "techs", "marches", "npc_kingdoms", "reports", "market_prices", "events"];
      for (const t of tables) db.prepare(`DELETE FROM ${t}`).run();
      const { getDb: _g } = await import("@/lib/db");
      // re-seed via modul db (seedIfEmpty dijalankan saat koneksi dibuat; paksa ulang)
      const dbMod = await import("@/lib/db");
      (dbMod as any).__reseed?.();
      // jalankan seed manual sederhana:
      const fresh = getDb();
      if (!(fresh.prepare("SELECT COUNT(*) c FROM save").get() as any).c) {
        fresh.prepare("INSERT INTO save (id, kingdom_name, era, population, happiness, tax_percent, score, last_resolved_at) VALUES (1, 'Kerajaan Baru', 1, 10, 100, 20, 0, ?)").run(new Date().toISOString());
      }
      return NextResponse.json({ ok: true, message: "Kerajaan dimulai ulang dari nol." });
    }

    // ---------- Kronik ----------
    case "mark_read": {
      db.prepare("UPDATE reports SET is_read = 1 WHERE kingdom_id = 1").run();
      return NextResponse.json({ ok: true });
    }

    // ---------- Pemulihan perang (dipanggil saat peta dibuka) ----------
    case "settle_marches": {
      const pending = db.prepare("SELECT id FROM marches WHERE kingdom_id=1 AND kind='attack' AND returns_at <= ? AND resolved = 0").all(new Date().toISOString()) as any[];
      for (const m of pending) resolveBattleAtReturn(m.id);
      return NextResponse.json({ ok: true, settled: pending.length });
    }

    default:
      return fail("Aksi tidak dikenal");
  }
}
export const dynamic = "force-dynamic";

