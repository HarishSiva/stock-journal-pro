import { useMemo } from "react";
import { useExpenses } from "../hooks/useExpenses";
import { expenseCategories } from "../types/expense";

export function ExpenseReportsPage() {
  const { expenses, totals } = useExpenses();

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);

  const insights = useMemo(() => {
    const expenseItems = expenses.filter((expense) => expense.type === "expense");
    const incomeItems = expenses.filter((expense) => expense.type === "income");

    const categoryTotals = expenseCategories
      .map((category) => ({
        category,
        amount: expenseItems.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0),
      }))
      .filter((item) => item.amount > 0)
      .sort((a, b) => b.amount - a.amount);

    const merchantTotals = Array.from(new Map(expenseItems.map((expense) => [expense.merchant, [] as typeof expenseItems])).entries())
      .map(([merchant, entries]) => ({ merchant, amount: entries.reduce((sum, expense) => sum + expense.amount, 0), count: entries.length }))
      .sort((a, b) => b.amount - a.amount);

    const topCategory = categoryTotals[0];
    const totalExpenses = expenseItems.reduce((sum, expense) => sum + expense.amount, 0);
    const totalIncome = incomeItems.reduce((sum, expense) => sum + expense.amount, 0);
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    const recommendations: string[] = [];

    if (topCategory && topCategory.amount > totalExpenses * 0.2) {
      recommendations.push(`Your biggest expense cluster is ${topCategory.category} at ${formatCurrency(topCategory.amount)}. Try cutting this by 10–15% to save around ${formatCurrency(topCategory.amount * 0.12)}.`);
    }

    if (savingsRate < 20) {
      recommendations.push(`Your savings rate is ${savingsRate.toFixed(0)}%. Aim to save at least 20% of income, which is about ${formatCurrency(Math.max(0, totalIncome * 0.2 - savings))} more.`);
    }

    if (savings > 0) {
      recommendations.push(`You have ${formatCurrency(savings)} available for investing. Consider parking it in an emergency fund or a SIP to build long-term wealth.`);
    }

    const recurringExpense = categoryTotals.find((item) => item.category === "EMI" || item.category === "Rent" || item.category === "Utilities");
    if (recurringExpense && recurringExpense.amount > 0) {
      recommendations.push(`Recurring costs in ${recurringExpense.category} are ${formatCurrency(recurringExpense.amount)}. Review subscription renewals or negotiate better rates to lower fixed monthly spend.`);
    }

    if (totalExpenses > 0) {
      recommendations.push(`You are spending ${formatCurrency(totalExpenses)} across ${expenseItems.length} expense entries. Consolidating repeat purchases and setting a monthly cap can reduce waste quickly.`);
    }

    return {
      totalExpenses,
      totalIncome,
      savings,
      savingsRate,
      categoryTotals,
      merchantTotals,
      recommendations,
    };
  }, [expenses, formatCurrency]);

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ margin: 0 }}>Savings Insights</h1>
      <p style={{ color: "#6b7280" }}>Use your bank statement patterns to reduce unnecessary spending and improve savings.</p>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <div style={{ padding: 16, borderRadius: 12, background: "white", border: "1px solid #e5e7eb" }}>
          <div style={{ color: "#6b7280", fontSize: 13 }}>Total Income</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{formatCurrency(insights.totalIncome)}</div>
        </div>
        <div style={{ padding: 16, borderRadius: 12, background: "white", border: "1px solid #e5e7eb" }}>
          <div style={{ color: "#6b7280", fontSize: 13 }}>Total Expense</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{formatCurrency(insights.totalExpenses)}</div>
        </div>
        <div style={{ padding: 16, borderRadius: 12, background: "white", border: "1px solid #e5e7eb" }}>
          <div style={{ color: "#6b7280", fontSize: 13 }}>Savings</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{formatCurrency(insights.savings)}</div>
        </div>
        <div style={{ padding: 16, borderRadius: 12, background: "white", border: "1px solid #e5e7eb" }}>
          <div style={{ color: "#6b7280", fontSize: 13 }}>Savings Rate</div>
          <div style={{ marginTop: 6, fontSize: 24, fontWeight: 700 }}>{insights.savingsRate.toFixed(1)}%</div>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        <div style={{ padding: 16, borderRadius: 12, background: "white", border: "1px solid #e5e7eb" }}>
          <h3 style={{ marginTop: 0 }}>Top Spending Categories</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {insights.categoryTotals.slice(0, 5).map((item) => (
              <div key={item.category} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{item.category}</span>
                <strong>{formatCurrency(item.amount)}</strong>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: 16, borderRadius: 12, background: "white", border: "1px solid #e5e7eb" }}>
          <h3 style={{ marginTop: 0 }}>High-Value Merchants</h3>
          <div style={{ display: "grid", gap: 10 }}>
            {insights.merchantTotals.slice(0, 5).map((item) => (
              <div key={item.merchant} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{item.merchant}</span>
                <strong>{formatCurrency(item.amount)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "white", border: "1px solid #e5e7eb" }}>
        <h3 style={{ marginTop: 0 }}>Actionable Savings Ideas</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {insights.recommendations.map((line, index) => (
            <div key={index} style={{ padding: 12, borderRadius: 10, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
              {line}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
