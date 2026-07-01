type PriceMap = Record<string, number>;
export type PriceLookupResult = {
  prices: PriceMap;
  errors: Record<string, string>;
};

/**
 * In-memory cache for real quote values.
 */
const cache: PriceMap = {};
const inFlightRequests: Record<string, Promise<number>> = {};

export function normalizeIndianQuoteSymbol(symbol: string): string {
  const trimmed = symbol.trim().toUpperCase();

  if (trimmed.endsWith(".NS") || trimmed.endsWith(".BO") || trimmed.endsWith(".NSE") || trimmed.endsWith(".BSE")) {
    return trimmed.replace(/\.NSE$/i, ".NS").replace(/\.BSE$/i, ".BO");
  }

  return trimmed;
}

async function fetchRealPrice(symbol: string): Promise<number> {
  const quoteSymbol = normalizeIndianQuoteSymbol(symbol);
  const backendUrl = `/api/price?symbol=${encodeURIComponent(quoteSymbol)}`;

  const response = await fetch(backendUrl, {
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch live price for ${symbol}`);
  }

  const payload = await response.json();
  const quoteData = payload?.quote;
  const price = quoteData?.data?.[0]?.lastPrice ?? quoteData?.data?.[0]?.lp ?? quoteData?.lastPrice ?? quoteData?.lp;

  if (typeof price !== "number" || Number.isNaN(price)) {
    throw new Error(`No live price returned for ${symbol}`);
  }

  return Number(price);
}

/**
 * Get price for a symbol from a real market data source.
 */
export async function getPrice(symbol: string): Promise<number> {
  const normalizedSymbol = normalizeIndianQuoteSymbol(symbol.trim().toUpperCase());

  if (cache[normalizedSymbol] !== undefined) {
    return cache[normalizedSymbol];
  }

  const pendingRequest = inFlightRequests[normalizedSymbol];
  if (pendingRequest) {
    return pendingRequest;
  }

  const request = (async () => {
    const price = await fetchRealPrice(normalizedSymbol);
    cache[normalizedSymbol] = price;
    return price;
  })();

  inFlightRequests[normalizedSymbol] = request;

  try {
    return await request;
  } finally {
    delete inFlightRequests[normalizedSymbol];
  }
}

/**
 * Bulk fetch prices (important for portfolio screen)
 */
export async function getPrices(symbols: string[]): Promise<PriceLookupResult> {
  const prices: PriceMap = {};
  const errors: Record<string, string> = {};

  const settled = await Promise.allSettled(
    symbols.map(async (symbol) => {
      const normalizedSymbol = normalizeIndianQuoteSymbol(symbol.trim().toUpperCase());
      const price = await getPrice(normalizedSymbol);
      prices[normalizedSymbol] = price;
    }),
  );

  settled.forEach((result, index) => {
    const symbol = symbols[index]?.trim().toUpperCase();

    if (!symbol) {
      return;
    }

    if (result.status === "rejected") {
      const normalizedSymbol = normalizeIndianQuoteSymbol(symbol);
      errors[normalizedSymbol] = result.reason instanceof Error ? result.reason.message : "Unable to load live price";
    }
  });

  return { prices, errors };
}

/**
 * Clear cache (useful for refresh / dev mode)
 */
export function clearPriceCache() {
  Object.keys(cache).forEach((k) => delete cache[k]);
  Object.keys(inFlightRequests).forEach((k) => delete inFlightRequests[k]);
}