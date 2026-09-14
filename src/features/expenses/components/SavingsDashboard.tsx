import type { Expense } from "../types/expense";
import { getExpenseGroup } from "../utils/expenseGroups";

interface SavingsDashboardProps {
  expenses: Expense[];
}

const categoryColors = [
  "#2563eb",
  "#16a34a",
  "#f59e0b",
  "#dc2626",
  "#9333ea",
  "#0891b2",
];

export function SavingsDashboard({
  expenses,
}: SavingsDashboardProps) {
  const incomeItems = expenses.filter(
    (expense) => getExpenseGroup(expense) === "Income"
  );

  const expenseItems = expenses.filter(
    (expense) => getExpenseGroup(expense) === "Expense"
  );

  const savingsItems = expenses.filter(
    (expense) => getExpenseGroup(expense) === "Savings"
  );

  const investmentItems = expenses.filter(
    (expense) => getExpenseGroup(expense) === "Investments"
  );

  // Self Transfer items are intentionally excluded.
  const totalIncome = incomeItems.reduce(
    (sum, expense) => sum + Math.abs(expense.amount),
    0
  );

  const totalExpenses = expenseItems.reduce(
    (sum, expense) => sum + Math.abs(expense.amount),
    0
  );

  const totalSavings = savingsItems.reduce(
    (sum, expense) => sum + Math.abs(expense.amount),
    0
  );

  const totalInvestments = investmentItems.reduce(
    (sum, expense) => sum + Math.abs(expense.amount),
    0
  );

  // Net savings is calculated from Income and Expense groups only.
  const netSavings = totalIncome - totalExpenses;

  const savingsPercentage =
    totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  const expensePercentage =
    totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

  const expenseByCategory = expenseItems
    .reduce(
      (items, expense) => {
        const existing = items.find(
          (item) => item.category === expense.category
        );

        if (existing) {
          existing.amount += Math.abs(expense.amount);
        } else {
          items.push({
            category: expense.category,
            amount: Math.abs(expense.amount),
          });
        }

        return items;
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

  const expenseBarWidth = Math.min(
    Math.max(expensePercentage, 0),
    100
  );

  const savingsBarWidth = Math.min(
    Math.max(savingsPercentage, 0),
    100
  );

  const summaryCards = [
    {
      label: "TOTAL INCOME",
      amount: totalIncome,
      count: incomeItems.length,
      color: "#16a34a",
      background: "#f0fdf4",
    },
    {
      label: "TOTAL EXPENSES",
      amount: totalExpenses,
      count: expenseItems.length,
      color: "#dc2626",
      background: "#fef2f2",
    },
    {
      label: "TOTAL SAVINGS",
      amount: totalSavings,
      count: savingsItems.length,
      color: "#2563eb",
      background: "#eff6ff",
    },
    {
      label: "TOTAL INVESTMENTS",
      amount: totalInvestments,
      count: investmentItems.length,
      color: "#9333ea",
      background: "#faf5ff",
    },
    {
      label: "NET SAVINGS",
      amount: netSavings,
      count: null,
      color: netSavingsColor,
      background: netSavings >= 0 ? "#f0fdf4" : "#fef2f2",
    },
  ];

  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(240px, 1fr))",
          gap: 16,
        }}
      >
        {summaryCards.map((card) => (
          <div
            key={card.label}
            style={{
              background: card.background,
              border: `2px solid ${card.color}`,
              borderRadius: 12,
              padding: 20,
            }}
          >
            <div
              style={{
                fontSize: 13,
                color: card.color,
                fontWeight: 600,
                marginBottom: 8,
              }}
            >
              {card.label}
            </div>

            <div
              style={{
                fontSize: 30,
                fontWeight: 700,
                color: card.color,
                marginBottom: 4,
              }}
            >
              {formatCurrency(card.amount)}
            </div>

            {card.count !== null && (
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {card.count} {card.label
                  .toLowerCase()
                  .replace("total ", "")}{" "}
                entries
              </div>
            )}

            {card.label === "NET SAVINGS" && (
              <div style={{ fontSize: 12, color: "#6b7280" }}>
                {savingsPercentage.toFixed(1)}% of income
              </div>
            )}
          </div>
        ))}
      </div>

      <div
        style={{
          background: "white",
          border: "1px solid #e5e7eb",
          borderRadius: 12,
          padding: 20,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 600,
            marginBottom: 16,
            color: "#111827",
          }}
        >
          Savings Rate
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: 8,
            fontSize: 13,
          }}
        >
          <span style={{ color: "#6b7280" }}>
            Expenses vs Income
          </span>

          <span
            style={{
              fontWeight: 600,
              color: netSavingsColor,
            }}
          >
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
              width: `${expenseBarWidth}%`,
              transition: "width 0.3s ease",
            }}
          />

          <div
            style={{
              height: "100%",
              background: "#16a34a",
              width: `${savingsBarWidth}%`,
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
          <span>
            Expenses: {expensePercentage.toFixed(1)}%
          </span>

          <span>
            Savings: {savingsPercentage.toFixed(1)}%
          </span>
        </div>
      </div>

      {expenseByCategory.length > 0 && (
        <div
          style={{
            background: "white",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 20,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 16,
              color: "#111827",
            }}
          >
            Expense Breakdown by Category
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            {expenseByCategory.map((item, index) => {
              const percentage =
                totalExpenses > 0
                  ? (item.amount / totalExpenses) * 100
                  : 0;

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
                    <span style={{ fontWeight: 500 }}>
                      {item.category}
                    </span>

                    <span style={{ fontWeight: 600 }}>
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
                        background:
                          categoryColors[
                            index % categoryColors.length
                          ],
                        width: `${percentage}%`,
                      }}
                    />
                  </div>

                  <div
                    style={{
                      fontSize: 11,
                      color: "#6b7280",
                      marginTop: 2,
                    }}
                  >
                    {percentage.toFixed(1)}% of expenses
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}