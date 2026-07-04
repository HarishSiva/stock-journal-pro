import type { Expense } from "../types/expense";

interface SavingsDashboardProps {
  expenses: Expense[];
}

export function SavingsDashboard({ expenses }: SavingsDashboardProps) {
  // Calculate totals
  const totalIncome = expenses
    .filter((e) => e.type === "income")
    .reduce((sum, e) => sum + e.amount, 0);

  const totalExpenses = expenses
    .filter((e) => e.type === "expense")
    .reduce((sum, e) => sum + e.amount, 0);

  const netSavings = totalIncome - totalExpenses;
  const savingsPercentage = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Expense breakdown by category
  const expenseByCategory = expenses
    .filter((e) => e.type === "expense")
    .reduce(
      (acc, e) => {
        const existing = acc.find((item) => item.category === e.category);
        if (existing) {
          existing.amount += e.amount;
        } else {
          acc.push({ category: e.category, amount: e.amount });
        }
        return acc;
      },
      [] as Array<{ category: string; amount: number }>
    )
    .sort((a, b) => b.amount - a.amount);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value);

  const netSavingsColor = netSavings >= 0 ? "#16a34a" : "#dc2626";
  const savingsPercentageColor = savingsPercentage >= 0 ? "#16a34a" : "#dc2626";

  return (
    <div style={{ display: "grid", gap: 24 }}>
      {/* Main Summary Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: 16,
        }}
      >
        {/* Total Income Card */}
        <div
          style={{
            background: "#f0fdf4",
            border: "2px solid #16a34a",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 13, color: "#16a34a", fontWeight: 600, marginBottom: 8 }}>
            TOTAL INCOME
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#16a34a", marginBottom: 4 }}>
            {formatCurrency(totalIncome)}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {expenses.filter((e) => e.type === "income").length} income entries
          </div>
        </div>

        {/* Total Expenses Card */}
        <div
          style={{
            background: "#fef2f2",
            border: "2px solid #dc2626",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 13, color: "#dc2626", fontWeight: 600, marginBottom: 8 }}>
            TOTAL EXPENSES
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>
            {formatCurrency(totalExpenses)}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {expenses.filter((e) => e.type === "expense").length} expense entries
          </div>
        </div>

        {/* Net Savings Card */}
        <div
          style={{
            background: netSavings >= 0 ? "#f0fdf4" : "#fef2f2",
            border: `2px solid ${netSavingsColor}`,
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 13, color: netSavingsColor, fontWeight: 600, marginBottom: 8 }}>
            NET SAVINGS
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: netSavingsColor, marginBottom: 4 }}>
            {formatCurrency(netSavings)}
          </div>
          <div style={{ fontSize: 12, color: "#6b7280" }}>
            {savingsPercentage.toFixed(1)}% of income
          </div>
        </div>
      </div>

      {/* Savings Rate Visualization */}
      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#111827" }}>
          Savings Rate
        </div>

        <div style={{ marginBottom: 12 }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginBottom: 8,
              fontSize: 13,
            }}
          >
            <span style={{ color: "#6b7280" }}>Expense vs Income</span>
            <span style={{ fontWeight: 600, color: savingsPercentageColor }}>
              {savingsPercentage.toFixed(1)}%
            </span>
          </div>
          <div
            style={{
              height: 24,
              background: "#e5e7eb",
              borderRadius: 12,
              overflow: "hidden",
              display: "flex",
            }}
          >
            <div
              style={{
                height: "100%",
                background: "#dc2626",
                width: `${Math.min(100 - savingsPercentage, 100)}%`,
                transition: "width 0.3s ease",
              }}
            />
            <div
              style={{
                height: "100%",
                background: "#16a34a",
                width: `${Math.max(savingsPercentage, 0)}%`,
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 8,
              fontSize: 12,
              color: "#6b7280",
            }}
          >
            <span>Expenses: {((100 - savingsPercentage).toFixed(1))}%</span>
            <span>Savings: {Math.max(savingsPercentage, 0).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Expense Breakdown */}
      {expenseByCategory.length > 0 && (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#111827" }}>
            Expense Breakdown by Category
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {expenseByCategory.map((item) => {
              const percentage = (item.amount / totalExpenses) * 100;
              return (
                <div key={item.category}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 6,
                      fontSize: 13,
                    }}
                  >
                    <span style={{ fontWeight: 500, color: "#111827" }}>{item.category}</span>
                    <span style={{ fontWeight: 600, color: "#111827" }}>
                      {formatCurrency(item.amount)}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 8,
                      background: "#e5e7eb",
                      borderRadius: 4,
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        height: "100%",
                        background: `hsl(${Math.random() * 360}, 70%, 50%)`,
                        width: `${percentage}%`,
                        transition: "width 0.3s ease",
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                    {percentage.toFixed(1)}% of expenses
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Top Spending Categories */}
      {expenseByCategory.length > 0 && (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, color: "#111827" }}>
            Top Spending Categories
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {expenseByCategory.slice(0, 5).map((item, index) => (
              <div
                key={item.category}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "12px",
                  background: "#f9fafb",
                  borderRadius: 8,
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: "50%",
                      background: `hsl(${(index * 60) % 360}, 70%, 60%)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: 700,
                      fontSize: 12,
                    }}
                  >
                    #{index + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, color: "#111827" }}>{item.category}</div>
                    <div style={{ fontSize: 12, color: "#6b7280" }}>
                      {((item.amount / totalExpenses) * 100).toFixed(1)}% of total
                    </div>
                  </div>
                </div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>
                  {formatCurrency(item.amount)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
