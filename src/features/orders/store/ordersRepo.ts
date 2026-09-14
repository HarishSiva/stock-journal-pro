import { getDB } from "@/shared/db/sqlite";
import type { Order } from "@/features/orders/types/order";

export async function initOrdersTable() {
  const db = await getDB();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      symbol TEXT,
      side TEXT,
      quantity INTEGER,
      price REAL,
      broker TEXT,
      trade_date TEXT
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS manual_prices (
      symbol TEXT PRIMARY KEY,
      price REAL NOT NULL,
      last_updated TEXT NOT NULL
    )
  `);

  //("✅ Orders and manual price tables initialized");
}

export async function addOrderDB(order: Order) {
  const db = await getDB();

  await db.execute(
    `
      INSERT INTO orders (symbol, side, quantity, price, broker, trade_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `,
    [
      order.symbol,
      order.side,
      order.quantity,
      order.price,
      order.broker,
      order.trade_date,
    ]
  );
}

export async function updateOrderDB(id: string | number, updates: Partial<Order>) {
  const db = await getDB();

  const fields: string[] = [];
  const values: unknown[] = [];

  if (updates.symbol !== undefined) {
    fields.push("symbol = ?");
    values.push(updates.symbol);
  }

  if (updates.side !== undefined) {
    fields.push("side = ?");
    values.push(updates.side);
  }

  if (updates.quantity !== undefined) {
    fields.push("quantity = ?");
    values.push(updates.quantity);
  }

  if (updates.price !== undefined) {
    fields.push("price = ?");
    values.push(updates.price);
  }

  if (updates.broker !== undefined) {
    fields.push("broker = ?");
    values.push(updates.broker);
  }

  if (updates.trade_date !== undefined) {
    fields.push("trade_date = ?");
    values.push(updates.trade_date);
  }

  if (!fields.length) return;

  values.push(id);

  await db.execute(
    `UPDATE orders SET ${fields.join(", ")} WHERE id = ?`,
    values
  );
}

export async function getOrdersDB(): Promise<Order[]> {
  const db = await getDB();

  const rows = await db.select<any[]>(`
    SELECT
      id,
      symbol,
      side,
      quantity,
      price,
      broker,
      trade_date
    FROM orders
    ORDER BY trade_date ASC
  `);

  return rows.map((row) => ({
    id: String(row.id),
    symbol: row.symbol,
    side: row.side,
    quantity: Number(row.quantity),
    price: Number(row.price),
    broker: row.broker,
    trade_date: row.trade_date,
  }));
}

export async function deleteOrderDB(id: string | number) {
  const db = await getDB();

  await db.execute(
    `DELETE FROM orders WHERE id = ?`,
    [id]
  );
}

export async function getManualPricesDB(): Promise<Record<string, { price: number; lastUpdated: string }>> {
  const db = await getDB();

  const rows = await db.select<any[]>(`
    SELECT symbol, price, last_updated
    FROM manual_prices
  `);

  return rows.reduce<Record<string, { price: number; lastUpdated: string }>>((acc, row) => {
    acc[row.symbol] = {
      price: Number(row.price),
      lastUpdated: row.last_updated,
    };
    return acc;
  }, {});
}

export async function setManualPriceDB(symbol: string, price: number) {
  const db = await getDB();

  await db.execute(
    `
      INSERT INTO manual_prices (symbol, price, last_updated)
      VALUES (?, ?, ?)
      ON CONFLICT(symbol)
      DO UPDATE SET
        price = excluded.price,
        last_updated = excluded.last_updated
    `,
    [symbol, price, new Date().toISOString()]
  );
}

export async function deleteManualPriceDB(symbol: string) {
  const db = await getDB();

  await db.execute(
    `DELETE FROM manual_prices WHERE symbol = ?`,
    [symbol]
  );
}