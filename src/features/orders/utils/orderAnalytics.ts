import type { Order } from "../types/order";

export interface OrderAnalytics {
  totalTrades: number;
  totalInvested: number;
  buyCount: number;
  sellCount: number;
  totalPnL: number;
  winningTrades: number;
}

export function calculateOrderAnalytics(
  orders: Order[]
): OrderAnalytics {
  const totalTrades = orders.length;

  const totalInvested = orders.reduce(
    (sum, order) => sum + order.quantity * order.price,
    0
  );

  const buyCount = orders.filter(o => o.side === "BUY").length;
  const sellCount = orders.filter(o => o.side === "SELL").length;

  let totalPnL = 0;
  let winningTrades = 0;

  const buys = orders.filter(o => o.side === "BUY");

  for (const sell of orders.filter(o => o.side === "SELL")) {
    const buy = buys.find(b => b.symbol === sell.symbol);

    if (!buy) continue;

    const pnl = (sell.price - buy.price) * sell.quantity;

    totalPnL += pnl;

    if (pnl > 0) {
      winningTrades++;
    }
  }

  return {
    totalTrades,
    totalInvested,
    buyCount,
    sellCount,
    totalPnL,
    winningTrades,
  };
}