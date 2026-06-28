import { useMemo, useState } from "react";
import { useOrders } from "../hooks/useOrders";

type Filter = "ALL" | "BUY" | "SELL";

export function useOrdersView() {
  const { orders, loading } = useOrders();

  const [filter, setFilter] = useState<Filter>("ALL");
  const [search, setSearch] = useState("");

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesFilter =
        filter === "ALL" || order.side === filter;

      const matchesSearch = order.symbol
        .toLowerCase()
        .includes(search.toLowerCase());

      return matchesFilter && matchesSearch;
    });
  }, [orders, filter, search]);

  const stats = useMemo(() => {
    const buyOrders = orders.filter((o) => o.side === "BUY");
    const sellOrders = orders.filter((o) => o.side === "SELL");

    return {
      total: orders.length,
      buyVolume: buyOrders.reduce(
        (sum, o) => sum + o.quantity * o.price,
        0
      ),
      sellVolume: sellOrders.reduce(
        (sum, o) => sum + o.quantity * o.price,
        0
      ),
    };
  }, [orders]);

  return {
    orders: filteredOrders,
    filter,
    setFilter,
    search,
    setSearch,
    stats,
    loading,
  };
}