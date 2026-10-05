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

export default function QueueTimer({
  startedAt,
  finishesAt,
  label,
}: {
  startedAt: string;
  finishesAt: string;
  label: string;
}) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const start = new Date(startedAt).getTime();
  const end = new Date(finishesAt).getTime();
  const pct = Math.max(0, Math.min(100, ((now - start) / Math.max(end - start, 1)) * 100));
  const left = end - now;

  return (
    <div className="py-1">
      <div className="flex items-baseline justify-between text-sm">
        <span>{label}</span>
        <span className="data-olive text-xs">{left <= 0 ? "menyelesaikan…" : fmt(left)}</span>
      </div>
      <div className="progress" role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
