import Link from "next/link";
import * as B from "@config/balance";
import { loadView } from "@/lib/view";
import { productionPerHour, happinessFactor, foodUpkeepPerHour, taxGoldPerHour } from "@/lib/game/engine";
import QueueTimer from "@/components/QueueTimer";

function fmt(n: number): string {
  return Math.floor(n).toLocaleString("id-ID");
}

export default function KerajaanPage() {
  const v = loadView();
  const hFac = happinessFactor(v.state.happiness);
  const prod = productionPerHour(v.state.levels, v.state.workersPerBuilding, hFac);
  prod.emas += taxGoldPerHour(v.state.population, v.state.taxPercent);
  const upkeep = foodUpkeepPerHour(v.state.population, v.state.unitCounts);

  return (
    <div className="space-y-4">
      <header>
        <p className="text-sm data-olive">{v.eraName} · Skor {fmt(v.score)}</p>
        <h1 className="font-title text-2xl font-semibold"><span className="rubric">K</span>erajaan {v.kingdomName}</h1>
        <p className="mt-1 text-sm">
          Juru tulis mencatat: {fmt(v.state.population)} penduduk dari kapasitas {v.housing} rumah,
          kebahagiaan {Math.round(v.state.happiness)} dari 100{v.state.happiness < B.LOW_HAPPINESS_THRESHOLD ? " — hati rakyat dingin, produksi melambat" : ""}.
        </p>
      </header>

      <section aria-label="Sumber daya" className="card grid grid-cols-2 gap-3 p-4 sm:grid-cols-3">
        {B.RESOURCES.map((r) => (
          <div key={r}>
            <p className="text-xs uppercase tracking-wide data-olive">{r}</p>
            <p className="font-title text-xl">{fmt(v.state.resources[r])} <span className="text-xs">/ {fmt(v.cap)}</span></p>
            <p className="text-xs">{prod[r] - (r === "makanan" ? upkeep : 0) >= 0 ? "+" : ""}{((prod[r] - (r === "makanan" ? upkeep : 0))).toFixed(1)}/jam</p>
          </div>
        ))}
      </section>

      {v.activeEvent && (
        <section className="card p-4">
          <h2 className="font-title text-lg"><span className="rubric">A</span>cara menunggu keputusan</h2>
          <p className="text-sm">Sebuah peristiwa menuntut jawabanmu. Buka menu <Link href="/kronik" className="underline">Kronik</Link>.</p>
        </section>
      )}

      <section aria-label="Antrean aktif" className="card space-y-2 p-4">
        <h2 className="font-title text-lg"><span className="rubric">A</span>ntrean aktif</h2>
        {v.construction.length === 0 && v.research.length === 0 && v.training.length === 0 && v.marches.length === 0 && (
          <p className="text-sm text-[var(--ink)] opacity-70">
            Tidak ada pekerjaan berjalan. Kunjungi <Link href="/bangunan" className="underline">Bangunan</Link> atau <Link href="/riset" className="underline">Riset</Link> untuk memulai.
          </p>
        )}
        {v.construction.map((c: any) => (
          <QueueTimer key={c.id} startedAt={c.started_at} finishesAt={c.finishes_at} label={`Membangun ${B.BUILDINGS.find((b) => b.id === c.building_id)?.name} → lv${c.target_level}`} />
        ))}
        {v.research.map((r: any) => (
          <QueueTimer key={r.id} startedAt={r.started_at} finishesAt={r.finishes_at} label={`Riset ${B.TECHS.find((t) => t.id === r.tech_id)?.name}`} />
        ))}
        {v.training.map((t: any) => (
          <QueueTimer key={t.id} startedAt={t.started_at} finishesAt={t.finishes_at} label={`Melatih ${t.quantity} ${B.UNITS.find((u) => u.id === t.unit_id)?.name}`} />
        ))}
        {v.marches.map((m: any) => (
          <QueueTimer key={m.id} startedAt={m.departed_at} finishesAt={m.returns_at ?? m.arrives_at} label={`Armada ke ${m.target_npc} (${m.kind === "scout" ? "intai" : "serang"})`} />
        ))}
      </section>

      <section aria-label="Pekerja dan pajak" className="card p-4 text-sm">
        <h2 className="font-title text-lg"><span className="rubric">P</span>ekerja &amp; pajak</h2>
        <p className="mt-1">Pekerja teralokasi: {v.usedWorkers} · menganggur: {Math.max(0, Math.floor(v.state.population) - v.usedWorkers)}</p>
        <p>Pajak {v.state.taxPercent}% · kebahagiaan dasar {Math.round(100 - v.state.taxPercent * B.HAPPINESS_PER_TAX_PERCENT)}</p>
        <p>Upkeep makanan: {upkeep.toFixed(1)}/jam (penduduk + prajurit)</p>
        <p className="mt-2 text-xs opacity-70">Atur pajak di <Link href="/pengaturan" className="underline">Pengaturan</Link>, alokasi pekerja di <Link href="/bangunan" className="underline">Bangunan</Link>.</p>
      </section>
    </div>
  );
}

export const dynamic = "force-dynamic";
