"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useDemo } from "@/components/DemoProvider";

const MAIN = [
  { href: "/demo", label: "Kerajaan" },
  { href: "/demo/bangunan", label: "Bangunan" },
  { href: "/demo/militer", label: "Militer" },
  { href: "/demo/peta", label: "Peta" },
  { href: "/demo/kronik", label: "Kronik" },
];
const MORE = [
  { href: "/demo/riset", label: "Riset" },
  { href: "/demo/pasar", label: "Pasar" },
  { href: "/demo/peringkat", label: "Peringkat" },
  { href: "/demo/pengaturan", label: "Pengaturan" },
];

export function DemoTopBar() {
  return (
    <header className="card sticky top-0 z-10 border-x-0 border-t-0">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-2">
        <Link href="/demo" className="font-title text-lg font-semibold">
          <span className="rubric">K</span>ronik Kerajaan <span className="text-xs data-olive">demo</span>
        </Link>
        <Link href="/" className="text-xs underline">versi server</Link>
      </div>
    </header>
  );
}

export function DemoBottomNav() {
  const pathname = usePathname();
  const { pending } = useDemo();
  const [open, setOpen] = useState(false);
  return (
    <>
      {open && <div className="fixed inset-0 z-20 bg-black/40 md:hidden" onClick={() => setOpen(false)} aria-hidden="true" />}
      {open && (
        <nav className="card fixed bottom-20 left-1/2 z-30 w-56 -translate-x-1/2 p-2 text-sm md:hidden" aria-label="Tujuan lainnya">
          {MORE.map((n) => (
            <Link key={n.href} href={n.href} onClick={() => setOpen(false)} className="block rounded px-3 py-2 hover:bg-[var(--hover-bg)]">{n.label}</Link>
          ))}
        </nav>
      )}
      <nav className="card fixed bottom-0 left-0 right-0 z-10 flex border-x-0 border-b-0 md:hidden" aria-label="Navigasi bawah demo">
        {MAIN.map((n) => (
          <Link key={n.href} href={n.href} className={`flex-1 py-3 text-center text-xs ${pathname === n.href ? "rubric font-semibold" : ""}`}
            aria-current={pathname === n.href ? "page" : undefined}>{n.label}</Link>
        ))}
        <button onClick={() => setOpen(!open)} className="flex-1 py-3 text-center text-xs" aria-expanded={open}>Lainnya{pending ? " …" : ""}</button>
      </nav>
    </>
  );
}
