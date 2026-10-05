import { describe, it, expect } from "vitest";
import * as B from "@config/balance";
import {
  zeroResources, buildingCost, buildingDurationHours, canAfford, subtract,
  warehouseCapacity, housingCapacity, productionPerHour, happinessFactor,
  taxGoldPerHour, foodUpkeepPerHour, advance, canAdvanceEra,
  attackerPower, defenderPower, resolveBattle, renderWarChronicle,
  computeScore, marketPrices, maxBuildingLevelAllowed,
} from "@/lib/game/engine";

const lv = (o: Record<string, number>) => o;
const workers = (o: Record<string, number>) => o;

describe("biaya bangunan", () => {
  it("naik eksponensial 1.6^level", () => {
    const c0 = buildingCost("ladang", 0);
    const c3 = buildingCost("ladang", 3);
    expect(c0.kayu).toBe(30);
    expect(c3.kayu).toBe(Math.ceil(30 * Math.pow(1.6, 3)));
  });
  it("durasi = base * level tujuan", () => {
    expect(buildingDurationHours("ladang", 0)).toBeCloseTo(0.25);
    expect(buildingDurationHours("ladang", 3)).toBeCloseTo(1.0);
  });
  it("tidak mampu terdeteksi", () => {
    const have = { ...zeroResources(), kayu: 10 };
    expect(canAfford(have, buildingCost("ladang", 0))).toBe(false);
    expect(canAfford({ ...have, kayu: 30 }, buildingCost("ladang", 0))).toBe(true);
  });
});

describe("kapasitas", () => {
  it("gudang menambah kapasitas linier", () => {
    expect(warehouseCapacity(lv({ gudang: 0 }))).toBe(B.WAREHOUSE_BASE_CAPACITY);
    expect(warehouseCapacity(lv({ gudang: 2 }))).toBe(B.WAREHOUSE_BASE_CAPACITY + 2 * B.WAREHOUSE_CAPACITY_PER_LEVEL);
  });
  it("perumahan = awal + balai pekerja", () => {
    expect(housingCapacity(lv({ balai_pekerja: 3 }))).toBe(B.INITIAL_POPULATION + 3 * B.HOUSING_POP_PER_LEVEL);
  });
});

describe("produksi & upkeep", () => {
  it("produksi proporsional pekerja terisi", () => {
    // ladang lv2 = 6 slot; 3 pekerja → setengah laju
    const p = productionPerHour(lv({ ladang: 2 }), workers({ ladang: 3 }), 1);
    expect(p.makanan).toBeCloseTo(12 * 2 * 0.5);
  });
  it("kebahagiaan rendah memperlambat produksi", () => {
    expect(happinessFactor(10)).toBe(B.LOW_HAPPINESS_PRODUCTION_FACTOR);
    expect(happinessFactor(80)).toBe(1);
  });
  it("pajak emas linier", () => {
    expect(taxGoldPerHour(100, 50)).toBeCloseTo(100 * B.TAX_GOLD_PER_POP_PER_HOUR * 0.5);
  });
  it("upkeep = penduduk + prajurit", () => {
    const u = foodUpkeepPerHour(10, { milisi: 5 });
    expect(u).toBeCloseTo(10 * B.FOOD_PER_POPULATION_PER_HOUR + 5 * 0.4);
  });
});

describe("advance (tick)", () => {
  it("deterministik", () => {
    const mk = () => ({
      population: 10, happiness: 100, taxPercent: 20,
      resources: { ...zeroResources(), makanan: 50 },
      levels: lv({ ladang: 2, gudang: 1 }),
      workersPerBuilding: workers({ ladang: 6 }),
      unitCounts: {},
    });
    const a = advance(mk(), 2);
    const b = advance(mk(), 2);
    expect(a.state.resources).toEqual(b.state.resources);
    expect(a.grewPopulation).toBe(b.grewPopulation);
  });

  it("produksi offline dibatasi kap offline 12 jam", () => {
    // test via logika cap: 100 jam produksi = 12 jam di resolve; di sini uji cap gudang
    const st = {
      population: 10, happiness: 100, taxPercent: 0,
      resources: zeroResources(),
      levels: lv({ ladang: 1, gudang: 0 }),
      workersPerBuilding: workers({ ladang: 3 }),
      unitCounts: {},
    };
    const r = advance(st, 1000);
    expect(r.state.resources.makanan).toBeLessThanOrEqual(warehouseCapacity(st.levels));
    expect(r.cappedResources.makanan).toBeGreaterThan(0);
  });

  it("kelaparan membunuh prajurit", () => {
    const st = {
      population: 10, happiness: 100, taxPercent: 0,
      resources: zeroResources(), // tanpa makanan sama sekali
      levels: lv({}),
      workersPerBuilding: workers({}),
      unitCounts: { milisi: 10 },
    };
    const r = advance(st, 5);
    expect(r.starvedUnitsKilled).toBeGreaterThan(0);
    expect(r.state.unitCounts.milisi).toBeLessThan(10);
  });

  it("populasi tumbuh sampai batas rumah", () => {
    const st = {
      population: 10, happiness: 100, taxPercent: 0,
      resources: { ...zeroResources(), makanan: 1000 },
      levels: lv({ ladang: 5, balai_pekerja: 2 }),
      workersPerBuilding: workers({ ladang: 15 }),
      unitCounts: {},
    };
    const r = advance(st, 4);
    expect(r.state.population).toBeGreaterThan(10);
    expect(r.state.population).toBeLessThanOrEqual(housingCapacity(st.levels));
  });
});

describe("era", () => {
  it("terkunci sampai syarat terpenuhi", () => {
    expect(canAdvanceEra(lv({ balai_kota: 1 }), [], 1)).toBe(false);
    expect(canAdvanceEra(lv({ balai_kota: 3 }), ["tulisan_lisan"], 1)).toBe(true);
    expect(canAdvanceEra(lv({ balai_kota: 3 }), [], 1)).toBe(false);
  });
});

describe("perang", () => {
  it("kekuatan serang = Σ unit × serangan", () => {
    expect(attackerPower({ milisi: 10, pemanah: 2 })).toBe(10 * 6 + 2 * 10);
  });
  it("tembok & menara menambah pertahanan", () => {
    const base = defenderPower(100, 0, 0);
    expect(defenderPower(100, 2, 1)).toBeGreaterThan(base);
  });
  it("kuat menang dan membawa jarahan", () => {
    const r = resolveBattle({
      attackerUnits: { pendekar: 50 },
      npcTroops: 20, wallLevel: 0, towerLevel: 0,
      npcResources: { ...zeroResources(), kayu: 1000 },
    });
    expect(r.attackerWon).toBe(true);
    expect(r.loot.kayu).toBeGreaterThan(0);
    expect(r.loot.kayu).toBeLessThanOrEqual(Math.floor(1000 * B.LOOT_PERCENT_OF_TARGET));
  });
  it("lemah kalah dan tidak membawa jarahan", () => {
    const r = resolveBattle({
      attackerUnits: { milisi: 2 },
      npcTroops: 500, wallLevel: 3, towerLevel: 2,
      npcResources: { ...zeroResources(), kayu: 1000 },
    });
    expect(r.attackerWon).toBe(false);
    expect(r.loot.kayu).toBe(0);
  });
  it("kronik perang naratif, bukan tabel", () => {
    const r = resolveBattle({
      attackerUnits: { milisi: 20 },
      npcTroops: 10, wallLevel: 0, towerLevel: 0,
      npcResources: { ...zeroResources(), kayu: 500 },
    });
    const text = renderWarChronicle("Kerajaan Rumbia", r, { milisi: 20 });
    expect(text).toContain("Kerajaan Rumbia");
    expect(text.split(" ").length).toBeGreaterThan(10);
  });
});

describe("skor & pasar", () => {
  it("skor naik dengan kemajuan", () => {
    const s0 = computeScore(10, lv({}), {}, 0, 1);
    const s1 = computeScore(20, lv({ ladang: 3 }), { milisi: 5 }, 2, 2);
    expect(s1).toBeGreaterThan(s0);
  });
  it("harga pasar berfluktuasi deterministik di sekitar dasar", () => {
    for (let seed = 0; seed < 50; seed++) {
      const p = marketPrices(seed);
      for (const r of B.RESOURCES) {
        expect(p[r]).toBeGreaterThanOrEqual(B.MARKET_BASE_PRICES[r] * (1 - B.MARKET_SPREAD) - 0.01);
        expect(p[r]).toBeLessThanOrEqual(B.MARKET_BASE_PRICES[r] * (1 + B.MARKET_SPREAD) + 0.01);
      }
    }
  });
});

describe("batas level", () => {
  it("balai kota lv X membatasi bangunan lain ke X+1", () => {
    expect(maxBuildingLevelAllowed(lv({ balai_kota: 2 }))).toBe(3);
  });
});

describe("kebahagiaan & emigrasi", () => {
  it("pajak tinggi menurunkan kebahagiaan dan menghentikan pertumbuhan", () => {
    const st = {
      population: 10, happiness: 100, taxPercent: 100,
      resources: { ...zeroResources(), makanan: 1000 },
      levels: lv({ ladang: 5, balai_pekerja: 5 }),
      workersPerBuilding: workers({ ladang: 15 }),
      unitCounts: {},
    };
    const r = advance(st, 4);
    expect(r.state.happiness).toBeLessThan(B.LOW_HAPPINESS_THRESHOLD);
    expect(r.grewPopulation).toBe(0);
  });
  it("kebahagiaan nol membuat penduduk pergi", () => {
    const st = {
      population: 10, happiness: 100, taxPercent: 100,
      resources: { ...zeroResources(), makanan: 1000 },
      levels: lv({}),
      workersPerBuilding: workers({}),
      unitCounts: {},
    };
    const r = advance(st, 2);
    expect(r.leftPopulation).toBeGreaterThan(0);
    expect(r.state.population).toBeLessThan(10);
  });
});
