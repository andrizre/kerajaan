"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ActionButton";

export default function PengaturanPage() {
  const [tax, setTax] = useState<number | null>(null);
  const [name, setName] = useState("");

  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">P</span>engaturan</h1>

      <section className="card p-4">
        <h2 className="font-title text-lg"><span className="rubric">P</span>ajak</h2>
        <p className="text-sm">0% = rakyat bahagia tanpa emas; 100% = emas penuh, rakyat pergi. Kebahagiaan turun 1 per % pajak.</p>
        <div className="mt-2 flex items-center gap-3">
          <input
            type="range"
            min={0}
            max={100}
            defaultValue={undefined}
            aria-label="Persen pajak"
            onChange={(e) => setTax(Number(e.target.value))}
            className="w-48"
          />
          <span className="data-olive text-sm">{tax === null ? "—" : `${tax}%`}</span>
          <ActionButton action="set_tax" payload={{ taxPercent: tax ?? 20 }} disabled={tax === null} className="btn-primary text-sm">
            Terapkan
          </ActionButton>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="font-title text-lg"><span className="rubric">N</span>ama kerajaan</h2>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nama baru (3–32 huruf)"
            aria-label="Nama kerajaan baru"
            className="rounded border border-[var(--paper-edge)] bg-transparent px-3 py-1.5 text-sm"
          />
          <ActionButton action="rename_kingdom" payload={{ name } as any} disabled={name.trim().length < 3} className="btn-primary text-sm">
            Ganti nama
          </ActionButton>
        </div>
      </section>

      <section className="card p-4">
        <h2 className="font-title text-lg rubric">Mulai ulang</h2>
        <p className="text-sm">Menghapus seluruh kronik, bangunan, dan pasukan. Tidak dapat dibatalkan.</p>
        <div className="mt-2">
          <ActionButton
            action="reset_game"
            payload={{ confirm: true }}
            className="btn-primary text-sm"
            confirmText="Yakin memulai ulang kerajaan dari nol? Seluruh kemajuan hilang."
          >
            Mulai ulang dari nol
          </ActionButton>
        </div>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
