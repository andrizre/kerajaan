"use client";

// Kontrol jumlah perdagangan pasar — dipakai halaman Pasar (web) dan demo.
// Jumlah diketik pemain, dibatasi bilangan bulat 1–1.000.000.

import { useState } from "react";
import * as B from "@config/balance";
import { ActionButton } from "@/components/ActionButton";
import { DemoActionButton } from "@/components/DemoActionButton";

const clampAmount = (n: number): number =>
  Math.max(1, Math.min(1_000_000, Math.floor(Number.isFinite(n) ? n : 1)));

function AmountInput({ value, onChange, idPrefix }: {
  value: number; onChange: (n: number) => void; idPrefix: string;
}) {
  return (
    <input
      type="number"
      min={1}
      max={1_000_000}
      inputMode="numeric"
      aria-label={`Jumlah untuk ${idPrefix}`}
      value={Number.isFinite(value) ? value : ""}
      onChange={(e) => onChange(clampAmount(Number(e.target.value)))}
      className="w-24 rounded border border-[var(--paper-edge)] bg-transparent px-2 py-1.5 text-sm"
    />
  );
}

/** Versi web (server save) — memakai ActionButton. */
export function MarketTradeControls({ resource }: { resource: B.Resource }) {
  const [amount, setAmount] = useState(50);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <AmountInput value={amount} onChange={setAmount} idPrefix={resource} />
      <ActionButton action="market_trade" payload={{ resource, amount, choiceId: "sell" }} className="btn-ghost text-sm">
        Jual {amount}
      </ActionButton>
      <ActionButton action="market_trade" payload={{ resource, amount, choiceId: "buy" }} className="btn-ghost text-sm">
        Beli {amount}
      </ActionButton>
    </div>
  );
}

/** Versi demo (localStorage) — memakai DemoActionButton. */
export function DemoMarketTradeControls({ resource }: { resource: B.Resource }) {
  const [amount, setAmount] = useState(50);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-2">
      <AmountInput value={amount} onChange={setAmount} idPrefix={resource} />
      <DemoActionButton action="market_trade" payload={{ resource, amount, choiceId: "sell" }} className="btn-ghost text-sm">
        Jual {amount}
      </DemoActionButton>
      <DemoActionButton action="market_trade" payload={{ resource, amount, choiceId: "buy" }} className="btn-ghost text-sm">
        Beli {amount}
      </DemoActionButton>
    </div>
  );
}
