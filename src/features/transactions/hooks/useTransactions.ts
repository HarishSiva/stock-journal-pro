import { useEffect, useMemo, useState } from "react";
import type { Transaction } from "../types/transaction";

const STORAGE_KEY = "stock-journal-transactions";

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    if (typeof window === "undefined") {
      return [];
    }

    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as Transaction[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    }
  }, [transactions]);

  const addTransaction = (values: Omit<Transaction, "id">) => {
    const next: Transaction = {
      ...values,
      id: createId(),
    };

    setTransactions((current) => [next, ...current]);
    return next;
  };

  const updateTransaction = (id: string, values: Partial<Transaction>) => {
    setTransactions((current) => current.map((tx) => (tx.id === id ? { ...tx, ...values } : tx)));
  };

  const removeTransaction = (id: string) => {
    setTransactions((current) => current.filter((tx) => tx.id !== id));
  };

  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, tx) => {
        acc.totalAmount += tx.amount;
        acc.totalBrokerage += tx.brokerage;
        acc.totalStt += tx.stt;
        acc.totalStampDuty += tx.stampDuty;
        acc.totalSebiCharges += tx.sebiCharges;
        acc.totalGst += tx.gst;
        acc.totalOtherCharges += tx.otherCharges;
        return acc;
      },
      {
        totalAmount: 0,
        totalBrokerage: 0,
        totalStt: 0,
        totalStampDuty: 0,
        totalSebiCharges: 0,
        totalGst: 0,
        totalOtherCharges: 0,
      },
    );
  }, [transactions]);

  return {
    transactions,
    addTransaction,
    updateTransaction,
    removeTransaction,
    totals,
  };
}
