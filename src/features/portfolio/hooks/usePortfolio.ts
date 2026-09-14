
import { useCallback, useEffect, useState } from "react";

import {
  getOrdersDB,
  getManualPricesDB,
  setManualPriceDB,
} from "../../orders/store/ordersRepo";

// ============================================================
// Types
// ============================================================

export interface ManualPrice {
  price: number;
  lastUpdated?: string | null;
}

export type ManualPriceMap = Record<string, ManualPrice>;

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

  // ----------------------------------------------------------
  // Gain missed because a position was closed earlier
  // ----------------------------------------------------------

  missedGain: number;
  missedGainPct: number;

  avgPrice: number;

  // Oldest historical BUY -> today
  holdingAgeDays: number;

  lastUpdated: string | null;
}

// ============================================================
// Internal lot types
// ============================================================

interface BuyLot {
  qty: number;
  price: number;
  date: number;
}

interface ShortLot {
  qty: number;
  price: number;
}

interface ClosedLongLot {
  qty: number;
  sellPrice: number;
  sellValue: number;
}

interface ClosedShortLot {
  qty: number;
  buyPrice: number;
  buyValue: number;
}

// ============================================================
// calculateHoldings
// ============================================================

function calculateHoldings(
  orders: any[],
  marketPrices: Record<string, number>
): Holding[] {
  const internal = new Map<
    string,
    {
      holding: Holding;

      // Currently open long lots
      buyLots: BuyLot[];

      // Currently open short lots
      shortLots: ShortLot[];

      // Historical closed long positions.
      //
      // Example:
      // BUY 100 @ 500
      // SELL 100 @ 600
      //
      // We keep:
      // qty = 100
      // sellPrice = 600
      //
      // This allows us to calculate:
      //
      // missedGain = (currentPrice - sellPrice) * qty
      closedLongLots: ClosedLongLot[];

      // Historical closed short positions.
      //
      // Example:
      // SELL 100 @ 500
      // BUY 100 @ 450
      //
      // We keep:
      // qty = 100
      // buyPrice = 450
      //
      // Missed gain:
      // (buyPrice - currentPrice) * qty
      closedShortLots: ClosedShortLot[];

      realizedPnL: number;

      totalBuyCost: number;

      oldestBuyDate: number;
    }
  >();

  // ==========================================================
  // Parse trade date
  // ==========================================================

  function parseTradeDate(value: any): number {
    if (!value) {
      return 0;
    }

    const text = String(value).trim();

    // --------------------------------------------------------
    // DD-MM-YYYY HH:mm AM/PM
    // DD/MM/YYYY HH:mm AM/PM
    // --------------------------------------------------------

    const match = text.match(
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)$/i
    );

    if (match) {
      const day = Number(match[1]);
      const month = Number(match[2]) - 1;
      const year = Number(match[3]);

      let hour = Number(match[4]);

      const minute = Number(match[5]);
      const second = Number(match[6] ?? 0);

      const ampm = match[7].toUpperCase();

      if (ampm === "PM" && hour !== 12) {
        hour += 12;
      }

      if (ampm === "AM" && hour === 12) {
        hour = 0;
      }

      const timestamp = new Date(
        year,
        month,
        day,
        hour,
        minute,
        second
      ).getTime();

      return Number.isNaN(timestamp) ? 0 : timestamp;
    }

    // --------------------------------------------------------
    // DD-MM-YYYY
    // DD/MM/YYYY
    // --------------------------------------------------------

    const dateOnlyMatch = text.match(
      /^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/
    );

    if (dateOnlyMatch) {
      const day = Number(dateOnlyMatch[1]);
      const month = Number(dateOnlyMatch[2]) - 1;
      const year = Number(dateOnlyMatch[3]);

      const timestamp = new Date(
        year,
        month,
        day
      ).getTime();

      return Number.isNaN(timestamp) ? 0 : timestamp;
    }

    // --------------------------------------------------------
    // ISO / browser-compatible date
    // --------------------------------------------------------

    const parsed = new Date(text).getTime();

    return Number.isNaN(parsed) ? 0 : parsed;
  }

  // ==========================================================
  // Sort orders chronologically
  // ==========================================================

  const sortedOrders = [...orders].sort((a, b) => {
    const dateA = parseTradeDate(
      a.trade_date ?? a.Date
    );

    const dateB = parseTradeDate(
      b.trade_date ?? b.Date
    );

    return dateA - dateB;
  });

  // ==========================================================
  // Process orders
  // ==========================================================

  for (const order of sortedOrders) {
    const symbol = String(
      order.symbol ??
      order.Instrument ??
      ""
    ).trim();

    const side = String(
      order.side ??
      order.Side ??
      ""
    )
      .trim()
      .toUpperCase();

    const qty = Number(
      order.quantity ??
      order.Qty ??
      0
    );

    const price = Number(
      order.price ??
      order.Price ??
      0
    );

    // --------------------------------------------------------
    // Ignore invalid orders
    // --------------------------------------------------------

    if (
      !symbol ||
      qty <= 0 ||
      price < 0
    ) {
      continue;
    }

    // ========================================================
    // Create holding
    // ========================================================

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

          missedGain: 0,
          missedGainPct: 0,

          avgPrice: 0,

          holdingAgeDays: 0,

          lastUpdated: null,
        },

        buyLots: [],

        shortLots: [],

        closedLongLots: [],

        closedShortLots: [],

        realizedPnL: 0,

        totalBuyCost: 0,

        oldestBuyDate: 0,
      });
    }

    const data = internal.get(symbol)!;
    const holding = data.holding;

    const tradeDate = parseTradeDate(
      order.trade_date ?? order.Date
    );

    // ========================================================
    // BUY
    // ========================================================

    if (side === "BUY") {
      holding.totalBoughtQty += qty;

      // ------------------------------------------------------
      // Historical BUY cost
      // ------------------------------------------------------

      data.totalBuyCost += qty * price;

      // ------------------------------------------------------
      // Oldest historical BUY
      // ------------------------------------------------------

      if (
        tradeDate > 0 &&
        (
          data.oldestBuyDate === 0 ||
          tradeDate < data.oldestBuyDate
        )
      ) {
        data.oldestBuyDate = tradeDate;
      }

      let remainingQty = qty;

      // ------------------------------------------------------
      // First close existing SHORT lots
      //
      // SELL 100 @ 500
      // BUY  100 @ 450
      //
      // Realized = +5000
      //
      // We also remember the BUY price because this was
      // the price at which the short was closed.
      // ------------------------------------------------------

      while (
        remainingQty > 0 &&
        data.shortLots.length > 0
      ) {
        const shortLot = data.shortLots[0];

        const matchedQty = Math.min(
          remainingQty,
          shortLot.qty
        );

        // ----------------------------------------------------
        // Realized short P&L
        // ----------------------------------------------------

        data.realizedPnL +=
          (
            shortLot.price -
            price
          ) * matchedQty;

        // ----------------------------------------------------
        // Store closed short lot.
        //
        // This is needed for Missed Gain.
        // ----------------------------------------------------

        data.closedShortLots.push({
          qty: matchedQty,

          buyPrice: price,

          buyValue:
            price * matchedQty,
        });

        shortLot.qty -= matchedQty;

        remainingQty -= matchedQty;

        if (shortLot.qty <= 0) {
          data.shortLots.shift();
        }
      }

      // ------------------------------------------------------
      // Remaining BUY becomes an open long lot
      // ------------------------------------------------------

      if (remainingQty > 0) {
        data.buyLots.push({
          qty: remainingQty,
          price,
          date: tradeDate,
        });
      }
    }

    // ========================================================
    // SELL
    // ========================================================

    else if (side === "SELL") {
      holding.totalSoldQty += qty;

      let remainingQty = qty;

      // ------------------------------------------------------
      // First close existing LONG lots
      //
      // BUY  100 @ 500
      // SELL 100 @ 600
      //
      // Realized = +10000
      // ------------------------------------------------------

      while (
        remainingQty > 0 &&
        data.buyLots.length > 0
      ) {
        const buyLot = data.buyLots[0];

        const matchedQty = Math.min(
          remainingQty,
          buyLot.qty
        );

        // ----------------------------------------------------
        // Realized long P&L
        // ----------------------------------------------------

        data.realizedPnL +=
          (
            price -
            buyLot.price
          ) * matchedQty;

        // ----------------------------------------------------
        // Store closed long lot.
        //
        // This is the key information for Missed Gain.
        // ----------------------------------------------------

        data.closedLongLots.push({
          qty: matchedQty,

          sellPrice: price,

          sellValue:
            price * matchedQty,
        });

        buyLot.qty -= matchedQty;

        remainingQty -= matchedQty;

        if (buyLot.qty <= 0) {
          data.buyLots.shift();
        }
      }

      // ------------------------------------------------------
      // Remaining SELL becomes an open SHORT lot
      // ------------------------------------------------------

      if (remainingQty > 0) {
        data.shortLots.push({
          qty: remainingQty,
          price,
        });
      }
    }
  }

  // ==========================================================
  // Build final holdings
  // ==========================================================

  const result: Holding[] = [];

  for (const [symbol, data] of internal) {
    const holding = data.holding;

    // ========================================================
    // Current market price
    // ========================================================

    holding.currentPrice = Number(
      marketPrices[symbol] ?? 0
    );

    // ========================================================
    // Historical quantity
    //
    // User-defined:
    // quantity = total BUY quantity
    // ========================================================

    holding.quantity =
      holding.totalBoughtQty;

    // ========================================================
    // Signed current position
    //
    // BUY 100
    // SELL 40
    // = +60
    //
    // SELL 100
    // BUY 40
    // = -60
    // ========================================================

    holding.currentlyHeldQty =
      holding.totalBoughtQty -
      holding.totalSoldQty;

    // ========================================================
    // Holding Age
    //
    // Oldest historical BUY -> today
    //
    // This remains non-zero even after complete closure.
    // ========================================================

    if (data.oldestBuyDate > 0) {
      holding.holdingAgeDays =
        Math.max(
          0,
          Math.floor(
            (
              Date.now() -
              data.oldestBuyDate
            ) /
            (1000 * 60 * 60 * 24)
          )
        );
    } else {
      holding.holdingAgeDays = 0;
    }

    // ========================================================
    // Average historical BUY price
    // ========================================================

    holding.avgPrice =
      holding.totalBoughtQty > 0
        ? data.totalBuyCost /
          holding.totalBoughtQty
        : 0;

    // ========================================================
    // Invested
    // ========================================================

    holding.invested =
      holding.totalBoughtQty *
      holding.avgPrice;

    // ========================================================
    // Total cost basis
    // ========================================================

    holding.totalCostBasis =
      holding.totalBoughtQty *
      holding.avgPrice;

    // ========================================================
    // Current market value
    //
    // Long  = positive
    // Short = negative
    // Flat  = zero
    // ========================================================

    holding.currentValue =
      holding.currentlyHeldQty *
      holding.currentPrice;

    // ========================================================
    // Unrealized P&L
    //
    // Calculate from actual remaining lots.
    //
    // This is important because avgPrice alone is not enough
    // for mixed long/short positions.
    // ========================================================

    let unrealizedPnL = 0;

    // --------------------------------------------------------
    // Open LONG lots
    // --------------------------------------------------------

    for (const lot of data.buyLots) {
      unrealizedPnL +=
        (
          holding.currentPrice -
          lot.price
        ) * lot.qty;
    }

    // --------------------------------------------------------
    // Open SHORT lots
    // --------------------------------------------------------

    for (const lot of data.shortLots) {
      unrealizedPnL +=
        (
          lot.price -
          holding.currentPrice
        ) * lot.qty;
    }

    holding.unrealizedPnL =
      unrealizedPnL;

    // ========================================================
    // Net P&L
    // ========================================================

    holding.netPnl =
      data.realizedPnL +
      holding.unrealizedPnL;

    // ========================================================
    // Gain %
    //
    // Normal long portfolio:
    //
    // netPnl / invested
    //
    // Pure short:
    //
    // use remaining short entry value.
    // ========================================================

    let gainDenominator =
      holding.invested;

    if (
      gainDenominator <= 0 &&
      data.shortLots.length > 0
    ) {
      gainDenominator =
        data.shortLots.reduce(
          (sum, lot) =>
            sum +
            lot.qty *
            lot.price,
          0
        );
    }

    holding.gainPct =
      gainDenominator > 0
        ? (
            holding.netPnl /
            gainDenominator
          ) * 100
        : 0;

    // ========================================================
    // MISSED GAIN
    //
    // LONG:
    //
    // BUY 100 @ 500
    // SELL 100 @ 600
    // Current = 700
    //
    // Missed Gain:
    //
    // (700 - 600) * 100
    // = +10000
    //
    // SHORT:
    //
    // SELL 100 @ 500
    // BUY 100 @ 450
    // Current = 400
    //
    // Missed Gain:
    //
    // (450 - 400) * 100
    // = +5000
    // ========================================================

    let missedGain = 0;

    // --------------------------------------------------------
    // Closed LONG positions
    // --------------------------------------------------------

    for (const lot of data.closedLongLots) {
      missedGain +=
        (
          holding.currentPrice -
          lot.sellPrice
        ) * lot.qty;
    }

    // --------------------------------------------------------
    // Closed SHORT positions
    // --------------------------------------------------------

    for (const lot of data.closedShortLots) {
      missedGain +=
        (
          lot.buyPrice -
          holding.currentPrice
        ) * lot.qty;
    }

    holding.missedGain =
      missedGain;

    // ========================================================
    // MISSED GAIN %
    //
    // For closed LONG:
    //
    // missedGain / sellValue * 100
    //
    // For closed SHORT:
    //
    // missedGain / coverValue * 100
    //
    // We aggregate the actual closed transaction values.
    // ========================================================

    let missedGainDenominator = 0;

    // --------------------------------------------------------
    // Closed LONG denominator
    // --------------------------------------------------------

    for (const lot of data.closedLongLots) {
      missedGainDenominator +=
        lot.sellValue;
    }

    // --------------------------------------------------------
    // Closed SHORT denominator
    // --------------------------------------------------------

    for (const lot of data.closedShortLots) {
      missedGainDenominator +=
        lot.buyValue;
    }

    holding.missedGainPct =
      missedGainDenominator > 0
        ? (
            holding.missedGain /
            missedGainDenominator
          ) * 100
        : 0;

    // ========================================================
    // Timestamp
    // ========================================================

    holding.lastUpdated =
      new Date().toISOString();

    result.push(holding);
  }

  return result;
}

// ============================================================
// usePortfolio Hook
// ============================================================

export function usePortfolio() {
  const [
    holdings,
    setHoldings
  ] = useState<any[]>([]);

  const [
    manualPrices,
    setManualPricesState
  ] = useState<ManualPriceMap>({});

  const [
    loading,
    setLoading
  ] = useState(true);

  // ==========================================================
  // Load portfolio
  // ==========================================================

  const loadPortfolio =
    useCallback(
      async (
        overrideManualMap?: ManualPriceMap
      ) => {
        try {
          const [
            orders,
            storedManualMap
          ] = await Promise.all([
            getOrdersDB(),
            getManualPricesDB(),
          ]);

          const safeOrders =
            Array.isArray(orders)
              ? orders
              : [];

          const safeStoredManualMap:
            ManualPriceMap =
            storedManualMap ?? {};

          // --------------------------------------------------
          // If a new manual price map was supplied, use it.
          // Otherwise use the DB values.
          // --------------------------------------------------

          const safeManualMap =
            overrideManualMap ??
            safeStoredManualMap;

          // ==================================================
          // Build market price map
          // ==================================================

          const marketPrices:
            Record<string, number> = {};

          Object.entries(
            safeManualMap
          ).forEach(
            ([symbol, value]) => {
              const price =
                Number(value?.price);

              if (
                Number.isFinite(price)
              ) {
                marketPrices[symbol] =
                  price;
              }
            }
          );

          // ==================================================
          // Calculate holdings
          // ==================================================

          const calculated =
            calculateHoldings(
              safeOrders,
              marketPrices
            );

          // ==================================================
          // Add manualPrice for UI
          // ==================================================

          const enriched =
            calculated.map(
              (holding) => {
                const symbol =
                  String(
                    holding.symbol
                  );

                const custom =
                  safeManualMap[symbol];

                if (!custom) {
                  return holding;
                }

                return {
                  ...holding,

                  manualPrice:
                    Number(
                      custom.price
                    ),
                };
              }
            );

          setHoldings(
            enriched
          );

          setManualPricesState(
            safeManualMap
          );
        } catch (error) {
          console.error(
            "Failed to load portfolio:",
            error
          );

          setHoldings([]);

          setManualPricesState({});
        } finally {
          setLoading(false);
        }
      },
      []
    );

  // ==========================================================
  // Set manual prices
  //
  // IMPORTANT:
  //
  // We reload the calculations after changing a manual price.
  //
  // This ensures:
  //
  // - currentValue changes
  // - unrealizedPnL changes
  // - netPnl changes
  // - gainPct changes
  // - missedGain changes
  // - missedGainPct changes
  //
  // It also correctly handles SHORT positions.
  // ==========================================================

  const setManualPrices =
    useCallback(
      (
        updater:
          | ManualPriceMap
          | ((
              prev: ManualPriceMap
            ) => ManualPriceMap)
      ) => {
        setManualPricesState(
          (current) => {
            const next =
              typeof updater === "function"
                ? updater(current)
                : updater;

            // ------------------------------------------------
            // Persist prices
            // ------------------------------------------------

            Object.entries(
              next ?? {}
            ).forEach(
              ([symbol, value]) => {
                setManualPriceDB(
                  symbol,
                  Number(
                    value?.price ?? 0
                  )
                ).catch(
                  (error) => {
                    console.error(
                      `Failed to persist manual price for ${symbol}:`,
                      error
                    );
                  }
                );
              }
            );

            return next ?? {};
          }
        );

        // ----------------------------------------------------
        // Recalculate the complete portfolio using the new
        // manual-price map.
        //
        // This is deliberately outside the state updater.
        // ----------------------------------------------------

        const currentPricesPromise =
          getManualPricesDB();

        currentPricesPromise
          .then(
            (storedMap) => {
              const currentMap =
                storedMap ?? {};

              const nextMap =
                typeof updater === "function"
                  ? updater(currentMap)
                  : updater;

              return loadPortfolio(
                nextMap
              );
            }
          )
          .catch(
            (error) => {
              console.error(
                "Failed to refresh portfolio after manual price change:",
                error
              );
            }
          );
      },
      [loadPortfolio]
    );

  // ==========================================================
  // Initial load
  // ==========================================================

  useEffect(
    () => {
      loadPortfolio();
    },
    [loadPortfolio]
  );

  // ==========================================================
  // Return
  // ==========================================================

  return {
    holdings,

    loading,

    manualPrices,

    setManualPrices,

    reloadPortfolio:
      loadPortfolio,
  };
}