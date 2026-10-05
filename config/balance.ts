// ============================================================
// config/balance.ts — SEMUA angka ekonomi & perang di satu file
// Mengubah nilai di sini tidak boleh menyentuh logika.
// ============================================================

export const RESOURCES = ["makanan", "kayu", "batu", "besi", "emas"] as const;
export type Resource = (typeof RESOURCES)[number];

// --- Waktu ---
export const OFFLINE_CAP_HOURS = 12; // produksi offline maksimal (jam)
export const TICK_MS = 0; // evaluasi malas: tidak ada tick periodik

// --- Populasi & pekerja ---
export const INITIAL_POPULATION = 10;
export const POPULATION_GROWTH_PER_HOUR = 0.5; // penduduk baru/jam bila kondisi cukup
export const FOOD_PER_POPULATION_PER_HOUR = 0.2; // upkeep dasar per penduduk
export const WORKER_PRODUCTION_SHARE = 0.1; // produksi per pekerja per jam = base * share

// --- Pajak & kebahagiaan ---
export const TAX_GOLD_PER_POP_PER_HOUR = 0.1; // emas/jam pada pajak 100%
export const HAPPINESS_PER_TAX_PERCENT = 1.0; // kebahagiaan turun per % pajak (100% pajak → 0)
export const BASE_HAPPINESS_AT_ZERO_TAX = 100;
export const LOW_HAPPINESS_THRESHOLD = 30;
export const LOW_HAPPINESS_PRODUCTION_FACTOR = 0.7;
export const EMIGRATION_PER_HOUR_AT_ZERO_HAPPINESS = 1; // penduduk pergi/jam

// --- Biaya & durasi bangunan ---
export const BUILDING_COST_MULTIPLIER = 1.6; // base * 1.6^level
export const BUILDING_DURATION_LINEAR = true; // durasi = base_jam * level
export const MAX_BUILDING_LEVEL = 20;

export type BuildingDef = {
  id: string;
  name: string;
  era: 1 | 2 | 3 | 4;
  baseCost: Partial<Record<Resource, number>>;
  baseDurationHours: number;
  effect: { resource: Resource; perLevelPerHour: number } | null;
  workerSlotsPerLevel: number;
  description: string;
};

export const BUILDINGS: BuildingDef[] = [
  {
    id: "balai_kota",
    name: "Balai Kota",
    era: 1,
    baseCost: { kayu: 60, batu: 40 },
    baseDurationHours: 0.5,
    effect: null,
    workerSlotsPerLevel: 0,
    description: "Ikon era kerajaan. Level-nya menjadi batas level seluruh bangunan lain.",
  },
  {
    id: "ladang",
    name: "Ladang",
    era: 1,
    baseCost: { kayu: 30 },
    baseDurationHours: 0.25,
    effect: { resource: "makanan", perLevelPerHour: 12 },
    workerSlotsPerLevel: 3,
    description: "Menanam gandum. Sumber makanan utama kerajaan.",
  },
  {
    id: "tempat_tebang",
    name: "Tempat Tebang",
    era: 1,
    baseCost: { kayu: 20, makanan: 20 },
    baseDurationHours: 0.25,
    effect: { resource: "kayu", perLevelPerHour: 8 },
    workerSlotsPerLevel: 3,
    description: "Tebang pohon dan gergaji kayu balok.",
  },
  {
    id: "pemecah_batu",
    name: "Pemecah Batu",
    era: 1,
    baseCost: { kayu: 40 },
    baseDurationHours: 0.3,
    effect: { resource: "batu", perLevelPerHour: 6 },
    workerSlotsPerLevel: 3,
    description: "Memecah batu karang untuk tembok dan jalan.",
  },
  {
    id: "peleburan_besi",
    name: "Peleburan Besi",
    era: 1,
    baseCost: { kayu: 60, batu: 50 },
    baseDurationHours: 0.4,
    effect: { resource: "besi", perLevelPerHour: 4 },
    workerSlotsPerLevel: 3,
    description: "Melebur bijih besi menjadi bilah dan paku.",
  },
  {
    id: "tambang_emas",
    name: "Tambang Emas",
    era: 3,
    baseCost: { kayu: 120, batu: 100, besi: 40 },
    baseDurationHours: 0.6,
    effect: { resource: "emas", perLevelPerHour: 2 },
    workerSlotsPerLevel: 4,
    description: "Menggali urat emas di pegunungan (terbuka di Zaman Ksatria).",
  },
  {
    id: "gudang",
    name: "Gudang",
    era: 1,
    baseCost: { kayu: 50 },
    baseDurationHours: 0.3,
    effect: null,
    workerSlotsPerLevel: 0,
    description: "Menyimpan hasil bumi. Kapasitas menentukan batas seluruh sumber daya.",
  },
  {
    id: "balai_pekerja",
    name: "Balai Pekerja",
    era: 1,
    baseCost: { kayu: 45, makanan: 30 },
    baseDurationHours: 0.3,
    effect: null,
    workerSlotsPerLevel: 0,
    description: "Rumah-rumah pekerja. Menentukan kapasitas populasi.",
  },
  {
    id: "barak",
    name: "Barak",
    era: 1,
    baseCost: { kayu: 70, batu: 30 },
    baseDurationHours: 0.4,
    effect: null,
    workerSlotsPerLevel: 0,
    description: "Tempat melatih pasukan dan menampung mereka.",
  },
  {
    id: "tembok",
    name: "Tembok",
    era: 1,
    baseCost: { batu: 80 },
    baseDurationHours: 0.5,
    effect: null,
    workerSlotsPerLevel: 0,
    description: "Pertahanan pertama. Menambah kekuatan bertahan.",
  },
  {
    id: "menara_jaga",
    name: "Menara Jaga",
    era: 4,
    baseCost: { batu: 150, besi: 50 },
    baseDurationHours: 0.6,
    effect: null,
    workerSlotsPerLevel: 0,
    description: "Penglihatan jauh dan busur di ketinggian (Zaman Benteng).",
  },
  {
    id: "balai_rakyat",
    name: "Balai Rakyat",
    era: 2,
    baseCost: { kayu: 80, batu: 60 },
    baseDurationHours: 0.4,
    effect: null,
    workerSlotsPerLevel: 0,
    description: "Perayaan dan musyawarah. Menenangkan hati penduduk (Zaman Kerajaan).",
  },
  {
    id: "pasar",
    name: "Pasar",
    era: 1,
    baseCost: { kayu: 50, makanan: 40 },
    baseDurationHours: 0.3,
    effect: null,
    workerSlotsPerLevel: 2,
    description: "Perdagangan dengan pedagang keliling. Membuka layar Pasar.",
  },
];

// --- Efek non-produksi (linier per level) ---
export const WAREHOUSE_CAPACITY_PER_LEVEL = 500;
export const WAREHOUSE_BASE_CAPACITY = 300;
export const HOUSING_POP_PER_LEVEL = 8;
export const BALAI_RAKYAT_HAPPINESS_PER_LEVEL = 4;
export const WALL_DEFENSE_PER_LEVEL = 15;
export const TOWER_DEFENSE_PER_LEVEL = 25;
export const BARRACK_CAPACITY_PER_LEVEL = 10;

// --- Riset & era ---
export type TechDef = {
  id: string;
  name: string;
  era: 1 | 2 | 3 | 4;
  cost: Partial<Record<Resource, number>>;
  durationHours: number;
  requiredForEraAdvance: boolean;
  unlocks?: string[];
  description: string;
};

export const TECHS: TechDef[] = [
  {
    id: "tulisan_lisan",
    name: "Adat Lisan",
    era: 1,
    cost: { makanan: 50, kayu: 30 },
    durationHours: 0.5,
    requiredForEraAdvance: true,
    description: "Cerita dan hukum dihafal juru tulis. Modal menuju Zaman Kerajaan.",
  },
  {
    id: "pencatatan",
    name: "Pencatatan Kerajaan",
    era: 2,
    cost: { kayu: 100, besi: 40 },
    durationHours: 1,
    requiredForEraAdvance: true,
    unlocks: ["balai_rakyat"],
    description: "Kronik resmi mulai ditulis. Wajib menuju Zaman Ksatria.",
  },
  {
    id: "metalurgi_maju",
    name: "Metalurgi Maju",
    era: 3,
    cost: { besi: 150, batu: 100 },
    durationHours: 1.5,
    requiredForEraAdvance: true,
    unlocks: ["tambang_emas"],
    description: "Tungku lebih panas: emas dan baja. Wajib menuju Zaman Benteng.",
  },
  {
    id: "teknik_benteng",
    name: "Teknik Benteng",
    era: 4,
    cost: { batu: 300, besi: 200, emas: 100 },
    durationHours: 2,
    requiredForEraAdvance: false,
    unlocks: ["menara_jaga"],
    description: "Ilmu menara dan parit tinggi.",
  },
];

export type EraDef = {
  id: number;
  name: string;
  cityHallLevel: number;
  requiredTech: string;
};

export const ERAS: EraDef[] = [
  { id: 1, name: "Zaman Permukiman", cityHallLevel: 0, requiredTech: "" },
  { id: 2, name: "Zaman Kerajaan", cityHallLevel: 3, requiredTech: "tulisan_lisan" },
  { id: 3, name: "Zaman Ksatria", cityHallLevel: 6, requiredTech: "pencatatan" },
  { id: 4, name: "Zaman Benteng", cityHallLevel: 10, requiredTech: "metalurgi_maju" },
];

// --- Militer ---
export type UnitDef = {
  id: string;
  name: string;
  era: 1 | 2 | 3 | 4;
  attack: number;
  foodUpkeepPerHour: number;
  trainMinutes: number;
  cost: Partial<Record<Resource, number>>;
  carryCapacity: number;
  description: string;
};

export const UNITS: UnitDef[] = [
  { id: "milisi", name: "Milisi", era: 1, attack: 6, foodUpkeepPerHour: 0.4, trainMinutes: 5, cost: { makanan: 20, kayu: 10 }, carryCapacity: 40, description: "Petani bersenjata keratan. Murah, banyak." },
  { id: "pemanah", name: "Pemanah", era: 1, attack: 10, foodUpkeepPerHour: 0.5, trainMinutes: 8, cost: { makanan: 30, kayu: 30 }, carryCapacity: 40, description: "Busur panjang dari hutan tebangan." },
  { id: "tombak", name: "Pasukan Tombak", era: 2, attack: 16, foodUpkeepPerHour: 0.7, trainMinutes: 12, cost: { makanan: 40, kayu: 30, besi: 15 }, carryCapacity: 60, description: "Dinding tombak yang menahan kavaleri." },
  { id: "pendekar", name: "Pendekar", era: 3, attack: 26, foodUpkeepPerHour: 1.0, trainMinutes: 20, cost: { makanan: 60, besi: 40 }, carryCapacity: 80, description: "Baja berkilau, pedang berat." },
  { id: "ketapel", name: "Ketapel", era: 4, attack: 45, foodUpkeepPerHour: 2.0, trainMinutes: 40, cost: { kayu: 150, besi: 80, emas: 30 }, carryCapacity: 0, description: "Mesin perang yang meruntuhkan tembok." },
];

// --- Perang ---
export const DEFENDER_BONUS_WALL_PER_LEVEL = 0.05; // +5% kekuatan bertahan per level tembok
export const DEFENDER_BONUS_TOWER_PER_LEVEL = 0.08;
export const LOOT_PERCENT_OF_TARGET = 0.2; // 20% sumber daya target
export const NPC_RECOVERY_HOURS = 8; // pasukan NPC pulih penuh setelah ini
export const TRAVEL_MINUTES_PER_DISTANCE = 10; // waktu tempuh per satuan jarak
export const SCOUT_MINUTES = 5;

// --- Pasar ---
export const MARKET_BASE_PRICES: Record<Resource, number> = {
  makanan: 1,
  kayu: 1.5,
  batu: 2,
  besi: 3.5,
  emas: 10,
};
export const MARKET_SPREAD = 0.15; // harga jual = dasar * (1 - spread), beli = dasar * (1 + spread)

// --- NPC kingdoms ---
export const NPC_KINGDOMS: { name: string; distance: number; power: number }[] = [
  { name: "Kerajaan Rumbia", distance: 1, power: 60 },
  { name: "Kadipaten Kendal", distance: 2, power: 120 },
  { name: "Kerajaan Sandal", distance: 3, power: 200 },
  { name: "Kesultanan Timur", distance: 4, power: 320 },
  { name: "Kerajaan Pasisir", distance: 5, power: 480 },
  { name: "Kadipaten Gunung", distance: 6, power: 700 },
  { name: "Kerajaan Lembah", distance: 7, power: 980 },
  { name: "Kesultanan Barat", distance: 8, power: 1300 },
  { name: "Kerajaan Baja Hitam", distance: 9, power: 1700 },
  { name: "Kerajaan Mahkota Emas", distance: 10, power: 2200 },
];

// --- Skor peringkat ---
export const SCORE_POPULATION = 1;
export const SCORE_BUILDING_LEVEL = 10;
export const SCORE_UNIT = 5;
export const SCORE_TECH = 50;
export const SCORE_ERA = 200;

// --- Acara acak ---
export const EVENT_BASE_INTERVAL_HOURS = 2.5; // rata-rata jeda antar-acara
