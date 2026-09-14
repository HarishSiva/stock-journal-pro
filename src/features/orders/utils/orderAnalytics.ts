import type { Order } from "../types/order";

export interface OrderAnalytics {
  totalTrades: number;
  totalInvested: number;
  totalInvestedFormatted: string;
  buyCount: number;
  sellCount: number;
  totalPnL: number;
  totalPnLFormatted: string;
  winningTrades: number;
  oldestTradeDate?: string;
  newestTradeDate?: string;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

const parsePrice = (price: any): number => {
  if (typeof price === "number") return price;

  if (typeof price === "string") {
    const cleaned = price.replace(/[₹,]/g, "").trim();
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  }

  return 0;
};

function parseCustomDate(dateString?: string): Date | null {
  if (!dateString) return null;

  try {
    // Handle format: "19th Dec'24"
    const cleaned = dateString.replace(
      /(\d+)(st|nd|rd|th)\s+/,
      "$1 "
    );

    const date = new Date(cleaned);

    if (isNaN(date.getTime())) {
      // Manual fallback for "19 Dec'24" format
      const parts = cleaned.split(/\s+/);

      if (parts.length >= 2) {
        const day = parts[0];
        const month = parts[1];
        const year =
          parts[2] || new Date().getFullYear().toString();

        const fullYear =
          year.length === 2 ? `20${year}` : year;

        const monthNum = getMonthNumber(month);

        const isoDate =
          `${fullYear}-${monthNum}-${day.padStart(2, "0")}`;

        const parsedDate = new Date(isoDate);

        return isNaN(parsedDate.getTime())
          ? null
          : parsedDate;
      }
    }

    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

function getMonthNumber(monthName: string): string {
  const months: Record<string, string> = {
    Jan: "01",
    Feb: "02",
    Mar: "03",
    Apr: "04",
    May: "05",
    Jun: "06",
    Jul: "07",
    Aug: "08",
    Sep: "09",
    Oct: "10",
    Nov: "11",
    Dec: "12",
  };

  return months[monthName] || "01";
}

export function calculateOrderAnalytics(
  orders: Order[]
): OrderAnalytics {
  const totalTrades = orders.length;
/* 
  console.log("📋 Total orders received:", totalTrades);
  console.log("📋 Orders data:", orders);
 */
  const totalInvested = orders.reduce((sum, order) => {
    const quantity = Number(order.quantity) || 0;
    const price = parsePrice(order.price);
    const invested = quantity * price;
/* 
    console.log(
      `Order ${order.symbol}: qty=${quantity}, price=${price}, invested=${invested}`
    ); */

    return sum + invested;
  }, 0);

  const buyCount = orders.filter(
    o => o.side === "BUY"
  ).length;

  const sellCount = orders.filter(
    o => o.side === "SELL"
  ).length;

/*   console.log(
    `🔍 Buy orders: ${buyCount}, Sell orders: ${sellCount}`
  );
 */
  // Get date range - SORT BY DATE, NOT STRING
  const validDates = orders
    .map(o => ({
      original: o.trade_date,
      parsed: parseCustomDate(o.trade_date),
    }))
    .filter(
      (
        item
      ): item is {
        original: string;
        parsed: Date;
      } =>
        !!item.parsed &&
        !isNaN(item.parsed.getTime())
    );

  let oldestTradeDate: string | undefined;
  let newestTradeDate: string | undefined;

  if (validDates.length > 0) {
    const sorted = validDates.sort(
      (a, b) =>
        a.parsed.getTime() -
        b.parsed.getTime()
    );

    oldestTradeDate = sorted[0].original;
    newestTradeDate =
      sorted[sorted.length - 1].original;
  }

/*   console.log(
    `📅 Date range: ${oldestTradeDate} to ${newestTradeDate}`
  ); */

  // ============================================================
  // FIFO P&L CALCULATION
  // Only COMPLETED BUY + SELL quantities are included in P&L
  // ============================================================

  let totalPnL = 0;
  let winningTrades = 0;

  // Create FIFO queues per symbol.
  // Each item represents an available/open BUY quantity.
  const buyQueues = new Map<
    string,
    Array<{
      quantity: number;
      price: number;
    }>
  >();

  // Process orders in chronological order.
  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = parseCustomDate(a.trade_date)?.getTime() ?? 0;
    const dateB = parseCustomDate(b.trade_date)?.getTime() ?? 0;

    return dateA - dateB;
  });

  for (const order of sortedOrders) {
    const symbol = order.symbol;
    const quantity = Number(order.quantity) || 0;
    const price = parsePrice(order.price);

    if (!symbol || quantity <= 0 || price <= 0) {
      continue;
    }

    // ------------------------------------------------------------
    // BUY
    // Add the BUY quantity to the FIFO queue.
    // It does NOT contribute to P&L yet.
    // ------------------------------------------------------------
    if (order.side === "BUY") {
      if (!buyQueues.has(symbol)) {
        buyQueues.set(symbol, []);
      }

      buyQueues.get(symbol)!.push({
        quantity,
        price,
      });

     /*  console.log(
        `🟢 BUY added to FIFO: ${symbol}, qty=${quantity}, price=${price}`
      ); */

      continue;
    }

    // ------------------------------------------------------------
    // SELL
    // Match SELL against previous BUY quantities using FIFO.
    // Only the matched quantity contributes to P&L.
    // ------------------------------------------------------------
    if (order.side === "SELL") {
      let remainingSellQuantity = quantity;

      const queue = buyQueues.get(symbol);

      if (!queue || queue.length === 0) {
        console.log(
          `⚠️ SELL without BUY: ${symbol}, qty=${quantity}`
        );

        continue;
      }

      let sellPnL = 0;

      while (
        remainingSellQuantity > 0 &&
        queue.length > 0
      ) {
        const buy = queue[0];

        const matchedQuantity = Math.min(
          remainingSellQuantity,
          buy.quantity
        );

        const pnl =
          (price - buy.price) *
          matchedQuantity;

        sellPnL += pnl;

        totalPnL += pnl;

        /* console.log(
          `🔵 MATCH ${symbol}: ` +
          `BUY ${matchedQuantity} @ ${buy.price} ` +
          `→ SELL ${matchedQuantity} @ ${price} ` +
          `PnL=${pnl}`
        ); */

        // Reduce the BUY quantity
        buy.quantity -= matchedQuantity;

        // Reduce the remaining SELL quantity
        remainingSellQuantity -= matchedQuantity;

        // Remove completely consumed BUY
        if (buy.quantity <= 0) {
          queue.shift();
        }
      }

      // Count the SELL as a winning trade only when
      // it actually matched BUY quantity.
      if (sellPnL > 0) {
        winningTrades++;
      }

    /*   console.log(
        `📊 ${symbol} SELL: ` +
        `requested=${quantity}, ` +
        `matched=${quantity - remainingSellQuantity}, ` +
        `unmatched=${remainingSellQuantity}, ` +
        `PnL=${sellPnL}`
      );
 */
      if (remainingSellQuantity > 0) {
        console.log(
          `⚠️ ${symbol}: SELL quantity ` +
          `${remainingSellQuantity} remains unmatched`
        );
      }
    }
  }

  /* console.log("📊 Final Analytics:", {
    totalTrades,
    totalInvested,
    buyCount,
    sellCount,
    totalPnL,
    winningTrades,
    oldestTradeDate,
    newestTradeDate,
  }); */

  return {
    totalTrades,
    totalInvested,
    totalInvestedFormatted:
      formatCurrency(totalInvested),
    buyCount,
    sellCount,
    totalPnL,
    totalPnLFormatted:
      formatCurrency(totalPnL),
    winningTrades,
    oldestTradeDate,
    newestTradeDate,
  };
}