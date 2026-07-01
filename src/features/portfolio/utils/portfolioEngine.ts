import type { Order } from "../../orders/types/order";
import type { Transaction } from "../../transactions/types/transaction";
import { getPrices, normalizeIndianQuoteSymbol, type PriceLookupResult } from "@/shared/services/priceService";

export type ManualPriceEntry = {
  price: number;
  lastUpdated: string;
};

type Lot = {
  quantity: number;
  buyPrice: number;
  buyDate: string;
};

type HoldingState = {
  holding: Holding;
  lots: Lot[];
  realizedNetPnl: number;
  realizedTax: number;
  realizedCostBasis: number;
  totalBuyCost: number;
};

export type Holding = {
  symbol: string;
  quantity: number;
  avgPrice: number;
  invested: number;

  currentPrice: number;
  currentValue: number;

  unrealizedPnL: number;
  netPnl: number;
  gainPct: number;
  priceStatus: "loading" | "ready" | "unavailable";
  priceError?: string;
  manualPrice?: number;
  lastUpdated?: string;
  holdingAgeDays: number;
  holdingAgeLabel: string;
  realizedNetPnl: number;
  realizedTax: number;
  totalCostBasis: number;
};

function calculateHoldingAgeDays(buyDate: string): number {
  const diffMs = Date.now() - new Date(buyDate).getTime();
  return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
}

function formatHoldingAge(days: number): string {
  if (days <= 0) {
    return "New";
  }

  const years = Math.floor(days / 365);
  const months = Math.floor((days % 365) / 30);

  if (years > 0) {
    return `${years}y${months > 0 ? ` ${months}m` : ""}`;
  }

  if (months > 0) {
    return `${months}m`;
  }

  return `${days}d`;
}

function createHolding(symbol: string): Holding {
  return {
    symbol,
    quantity: 0,
    avgPrice: 0,
    invested: 0,
    currentPrice: 0,
    currentValue: 0,
    unrealizedPnL: 0,
    netPnl: 0,
    gainPct: 0,
    priceStatus: "loading",
    manualPrice: undefined,
    lastUpdated: undefined,
    holdingAgeDays: 0,
    holdingAgeLabel: "New",
    realizedNetPnl: 0,
    realizedTax: 0,
    totalCostBasis: 0,
  };
}

export function calculateHoldingsBase(orders: Order[]): Holding[] {
  const states: Record<string, HoldingState> = {};

  for (const order of orders) {
    const symbol = order.symbol;

    if (!states[symbol]) {
      states[symbol] = {
        holding: createHolding(symbol),
        lots: [],
        realizedNetPnl: 0,
        realizedTax: 0,
        realizedCostBasis: 0,
        totalBuyCost: 0,
      };
    }

    const state = states[symbol];

    if (order.side === "BUY") {
      state.lots.push({
        quantity: order.quantity,
        buyPrice: order.price,
        buyDate: order.date,
      });
      state.totalBuyCost += order.price * order.quantity;
    }

    if (order.side === "SELL") {
      let remainingQty = order.quantity;
      let grossGain = 0;
      let stcgGain = 0;
      let ltcgGain = 0;
      let costBasisForSell = 0;

      while (remainingQty > 0 && state.lots.length > 0) {
        const lot = state.lots[0];
        const matchedQty = Math.min(remainingQty, lot.quantity);
        const sellValue = order.price * matchedQty;
        const lotCost = lot.buyPrice * matchedQty;
        const gain = sellValue - lotCost;
        const holdingAgeDays = calculateHoldingAgeDays(lot.buyDate);

        if (holdingAgeDays > 365) {
          ltcgGain += gain;
        } else {
          stcgGain += gain;
        }

        grossGain += gain;
        costBasisForSell += lotCost;
        remainingQty -= matchedQty;
        lot.quantity -= matchedQty;

        if (lot.quantity <= 0) {
          state.lots.shift();
        }
      }

      const shortTermTax = stcgGain * 0.15;
      const longTermTax = Math.max(0, ltcgGain - 100000) * 0.1;
      const taxAmount = shortTermTax + longTermTax;
      state.realizedTax += taxAmount;
      state.realizedNetPnl += grossGain - taxAmount;
      state.realizedCostBasis += costBasisForSell;
    }
  }

  return Object.values(states).map((state) => {
    const invested = state.lots.reduce((sum, lot) => sum + lot.buyPrice * lot.quantity, 0);
    const quantity = state.lots.reduce((sum, lot) => sum + lot.quantity, 0);
    const avgPrice = quantity > 0 ? invested / quantity : 0;

    const oldestLot = [...state.lots].sort((a, b) => new Date(a.buyDate).getTime() - new Date(b.buyDate).getTime())[0];
    const holdingAgeDays = oldestLot ? calculateHoldingAgeDays(oldestLot.buyDate) : 0;

    state.holding.quantity = quantity;
    state.holding.avgPrice = avgPrice;
    state.holding.invested = invested;
    state.holding.realizedNetPnl = state.realizedNetPnl;
    state.holding.realizedTax = state.realizedTax;
    state.holding.totalCostBasis = state.totalBuyCost;
    state.holding.holdingAgeDays = holdingAgeDays;
    state.holding.holdingAgeLabel = formatHoldingAge(holdingAgeDays);

    return state.holding;
  });
}

export function calculateHoldings(orders: Order[]): Holding[] {
  return calculateHoldingsBase(orders);
}

function calculateTransactionCosts(transactions: Transaction[]) {
  return transactions.reduce(
    (map, tx) => {
      const key = tx.symbol;
      const entry = map[key] ?? { totalCharges: 0 };
      entry.totalCharges += tx.brokerage + tx.stt + tx.stampDuty + tx.sebiCharges + tx.gst + tx.otherCharges;
      map[key] = entry;
      return map;
    },
    {} as Record<string, { totalCharges: number }>,
  );
}

export async function calculateHoldingsWithPrices(
  orders: Order[],
  manualPrices: Record<string, ManualPriceEntry> = {},
  transactions: Transaction[] = []
): Promise<Holding[]> {
  const base = calculateHoldingsBase(orders);
  const transactionCosts = calculateTransactionCosts(transactions);

  const symbols = base.map((b) => b.symbol);
  const { prices, errors }: PriceLookupResult = await getPrices(symbols);

  return base.map((h) => {
    const lookupSymbol = normalizeIndianQuoteSymbol(h.symbol);
    const manualEntry = manualPrices[h.symbol] ?? manualPrices[lookupSymbol];
    const priceError = errors[lookupSymbol];
    const resolvedPrice = manualEntry?.price ?? prices[lookupSymbol] ?? 0;
    const currentPrice = resolvedPrice;
    const currentValue = h.quantity * currentPrice;

    const txSummary = transactionCosts[h.symbol];
    const transactionCharges = txSummary?.totalCharges ?? 0;
    const unrealizedPnL = currentValue - h.invested;
    const netPnl = h.realizedNetPnl + unrealizedPnL - transactionCharges;
    const totalCostBasis = h.totalCostBasis || h.invested;
    const gainPct = totalCostBasis > 0 ? (netPnl / totalCostBasis) * 100 : 0;

    return {
      ...h,
      currentPrice,
      currentValue,
      unrealizedPnL,
      netPnl,
      gainPct,
      manualPrice: manualEntry?.price,
      lastUpdated: manualEntry?.lastUpdated,
      priceStatus: manualEntry ? "ready" : priceError ? "unavailable" : "ready",
      priceError,
    };
  });
}