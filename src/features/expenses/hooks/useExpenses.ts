import { useEffect, useMemo, useState } from "react";
import type { Expense, ExpenseCategory, ExpenseType } from "../types/expense";

const STORAGE_KEY = "stock-journal-expenses";

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeHeaderKey(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function getFieldValue(row: Record<string, string>, aliases: string[]) {
  for (const alias of aliases) {
    const normalized = normalizeHeaderKey(alias);
    if (normalized in row && row[normalized] !== "") {
      return row[normalized];
    }
  }

  return "";
}

function parseCsvLine(line: string, delimiter = ","): string[] {
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

    if (char === delimiter && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  values.push(current);
  return values;
}

function detectDelimiter(sampleLine: string): string {
  // Try common single-character delimiters and pick the one that yields multiple columns
  const candidates = [",", "\t", ";", "|"];
  for (const d of candidates) {
    const parts = parseCsvLine(sampleLine, d);
    if (parts.length > 1) return d;
  }
  // Fallback to comma
  return ",";
}

function isRowStart(line: string): boolean {
  return /^\s*(date|\d{1,2}\/\d{1,2}\/\d{2,4})/i.test(line.trim());
}

function normalizeCsvLines(rawCsv: string): string[] {
  const physicalLines = rawCsv.split(/\r?\n/);
  const combined: string[] = [];
  let currentLine = "";

  for (const rawLine of physicalLines) {
    const trimmedLine = rawLine.trim();
    if (!trimmedLine) {
      continue;
    }

    if (currentLine === "") {
      currentLine = trimmedLine;
      continue;
    }

    if (isRowStart(trimmedLine)) {
      combined.push(currentLine);
      currentLine = trimmedLine;
    } else {
      currentLine += " " + trimmedLine;
    }
  }

  if (currentLine !== "") {
    combined.push(currentLine);
  }

  return combined;
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
      return { imported: [], skipped: 0, errors: ["CSV contains no data rows."] };
    }

    const delimiter = detectDelimiter(lines[0]);
    const headers = parseCsvLine(lines[0], delimiter).map((value) => normalizeHeaderKey(value));
    const imported: Omit<Expense, "id">[] = [];
    let skipped = 0;
    const errors: string[] = [];

    const dataLines = lines.slice(1);
    const rows: string[] = [];
    let pending = "";

    for (let i = 0; i < dataLines.length; i += 1) {
      const line = dataLines[i];
      const candidate = pending ? `${pending} ${line}` : line;
      const values = parseCsvLine(candidate, delimiter);

      if (values.length >= headers.length) {
        rows.push(candidate);
        pending = "";
        continue;
      }

      pending = candidate;
    }

    if (pending) {
      rows.push(pending);
    }

    for (let i = 0; i < rows.length; i += 1) {
      const values = parseCsvLine(rows[i], delimiter);
      const row: Record<string, string> = {};

      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() ?? "";
      });

        const debitAmount = parseAmountValue(
        getFieldValue(row, [
          "debitamount",
          "debit",
          "withdrawal",
          "withdrawalamt",
          "withdrawalamount",
          "withdrwalamt",
        ]),
      );
      const creditAmount = parseAmountValue(
        getFieldValue(row, [
          "creditamount",
          "credit",
          "deposit",
          "income",
          "depositamt",
          "depositamount",
          "creditamt",
        ]),
      );
      const genericAmount = parseAmountValue(
        getFieldValue(row, [
          "amount",
          "transactionamount",
          "totalamount",
          "value",
          "amt",
        ]),
      );
      const rawType = getFieldValue(row, [
        "type",
        "transactiontype",
        "transaction_type",
        "transtype",
        "txntype",
        "nature",
        "transaction nature",
      ]);

      let amount = Number.NaN;
      let type: ExpenseType = "expense";

      const hasDebit = Number.isFinite(debitAmount) && debitAmount !== 0;
      const hasCredit = Number.isFinite(creditAmount) && creditAmount !== 0;

      if (hasDebit && !hasCredit) {
        amount = debitAmount;
        type = "expense";
      } else if (hasCredit && !hasDebit) {
        amount = creditAmount;
        type = "income";
      } else if (hasDebit && hasCredit) {
        if (Math.abs(debitAmount) >= Math.abs(creditAmount)) {
          amount = debitAmount;
          type = "expense";
        } else {
          amount = creditAmount;
          type = "income";
        }
      } else if (Number.isFinite(genericAmount) && genericAmount !== 0) {
        amount = genericAmount;
        type = inferType(genericAmount, rawType);
      }

      if (!Number.isFinite(amount) || amount === 0) {
        skipped += 1;
        errors.push(`Row ${i + 1}: missing or invalid amount.`);
        continue;
      }

      const normalizedAmount = Math.abs(amount);
      const merchant = getFieldValue(row, [
        "merchant",
        "description",
        "details",
        "narration",
        "payee",
        "particulars",
        "remarks",
        "transactiondescription",
      ]) || "Unknown";
      const inferredCategory = inferCategoryFromText(merchant);
      const category = type === "income" && inferredCategory === "Uncategorized" ? "Income" : inferredCategory;
      const dateValue = getFieldValue(row, [
        "date",
        "valuedate",
        "valuedat",
        "value date",
        "value dat",
        "transactiondate",
        "postingdate",
      ]) || new Date().toISOString().slice(0, 10);

      imported.push({
        amount: normalizedAmount,
        type,
        category,
        paymentMethod: getFieldValue(row, ["paymentmethod", "mode", "channel", "transactionmode"]) || "Unknown",
        account: getFieldValue(row, ["account", "bankaccount", "accountnumber", "a/c number"]) || "Main",
        merchant,
        notes: getFieldValue(row, ["notes", "remarks", "narration", "description"]) || "Imported from bank statement",
        date: dateValue,
        receiptImage: getFieldValue(row, ["receiptimage", "receiptimageurl", "image"]) || undefined,
      });
    }

    imported.forEach((item) => addExpense(item));
    return { imported, skipped, errors };
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
