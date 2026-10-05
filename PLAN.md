# PLAN.md — Kronik Kerajaan

Game teks berbasis web, mengelola kerajaan seperti Age of Empires/Stronghold, dengan loop seperti Torn dan IdleMMO. Bahasa antarmuka: Bahasa Indonesia.

## Keputusan terkunci

- Nama: Kronik Kerajaan
- Folder: /home/agentuser/kerajaan
- Model: single player dulu, save server-side, siap multiplayer (kolom `owner` disiapkan di skema)
- Stack: Next.js (App Router, TypeScript) + SQLite via node:sqlite
- Arah visual: manuskrip & tinta (DESIGN.md, ditulis sebelum UI)
- Dials: ENERGY 2 / RHYTHM 2 / MOTION 1

## Visi gameplay

Tiga loop yang saling mengunci:

1. **Ekonomi (idle)**: bangunan memproduksi sumber daya per jam, progres berjalan saat pemain pergi (IdleMMO), dibatasi kapasitas gudang dan cap offline 12 jam.
2. **Pembangunan (AoE/Stronghold)**: pekerja dialokasikan, konstruksi/riset durasi waktu nyata, biaya base × 1.6^level, era membuka konten.
3. **Penaklukan (Torn)**: serangan ke kerajaan NPC dengan waktu tempuh, laporan perang berbentuk teks kronik, jarahan sumber daya, pertahanan bisa diserang balik saat offline.

### Sumber daya (5)
Makanan (upkeep + pertumbuhan populasi), Kayu, Batu, Besi, Emas (pajak + perdagangan).

### Bangunan (12, MVP)
Balai Kota; produksi: Ladang, Tempat Tebang, Pemecah Batu, Peleburan Besi, Tambang Emas (era 3); logistik: Gudang, Balai Pekerja; militer: Barak, Tembok, Menara Jaga; sosial: Balai Rakyat, Pasar. Level 1–20, biaya base × 1.6^level, durasi base_jam × level, efek linier. Semua angka di `config/balance.ts`.

### Pekerja, pajak, kebahagiaan
Populasi tumbuh bila makanan & kapasitas rumah cukup. Pekerja dialokasikan per bangunan. Pajak 0–100% → emas/penduduk/jam; pajak tinggi → kebahagiaan turun → produksi turun, penduduk pergi.

### Zaman (era gate)
1. Zaman Permukiman: bangunan dasar, Milisi, Pemanah
2. Zaman Kerajaan: riset bertingkat, Pasukan Tombak, Balai Rakyat
3. Zaman Ksatria: Tambang Emas, Pendekar, Ksatria
4. Zaman Benteng: Menara Jaga penuh, Ketapel, Tembok tinggi

Syarat naik era: Balai Kota level X + riset wajib selesai. Riset satu per satu, antrean seperti konstruksi.

### Militer & serangan
5 unit: Milisi, Pemanah, Pasukan Tombak, Pendekar, Ketapel. Latihan di Barak (antrean), upkeep makanan/jam. 10 kerajaan NPC (nama, jarak, kekuatan). Tahap Torn: intai → serang (pulang-pergi). Kekuatan = Σ(unit × serangan) + bonus pertahanan. Kerugian proporsional. Jarahan = min(20% sumber daya target, kapasitas angkut). Laporan perang = teks kronik naratif. NPC punya timer pemulihan pasukan.

### Lapisan Torn
Kronik (umpan laporan + penanda belum dibaca), acara acak dengan pilihan, pasar NPC (harga dasar + fluktuasi), peringkat vs 10 NPC.

### Mesin tick: evaluasi malas
Tanpa cron. Semua state membawa `last_resolved_at`. Setiap API memanggil `resolveKingdom()`: selisih waktu → kredit produksi (dibatasi gudang & cap offline 12 jam) → potong upkeep → selesaikan antrean. Deterministik, hemat, mudah diuji.

## Layar

| Layar | Isi |
|---|---|
| Kerajaan | Panel sumber daya, antrean aktif + timer, pekerja, kebahagiaan, aksi cepat |
| Bangunan | Level, efek, biaya, timer upgrade, alokasi pekerja, antrean |
| Riset | Pohon riset per zaman, antrean |
| Militer | Rekrut unit, komposisi, upkeep |
| Peta | NPC kingdom, intai/serang, status perjalanan pasukan |
| Kronik | Umpan laporan + detail laporan perang |
| Pasar | Jual-beli ke NPC |
| Peringkat | Skor pemain vs NPC |
| Pengaturan | Nama kerajaan, tema, mulai ulang (konfirmasi) |

Desktop: bar atas. Mobile: bottom nav 5 tujuan utama + menu "Lainnya". Semua tujuan berisi (R-24), tanpa tautan mati (R-26).

## Arsitektur

```
kerajaan/
  AGENTS.md  DESIGN.md  PLAN.md
  config/balance.ts
  db/schema.sql
  src/lib/game/     # murni tanpa IO
  src/lib/db.ts     # node:sqlite
  src/lib/resolve.ts
  src/app/<layar>/  # App Router, server components + route handler
  src/tests/        # vitest
```

Tabel: save, resources, buildings, construction_queue, research_queue, training_queue, units, techs, workers, npc_kingdoms, reports, market_prices, events. Mutasi via handler + Zod, lalu `resolveKingdom()`. Semua operasi menerima `kingdomId`.

## Urutan eksekusi

- **Fase 0** Fondasi: scaffold, DESIGN.md, AGENTS.md, shell responsif, tema terang/gelap, kontras AA. Gerbang: `next build` lolos, 375px + desktop, kedua tema lolos checker.
- **Fase 1** Data & tick: skema, save, resolveKingdom + cap offline, uji unit. Gerbang: produksi offline akurat, deterministik.
- **Fase 2** Ekonomi & pembangunan. Gerbang: loop bangun→produksi→naik level jalan penuh.
- **Fase 3** Riset & zaman. Gerbang: era terkunci sampai syarat terpenuhi.
- **Fase 4** Militer. Gerbang: upkeep per jam, unit habis bila kelaparan.
- **Fase 5** Peta & serangan. Gerbang: serangan pulang-pergi + laporan jarahan konsisten.
- **Fase 6** Lapisan Torn. Gerbang: semua laporan asli dari kejadian nyata (R-38).
- **Fase 7** QA & Delivery Gate: uji klik browser (R-35), mobile 375/768/1024 (R-03), keyboard/fokus (R-32), keadaan kosong/muat/gagal (R-27), tuning, laporan PASS/FAIL.

Setiap fase diakhiri build lolos + uji merah-hijau. Tidak ada hasil fase tanpa laporan gerbang.
