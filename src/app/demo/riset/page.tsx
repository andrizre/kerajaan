"use client";

import * as B from "@config/balance";
import { DemoActionButton } from "@/components/DemoActionButton";
import DemoQueueTimer from "@/components/DemoQueueTimer";
import { useDemo } from "@/components/DemoProvider";

const fmt = (n: number) => Math.floor(n).toLocaleString("id-ID");

export default function DemoRiset() {
  const { view, refresh } = useDemo();
  if (!view) return <p className="text-sm opacity-60">Memuat…</p>;
  const nextEra = B.ERAS.find((e) => e.id === view.era + 1);
  const canEra = !!nextEra
    && (view.state.levels["balai_kota"] ?? 0) >= nextEra.cityHallLevel
    && view.completedTechs.includes(nextEra.requiredTech);

  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">R</span>iset &amp; Zaman</h1>
      <p className="text-sm">Zaman kini: <strong>{view.eraName}</strong>.</p>

      {view.research.length > 0 && (
        <section className="card space-y-2 p-4">
          <h2 className="font-title text-lg"><span className="rubric">D</span>alam garapan</h2>
          {view.research.map((r) => (
            <DemoQueueTimer key={r.id} startedAt={r.started_at} finishesAt={r.finishes_at} label={B.TECHS.find((t) => t.id === r.tech_id)?.name ?? r.tech_id} onDone={refresh} />
          ))}
        </section>
      )}

      {nextEra && (
        <section className="card p-4">
          <h2 className="font-title text-lg"><span className="rubric">N</span>aik Zaman: {nextEra.name}</h2>
          <p className="text-sm">
            Syarat: Balai Kota lv {nextEra.cityHallLevel} (kini {view.state.levels["balai_kota"] ?? 0}) dan riset{" "}
            {B.TECHS.find((t) => t.id === nextEra.requiredTech)?.name} {view.completedTechs.includes(nextEra.requiredTech) ? "✓" : "✗"}.
          </p>
          <div className="mt-2">
            <DemoActionButton action="advance_era" disabled={!canEra}>Naik ke {nextEra.name}</DemoActionButton>
          </div>
        </section>
      )}

      <div className="space-y-3">
        {B.TECHS.map((def) => {
          const done = view.completedTechs.includes(def.id);
          const locked = def.era > view.era;
          const queued = view.research.some((r) => r.tech_id === def.id);
          const affordable = B.RESOURCES.every((r) => view.state.resources[r] >= (def.cost as Record<string, number>)[r] || !(def.cost as Record<string, number>)[r]);
          return (
            <section key={def.id} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-title text-lg"><span className="rubric">{def.name.charAt(0)}</span>{def.name.slice(1)}</h2>
                {done ? <span className="text-xs data-olive">selesai</span>
                  : locked ? <span className="text-xs rubric">zaman {def.era}</span>
                  : queued ? <span className="text-xs data-olive">sedang digarap</span>
                  : <DemoActionButton action="start_research" payload={{ techId: def.id }} disabled={!affordable}>Mulai riset</DemoActionButton>}
              </div>
              <p className="mt-1 text-sm opacity-80">{def.description}</p>
              <p className="mt-1 text-xs">Biaya: {Object.entries(def.cost).map(([r, v]) => `${fmt(v)} ${r}`).join(", ")} · durasi {def.durationHours} jam</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
