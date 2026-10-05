# Kronik Kerajaan

Game teks berbasis web: kelola kerajaan kecil dari desa menjadi benteng — ekonomi idle, pembangunan bergaya Age of Empires/Stronghold, penaklukan bergaya Torn. Bahasa antarmuka: Indonesia.

## Menjalankan

```bash
npm install
npm run dev        # buka http://localhost:3000
# produksi:
npm run build && npm start
```

## Uji & verifikasi

```bash
npm test                      # vitest: ekonomi, antrean, perang, offline cap (24 tes)
python3 scripts/contrast-check.py   # kontras WCAG AA kedua tema
```

## Struktur

- `PLAN.md` — rencana lengkap (fase, arsitektur, gerbang)
- `DESIGN.md` — arah visual manuskrip & tinta (palet, tipografi, motif rubrikasi)
- `AGENTS.md` — konvensi & blok antislop
- `config/balance.ts` — SEMUA angka ekonomi/perang (tuning di sini saja)
- `db/schema.sql` — skema SQLite (via `node:sqlite`, tanpa dependensi native)
- `src/lib/game/engine.ts` — logika murni tanpa IO (produksi, biaya, perang, skor)
- `src/lib/resolve.ts` — `resolveKingdom()`: tick evaluasi malas (tanpa cron), cap offline 12 jam
- `src/app/` — layar-layar (Kerajaan, Bangunan, Riset, Militer, Peta, Kronik, Pasar, Peringkat, Pengaturan)
- `src/tests/` — vitest

## Loop gameplay

1. **Ekonomi (idle)** — bangunan memproduksi per jam, berjalan saat offline (cap 12 jam), dibatasi gudang.
2. **Pembangunan** — pekerja dialokasikan, biaya ×1.6^level, era membuka konten.
3. **Penaklukan (Torn)** — intai → serang kerajaan NPC, laporan perang berupa teks kronik naratif, jarahan 20%.

Database tersimpan di `db/kerajaan.sqlite` (dibuat otomatis). Siap multiplayer: semua operasi menerima `kingdomId`.
