import assert from "node:assert/strict";
import { applyManualPrices, calculateHoldings } from "./portfolioEngine.ts";

const holdings = calculateHoldings([
  { symbol: "TCS", side: "BUY", quantity: 10, price: 100 },
]);

assert.equal(holdings.length, 1);
assert.equal(holdings[0].currentlyHeldQty, 10);
assert.equal(holdings[0].invested, 1000);
assert.equal(holdings[0].currentPrice, 0);
assert.equal(holdings[0].currentValue, 0);
assert.equal(holdings[0].unrealizedPnL, -1000);
assert.equal(holdings[0].netPnl, -1000);

const markedUp = applyManualPrices(holdings, {
  TCS: { price: 120, lastUpdated: "2026-09-05T00:00:00.000Z" },
});

assert.equal(markedUp[0].currentPrice, 120);
assert.equal(markedUp[0].manualPrice, 120);
assert.equal(markedUp[0].currentValue, 1200);
assert.equal(markedUp[0].unrealizedPnL, 200);
assert.equal(markedUp[0].netPnl, 200);
assert.equal(markedUp[0].gainPct, 20);
assert.equal(markedUp[0].lastUpdated, "2026-09-05T00:00:00.000Z");

const partialSell = calculateHoldings([
  { symbol: "INFY", side: "BUY", quantity: 10, price: 50 },
  { symbol: "INFY", side: "SELL", quantity: 4, price: 60 },
]);
const priced = applyManualPrices(partialSell, {
  INFY: { price: 80, lastUpdated: "2026-09-05T00:00:00.000Z" },
});

assert.equal(priced[0].currentlyHeldQty, 6);
assert.equal(priced[0].invested, 300);
assert.equal(priced[0].currentValue, 480);
assert.equal(priced[0].unrealizedPnL, 180);

console.log("portfolioEngine checks passed");
