"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", label: "Kerajaan" },
  { href: "/bangunan", label: "Bangunan" },
  { href: "/militer", label: "Militer" },
  { href: "/peta", label: "Peta" },
  { href: "/kronik", label: "Kronik" },
  { href: "/riset", label: "Riset" },
  { href: "/pasar", label: "Pasar" },
  { href: "/peringkat", label: "Peringkat" },
  { href: "/pengaturan", label: "Pengaturan" },
];

export function ThemeToggle() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);
  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("kk-theme", next ? "dark" : "light");
  }
  return (
    <button onClick={toggle} className="btn-ghost text-sm" aria-label="Ganti tema terang/gelap">
      {dark ? "Terang" : "Gelap"}
    </button>
  );
}

export default function TopBar() {
  const pathname = usePathname();
  return (
    <header className="card sticky top-0 z-10 border-x-0 border-t-0">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-2">
        <Link href="/" className="font-title text-lg font-semibold">
          <span className="rubric">K</span>ronik Kerajaan
        </Link>
        <nav className="hidden items-center gap-4 text-sm md:flex" aria-label="Navigasi utama">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className={pathname === n.href ? "rubric font-semibold" : ""}
              aria-current={pathname === n.href ? "page" : undefined}
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <ThemeToggle />
      </div>
    </header>
  );
}
