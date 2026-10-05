# DESIGN.md — Kronik Kerajaan

> Ditulis sebelum baris UI pertama (R-37). Semua keputusan visual mengacu ke dokumen ini.

## Identitas

Kronik kerajaan yang ditulis di atas perkamen. Suara antarmuka: **seorang juru tulis istana** — bernada hidup, naratif, bukan katalog fitur. Angka dan status tetap jelas, tapi dibingkai sebagai catatan sejarah ("Gudang penuh — jagalah panen"), bukan dashboard kosong.

## Palet (R-29: 2–3 inti + 1 aksen)

| Peran | Terang | Gelap ("Kodeks Malam") |
|---|---|---|
| Dasar (kertas) | `#F4EAD5` perkamen | `#1C1710` perkamen tua |
| Teks (tinta) | `#2A2118` coklat-hitam | `#E8DCC4` tinta pucat |
| Sekunder (data ekonomi) | `#5C6B3C` hijau zaitun | `#8FA05E` zaitun terang |
| Aksen (tindakan & genting) | `#A03A22` bata merah | `#C96A4A` bata hangat |

Aturan pakai:
- Bata merah **hanya** untuk tombol aksi utama, rubrikasi judul, dan status genting (perang masuk, kebahagiaan kritis, gudang penuh).
- Zaitun untuk angka sumber daya, progres antrean, data ekonomi.
- Tidak ada warna keempat di luar turunan opasitas dari keempat warna di atas.

Kedua tema wajib lolos kontras AA (R-25, R-34), diverifikasi dengan `contrast-check.py` sebelum fase apa pun dinyatakan selesai.

## Tipografi (R-06: pilihan dengan alasan)

- **Judul**: serif gaya garamond — suara manuskrip/perkamen, memberi karakter era tanpa gambar. (Font: "EB Garamond" via next/font; fallback `Georgia, serif`.)
- **Teks & angka UI**: sans humanis dengan angka tabular — timer dan tabel sumber daya harus rata kolom. (Font: "Source Sans 3"; `font-variant-numeric: tabular-nums` di semua angka game.)
- Bukan Inter dan bukan font sistem default tanpa alasan; alasan tertulis di sini.

## Motif identitas: rubrikasi

Manuskrip nyata menandai bagian penting dengan tinta merah (*rubrication*). Dipakai sebagai satu motif berulang:
- Judul setiap layar: huruf awal / seluruh judul kecil-kecil dalam bata merah, sisanya tinta.
- Huruf kapital awal paragraf kronik (drop cap kecil) berwarna bata merah.
- Satu motif, konsisten — bukan dekorasi acak.

## Ikon (R-04: teks-dulu, tanpa emoji)

Sumber daya ditampilkan berlabel angka ("Makanan 1.240"). Bila ikon benar-benar diperlukan (nav mobile, sumber daya), SVG digambar khusus untuk kerajaan ini dengan relevansi tertulis di sini: gandum (Makanan), kapak (Kayu), pahat (Batu), linggis (Besi), koin (Emas). Tidak ada emoji di UI.

## Dials

- **ENERGY 2** — game dengan karakter: tekstur kertas halus, garis tepi tinta, rubrikasi. Bukan halaman datar, tapi juga bukan fantasy-ledakan.
- **RHYTHM 2** — setiap layar punya hierarki berbeda: Kerajaan = ringkasan naratif besar di atas + baris data; Bangunan = daftar berjenjang (bukan grid seragam); Kronik = kolom tunggal tulisan panjang.
- **MOTION 1** — hanya transisi hover (perubahan warna tinta, 150ms) dan progres antrean yang mengisi. Tanpa animasi berulang, tanpa partikel (R-19).

## Logo

Wordmark teks "Kronik Kerajaan" pada tipografi judul, huruf K awal dirubrikasi merah. Tanpa aset gambar dibuat tanpa konfirmasi (R-23).

## Tata letak

- Desktop: bar atas (wordmark + nav).
- Mobile: bottom nav 5 tujuan utama (Kerajaan, Bangunan, Militer, Peta, Kronik) + menu "Lainnya" untuk Riset, Pasar, Peringkat, Pengaturan.
- Setiap tujuan punya isinya (R-24), tanpa tautan mati (R-26).
- Konten maksimal ~720px agar terasa seperti lembar kronik, bukan dashboard lebar.
