import { useMemo, useState } from "react";
import { usePortfolio } from "@/features/portfolio/hooks/usePortfolio";
import { ExpenseDashboardPage } from "@/features/expenses/pages/ExpenseDashboardPage";
import { calculateDashboardMetrics } from "../utils/calculateDashboardMetrics";

export function DashboardPage() {
  const { holdings, loading } = usePortfolio();
  const [mode, setMode] = useState<"stocks" | "expenses">("stocks");

  const metrics = useMemo(() => {
    return calculateDashboardMetrics(holdings);
  }, [holdings]);

  const topHoldings = useMemo(() => {
    return [...holdings]
      .sort((a, b) => b.currentValue - a.currentValue)
      .slice(0, 4);
  }, [holdings]);

  const pnlColor = metrics.totalPnL >= 0 ? "#16a34a" : "#dc2626";
  const returnPct =
    metrics.invested > 0 ? (metrics.totalPnL / metrics.invested) * 100 : 0;

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 2,
    }).format(value);

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>
            {mode === "stocks" ? "A quick view of your portfolio momentum." : "Gamified view of your personal expense tracker."}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 14, color: "#6b7280" }}>View</span>
          <select
            value={mode}
            onChange={(event) => setMode(event.target.value as "stocks" | "expenses")}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
          >
            <option value="stocks">Stocks</option>
            <option value="expenses">Expenses</option>
          </select>
        </div>
      </div>

      {mode === "expenses" ? (
        <div style={{ marginTop: 16 }}>
          <ExpenseDashboardPage />
        </div>
      ) : (
        <>
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

          {!loading ? (
            <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
              <div style={{ padding: 16, borderRadius: 12, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <div style={{ color: "#6b7280", fontSize: 13 }}>Invested</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{formatCurrency(metrics.invested)}</div>
              </div>

              <div style={{ padding: 16, borderRadius: 12, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <div style={{ color: "#6b7280", fontSize: 13 }}>Current Value</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{formatCurrency(metrics.currentValue)}</div>
              </div>

              <div style={{ padding: 16, borderRadius: 12, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
                <div style={{ color: "#6b7280", fontSize: 13 }}>Total P&amp;L</div>
                <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700, color: pnlColor }}>
                  {formatCurrency(metrics.totalPnL)}
                </div>
                <div style={{ marginTop: 4, fontSize: 13, color: pnlColor }}>
                  {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%
                </div>
              </div>
            </div>
          ) : null}

          <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "white", border: "1px solid #e5e7eb" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <strong>Performance snapshot</strong>
              <span style={{ color: "#6b7280", fontSize: 13 }}>{holdings.length} holdings</span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10, marginBottom: 12 }}>
              <div style={{ padding: 10, borderRadius: 10, background: "#f9fafb" }}>
                <div style={{ color: "#6b7280", fontSize: 12 }}>Win rate</div>
                <div style={{ marginTop: 4, fontWeight: 700 }}>{holdings.length > 0 ? "100%" : "—"}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: "#f9fafb" }}>
                <div style={{ color: "#6b7280", fontSize: 12 }}>Avg. cost basis</div>
                <div style={{ marginTop: 4, fontWeight: 700 }}>{holdings.length > 0 ? formatCurrency(metrics.invested / holdings.length) : "—"}</div>
              </div>
              <div style={{ padding: 10, borderRadius: 10, background: "#f9fafb" }}>
                <div style={{ color: "#6b7280", fontSize: 12 }}>Position count</div>
                <div style={{ marginTop: 4, fontWeight: 700 }}>{holdings.length}</div>
              </div>
            </div>

            {holdings.length === 0 ? (
              <div style={{ color: "#6b7280", fontSize: 14 }}>Add an order to begin building your portfolio.</div>
            ) : (
              <div style={{ display: "grid", gap: 8 }}>
                {topHoldings.map((holding) => (
                  <div key={holding.symbol} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid #f3f4f6" }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{holding.symbol}</div>
                      <div style={{ fontSize: 13, color: "#6b7280" }}>{holding.quantity} shares • {holding.holdingAgeLabel}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: 600 }}>{formatCurrency(holding.currentValue)}</div>
                      <div style={{ fontSize: 13, color: holding.netPnl >= 0 ? "#16a34a" : "#dc2626" }}>
                        {holding.netPnl >= 0 ? "+" : ""}{holding.netPnl.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}