#!/usr/bin/env python3
"""Verifikasi kontras AA (WCAG) untuk palet Kronik Kerajaan — kedua tema."""
import sys

def lum(hex_color):
    r, g, b = (int(hex_color[i:i+2], 16)/255 for i in (1, 3, 5))
    def f(c): return c/12.92 if c <= 0.03928 else ((c+0.055)/1.055)**2.4
    r, g, b = f(r), f(g), f(b)
    return 0.2126*r + 0.7152*g + 0.0722*b

def ratio(a, b):
    la, lb = lum(a), lum(b)
    hi, lo = max(la, lb), min(la, lb)
    return (hi + 0.05) / (lo + 0.05)

THEMES = {
    "terang": {"paper": "#F4EAD5", "ink": "#2A2118", "olive": "#5C6B3C", "brick": "#A03A22"},
    "gelap":  {"paper": "#1C1710", "ink": "#E8DCC4", "olive": "#8FA05E", "brick": "#C96A4A"},
}

fails = 0
for name, t in THEMES.items():
    print(f"== Tema {name} ==")
    pairs = [
        ("teks di kertas", t["ink"], t["paper"], 4.5),
        ("olive (data ekonomi) di kertas", t["olive"], t["paper"], 4.5),
        ("brick (aksen) di kertas", t["brick"], t["paper"], 4.5),
        ("teks kertas di tombol brick", t["paper"], t["brick"], 4.5),
    ]
    for label, fg, bg, need in pairs:
        r = ratio(fg, bg)
        ok = r >= need
        if not ok: fails += 1
        print(f"  {'PASS' if ok else 'FAIL'} {label}: {r:.2f} (butuh {need})")
print("SEMUA PASS" if fails == 0 else f"{fails} GAGAL")
sys.exit(1 if fails else 0)
