import { getDB } from "../../../shared/db/sqlite";
import type { Order } from "../types/order";

export async function initOrdersTable() {
  const db = await getDB();

  await db.execute(`
    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      symbol TEXT,
      side TEXT,
      quantity INTEGER,
      price REAL,
      broker TEXT,
      date TEXT,
      investmentThesis TEXT,
      notes TEXT
    );
  `);
}

export async function addOrderDB(order: Order) {
  const db = await getDB();

  await db.execute(
    `INSERT INTO orders VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      order.id,
      order.symbol,
      order.side,
      order.quantity,
      order.price,
      order.broker,
      order.date,
      order.investmentThesis ?? "",
      order.notes ?? "",
    ]
  );

  console.log("Saved successfully");
}

export async function getOrdersDB(): Promise<Order[]> {
  const db = await getDB();

  const result = await db.select<Order[]>(
    "SELECT * FROM orders ORDER BY date DESC"
  );

  return result ?? [];
}

export async function deleteOrderDB(id: string) {
  const db = await getDB();

  await db.execute("DELETE FROM orders WHERE id = ?", [id]);
}