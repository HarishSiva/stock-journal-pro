import { useEffect, useMemo, useState } from "react";
import type { Expense, ExpenseCategory, ExpenseType } from "../types/expense";

const STORAGE_KEY = "stock-journal-expenses";

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeHeaderKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function parseCsvLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function parseAmountValue(rawValue: string): number {
  const normalized = rawValue.trim().replace(/^[(]/, "-").replace(/[)]$/, "");
  const cleaned = normalized.replace(/[$₹,\s]/g, "");

  if (cleaned === "") {
    return Number.NaN;
  }

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

function inferCategoryFromText(description: string): ExpenseCategory {
  const text = description.toLowerCase();

  if (/(swiggy|zomato|restaurant|food|cafe|coffee|dining)/.test(text)) return "Food";
  if (/(fuel|petrol|diesel|gas|hpcl|bpcl)/.test(text)) return "Fuel";
  if (/(grocery|mart|supermarket|dmart|bigbasket|reliance|grocer)/.test(text)) return "Grocery";
  if (/(shopping|amazon|flipkart|mall|clothing|electronics)/.test(text)) return "Shopping";
  if (/(medical|hospital|clinic|pharmacy|doctor)/.test(text)) return "Medical";
  if (/(education|course|fees|school|college|tuition)/.test(text)) return "Education";
  if (/(rent|house|flat)/.test(text)) return "Rent";
  if (/(emi|loan|installment)/.test(text)) return "EMI";
  if (/(salary|credit|refund|bonus|interest|income|deposit|cashback)/.test(text)) return "Investment";

  return "Uncategorized";
}

function inferType(amount: number, rawType?: string): ExpenseType {
  const normalized = rawType?.toLowerCase() ?? "";
  if (normalized.includes("credit") || normalized.includes("income") || normalized.includes("deposit") || normalized.includes("salary")) {
    return "income";
  }

  if (normalized.includes("debit") || normalized.includes("expense") || normalized.includes("withdrawal")) {
    return "expense";
  }

  return amount < 0 ? "expense" : "income";
}

export function useExpenses() {
  const [expenses, setExpenses] = useState<Expense[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Expense[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
    }
  }, [expenses]);

  const addExpense = (values: Omit<Expense, "id">) => {
    const next: Expense = { ...values, id: createId() };
    setExpenses((current) => [next, ...current]);
    return next;
  };

  const importExpensesFromCsv = (csv: string) => {
    const lines = csv
      .trim()
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !/^\*+$/.test(line) && !/^-{3,}$/.test(line));

    if (lines.length < 2) {
      return [];
    }

    const headers = parseCsvLine(lines[0]).map((value) => normalizeHeaderKey(value));
    const imported: Omit<Expense, "id">[] = [];

    for (let i = 1; i < lines.length; i += 1) {
      const values = parseCsvLine(lines[i]);
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() ?? "";
      });

      const debitAmount = parseAmountValue(
        row.debitamount ?? row.debit ?? row.withdrawal ?? row.withdrawalamt ?? row.withdrawalamount ?? row.withdrwalamt ?? "",
      );
      const creditAmount = parseAmountValue(
        row.creditamount ?? row.credit ?? row.deposit ?? row.income ?? row.depositamt ?? row.depositamount ?? row.creditamt ?? "",
      );
      const genericAmount = parseAmountValue(row.amount ?? row.transactionamount ?? row.totalamount ?? row.value ?? row.amt ?? "");
      const rawType = row.type ?? row.transactiontype ?? row.transaction_type ?? row.transtype ?? row.txntype ?? "";

      let amount = Number.NaN;
      let type: ExpenseType = "expense";

      if (Number.isFinite(creditAmount) && !Number.isFinite(debitAmount)) {
        amount = creditAmount;
        type = "income";
      } else if (Number.isFinite(debitAmount) && !Number.isFinite(creditAmount)) {
        amount = debitAmount;
        type = "expense";
      } else if (Number.isFinite(genericAmount)) {
        amount = genericAmount;
        type = inferType(genericAmount, rawType);
      }

      if (!Number.isFinite(amount) || amount === 0) {
        continue;
      }

      const normalizedAmount = Math.abs(amount);
      const merchant = row.merchant ?? row.description ?? row.narration ?? row.payee ?? row.particulars ?? "Unknown";

      imported.push({
        amount: normalizedAmount,
        type,
        category: inferCategoryFromText(merchant),
        paymentMethod: row.paymentmethod ?? row.mode ?? row.channel ?? "Unknown",
        account: row.account ?? row.bankaccount ?? row.accountnumber ?? "Main",
        merchant,
        notes: row.notes ?? row.remarks ?? "Imported from bank statement",
        date: row.date ?? row.transactiondate ?? row.valueDate ?? new Date().toISOString().slice(0, 10),
        receiptImage: row.receiptimage ?? undefined,
      });
    }

    imported.forEach((item) => addExpense(item));
    return imported;
  };

  const updateExpense = (id: string, values: Partial<Expense>) => {
    setExpenses((current) => current.map((expense) => (expense.id === id ? { ...expense, ...values } : expense)));
  };

  const bulkUpdateCategory = (ids: string[], category: ExpenseCategory) => {
    setExpenses((current) => current.map((expense) => (ids.includes(expense.id) ? { ...expense, category } : expense)));
  };

  const removeExpense = (id: string) => {
    setExpenses((current) => current.filter((expense) => expense.id !== id));
  };

  const removeAllExpenses = () => {
    setExpenses([]);
  };

  const totals = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);

    const currentMonthExpenses = expenses.filter((expense) => expense.type === "expense" && new Date(expense.date) >= monthStart);
    const currentMonthIncome = expenses.filter((expense) => expense.type === "income" && new Date(expense.date) >= monthStart);

    return {
      totalExpenses: expenses.filter((expense) => expense.type === "expense").reduce((sum, expense) => sum + expense.amount, 0),
      totalIncome: expenses.filter((expense) => expense.type === "income").reduce((sum, expense) => sum + expense.amount, 0),
      currentMonthExpenses: currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      currentMonthIncome: currentMonthIncome.reduce((sum, expense) => sum + expense.amount, 0),
      currentMonthSavings: currentMonthIncome.reduce((sum, expense) => sum + expense.amount, 0) - currentMonthExpenses.reduce((sum, expense) => sum + expense.amount, 0),
      count: expenses.length,
    };
  }, [expenses]);

  return { expenses, addExpense, importExpensesFromCsv, updateExpense, bulkUpdateCategory, removeExpense, removeAllExpenses, totals };
}
