"use client";

import * as B from "@config/balance";
import { useDemo } from "@/components/DemoProvider";
import DemoQueueTimer from "@/components/DemoQueueTimer";
import Link from "next/link";

const fmt = (n: number) => Math.floor(n).toLocaleString("id-ID");

export default function DemoKerajaan() {
  const { view, refresh } = useDemo();
  if (!view) return <p className="text-sm opacity-60">Memuat kronik…</p>;
  const st = view.state;
  const production = B.RESOURCES.map((r) => {
    const def = B.BUILDINGS.find((b) => b.effect?.resource === r);
    let per = 0;
    if (def?.effect) {
      const lv = st.levels[def.id] ?? 0;
      const slots = def.workerSlotsPerLevel * lv;
      const w = st.workersPerBuilding[def.id] ?? 0;
      per = lv > 0 && slots > 0 ? def.effect.perLevelPerHour * lv * Math.min(1, w / slots) : 0;
    }
    return { r, per };
  });

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm data-olive">{view.eraName} · Skor {fmt(view.score)}</p>
        <h1 className="font-title text-2xl font-semibold"><span className="rubric">K</span>erajaan {view.kingdomName}</h1>
        <p className="mt-1 text-sm">
          {fmt(st.population)} penduduk dari kapasitas {view.housing} rumah, kebahagiaan {Math.round(st.happiness)} dari 100
          {st.happiness < B.LOW_HAPPINESS_THRESHOLD ? " — hati rakyat dingin, produksi melambat" : ""}.
        </p>
      </header>

      <section aria-label="Sumber daya" className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {B.RESOURCES.map((r) => {
          const prod = production.find((p) => p.r === r)!;
          const upkeep = r === "makanan"
            ? st.population * B.FOOD_PER_POPULATION_PER_HOUR + B.UNITS.reduce((s, u) => s + (st.unitCounts[u.id] ?? 0) * u.foodUpkeepPerHour, 0)
            : 0;
          const net = prod.per - upkeep;
          return (
            <div key={r}>
              <p className="text-xs uppercase tracking-wide data-olive">{r}</p>
              <p className="font-title text-xl">{fmt(st.resources[r])} <span className="text-xs">/ {fmt(view.cap)}</span></p>
              <p className="text-xs">{net >= 0 ? "+" : ""}{net.toFixed(1)}/jam</p>
            </div>
          );
        })}
      </section>

      <section aria-label="Antrean aktif" className="card space-y-2 p-4">
        <h2 className="font-title text-lg"><span className="rubric">A</span>ntrean aktif</h2>
        {view.construction.length === 0 && view.research.length === 0 && view.training.length === 0 && view.marches.length === 0 && (
          <p className="text-sm opacity-70">Tidak ada pekerjaan berjalan. Kunjungi <Link href="/demo/bangunan" className="underline">Bangunan</Link> atau <Link href="/demo/riset" className="underline">Riset</Link>.</p>
        )}
        {view.construction.map((c) => (
          <DemoQueueTimer key={c.id} startedAt={c.started_at} finishesAt={c.finishes_at} label={`Membangun ${B.BUILDINGS.find((b) => b.id === c.building_id)?.name} → lv${c.target_level}`} onDone={refresh} />
        ))}
        {view.research.map((r) => (
          <DemoQueueTimer key={r.id} startedAt={r.started_at} finishesAt={r.finishes_at} label={`Riset ${B.TECHS.find((t) => t.id === r.tech_id)?.name}`} onDone={refresh} />
        ))}
        {view.training.map((t) => (
          <DemoQueueTimer key={t.id} startedAt={t.started_at} finishesAt={t.finishes_at} label={`Melatih ${t.quantity} ${B.UNITS.find((u) => u.id === t.unit_id)?.name}`} onDone={refresh} />
        ))}
        {view.marches.map((m) => (
          <DemoQueueTimer key={m.id} startedAt={m.departed_at} finishesAt={m.returns_at ?? m.arrives_at} label={`Armada ke ${m.target_npc} (${m.kind === "scout" ? "intai" : "serang"})`} onDone={refresh} />
        ))}
      </section>

      <section aria-label="Pekerja dan pajak" className="card p-4 text-sm">
        <h2 className="font-title text-lg"><span className="rubric">P</span>ekerja &amp; pajak</h2>
        <p className="mt-1">Pekerja teralokasi: {view.usedWorkers} · menganggur: {Math.max(0, Math.floor(st.population) - view.usedWorkers)}</p>
        <p>Pajak {st.taxPercent}% · kebahagiaan dasar {Math.round(100 - st.taxPercent * B.HAPPINESS_PER_TAX_PERCENT)}</p>
      </section>
    </div>
  );
}
