import type { ExpenseGroup } from "../utils/expenseGroups";

export type ExpenseType = "expense" | "income";

export type ExpenseCategory =
  | "Food"
  | "Fuel"
  | "Grocery"
  | "Shopping"
  | "Medical"
  | "Education"
  | "Rent"
  | "EMI"
  | "Utilities"
  | "Savings"
  | "Investment"
  | "Income"
  | "Self Transfer"
  | "Uncategorized";

export const expenseCategories: ExpenseCategory[] = [
  "Food",
  "Fuel",
  "Grocery",
  "Shopping",
  "Medical",
  "Education",
  "Rent",
  "EMI",
  "Utilities",
  "Savings",
  "Investment",
  "Income",
  "Self Transfer",
  "Uncategorized",
];

export interface Expense {
  id: string;
  amount: number;
  type: ExpenseType;
  category: ExpenseCategory;
  group?: ExpenseGroup;
  paymentMethod: string;
  account: string;
  merchant: string;
  notes: string;
  date: string;
  receiptImage?: string;
}