import { mapView } from "@/lib/view";
import * as B from "@config/balance";
import { ActionButton } from "@/components/ActionButton";
import AttackForm from "@/components/AttackForm";
import QueueTimer from "@/components/QueueTimer";

export default function PetaPage() {
  const v = mapView();
  const units = B.UNITS.map((u) => ({ id: u.id, name: u.name, count: v.state.unitCounts[u.id] ?? 0 }));

  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">P</span>eta Kerajaan</h1>
      <p className="text-sm">Sepuluh kerajaan tersebar di sekeliling wilayahmu. Intai dulu, lalu serang bila yakin menang.</p>

      {v.marches.length > 0 && (
        <section className="card space-y-2 p-4">
          <h2 className="font-title text-lg"><span className="rubric">A</span>rmada di jalan</h2>
          {v.marches.map((m: any) => (
            <QueueTimer
              key={m.id}
              startedAt={m.departed_at}
              finishesAt={m.returns_at ?? m.arrives_at}
              label={`${m.kind === "scout" ? "Intai" : "Serang"} ${m.target_npc}${m.returns_at ? " (pulang)" : ""}`}
            />
          ))}
        </section>
      )}

      <div className="space-y-3">
        {v.npcs.map((n: any) => {
          const def = v.defs.find((d) => d.name === n.npc_name);
          const recovery = n.last_raided_at
            ? Math.max(0, Math.ceil((B.NPC_RECOVERY_HOURS * 60 - (Date.now() - new Date(n.last_raided_at).getTime()) / 60000)))
            : 0;
          return (
            <section key={n.npc_name} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-title text-lg"><span className="rubric">{n.npc_name.charAt(0)}</span>{n.npc_name.slice(1)}</h2>
                <span className="text-xs data-olive">jarak {def?.distance ?? "?"} · kekuatan {n.power}</span>
              </div>
              <p className="text-sm">Pasukan tampak: {Math.floor(n.troops)}{recovery > 0 ? ` (memulihkan, ${recovery} mnt lagi penuh)` : ""}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ActionButton action="scout" payload={{ npcName: n.npc_name }} className="btn-ghost text-sm">Intai</ActionButton>
              </div>
              <AttackForm npcName={n.npc_name} units={units} />
            </section>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
