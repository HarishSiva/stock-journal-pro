import { useOrders } from "../hooks/useOrders";
import { calculateOrderAnalytics } from "../utils/orderAnalytics";
import { OrdersTable } from "../components/OrdersTable";

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function parseCustomDate(dateString?: string): Date | null {
  if (!dateString) return null;

  try {
    // Handle format: "19th Dec'24"
    // Remove ordinal suffix (st, nd, rd, th)
    const cleaned = dateString.replace(/(\d+)(st|nd|rd|th)\s+/, "$1 ");
    
    // Parse with Intl or fallback to manual parsing
    const date = new Date(cleaned);
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      // Manual fallback for "19 Dec'24" format
      const parts = cleaned.split(/\s+/);
      if (parts.length >= 2) {
        const day = parts[0];
        const month = parts[1];
        const year = parts[2] || new Date().getFullYear().toString();
        
        const fullYear = year.length === 2 ? `20${year}` : year;
        const isoDate = `${fullYear}-${getMonthNumber(month)}-${day.padStart(2, "0")}`;
        
        return new Date(isoDate);
      }
    }
    
    return date;
  } catch {
    return null;
  }
}

function getMonthNumber(monthName: string): string {
  const months: Record<string, string> = {
    Jan: "01", Feb: "02", Mar: "03", Apr: "04", May: "05", Jun: "06",
    Jul: "07", Aug: "08", Sep: "09", Oct: "10", Nov: "11", Dec: "12",
  };
  return months[monthName] || "01";
}

function formatDate(dateString?: string): string {
  if (!dateString) return "N/A";
  
  try {
    const date = parseCustomDate(dateString);
    
    if (!date || isNaN(date.getTime())) {
      return dateString; // Fallback to original string
    }
    
    return date.toLocaleDateString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return dateString;
  }
}

export function OrdersPage() {
  const { orders, loading } = useOrders();
  const analytics = calculateOrderAnalytics(orders);

  return (
    <div style={{ padding: 16 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Orders</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>Trade history and performance analysis.</p>
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
            Refreshing orders…
          </div>
        ) : null}
      </div>

      {/* Stats Cards */}
      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
        <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 10, background: "white" }}>
          <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Total Trades</div>
          <div style={{ fontSize: 24, fontWeight: 700 }}>{analytics.totalTrades}</div>
        </div>

        <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 10, background: "white" }}>
          <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Buy Count</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#3b82f6" }}>{analytics.buyCount}</div>
        </div>

        <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 10, background: "white" }}>
          <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Sell Count</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#ef4444" }}>{analytics.sellCount}</div>
        </div>

        <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 10, background: "white" }}>
          <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Total Invested</div>
          <div style={{ fontSize: 18, fontWeight: 600 }}>{analytics.totalInvestedFormatted}</div>
        </div>

        <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 10, background: "white" }}>
          <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Total P&L</div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: analytics.totalPnL >= 0 ? "#16a34a" : "#dc2626",
            }}
          >
            {analytics.totalPnLFormatted}
          </div>
        </div>

        <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 10, background: "white" }}>
          <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Winning Trades</div>
          <div style={{ fontSize: 20, fontWeight: 600, color: "#16a34a" }}>{analytics.winningTrades}</div>
        </div>

        <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 10, background: "white" }}>
          <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>First Trade</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(analytics.oldestTradeDate)}</div>
        </div>

        <div style={{ padding: 14, border: "1px solid #e5e7eb", borderRadius: 10, background: "white" }}>
          <div style={{ color: "#6b7280", fontSize: 12, marginBottom: 4 }}>Latest Trade</div>
          <div style={{ fontSize: 14, fontWeight: 600 }}>{formatDate(analytics.newestTradeDate)}</div>
        </div>
      </div>

      {/* Info Box */}
      <div style={{ marginTop: 16, padding: "12px 14px", borderRadius: 10, background: "#f9fafb", border: "1px solid #e5e7eb", color: "#374151", fontSize: 13 }}>
        Track all your trades. P&L is calculated based on matched buy/sell orders for the same symbol.
      </div>

      {/* Orders Table */}
      <div style={{ marginTop: 16 }}>
        <OrdersTable />
      </div>
    </div>
  );
}