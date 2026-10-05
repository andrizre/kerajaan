"use client";

import { useState } from "react";
import * as B from "@config/balance";
import { DemoActionButton } from "@/components/DemoActionButton";
import DemoQueueTimer from "@/components/DemoQueueTimer";
import { useDemo } from "@/components/DemoProvider";

export default function DemoPeta() {
  const { view, refresh } = useDemo();
  const [openNpc, setOpenNpc] = useState<string | null>(null);
  const [sel, setSel] = useState<Record<string, number>>({});
  if (!view) return <p className="text-sm opacity-60">Memuat…</p>;
  const st = view.state;

  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">P</span>eta Kerajaan</h1>
      <p className="text-sm">Sepuluh kerajaan di sekeliling wilayahmu. Intai dulu, lalu serang bila yakin menang.</p>

      {view.marches.length > 0 && (
        <section className="card space-y-2 p-4">
          <h2 className="font-title text-lg"><span className="rubric">A</span>rmada di jalan</h2>
          {view.marches.map((m) => (
            <DemoQueueTimer key={m.id} startedAt={m.departed_at} finishesAt={m.returns_at ?? m.arrives_at} label={`${m.kind === "scout" ? "Intai" : "Serang"} ${m.target_npc}`} onDone={refresh} />
          ))}
        </section>
      )}

      <div className="space-y-3">
        {view.npcs.map((npc) => {
          const def = B.NPC_KINGDOMS.find((d) => d.name === npc.name);
          const units = B.UNITS.map((u) => ({ ...u, count: st.unitCounts[u.id] ?? 0 })).filter((u) => u.count > 0);
          return (
            <section key={npc.name} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-title text-lg"><span className="rubric">{npc.name.charAt(0)}</span>{npc.name.slice(1)}</h2>
                <span className="text-xs data-olive">jarak {def?.distance ?? "?"} · kekuatan {npc.power}</span>
              </div>
              <p className="text-sm">Pasukan tampak: {Math.floor(npc.troops)}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <DemoActionButton action="scout" payload={{ npcName: npc.name }} className="btn-ghost text-sm">Intai</DemoActionButton>
                <button className="btn-ghost text-sm" onClick={() => { setOpenNpc(openNpc === npc.name ? null : npc.name); setSel({}); }} aria-expanded={openNpc === npc.name}>
                  Susun armada serang…
                </button>
              </div>
              {openNpc === npc.name && (
                <div className="mt-2 space-y-2">
                  {units.length === 0 && <p className="text-xs rubric">Tidak ada pasukan. Latih dulu di Militer.</p>}
                  {units.map((u) => (
                    <label key={u.id} className="flex items-center justify-between gap-2 text-sm">
                      <span>{u.name} (maks {u.count})</span>
                      <input type="number" min={0} max={u.count} value={sel[u.id] ?? 0}
                        onChange={(e) => setSel({ ...sel, [u.id]: Math.max(0, Math.min(u.count, Number(e.target.value) || 0)) })}
                        className="w-20 rounded border border-[var(--paper-edge)] bg-transparent px-2 py-1 text-right"
                        aria-label={`Jumlah ${u.name}`} />
                    </label>
                  ))}
                  {units.length > 0 && (
                    <DemoActionButton action="attack" payload={{ npcName: npc.name, units: sel }}>
                      Kirim armada ke {npc.name}
                    </DemoActionButton>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
