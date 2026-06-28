import type { Holding } from "@/features/portfolio/utils/portfolioEngine";

export type DashboardMetrics = {
  totalPnL: number;
  invested: number;
  currentValue: number;
};

export function calculateDashboardMetrics(
  holdings: Holding[]
): DashboardMetrics {
  const invested = holdings.reduce((sum, h) => sum + h.invested, 0);

  const currentValue = holdings.reduce(
    (sum, h) => sum + h.currentValue,
    0
  );

  const totalPnL = holdings.reduce((sum, h) => sum + h.netPnl, 0);

  return {
    invested,
    currentValue,
    totalPnL,
  };
}