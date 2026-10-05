# AGENTS.md — Kronik Kerajaan

Rencana lengkap: `PLAN.md`. Arah visual: `DESIGN.md` (baca sebelum menyentuh UI).

## Blok antislop

- Palet terkunci di DESIGN.md — tidak menambah warna baru tanpa alasan tertulis.
- Tanpa emoji di UI (R-04). Ikon = teks-dulu / SVG khusus.
- Tanpa animasi tanpa tujuan (R-19). MOTION 1: hover + progres saja.
- Setiap tujuan navigasi punya isinya (R-24), tanpa tautan mati (R-26).
- Semua laporan/asal data dari kejadian nyata di game, bukan data karangan (R-38).
- Semua angka ekonomi/perang di `config/balance.ts`, tidak disebar di logika.
- Kontras AA kedua tema diverifikasi sebelum gerbang fase (R-25, R-34).

## Konvensi teknis

- Next.js App Router + TypeScript strict. SQLite via `node:sqlite` (tanpa dependensi native).
- Tidak ada cron/background job: tick = evaluasi malas via `resolveKingdom()` di `src/lib/resolve.ts`, dipanggil di setiap baca/tulis API.
- Semua mutasi lewat route handler + validasi Zod, lalu `resolveKingdom()` dulu sebelum respons.
- Logika game murni di `src/lib/game/` (tanpa IO), bisa diuji vitest tanpa server.
- Semua operasi menerima `kingdomId` (kesiapan multiplayer; kolom `owner` sudah disiapkan).
