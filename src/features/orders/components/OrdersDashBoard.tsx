import type { Order } from "../types/order";
import { calculateOrderAnalytics } from "../utils/orderAnalytics";
import { DashboardCard } from "./DashboardCard";

type Props = {
  orders: Order[];
};

export function OrdersDashboard({ orders }: Props) {
  const analytics = calculateOrderAnalytics(orders);

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
        gap: 16,
        marginBottom: 24,
      }}
    >
      <DashboardCard
        title="Total Trades"
        value={analytics.totalTrades}
      />

      <DashboardCard
        title="Invested"
        value={`₹ ${analytics.totalInvested.toFixed(2)}`}
      />

      <DashboardCard
        title="BUY Orders"
        value={analytics.buyCount}
      />

      <DashboardCard
        title="SELL Orders"
        value={analytics.sellCount}
      />

      <DashboardCard
        title="Winning Trades"
        value={analytics.winningTrades}
      />

      <DashboardCard
        title="Total P&L"
        value={
          <span
            style={{
              color:
                analytics.totalPnL >= 0
                  ? "green"
                  : "red",
            }}
          >
            ₹ {analytics.totalPnL.toFixed(2)}
          </span>
        }
      />
    </div>
  );
}