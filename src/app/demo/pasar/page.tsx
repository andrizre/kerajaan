"use client";

import * as B from "@config/balance";
import { DemoMarketTradeControls } from "@/components/MarketTradeControls";
import { useDemo } from "@/components/DemoProvider";

const fmt = (n: number) => Math.floor(n).toLocaleString("id-ID");

export default function DemoPasar() {
  const { view } = useDemo();
  if (!view) return <p className="text-sm opacity-60">Memuat…</p>;
  const st = view.state;

  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">P</span>asar</h1>
      <p className="text-sm">Harga berubah setiap jam. Jual di bawah harga dasar, beli di atasnya.</p>
      <p className="text-sm">Emas: <strong>{fmt(st.resources.emas)}</strong></p>

      <div className="space-y-3">
        {view.prices.map((p) => {
          const res = p.resource as B.Resource;
          const base = B.MARKET_BASE_PRICES[res];
          return (
            <section key={res} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-title text-lg capitalize"><span className="rubric">{res.charAt(0)}</span>{res.slice(1)}</h2>
                <span className="text-xs data-olive">harga {p.price.toFixed(2)} (dasar {base}) · stok {fmt(st.resources[res])}</span>
              </div>
              <DemoMarketTradeControls resource={res} />
            </section>
          );
        })}
      </div>
    </div>
  );
}
