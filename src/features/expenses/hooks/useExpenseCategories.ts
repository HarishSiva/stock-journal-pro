import { useEffect, useState } from "react";
import { expenseCategories } from "../types/expense";

const STORAGE_KEY = "stock-journal-expense-categories";

export function useExpenseCategories() {
  const [categories, setCategories] = useState<string[]>(() => {
    if (typeof window === "undefined") {
      return expenseCategories;
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      const stored = raw ? (JSON.parse(raw) as string[]) : [];
      const merged = Array.from(new Set([...expenseCategories, ...(Array.isArray(stored) ? stored : [])]));
      return merged.length > 0 ? merged : expenseCategories;
    } catch {
      return expenseCategories;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const customCategories = categories.filter((category) => !expenseCategories.includes(category));
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(customCategories));
  }, [categories]);

  const addCategory = (category: string) => {
    setCategories((current) => {
      const normalized = category.trim();
      if (!normalized || current.some((item) => item.toLowerCase() === normalized.toLowerCase())) {
        return current;
      }

      return [...current, normalized];
    });
  };

  const removeCategory = (category: string) => {
    if (expenseCategories.includes(category)) {
      return;
    }

    setCategories((current) => current.filter((item) => item !== category));
  };

  return {
    categories,
    defaultCategories: expenseCategories,
    customCategories: categories.filter((category) => !expenseCategories.includes(category)),
    addCategory,
    removeCategory,
  };
}
