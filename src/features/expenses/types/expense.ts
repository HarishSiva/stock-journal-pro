export const expenseCategories = [
  "Grocery",
  "Fuel",
  "Food",
  "Shopping",
  "Medical",
  "Education",
  "Entertainment",
  "EMI",
  "Rent",
  "Utilities",
  "Travel",
  "Investment",
  "Insurance",
  "Uncategorized",
] as const;

export type ExpenseCategory = (typeof expenseCategories)[number];
export type ExpenseType = "expense" | "income";

export interface Expense {
  id: string;
  amount: number;
  type: ExpenseType;
  category: ExpenseCategory;
  paymentMethod: string;
  account: string;
  merchant: string;
  notes: string;
  date: string;
  receiptImage?: string;
}
