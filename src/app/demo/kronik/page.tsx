"use client";

import { DemoActionButton } from "@/components/DemoActionButton";
import { useDemo } from "@/components/DemoProvider";

const kindLabel: Record<string, string> = { construction: "Pembangunan", war: "Perang", event: "Acara", system: "Catatan" };

const EVENT_TEXT: Record<string, { title: string; body: string }> = {
  kemarau: { title: "Kemarau panjang", body: "Hujan tak turun sebulan. Ladang mulai retak. Buka irigasi memakan kayu; berdoa tidak menjanjikan apa pun." },
  pedagang: { title: "Pedagang keliling", body: "Seorang pedagang menawarkan karung makanan dengan harga yang 'tak akan terulang'." },
  pemberontakan: { title: "Keluhan di pasar", body: "Sekelompok rakyat memprotes pajak. Tekan, atau ampuni dan turunkan pajak." },
};

export default function DemoKronik() {
  const { view, refresh } = useDemo();
  if (!view) return <p className="text-sm opacity-60">Memuat…</p>;
  const ev = view.activeEvent as { event_id: string; choices_json: string } | null;
  const evText = ev ? EVENT_TEXT[ev.event_id] : null;

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between">
        <h1 className="font-title text-2xl font-semibold"><span className="rubric">K</span>ronik</h1>
        {view.unread > 0 && <DemoActionButton action="mark_read" className="btn-ghost text-xs">Tandai {view.unread} terbaca</DemoActionButton>}
      </div>

      {ev && evText && (
        <section className="card p-4">
          <h2 className="font-title text-lg"><span className="rubric">{evText.title.charAt(0)}</span>{evText.title.slice(1)}</h2>
          <p className="mt-1 text-sm">{evText.body}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {(JSON.parse(ev.choices_json || "[]") as { id: string; label: string }[]).map((c) => (
              <DemoActionButton key={c.id} action="resolve_event" payload={{ choiceId: c.id }}>{c.label}</DemoActionButton>
            ))}
          </div>
        </section>
      )}

      {view.reports.length === 0 && <p className="text-sm opacity-70">Gulungan kronik masih kosong.</p>}
      <div className="space-y-3">
        {view.reports.map((r) => (
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
