"use client";

import * as B from "@config/balance";
import { DemoActionButton } from "@/components/DemoActionButton";
import DemoQueueTimer from "@/components/DemoQueueTimer";
import { useDemo } from "@/components/DemoProvider";

const fmt = (n: number) => Math.floor(n).toLocaleString("id-ID");

export default function DemoMiliter() {
  const { view, refresh } = useDemo();
  if (!view) return <p className="text-sm opacity-60">Memuat…</p>;
  const st = view.state;
  const barrack = st.levels["barak"] ?? 0;
  const total = Object.values(st.unitCounts).reduce((a, b) => a + b, 0);
  const queued = view.training.reduce((a, t) => a + t.quantity, 0);
  const upkeep = B.UNITS.reduce((s, u) => s + (st.unitCounts[u.id] ?? 0) * u.foodUpkeepPerHour, 0)
    + st.population * B.FOOD_PER_POPULATION_PER_HOUR;

  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">M</span>iliter</h1>
      <p className="text-sm">Barak lv {barrack}: {total}/{barrack * B.BARRACK_CAPACITY_PER_LEVEL} prajurit ({queued} dalam latihan). Upkeep: {upkeep.toFixed(1)} makanan/jam.</p>

      {view.training.length > 0 && (
        <section className="card space-y-2 p-4">
          <h2 className="font-title text-lg"><span className="rubric">L</span>atihan berjalan</h2>
          {view.training.map((t) => (
            <DemoQueueTimer key={t.id} startedAt={t.started_at} finishesAt={t.finishes_at} label={`${t.quantity} ${B.UNITS.find((u) => u.id === t.unit_id)?.name}`} onDone={refresh} />
          ))}
        </section>
      )}

      <div className="space-y-3">
        {B.UNITS.map((def) => {
          const locked = def.era > view.era;
          const affordable = B.RESOURCES.every((r) => st.resources[r] >= ((def.cost as Record<string, number>)[r] ?? 0));
          return (
            <section key={def.id} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-title text-lg"><span className="rubric">{def.name.charAt(0)}</span>{def.name.slice(1)}</h2>
                {locked ? <span className="text-xs rubric">zaman {def.era}</span> : (
                  <div className="flex gap-2">
                    <DemoActionButton action="train_units" payload={{ unitId: def.id, quantity: 1 }} disabled={!affordable}>Latih 1</DemoActionButton>
                    <DemoActionButton action="train_units" payload={{ unitId: def.id, quantity: 5 }} className="btn-ghost text-sm" disabled={!affordable}>Latih 5</DemoActionButton>
                  </div>
                )}
              </div>
              <p className="mt-1 text-sm opacity-80">{def.description}</p>
              <p className="mt-1 text-xs">Dimiliki: <strong>{st.unitCounts[def.id] ?? 0}</strong> · serang {def.attack} · angkut {def.carryCapacity} · upkeep {def.foodUpkeepPerHour}/jam</p>
              <p className="text-xs">Biaya/unit: {Object.entries(def.cost).map(([r, v]) => `${fmt(v)} ${r}`).join(", ")} · {def.trainMinutes} mnt</p>
            </section>
          );
        })}
      </div>
    </div>
  );
}
