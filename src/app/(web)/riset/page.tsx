import * as B from "@config/balance";
import { techsView } from "@/lib/view";
import { ActionButton } from "@/components/ActionButton";
import QueueTimer from "@/components/QueueTimer";

const fmt = (n: number) => Math.floor(n).toLocaleString("id-ID");

export default function RisetPage() {
  const v = techsView();
  const cityHall = v.state.levels["balai_kota"] ?? 0;
  const canEra = v.nextEra && cityHall >= v.nextEra.cityHallLevel && v.completedTechs.includes(v.nextEra.requiredTech);

  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">R</span>iset &amp; Zaman</h1>
      <p className="text-sm">Zaman kini: <strong>{v.eraName}</strong>.</p>

      {v.research.length > 0 && (
        <section className="card space-y-2 p-4">
          <h2 className="font-title text-lg"><span className="rubric">D</span>alam garapan</h2>
          {v.research.map((r: any) => (
            <QueueTimer key={r.id} startedAt={r.started_at} finishesAt={r.finishes_at} label={B.TECHS.find((t) => t.id === r.tech_id)?.name ?? r.tech_id} />
          ))}
        </section>
      )}

      {v.nextEra && (
        <section className="card p-4">
          <h2 className="font-title text-lg"><span className="rubric">N</span>aik Zaman: {v.nextEra.name}</h2>
          <p className="text-sm">
            Syarat: Balai Kota lv {v.nextEra?.cityHallLevel} (kini {cityHall}) dan riset{" "}
            {B.TECHS.find((t) => t.id === v.nextEra?.requiredTech)?.name}{" "}
            {v.nextEra && v.completedTechs.includes(v.nextEra.requiredTech) ? "✓" : "✗"}.
          </p>
          <div className="mt-2">
            <ActionButton action="advance_era" disabled={!canEra}>Naik ke {v.nextEra.name}</ActionButton>
          </div>
        </section>
      )}

      <div className="space-y-3">
        {v.list.map((t) => (
          <section key={t.def.id} className="card p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="font-title text-lg"><span className="rubric">{t.def.name.charAt(0)}</span>{t.def.name.slice(1)}</h2>
              {t.done ? (
                <span className="text-xs data-olive">selesai</span>
              ) : t.locked ? (
                <span className="text-xs rubric">zaman {t.def.era}</span>
              ) : t.queued ? (
                <span className="text-xs data-olive">sedang digarap</span>
              ) : (
                <ActionButton action="start_research" payload={{ techId: t.def.id }}>
                  Mulai riset
                </ActionButton>
              )}
            </div>
            <p className="mt-1 text-sm opacity-80">{t.def.description}</p>
            <p className="mt-1 text-xs">
              Biaya: {B.RESOURCES.filter((r) => t.cost[r] > 0).map((r) => `${fmt(t.cost[r])} ${r}`).join(", ")} · durasi {t.def.durationHours} jam
            </p>
          </section>
        ))}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
