import { chronicleView } from "@/lib/view";
import { ActionButton } from "@/components/ActionButton";
import EventChoices from "@/components/EventChoices";

const kindLabel: Record<string, string> = {
  construction: "Pembangunan",
  war: "Perang",
  event: "Acara",
  system: "Catatan",
};

export default function KronikPage() {
  const v = chronicleView();

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="font-title text-2xl font-semibold"><span className="rubric">K</span>ronik</h1>
        {v.unread > 0 && (
          <ActionButton action="mark_read" className="btn-ghost text-xs">Tandai {v.unread} terbaca</ActionButton>
        )}
      </div>

      {v.activeEvent && <EventChoices eventId={v.activeEvent.event_id} choices={JSON.parse(v.activeEvent.choices_json ?? "[]")} />}

      {v.reports.length === 0 && (
        <p className="text-sm opacity-70">Gulungan kronik masih kosong. Selesaikan pembangunan pertamamu untuk mengisinya.</p>
      )}

      <div className="space-y-3">
        {v.reports.map((r: any) => (
          <article key={r.id} className={`card p-4 ${r.is_read ? "opacity-70" : ""}`}>
            <p className="text-xs uppercase tracking-wide data-olive">
              {kindLabel[r.kind] ?? r.kind} · {new Date(r.created_at).toLocaleString("id-ID")} {r.is_read ? "" : "• baru"}
            </p>
            <h2 className="font-title text-lg"><span className="rubric">{r.title.charAt(0)}</span>{r.title.slice(1)}</h2>
            <p className="mt-1 text-sm leading-relaxed">{r.body}</p>
          </article>
        ))}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
