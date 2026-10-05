"use client";

import { useEffect, useState } from "react";

function fmt(ms: number) {
  if (ms <= 0) return "selesai";
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}j ${m}m`;
  if (m > 0) return `${m}m ${sec}s`;
  return `${sec}s`;
}

export default function DemoQueueTimer({ startedAt, finishesAt, label, onDone }: {
  startedAt: string; finishesAt: string; label: string; onDone?: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  const done = new Date(finishesAt).getTime() <= now;
  useEffect(() => {
    if (done && onDone) {
      const t = setTimeout(onDone, 1200); // beri waktu 1 baris "menyelesaikan…"
      return () => clearTimeout(t);
    }
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = new Date(startedAt).getTime();
  const end = new Date(finishesAt).getTime();
  const pct = Math.max(0, Math.min(100, ((now - start) / Math.max(end - start, 1)) * 100));

  return (
    <div className="py-1">
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="data-olive text-xs">{done ? "menyelesaikan…" : fmt(end - now)}</span>
      </div>
      <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
