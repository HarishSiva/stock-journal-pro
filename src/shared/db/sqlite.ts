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