import { marketView } from "@/lib/view";
import * as B from "@config/balance";
import { MarketTradeControls } from "@/components/MarketTradeControls";

export default function PasarPage() {
  const v = marketView();
  return (
    <div className="space-y-4">
      <h1 className="font-title text-2xl font-semibold"><span className="rubric">P</span>asar</h1>
      <p className="text-sm">
        Harga berubah setiap jam mengikuti pedagang NPC. Jual di bawah harga dasar, beli di atasnya — juru tulis mencatat margin mereka dengan kesal.
      </p>
      <p className="text-sm">Emas: <strong>{Math.floor(v.state.resources.emas).toLocaleString("id-ID")}</strong></p>

      <div className="space-y-3">
        {v.prices.map((p: any) => {
          const res = p.resource as B.Resource;
          if (res === "emas") return null;
          const base = B.MARKET_BASE_PRICES[res];
          const harga = p.price as number;
          return (
            <section key={res} className="card p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-title text-lg capitalize"><span className="rubric">{res.charAt(0)}</span>{res.slice(1)}</h2>
                <span className="text-xs data-olive">harga kini {harga.toFixed(2)} (dasar {base}) · stok {Math.floor(v.state.resources[res]).toLocaleString("id-ID")}</span>
              </div>
              <MarketTradeControls resource={res} />
            </section>
          );
        })}
      </div>
    </div>
  );
}

export const dynamic = "force-dynamic";
