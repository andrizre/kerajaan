// Logika game murni — tanpa IO. Semua angka dari config/balance.ts.
import * as B from "@config/balance";

export type Resources = Record<B.Resource, number>;
export type BuildingLevels = Record<string, number>;

export const zeroResources = (): Resources => ({
  makanan: 0, kayu: 0, batu: 0, besi: 0, emas: 0,
});

// ---------- Biaya & durasi ----------

export function buildingCost(buildingId: string, currentLevel: number): Resources {
  const def = B.BUILDINGS.find((b) => b.id === buildingId);
  if (!def) throw new Error(`Bangunan tidak dikenal: ${buildingId}`);
  const f = Math.pow(B.BUILDING_COST_MULTIPLIER, currentLevel);
  const cost = zeroResources();
  for (const [res, amt] of Object.entries(def.baseCost)) {
    cost[res as B.Resource] = Math.ceil((amt as number) * f);
  }
  return cost;
}

export function buildingDurationHours(buildingId: string, currentLevel: number): number {
  const def = B.BUILDINGS.find((b) => b.id === buildingId);
  if (!def) throw new Error(`Bangunan tidak dikenal: ${buildingId}`);
  return def.baseDurationHours * (currentLevel + 1); // durasi = base * level tujuan
}

export function techCost(techId: string): Resources {
  const def = B.TECHS.find((t) => t.id === techId);
  if (!def) throw new Error(`Riset tidak dikenal: ${techId}`);
  const cost = zeroResources();
  for (const [res, amt] of Object.entries(def.cost)) cost[res as B.Resource] = amt as number;
  return cost;
}

export function unitCost(unitId: string, quantity: number): Resources {
  const def = B.UNITS.find((u) => u.id === unitId);
  if (!def) throw new Error(`Unit tidak dikenal: ${unitId}`);
  const cost = zeroResources();
  for (const [res, amt] of Object.entries(def.cost)) cost[res as B.Resource] = (amt as number) * quantity;
  return cost;
}

export function canAfford(have: Resources, cost: Resources): boolean {
  return B.RESOURCES.every((r) => have[r] >= cost[r]);
}

export function subtract(res: Resources, cost: Resources): Resources {
  const out = { ...res };
  for (const r of B.RESOURCES) out[r] = out[r] - cost[r];
  return out;
}

// ---------- Kapasitas & produksi ----------

export function warehouseCapacity(levels: BuildingLevels): number {
  return B.WAREHOUSE_BASE_CAPACITY + (levels["gudang"] ?? 0) * B.WAREHOUSE_CAPACITY_PER_LEVEL;
}

export function housingCapacity(levels: BuildingLevels): number {
  return B.INITIAL_POPULATION + (levels["balai_pekerja"] ?? 0) * B.HOUSING_POP_PER_LEVEL;
}

export function maxBuildingLevelAllowed(levels: BuildingLevels): number {
  return (levels["balai_kota"] ?? 0) + 1;
}

export function productionPerHour(
  levels: BuildingLevels,
  workersPerBuilding: Record<string, number>,
  happinessFactor: number
): Resources {
  const prod = zeroResources();
  for (const def of B.BUILDINGS) {
    if (!def.effect) continue;
    const level = levels[def.id] ?? 0;
    if (level <= 0) continue;
    const slots = def.workerSlotsPerLevel * level;
    const assigned = Math.min(workersPerBuilding[def.id] ?? 0, slots);
    if (assigned <= 0) continue;
    const fill = assigned / slots; // proporsi slot terisi
    prod[def.effect.resource] +=
      def.effect.perLevelPerHour * level * fill * happinessFactor;
  }
  return prod;
}

export function happinessFactor(happiness: number): number {
  if (happiness < B.LOW_HAPPINESS_THRESHOLD) return B.LOW_HAPPINESS_PRODUCTION_FACTOR;
  return 1;
}

export function taxGoldPerHour(population: number, taxPercent: number): number {
  return population * B.TAX_GOLD_PER_POP_PER_HOUR * (taxPercent / 100);
}

export function happinessFromTax(taxPercent: number): number {
  return Math.max(0, B.BASE_HAPPINESS_AT_ZERO_TAX - taxPercent * B.HAPPINESS_PER_TAX_PERCENT);
}

export function foodUpkeepPerHour(population: number, unitCounts: Record<string, number>): number {
  let upkeep = population * B.FOOD_PER_POPULATION_PER_HOUR;
  for (const def of B.UNITS) upkeep += (unitCounts[def.id] ?? 0) * def.foodUpkeepPerHour;
  return upkeep;
}

// ---------- Resolusi waktu (inti mesin evaluasi malas) ----------

export type KingdomState = {
  population: number;
  happiness: number;
  taxPercent: number;
  resources: Resources;
  levels: BuildingLevels;
  workersPerBuilding: Record<string, number>;
  unitCounts: Record<string, number>;
};

export type TickResult = {
  state: KingdomState;
  produced: Resources;
  consumed: Resources;
  starvedUnitsKilled: number;
  grewPopulation: number;
  leftPopulation: number;
  cappedResources: Resources; // yang terbuang karena gudang penuh
};

/**
 * Majukan state selama `hours` (atau selisih waktu nyata, dibatasi cap offline).
 * Deterministik: input sama → output sama.
 */
export function advance(state: KingdomState, hours: number, now = Date.now()): TickResult {
  const capped = zeroResources();
  const produced = zeroResources();
  const consumed = zeroResources();

  const cap = warehouseCapacity(state.levels);
  const hFac = happinessFactor(state.happiness);
  const prod = productionPerHour(state.levels, state.workersPerBuilding, hFac);
  const tax = taxGoldPerHour(state.population, state.taxPercent);
  const upkeepFood = foodUpkeepPerHour(state.population, state.unitCounts);

  for (const r of B.RESOURCES) {
    produced[r] = prod[r] * hours;
  }
  produced.emas += tax * hours;

  consumed.makanan = upkeepFood * hours;

  // Kelaparan: bila makanan tidak cukup, unit militer terbunuh proporsional
  let starvedUnitsKilled = 0;
  const totalUnits = Object.values(state.unitCounts).reduce((a, b) => a + b, 0);
  const foodBefore = state.resources.makanan + produced.makanan;
  if (totalUnits > 0 && foodBefore < consumed.makanan) {
    const deficit = consumed.makanan - foodBefore;
    starvedUnitsKilled = Math.min(totalUnits, Math.floor(deficit * 2)); // 1 unit per 2 makanan defisit
    if (starvedUnitsKilled > 0) {
      // bunuh proporsional dari unit terbesar dulu (murah dulu)
      let remaining = starvedUnitsKilled;
      const order = [...B.UNITS].sort((a, b) => a.attack - b.attack);
      for (const u of order) {
        const have = state.unitCounts[u.id] ?? 0;
        if (have <= 0) continue;
        const kill = Math.min(have, remaining);
        state.unitCounts[u.id] = have - kill;
        remaining -= kill;
        if (remaining <= 0) break;
      }
      starvedUnitsKilled -= remaining;
    }
  }

  const res = { ...state.resources };
  for (const r of B.RESOURCES) {
    res[r] = res[r] + produced[r] - consumed[r];
    if (res[r] < 0) res[r] = 0;
    if (res[r] > cap) {
      capped[r] = res[r] - cap;
      res[r] = cap;
    }
  }

  // Kebahagiaan mengikuti pajak + balai rakyat, diterapkan deterministik
  const happiness = Math.max(0, Math.min(100,
    happinessFromTax(state.taxPercent) + (state.levels["balai_rakyat"] ?? 0) * B.BALAI_RAKYAT_HAPPINESS_PER_LEVEL
  ));

  // Pertumbuhan populasi: butuh makanan positif, kebahagiaan cukup, dan tempat tinggal
  const cap_pop = housingCapacity(state.levels);
  let population = state.population;
  let grew = 0;
  if (happiness >= B.LOW_HAPPINESS_THRESHOLD && res.makanan > 0 && population < cap_pop) {
    grew = Math.min(B.POPULATION_GROWTH_PER_HOUR * hours, cap_pop - population);
    population += grew;
  }
  // Emigrasi bila kebahagiaan kritis
  let left = 0;
  if (happiness <= 0 && population > 0) {
    left = Math.min(population, B.EMIGRATION_PER_HOUR_AT_ZERO_HAPPINESS * hours);
    population -= left;
  }

  return {
    state: { ...state, population, happiness, resources: res },
    produced,
    consumed,
    starvedUnitsKilled,
    grewPopulation: grew,
    leftPopulation: left,
    cappedResources: capped,
  };
}

// ---------- Era ----------

export function canAdvanceEra(levels: BuildingLevels, completedTechs: string[], currentEra: number): boolean {
  const next = B.ERAS.find((e) => e.id === currentEra + 1);
  if (!next) return false;
  return (levels["balai_kota"] ?? 0) >= next.cityHallLevel && completedTechs.includes(next.requiredTech);
}

export function eraName(era: number): string {
  return B.ERAS.find((e) => e.id === era)?.name ?? "Zaman Tak Dikenal";
}

// ---------- Perang ----------

export function attackerPower(units: Record<string, number>): number {
  let p = 0;
  for (const def of B.UNITS) p += (units[def.id] ?? 0) * def.attack;
  return p;
}

export function defenderPower(npcTroops: number, wallLevel: number, towerLevel: number): number {
  const bonus = 1 + wallLevel * B.DEFENDER_BONUS_WALL_PER_LEVEL + towerLevel * B.DEFENDER_BONUS_TOWER_PER_LEVEL;
  return npcTroops * bonus;
}

export type BattleInput = {
  attackerUnits: Record<string, number>;
  npcTroops: number;
  wallLevel: number;
  towerLevel: number;
  npcResources: Resources;
};

export type BattleResult = {
  attackerWon: boolean;
  attackerLosses: Record<string, number>; // unit hilang
  defenderLosses: number; // pasukan NPC hilang
  loot: Resources;
  powerA: number;
  powerD: number;
};

export function resolveBattle(input: BattleInput): BattleResult {
  const powerA = attackerPower(input.attackerUnits);
  const powerD = defenderPower(input.npcTroops, input.wallLevel, input.towerLevel);
  const total = powerA + powerD;
  const attackerWon = powerA > powerD;

  // Kerugian proporsional: pihak yang lebih lemah kehilangan lebih besar
  const lossShareA = powerD / Math.max(total, 1);
  const lossShareD = powerA / Math.max(total, 1);

  const losses: Record<string, number> = {};
  let sentTotal = 0;
  for (const def of B.UNITS) {
    const sent = input.attackerUnits[def.id] ?? 0;
    sentTotal += sent;
    losses[def.id] = Math.min(sent, Math.floor(sent * lossShareA * (attackerWon ? 0.8 : 1.2)));
  }
  const defenderLosses = Math.floor(input.npcTroops * lossShareD * (attackerWon ? 0.9 : 0.6));

  // Jarahan: min(20% sumber daya NPC, kapasitas angkut armada yang selamat)
  const loot = zeroResources();
  if (attackerWon) {
    let carry = 0;
    for (const def of B.UNITS) {
      const survivors = (input.attackerUnits[def.id] ?? 0) - losses[def.id];
      carry += survivors * def.carryCapacity;
    }
    for (const r of B.RESOURCES) {
      const want = Math.floor(input.npcResources[r] * B.LOOT_PERCENT_OF_TARGET);
      loot[r] = Math.min(want, carry);
      carry -= loot[r];
      if (carry <= 0) break;
    }
  }

  return { attackerWon, attackerLosses: losses, defenderLosses, loot, powerA, powerD };
}

// ---------- Laporan perang (teks kronik, selera Torn) ----------

function fmt(n: number): string {
  return Math.floor(n).toLocaleString("id-ID");
}

export function renderWarChronicle(
  targetName: string,
  result: BattleResult,
  units: Record<string, number>
): string {
  const lines: string[] = [];
  if (result.attackerWon) {
    lines.push(`Bendera kita berkibar di atas reruntuhan gerbang ${targetName}.`);
  } else {
    lines.push(`Pasukan kita pulang dengan kepala tertunduk; ${targetName} bertahan.`);
  }
  lines.push(
    `Kekuatan serangan kita ${fmt(result.powerA)} berhadapan dengan pertahanan ${fmt(result.powerD)}.`
  );
  const lossParts: string[] = [];
  for (const def of B.UNITS) {
    const sent = units[def.id] ?? 0;
    const lost = result.attackerLosses[def.id] ?? 0;
    if (sent > 0) lossParts.push(`${lost} dari ${sent} ${def.name}`);
  }
  if (lossParts.length) lines.push(`Gugur di medan perang: ${lossParts.join(", ")}.`);
  lines.push(`Pertahanan musuh kehilangan ${fmt(result.defenderLosses)} pasukan.`);
  if (result.attackerWon) {
    const lootParts = B.RESOURCES.filter((r) => result.loot[r] > 0).map(
      (r) => `${fmt(result.loot[r])} ${r}`
    );
    lines.push(
      lootParts.length
        ? `Jarahan dibawa pulang: ${lootParts.join(", ")}. Juru tulis mencatat semuanya.`
        : `Tak ada jarahan yang muat di angkut armada. Kronik mencatat perang yang lapar.`
    );
  }
  return lines.join(" ");
}

// ---------- Pertahanan NPC ----------
// NPC tidak meminjam tembok/menara pemain; pertahanannya deterministik dari kekuatan sendiri.
export function npcDefenseLevels(power: number): { wallLevel: number; towerLevel: number } {
  const wallLevel = Math.min(10, Math.floor(power / 200));
  const towerLevel = power >= 1000 ? Math.min(6, Math.floor((power - 1000) / 400)) : 0;
  return { wallLevel, towerLevel };
}

// ---------- Skor ----------

export function computeScore(
  population: number,
  levels: BuildingLevels,
  unitCounts: Record<string, number>,
  techCount: number,
  era: number
): number {
  let s = population * B.SCORE_POPULATION;
  for (const l of Object.values(levels)) s += l * B.SCORE_BUILDING_LEVEL;
  for (const c of Object.values(unitCounts)) s += c * B.SCORE_UNIT;
  s += techCount * B.SCORE_TECH + era * B.SCORE_ERA;
  return Math.floor(s);
}

// ---------- Pasar ----------

export function marketPrices(seed: number): Record<B.Resource, number> {
  // fluktuasi deterministik dari seed (mis. jam ke-i)
  const out = {} as Record<B.Resource, number>;
  B.RESOURCES.forEach((r, i) => {
    const wobble = Math.sin(seed * 0.7 + i * 1.3) * B.MARKET_SPREAD;
    out[r] = Math.round(B.MARKET_BASE_PRICES[r] * (1 + wobble) * 100) / 100;
  });
  return out;
}
