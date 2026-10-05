"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDemo } from "@/components/DemoProvider";

export function DemoActionButton({
  action, payload, children, className = "btn-primary text-sm", disabled, confirmText,
}: {
  action: string; payload?: Record<string, unknown>; children: React.ReactNode;
  className?: string; disabled?: boolean; confirmText?: string;
}) {
  const { act, refresh, pending } = useDemo();
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  async function run() {
    if (confirmText && !window.confirm(confirmText)) return;
    setError(null); setMsg(null);
    const r = await act(action, payload);
    if (!r.ok) setError(r.error ?? "Gagal");
    else if (r.message) setMsg(r.message);
    refresh();
  }

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button onClick={run} disabled={disabled || pending} className={className}>
        {pending ? "…" : children}
      </button>
      {error && <span className="rubric text-xs">{error}</span>}
      {msg && <span className="data-olive text-xs">{msg}</span>}
    </span>
  );
}
