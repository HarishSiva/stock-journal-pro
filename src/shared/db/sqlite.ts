import Database from "@tauri-apps/plugin-sql";

let db: Database | null = null;
let dbInitPromise: Promise<Database> | null = null;

export async function getDB() {
  if (db) return db;

  if (!dbInitPromise) {
    dbInitPromise = Database.load("sqlite:stock.db");
  }

  db = await dbInitPromise;
  return db;
}

export async function getOrders() {
  const db = await getDB();
  try {
    const orders = await db.select<any[]>(`
      SELECT * FROM orders ORDER BY id DESC
    `);
    return orders || [];
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
}

export async function deleteOrder(id: number) {
  const db = await getDB();
  try {
    const result = await db.execute(
      `DELETE FROM orders WHERE id = ?`,
      [id]
    );
    
    if (!result || result.rowsAffected === 0) {
      throw new Error(`Order with id ${id} not found`);
    }
  } catch (error) {
    console.error("Error deleting order:", error);
    throw error;
  }
}