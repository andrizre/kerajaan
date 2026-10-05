"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function ActionButton({
  action,
  payload,
  children,
  className = "btn-primary text-sm",
  disabled,
  confirmText,
}: {
  action: string;
  payload?: Record<string, unknown>;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
  confirmText?: string;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null);
    const r = await fetch("/api/action", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    const j = await r.json();
    if (!j.ok) setError(j.error ?? "Gagal");
    start(() => router.refresh());
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button onClick={run} disabled={disabled || pending} className={className}>
        {pending ? "…" : children}
      </button>
      {error && <span className="rubric text-xs">{error}</span>}
    </span>
  );
}
