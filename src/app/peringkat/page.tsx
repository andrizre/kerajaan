import { rankingView } from "@/lib/view";

const fmt = (n: number) => Math.floor(n).toLocaleString("id-ID");

export default function PeringkatPage() {
  const v = rankingView();
  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">P</span>eringkat</h1>
      <p className="text-sm">
        Kronik menobatkanku peringkat <strong>#{v.rank}</strong> dari {v.rows.length}. Skor dihitung dari penduduk,
        bangunan, prajurit, riset, dan zaman.
      </p>
      <ol className="card divide-y divide-[var(--paper-edge)] p-0">
        {v.rows.map((r, i) => (
          <li key={r.name} className={`flex items-baseline justify-between px-4 py-2 ${r.isPlayer ? "font-semibold" : ""}`}>
            <span>
              <span className="rubric mr-2">{i + 1}.</span>
              {r.name}{r.isPlayer ? " (kita)" : ""}
            </span>
            <span className="data-olive">{fmt(r.score)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export const dynamic = "force-dynamic";
