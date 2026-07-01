import { useEffect, useRef, useState } from "react";

import { useOrders } from "@/features/orders/hooks/useOrders";
import { useTransactions } from "@/features/transactions/hooks/useTransactions";
import {
  calculateHoldingsBase,
  calculateHoldingsWithPrices,
  type Holding,
} from "../utils/portfolioEngine";

export function usePortfolio() {
  const { orders, loading: ordersLoading } = useOrders();
  const { transactions } = useTransactions();
  const [holdings, setHoldings] = useState<Holding[]>([]);
  const [loading, setLoading] = useState(true);
  const [manualPrices, setManualPrices] = useState<Record<string, { price: number; lastUpdated: string }>>(() => {
    if (typeof window === "undefined") {
      return {};
    }

    try {
      return JSON.parse(window.localStorage.getItem("portfolio-manual-prices") || "{}") as Record<string, { price: number; lastUpdated: string }>;
    } catch {
      return {};
    }
  });
  const hasLoadedRef = useRef(false);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    const requestVersion = requestVersionRef.current + 1;
    requestVersionRef.current = requestVersion;
    let isMounted = true;

    const baseHoldings = calculateHoldingsBase(orders);

    if (isMounted && requestVersion === requestVersionRef.current) {
      setHoldings(baseHoldings);
    }

    const loadHoldings = async () => {
      if (!hasLoadedRef.current) {
        setLoading(true);
      }

      try {
        const nextHoldings = await calculateHoldingsWithPrices(orders, manualPrices, transactions);

        if (isMounted && requestVersion === requestVersionRef.current) {
          setHoldings(nextHoldings);
        }
      } catch (error) {
        console.error("Failed to calculate portfolio holdings", error);

        if (isMounted && requestVersion === requestVersionRef.current) {
          setHoldings(baseHoldings);
        }
      } finally {
        if (isMounted && requestVersion === requestVersionRef.current) {
          setLoading(false);
          hasLoadedRef.current = true;
        }
      }
    };

    void loadHoldings();

    return () => {
      isMounted = false;
    };
  }, [orders, manualPrices, transactions]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem("portfolio-manual-prices", JSON.stringify(manualPrices));
    }
  }, [manualPrices]);

  return {
    holdings,
    loading: ordersLoading || loading,
    manualPrices,
    setManualPrices,
  };
}