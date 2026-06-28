import { getDB } from "./sqlite";

export async function testDB() {
  try {
    const db = await getDB();

    await db.execute(`
      CREATE TABLE IF NOT EXISTS test (
        id TEXT PRIMARY KEY,
        name TEXT
      )
    `);

    await db.execute(
      "INSERT INTO test (id, name) VALUES (?, ?)",
      [crypto.randomUUID(), "Harish"]
    );

    const rows = await db.select("SELECT * FROM test");

    console.log("TEST TABLE:", rows);
  } catch (err) {
    console.error("TEST DB ERROR:", err);
  }
}