import dotenv from "dotenv";
import { SmartAPI } from "smartapi-javascript";

dotenv.config();

const smartApi = new SmartAPI({
  api_key: process.env.ANGEL_ONE_API_KEY,
  username: process.env.ANGEL_ONE_CLIENT_ID,
  password: process.env.ANGEL_ONE_PASSWORD,
  totp: process.env.ANGEL_ONE_TOTP_SECRET,
});

async function login() {
  const response = await smartApi.generateSession();
  console.log("SmartAPI session ready");
  return response;
}

async function getQuote(symbol) {
  await login();
  const quote = await smartApi.getQuote(symbol);
  return quote;
}

async function getPositions() {
  await login();
  return smartApi.getPosition();
}

async function main() {
  try {
    const quote = await getQuote("RELIANCE");
    console.log("Quote:", JSON.stringify(quote, null, 2));
  } catch (error) {
    console.error("Angel One SmartAPI request failed", error);
  }
}

main();
