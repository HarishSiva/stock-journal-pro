import { useEffect, useState } from "react";
import type { Expense } from "../types/expense";
import { SavingsDashboard } from "../components/SavingsDashboard";

const STORAGE_KEY = "stock-journal-expenses";

export function SavingsDashboardPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadExpenses = async () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setExpenses(JSON.parse(stored));
        }
      } catch (error) {
        console.error("Failed to load expenses:", error);
      } finally {
        setLoading(false);
      }
    };

    loadExpenses();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center", color: "#6b7280" }}>
        Loading savings data...
      </div>
    );
  }

  if (expenses.length === 0) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ margin: 0, marginBottom: 8 }}>Savings Analysis</h1>
        <p style={{ margin: 0, color: "#6b7280", marginBottom: 24 }}>
          Track your income and expenses to see your savings breakdown.
        </p>
        <div
          style={{
            background: "#f3f4f6",
            borderRadius: 12,
            padding: 40,
            textAlign: "center",
            color: "#6b7280",
          }}
        >
          No expense or income data yet. Start by adding entries in the Expenses tracker.
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: 24, maxWidth: 1400, margin: "0 auto" }}>
      <div>
        <h1 style={{ margin: 0, marginBottom: 8 }}>Savings Analysis</h1>
        <p style={{ margin: 0, color: "#6b7280", marginBottom: 24 }}>
          Visual breakdown of your income, expenses, and savings potential.
        </p>
      </div>

      <SavingsDashboard expenses={expenses} />
    </div>
  );
}
