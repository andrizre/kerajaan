"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const MAIN = [
  { href: "/", label: "Kerajaan" },
  { href: "/bangunan", label: "Bangunan" },
  { href: "/militer", label: "Militer" },
  { href: "/peta", label: "Peta" },
  { href: "/kronik", label: "Kronik" },
];

const MORE = [
  { href: "/riset", label: "Riset" },
  { href: "/pasar", label: "Pasar" },
  { href: "/peringkat", label: "Peringkat" },
  { href: "/pengaturan", label: "Pengaturan" },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />
      )}
      {open && (
        <nav className="card fixed bottom-20 left-1/2 z-30 w-56 -translate-x-1/2 flex-col gap-1 p-2 text-sm md:hidden" aria-label="Tujuan lainnya">
          {MORE.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={() => setOpen(false)}
              className="block rounded px-3 py-2 hover:bg-[var(--hover-bg)]"
            >
              {n.label}
            </Link>
          ))}
        </nav>
      )}
      <nav
        className="card fixed bottom-0 left-0 right-0 z-10 flex border-x-0 border-b-0 md:hidden"
        aria-label="Navigasi bawah"
      >
        {MAIN.map((n) => (
          <Link
            key={n.href}
            href={n.href}
            className={`flex-1 py-3 text-center text-xs ${pathname === n.href ? "rubric font-semibold" : ""}`}
            aria-current={pathname === n.href ? "page" : undefined}
          >
            {n.label}
          </Link>
        ))}
        <button onClick={() => setOpen(!open)} className="flex-1 py-3 text-center text-xs" aria-expanded={open}>
          Lainnya
        </button>
      </nav>
    </>
  );
}
