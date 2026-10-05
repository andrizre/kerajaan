"use client";

import { useState } from "react";
import * as B from "@config/balance";
import { DemoActionButton } from "@/components/DemoActionButton";
import { useDemo } from "@/components/DemoProvider";

export default function DemoPengaturan() {
  const { view, refresh } = useDemo();
  const [tax, setTax] = useState<number | null>(null);
  const [name, setName] = useState("");
  if (!view) return <p className="text-sm opacity-60">Memuat…</p>;

  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">P</span>engaturan</h1>
      <p className="text-xs data-olive">Mode demo: kemajuan tersimpan di peramban ini (localStorage).</p>

      <section className="card p-4">
        <h2 className="font-title text-lg"><span className="rubric">P</span>ajak</h2>
        <p className="text-sm">0% = rakyat bahagia tanpa emas; 100% = emas penuh, rakyat pergi. Kebahagiaan turun 1 per % pajak.</p>
        <div className="mt-2 flex items-center gap-3">
          <input type="range" min={0} max={100} aria-label="Persen pajak" onChange={(e) => setTax(Number(e.target.value))} className="w-48" />
          <span className="data-olive text-sm">{tax === null ? "—" : `${tax}%`}</span>
          <DemoActionButton action="set_tax" payload={{ taxPercent: tax ?? view.state.taxPercent }} disabled={tax === null}>Terapkan</DemoActionButton>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="font-title text-lg"><span className="rubric">N</span>ama kerajaan</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nama baru (3–32 huruf)" aria-label="Nama kerajaan baru"
            className="rounded border border-[var(--paper-edge)] bg-transparent px-3 py-1.5 text-sm" />
          <DemoActionButton action="rename_kingdom" payload={{ name }} disabled={name.trim().length < 3}>Ganti nama</DemoActionButton>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="font-title text-lg rubric">Mulai ulang</h2>
        <p className="text-sm">Menghapus seluruh kronik, bangunan, dan pasukan di peramban ini.</p>
        <div className="mt-2">
          <DemoActionButton action="reset_game" payload={{ confirm: true }} confirmText="Yakin memulai ulang kerajaan dari nol?">
            Mulai ulang dari nol
          </DemoActionButton>
        </div>
      </section>
    </div>
  );
}
