import { militaryView } from "@/lib/view";
import * as B from "@config/balance";
import { ActionButton } from "@/components/ActionButton";
import QueueTimer from "@/components/QueueTimer";

const fmt = (n: number) => Math.floor(n).toLocaleString("id-ID");

export default function MiliterPage() {
  const v = militaryView();
  const barrack = v.state.levels["barak"] ?? 0;
  const totalUnits = Object.values(v.state.unitCounts).reduce((a, b) => a + b, 0);
  const queuedTotal = v.training.reduce((a, t: any) => a + t.quantity, 0);
  const upkeepUnits = B.UNITS.reduce((s, u) => s + (v.state.unitCounts[u.id] ?? 0) * u.foodUpkeepPerHour, 0);
  const upkeepPop = v.state.population * B.FOOD_PER_POPULATION_PER_HOUR;

  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">M</span>iliter</h1>
      <p className="text-sm">
        Barak lv {barrack}: {totalUnits}/{barrack * B.BARRACK_CAPACITY_PER_LEVEL} prajurit ({queuedTotal} dalam latihan).
        Upkeep: {upkeepUnits.toFixed(1)} + {upkeepPop.toFixed(1)} makanan/jam.
      </p>

      {v.training.length > 0 && (
        <section className="card space-y-2 p-4">
          <h2 className="font-title text-lg"><span className="rubric">L</span>atihan berjalan</h2>
          {v.training.map((t: any) => (
            <QueueTimer key={t.id} startedAt={t.started_at} finishesAt={t.finishes_at} label={`${t.quantity} ${B.UNITS.find((u) => u.id === t.unit_id)?.name}`} />
          ))}
        </section>
      )}

      <div className="space-y-3">
        {v.list.map((u) => (
          <section key={u.def.id} className="card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-title text-lg"><span className="rubric">{u.def.name.charAt(0)}</span>{u.def.name.slice(1)}</h2>
              {u.locked ? (
                <span className="text-xs rubric">zaman {u.def.era}</span>
              ) : (
                <div className="flex gap-2">
                  <ActionButton action="train_units" payload={{ unitId: u.def.id, quantity: 1 }} className="btn-primary text-sm">Latih 1</ActionButton>
                  <ActionButton action="train_units" payload={{ unitId: u.def.id, quantity: 5 }} className="btn-ghost text-sm">Latih 5</ActionButton>
                </div>
              )}
            </div>
            <p className="mt-1 text-sm opacity-80">{u.def.description}</p>
            <p className="mt-1 text-xs">
              Dimiliki: <strong>{u.count}</strong> · serang {u.def.attack} · angkut {u.def.carryCapacity} · upkeep {u.def.foodUpkeepPerHour} makanan/jam
            </p>
            <p className="text-xs">Biaya/unit: {B.RESOURCES.filter((r) => u.cost[r] > 0).map((r) => `${fmt(u.cost[r])} ${r}`).join(", ")} · {u.def.trainMinutes} mnt/unit</p>
          </section>
        ))}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
