import { buildingsView } from "@/lib/view";
import * as B from "@config/balance";
import { ActionButton } from "@/components/ActionButton";
import QueueTimer from "@/components/QueueTimer";

const fmt = (n: number) => Math.floor(n).toLocaleString("id-ID");

export default function BangunanPage() {
  const v = buildingsView();
  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">B</span>angunan</h1>
      <p className="text-sm">
        Batas level mengikuti Balai Kota (lv {v.state.levels["balai_kota"] ?? 0}).
        Pekerja menganggur: {Math.max(0, Math.floor(v.state.population) - v.usedWorkers)}.
      </p>

      {v.construction.length > 0 && (
        <section className="card space-y-2 p-4">
          <h2 className="font-title text-lg"><span className="rubric">D</span>alam pembangunan</h2>
          {v.construction.map((c: any) => (
            <QueueTimer key={c.id} startedAt={c.started_at} finishesAt={c.finishes_at} label={`${v.list.find((b) => b.def.id === c.building_id)?.def.name} → lv${c.target_level}`} />
          ))}
        </section>
      )}

      <div className="space-y-3">
        {v.list.map((b) => {
          const costStr = B.RESOURCES.filter((r) => b.cost[r] > 0).map((r) => `${fmt(b.cost[r])} ${r}`).join(", ") || "-";
          const affordable = B.RESOURCES.every((r) => v.state.resources[r] >= b.cost[r]);
          return (
            <section key={b.def.id} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-title text-lg">
                  <span className="rubric">{b.def.name.charAt(0)}</span>{b.def.name.slice(1)}{" "}
                  <span className="text-sm data-olive">lv {b.level}</span>
                </h2>
                {b.locked ? (
                  <span className="text-xs rubric">Terbuka di {["", "Zaman Permukiman", "Zaman Kerajaan", "Zaman Ksatria", "Zaman Benteng"][b.def.era]}</span>
                ) : b.queued ? (
                  <span className="text-xs data-olive">sedang dibangun</span>
                ) : b.maxed ? (
                  <span className="text-xs data-olive">level maksimum</span>
                ) : (
                  <ActionButton
                    action="upgrade_building"
                    payload={{ buildingId: b.def.id }}
                    disabled={!affordable}
                  >
                    Bangun → lv{b.level + 1}
                  </ActionButton>
                )}
              </div>
              <p className="mt-1 text-sm opacity-80">{b.def.description}</p>
              <p className="mt-1 text-xs">Biaya: {costStr} · durasi {b.hours.toFixed(1)} jam</p>
              {b.slots > 0 && (
                <p className="mt-1 text-xs">
                  Pekerja: {b.workers}/{b.slots}{" "}
                  {!b.locked && b.level > 0 && (
                    <>
                      <ActionButton action="assign_workers" payload={{ buildingId: b.def.id, workerDelta: 1 }} className="btn-ghost text-xs">+1</ActionButton>{" "}
                      <ActionButton action="assign_workers" payload={{ buildingId: b.def.id, workerDelta: -1 }} className="btn-ghost text-xs">−1</ActionButton>
                    </>
                  )}
                </p>
              )}
              {b.def.effect && (
                <p className="text-xs data-olive">Efek: +{(b.def.effect.perLevelPerHour * b.level * (b.workers > 0 ? b.workers / (b.def.workerSlotsPerLevel * b.level) : 0)).toFixed(1)} {b.def.effect.resource}/jam</p>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
