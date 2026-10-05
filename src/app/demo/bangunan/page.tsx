"use client";

import * as B from "@config/balance";
import { DemoActionButton } from "@/components/DemoActionButton";
import DemoQueueTimer from "@/components/DemoQueueTimer";
import { useDemo } from "@/components/DemoProvider";

const fmt = (n: number) => Math.floor(n).toLocaleString("id-ID");

export default function DemoBangunan() {
  const { view, refresh } = useDemo();
  if (!view) return <p className="text-sm opacity-60">Memuat…</p>;
  const st = view.state;

  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">B</span>angunan</h1>
      <p className="text-sm">Batas level mengikuti Balai Kota (lv {st.levels["balai_kota"] ?? 0}). Menganggur: {Math.max(0, Math.floor(st.population) - view.usedWorkers)}.</p>

      {view.construction.length > 0 && (
        <section className="card space-y-2 p-4">
          <h2 className="font-title text-lg"><span className="rubric">D</span>alam pembangunan</h2>
          {view.construction.map((c) => (
            <DemoQueueTimer key={c.id} startedAt={c.started_at} finishesAt={c.finishes_at} label={`${B.BUILDINGS.find((b) => b.id === c.building_id)?.name} → lv${c.target_level}`} onDone={refresh} />
          ))}
        </section>
      )}

      <div className="space-y-3">
        {B.BUILDINGS.map((def) => {
          const level = st.levels[def.id] ?? 0;
          const workers = st.workersPerBuilding[def.id] ?? 0;
          const slots = def.workerSlotsPerLevel * level;
          const locked = def.era > view.era;
          const queued = view.construction.some((c) => c.building_id === def.id);
          const cost = Object.fromEntries(B.RESOURCES.map((r) => {
            const base = (def.baseCost as Record<string, number>)[r] ?? 0;
            return [r, Math.ceil(base * Math.pow(B.BUILDING_COST_MULTIPLIER, level))];
          })) as Record<string, number>;
          const affordable = B.RESOURCES.every((r) => st.resources[r] >= cost[r]);
          const maxed = level >= B.MAX_BUILDING_LEVEL;
          const hours = def.baseDurationHours * (level + 1);
          return (
            <section key={def.id} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-title text-lg"><span className="rubric">{def.name.charAt(0)}</span>{def.name.slice(1)} <span className="text-sm data-olive">lv {level}</span></h2>
                {locked ? (
                  <span className="text-xs rubric">Terbuka di {["", "Zaman Permukiman", "Zaman Kerajaan", "Zaman Ksatria", "Zaman Benteng"][def.era]}</span>
                ) : queued ? (
                  <span className="text-xs data-olive">sedang dibangun</span>
                ) : maxed ? (
                  <span className="text-xs data-olive">level maksimum</span>
                ) : (
                  <DemoActionButton action="upgrade_building" payload={{ buildingId: def.id }} disabled={!affordable}>
                    Bangun → lv{level + 1}
                  </DemoActionButton>
                )}
              </div>
              <p className="mt-1 text-sm opacity-80">{def.description}</p>
              <p className="mt-1 text-xs">Biaya: {B.RESOURCES.filter((r) => cost[r] > 0).map((r) => `${fmt(cost[r])} ${r}`).join(", ") || "-"} · durasi {hours.toFixed(1)} jam</p>
              {slots > 0 && level > 0 && (
                <p className="mt-1 text-xs">
                  Pekerja: {workers}/{slots}{" "}
                  <DemoActionButton action="assign_workers" payload={{ buildingId: def.id, workerDelta: 1 }} className="btn-ghost text-xs">+1</DemoActionButton>{" "}
                  <DemoActionButton action="assign_workers" payload={{ buildingId: def.id, workerDelta: -1 }} className="btn-ghost text-xs">−1</DemoActionButton>
                </p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
