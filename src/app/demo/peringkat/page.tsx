"use client";

import { useDemo } from "@/components/DemoProvider";

const fmt = (n: number) => Math.floor(n).toLocaleString("id-ID");

export default function DemoPeringkat() {
  const { view } = useDemo();
  if (!view) return <p className="text-sm opacity-60">Memuat…</p>;
  const rank = view.rankRows.findIndex((r) => r.isPlayer) + 1;

  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">P</span>eringkat</h1>
      <p className="text-sm">Kronik menobatkan kita peringkat <strong>#{rank}</strong> dari {view.rankRows.length}.</p>
      <ol className="card divide-y divide-[var(--paper-edge)] p-0">
        {view.rankRows.map((r, i) => (
          <li key={r.name} className={`flex items-baseline justify-between px-4 py-2 ${r.isPlayer ? "font-semibold" : ""}`}>
            <span><span className="rubric mr-2">{i + 1}.</span>{r.name}{r.isPlayer ? " (kita)" : ""}</span>
            <span className="data-olive">{fmt(r.score)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
