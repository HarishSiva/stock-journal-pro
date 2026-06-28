import http from "node:http";
import { URL } from "node:url";
import dotenv from "dotenv";
import { SmartAPI } from "smartapi-javascript";

dotenv.config();

const port = Number(process.env.PORT || 3001);

const smartApi = new SmartAPI({
  api_key: process.env.ANGEL_ONE_API_KEY,
  username: process.env.ANGEL_ONE_CLIENT_ID,
  password: process.env.ANGEL_ONE_PASSWORD,
  totp: process.env.ANGEL_ONE_TOTP_SECRET,
});

let sessionPromise = null;

async function ensureSession() {
  if (!sessionPromise) {
    sessionPromise = smartApi.generateSession().catch((error) => {
      sessionPromise = null;
      throw error;
    });
  }

  return sessionPromise;
}

async function getQuote(symbol) {
  const normalizedSymbol = String(symbol || "").trim().toUpperCase();

  if (!normalizedSymbol) {
    throw new Error("A symbol is required");
  }

  await ensureSession();
  return smartApi.getQuote(normalizedSymbol);
}

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);

  if (req.method === "GET" && requestUrl.pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  if (req.method === "GET" && (requestUrl.pathname === "/api/quote" || requestUrl.pathname === "/api/price")) {
    try {
      const symbol = requestUrl.searchParams.get("symbol") || "RELIANCE";
      const quote = await getQuote(symbol);

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: true, symbol, quote }));
    } catch (error) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ ok: false, error: error instanceof Error ? error.message : "Unknown error" }));
    }
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ ok: false, error: "Not found" }));
});

server.listen(port, () => {
  console.log(`Angel One backend listening on http://localhost:${port}`);
});
