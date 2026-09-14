export interface Holding {
  symbol: string;
  quantity: number;
  totalBoughtQty: number;
  totalSoldQty: number;
  currentlyHeldQty: number;
  invested: number;
  totalCostBasis: number;
  currentPrice: number;
  currentValue: number;
  unrealizedPnL: number;
  netPnl: number;
  gainPct: number;
  avgPrice: number;
  lastUpdated: string | null;
}

export function calculateHoldings(
  orders: any[],
  marketPrices: Record<string, number>
): Holding[] {

  // Internal structure used only for calculation.
  // These fields are NOT returned in Holding.
  const internal = new Map<
    string,
    {
      holding: Holding;
      buyLots: { qty: number; price: number }[];
      sellLots: { qty: number; price: number }[];
      realizedPnL: number;
    }
  >();

  // ---------------------------------------------------------
  // Parse trade date
  // Supports:
  // DD-MM-YYYY hh:mm AM/PM
  // DD/MM/YYYY hh:mm AM/PM
  // ISO dates as fallback
  // ---------------------------------------------------------
  function parseTradeDate(value: any): number {
    if (!value) return 0;

    const text = String(value).trim();

    // Example: 12-06-2023 03:24 PM
    const match = text.match(
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s+(\d{1,2}):(\d{2})\s*(AM|PM)$/i
    );

    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2]) - 1;
      const year = Number(match[3]);

      let hour = Number(match[4]);
      const minute = Number(match[5]);
      const ampm = match[6].toUpperCase();

      if (ampm === "PM" && hour !== 12) {
        hour += 12;
      }

      if (ampm === "AM" && hour === 12) {
        hour = 0;
      }

      return new Date(
        year,
        month,
        day,
        hour,
        minute
      ).getTime();
    }

    const parsed = new Date(text).getTime();

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  // ---------------------------------------------------------
  // Sort orders chronologically
  // ---------------------------------------------------------
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = parseTradeDate(a.trade_date ?? a.Date);
    const dateB = parseTradeDate(b.trade_date ?? b.Date);

    return dateA - dateB;
  });

  // ---------------------------------------------------------
  // Process every order
  // ---------------------------------------------------------
  for (const order of sortedOrders) {

    const symbol = String(
      order.symbol ?? order.Instrument ?? ""
    ).trim();

    const side = String(
      order.side ?? order.Side ?? ""
    ).trim().toUpperCase();

    const qty = Number(
      order.quantity ?? order.Qty ?? 0
    );

    const price = Number(
      order.price ?? order.Price ?? 0
    );

    if (!symbol || qty <= 0 || price < 0) {
      continue;
    }

    // -------------------------------------------------------
    // Create holding if it doesn't exist
    // -------------------------------------------------------
    if (!internal.has(symbol)) {

      internal.set(symbol, {
        holding: {
          symbol,
          quantity: 0,
          totalBoughtQty: 0,
          totalSoldQty: 0,
          currentlyHeldQty: 0,
          invested: 0,
          totalCostBasis: 0,
          currentPrice: 0,
          currentValue: 0,
          unrealizedPnL: 0,
          netPnl: 0,
          gainPct: 0,
          avgPrice: 0,
          lastUpdated: null,
        },

        buyLots: [],
        sellLots: [],
        realizedPnL: 0,
      });
    }

    const data = internal.get(symbol)!;
    const holding = data.holding;

    // =======================================================
    // BUY
    // =======================================================
    if (side === "BUY") {

      holding.totalBoughtQty += qty;

      let remainingQty = qty;

      // -----------------------------------------------------
      // First match against previous SELL lots.
      //
      // This handles:
      // SELL 100 @ 500
      // BUY  100 @ 490
      //
      // Realized P&L = (500 - 490) * 100
      // -----------------------------------------------------
      while (
        remainingQty > 0 &&
        data.sellLots.length > 0
      ) {

        const sellLot = data.sellLots[0];

        const matchedQty = Math.min(
          remainingQty,
          sellLot.qty
        );

        data.realizedPnL +=
          (sellLot.price - price) * matchedQty;

        sellLot.qty -= matchedQty;
        remainingQty -= matchedQty;

        if (sellLot.qty <= 0) {
          data.sellLots.shift();
        }
      }

      // -----------------------------------------------------
      // Any remaining BUY quantity becomes an open position
      // -----------------------------------------------------
      if (remainingQty > 0) {
        data.buyLots.push({
          qty: remainingQty,
          price,
        });
      }
    }

    // =======================================================
    // SELL
    // =======================================================
    else if (side === "SELL") {

      holding.totalSoldQty += qty;

      let remainingQty = qty;

      // -----------------------------------------------------
      // First match against previous BUY lots.
      //
      // Example:
      // BUY 100 @ 490
      // SELL 100 @ 500
      //
      // Realized P&L = (500 - 490) * 100
      // -----------------------------------------------------
      while (
        remainingQty > 0 &&
        data.buyLots.length > 0
      ) {

        const buyLot = data.buyLots[0];

        const matchedQty = Math.min(
          remainingQty,
          buyLot.qty
        );

        data.realizedPnL +=
          (price - buyLot.price) * matchedQty;

        buyLot.qty -= matchedQty;
        remainingQty -= matchedQty;

        if (buyLot.qty <= 0) {
          data.buyLots.shift();
        }
      }

      // -----------------------------------------------------
      // Any remaining SELL quantity becomes a short position.
      // -----------------------------------------------------
      if (remainingQty > 0) {
        data.sellLots.push({
          qty: remainingQty,
          price,
        });
      }
    }
  }

  // ---------------------------------------------------------
  // Build final Holding[]
  // ---------------------------------------------------------
  const result: Holding[] = [];

  for (const [symbol, data] of internal) {

    const holding = data.holding;

    // -------------------------------------------------------
    // User-supplied market price
    // -------------------------------------------------------
    const marketPrice = Number(
      marketPrices[symbol] ?? 0
    );

    holding.currentPrice = marketPrice;

    // -------------------------------------------------------
    // Your requested semantics
    // quantity = total bought quantity
    // -------------------------------------------------------
    holding.quantity = holding.totalBoughtQty;

    // -------------------------------------------------------
    // Current quantity
    // -------------------------------------------------------
    holding.currentlyHeldQty =
      holding.totalBoughtQty -
      holding.totalSoldQty;

    // -------------------------------------------------------
    // Calculate total BUY cost
    // -------------------------------------------------------
    let totalBuyCost = 0;

    for (const order of sortedOrders) {

      const orderSymbol = String(
        order.symbol ?? order.Instrument ?? ""
      ).trim();

      const side = String(
        order.side ?? order.Side ?? ""
      ).trim().toUpperCase();

      if (orderSymbol !== symbol || side !== "BUY") {
        continue;
      }

      const qty = Number(
        order.quantity ?? order.Qty ?? 0
      );

      const price = Number(
        order.price ?? order.Price ?? 0
      );

      if (qty > 0) {
        totalBuyCost += qty * price;
      }
    }

    // -------------------------------------------------------
    // Average historical BUY price
    // -------------------------------------------------------
    holding.avgPrice =
      holding.totalBoughtQty > 0
        ? totalBuyCost / holding.totalBoughtQty
        : 0;

    // -------------------------------------------------------
    // Invested / Cost Basis
    // -------------------------------------------------------
    holding.invested =
      holding.totalBoughtQty * holding.avgPrice;

    holding.totalCostBasis =
      holding.totalBoughtQty * holding.avgPrice;

    // -------------------------------------------------------
    // Current market value
    // -------------------------------------------------------
    if (holding.currentlyHeldQty > 0) {

      holding.currentValue =
        holding.currentlyHeldQty *
        holding.currentPrice;

      // Unrealized P&L on currently held shares
      holding.unrealizedPnL =
        holding.currentValue -
        (
          holding.currentlyHeldQty *
          holding.avgPrice
        );

    } else {

      holding.currentValue = 0;
      holding.unrealizedPnL = 0;
    }

    // -------------------------------------------------------
    // Net P&L
    // -------------------------------------------------------
    holding.netPnl =
      data.realizedPnL +
      holding.unrealizedPnL;

    // -------------------------------------------------------
    // Gain %
    // -------------------------------------------------------
    holding.gainPct =
      holding.invested > 0
        ? (holding.netPnl / holding.invested) * 100
        : 0;

    holding.lastUpdated =
      new Date().toISOString();

    result.push(holding);
  }

  return result;
}