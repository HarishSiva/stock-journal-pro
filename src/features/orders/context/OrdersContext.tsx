import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { Order } from "../types/order";

import {
  initOrdersTable,
  getOrdersDB,
  addOrderDB,
  deleteOrderDB,
} from "../store/ordersRepo";
import { OrdersContext } from "./orders-context";
type Props = {
  children: ReactNode;
};

export function OrdersProvider({ children }: Props) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);

      await initOrdersTable();

      const data = await getOrdersDB();

      setOrders(data);
    } catch (err) {
      console.error("Failed to load orders", err);
    } finally {
      setLoading(false);
    }
  }, []);

 useEffect(() => {
  const load = async () => {
    await refresh();
  };

  void load();
}, [refresh]);
  const addOrder = useCallback(
    async (order: Order) => {
      try {
        await addOrderDB(order);

        // reload from DB
        const data = await getOrdersDB();
        setOrders(data);
      } catch (err) {
        console.error("Failed to add order", err);
      }
    },
    []
  );

  const deleteOrder = useCallback(
    async (id: string) => {
      try {
        await deleteOrderDB(id);

        // reload from DB
        const data = await getOrdersDB();
        setOrders(data);
      } catch (err) {
        console.error("Failed to delete order", err);
      }
    },
    []
  );

  const value = useMemo(
    () => ({
      orders,
      loading,
      refresh,
      addOrder,
      deleteOrder,
    }),
    [orders, loading, refresh, addOrder, deleteOrder]
  );

  return (
    <OrdersContext.Provider value={value}>
      {children}
    </OrdersContext.Provider>
  );
}