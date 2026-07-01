import { usePortfolio } from "../hooks/usePortfolio";

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function PortfolioPage() {
  const { holdings, loading, setManualPrices } = usePortfolio();

  const totals = holdings.reduce(
    (acc, h) => ({
      invested: acc.invested + h.invested,
      currentValue: acc.currentValue + h.currentValue,
      pnl: acc.pnl + h.netPnl,
    }),
    { invested: 0, currentValue: 0, pnl: 0 },
  );

  const totalGainPct = totals.invested > 0 ? (totals.pnl / totals.invested) * 100 : 0;

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Portfolio</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>Current holdings and performance.</p>
        </div>

        {loading ? (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "6px 10px",
              borderRadius: 999,
              background: "#f3f4f6",
              color: "#6b7280",
              fontSize: 13,
              boxShadow: "inset 0 1px 2px rgba(0,0,0,0.04)",
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#60a5fa",
                display: "inline-block",
                animation: "pulse 1.2s ease-in-out infinite",
              }}
            />
            Refreshing portfolio…
          </div>
        ) : null}
      </div>

      <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: "#f9fafb", border: "1px solid #e5e7eb", color: "#374151", fontSize: 13 }}>
        Enter a current price manually for each holding to calculate unrealized gains and update current value instantly.
      </div>

      <div style={{ marginTop: 16, overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 12, background: "white" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", textAlign: "left" }}>
              <th style={{ padding: "10px 8px" }}>Symbol</th>
              <th style={{ padding: "10px 8px" }}>Qty</th>
              <th style={{ padding: "10px 8px" }}>Avg Price</th>
              <th style={{ padding: "10px 8px" }}>Invested</th>
              <th style={{ padding: "10px 8px" }}>Current Price</th>
              <th style={{ padding: "10px 8px" }}>Current Value</th>
              <th style={{ padding: "10px 8px" }}>Unrealized Gain</th>
              <th style={{ padding: "10px 8px" }}>Gain %</th>
              <th style={{ padding: "10px 8px" }}>Age</th>
              <th style={{ padding: "10px 8px" }}>Last Updated</th>
              <th style={{ padding: "10px 8px" }}>Net P&amp;L</th>
            </tr>
          </thead>

          <tbody>
            {holdings.map((h) => (
              <tr key={h.symbol} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 8px", fontWeight: 600 }}>{h.symbol}</td>
                <td style={{ padding: "10px 8px" }}>{h.quantity}</td>
                <td style={{ padding: "10px 8px" }}>{formatInr(h.avgPrice)}</td>
                <td style={{ padding: "10px 8px" }}>{formatInr(h.invested)}</td>
                <td style={{ padding: "10px 8px" }}>
                  <input
                    type="number"
                    value={h.manualPrice ?? h.currentPrice ?? ""}
                    onChange={(event) => {
                      const nextValue = Number(event.target.value);
                      const nextEntry = Number.isNaN(nextValue)
                        ? undefined
                        : { price: nextValue, lastUpdated: new Date().toISOString() };

                      setManualPrices((current) => {
                        const updated = { ...current };
                        if (nextEntry) {
                          updated[h.symbol] = nextEntry;
                        } else {
                          delete updated[h.symbol];
                        }
                        return updated;
                      });
                    }}
                    style={{ width: 96, padding: "6px 8px", borderRadius: 8, border: "1px solid #d1d5db" }}
                  />
                </td>
                <td style={{ padding: "10px 8px" }}>
                  {h.priceStatus === "unavailable" ? "—" : formatInr(h.currentValue)}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    color: h.unrealizedPnL >= 0 ? "#16a34a" : "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  {h.priceStatus === "unavailable" ? "—" : formatInr(h.unrealizedPnL)}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    color: h.gainPct >= 0 ? "#16a34a" : "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  {h.priceStatus === "unavailable" ? "—" : `${h.gainPct >= 0 ? "+" : ""}${h.gainPct.toFixed(1)}%`}
                </td>
                <td style={{ padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>
                  {h.holdingAgeLabel}
                </td>
                <td style={{ padding: "10px 8px", fontSize: 12, color: "#6b7280" }}>
                  {h.lastUpdated ? new Date(h.lastUpdated).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "Not updated"}
                </td>
                <td
                  style={{
                    padding: "10px 8px",
                    color: h.netPnl >= 0 ? "#16a34a" : "#dc2626",
                    fontWeight: 600,
                  }}
                >
                  {h.priceStatus === "unavailable" ? "—" : h.netPnl.toFixed(2)}
                </td>
              </tr>
            ))}

            <tr style={{ background: "#f9fafb", fontWeight: 700 }}>
              <td colSpan={2} style={{ padding: "10px 8px" }}>
                Total
              </td>
              <td style={{ padding: "10px 8px" }} />
              <td style={{ padding: "10px 8px" }}>{formatInr(totals.invested)}</td>
              <td style={{ padding: "10px 8px" }} />
              <td style={{ padding: "10px 8px" }}>{formatInr(totals.currentValue)}</td>
              <td style={{ padding: "10px 8px" }} />
              <td style={{ padding: "10px 8px" }} />
              <td style={{ padding: "10px 8px" }} />
              <td
                style={{
                  padding: "10px 8px",
                  color: totalGainPct >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {totalGainPct >= 0 ? "+" : ""}{totalGainPct.toFixed(1)}%
              </td>
              <td
                style={{
                  padding: "10px 8px",
                  color: totals.pnl >= 0 ? "#16a34a" : "#dc2626",
                }}
              >
                {formatInr(totals.pnl)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}