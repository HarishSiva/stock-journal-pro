import type { Expense } from "../types/expense";
import type { ExpenseGroup } from "../utils/expenseGroups";


function normalize(value?: string): string {
  return (value ?? "").trim().toLowerCase().replace(/[\s_-]/g, "");
}

export function getExpenseGroup(expense: Expense): ExpenseGroup {
  if (expense.group) {
    return expense.group;
  }

  const category = normalize(expense.category);

  if (category === "selftransfer") return "Self Transfer";
  if (category === "savings" || category === "saving") return "Savings";
  if (category === "investment" || category === "investments") {
    return "Investments";
  }
  if (category === "income" || expense.type === "income") {
    return "Income";
  }

  return "Expense";
}