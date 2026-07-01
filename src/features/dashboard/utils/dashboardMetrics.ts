import type { Holding } from "../../portfolio/utils/portfolioEngine";

export type DashboardMetrics = {
  totalValue: number;
  totalInvested: number;
  totalPnL: number;
  gainPct: number;
  topGainer?: Holding;
  topLoser?: Holding;
};

export function calculateDashboardMetrics(
  holdings: Holding[]
): DashboardMetrics {
  let totalValue = 0;
  let totalInvested = 0;

  let topGainer: Holding | undefined;
  let topLoser: Holding | undefined;

  for (const h of holdings) {
    totalValue += h.currentValue;
    totalInvested += h.invested;

    if (!topGainer || h.gainPct > topGainer.gainPct) {
      topGainer = h;
    }

    if (!topLoser || h.gainPct < topLoser.gainPct) {
      topLoser = h;
    }
  }

  const totalPnL = totalValue - totalInvested;

  const gainPct =
    totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  return {
    totalValue,
    totalInvested,
    totalPnL,
    gainPct,
    topGainer,
    topLoser,
  };
}