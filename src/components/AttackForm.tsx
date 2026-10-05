"use client";

import { useState } from "react";
import { ActionButton } from "@/components/ActionButton";

export default function AttackForm({
  npcName,
  units,
}: {
  npcName: string;
  units: { id: string; name: string; count: number }[];
}) {
  const available = units.filter((u) => u.count > 0);
  const [open, setOpen] = useState(false);
  const [sel, setSel] = useState<Record<string, number>>({});

  if (available.length === 0) {
    return <p className="text-xs rubric">Tidak ada pasukan. Latih dulu di Militer.</p>;
  }

  return (
    <div className="mt-2">
      <button className="btn-ghost text-sm" onClick={() => setOpen(!open)} aria-expanded={open}>
        Susun armada serang…
      </button>
      {open && (
        <div className="mt-2 space-y-2">
          {available.map((u) => (
            <label key={u.id} className="flex items-center justify-between gap-2 text-sm">
              <span>{u.name} (maks {u.count})</span>
              <input
                type="number"
                min={0}
                max={u.count}
                value={sel[u.id] ?? 0}
                onChange={(e) => setSel({ ...sel, [u.id]: Math.max(0, Math.min(u.count, Number(e.target.value))) })}
                className="w-20 rounded border border-[var(--paper-edge)] bg-transparent px-2 py-1 text-right"
                aria-label={`Jumlah ${u.name}`}
              />
            </label>
          ))}
          <ActionButton action="attack" payload={{ npcName, units: sel }}>
            Kirim armada ke {npcName}
          </ActionButton>
        </div>
      )}
    </div>
  );
}
