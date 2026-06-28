import { useEffect, useState } from "react";
import type { Order } from "../types/order";
import {
  addOrderDB,
  deleteOrderDB,
  getOrdersDB,
  initOrdersTable,
} from "./ordersRepo";

export function useOrdersStore() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadOrders() {
      try {
        setLoading(true);

        await initOrdersTable();

        const data = await getOrdersDB();

        setOrders(data as Order[]);
      } catch (err) {
        console.error("Failed to load orders:", err);
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  async function addOrder(order: Order) {
    try {
      console.log("addOrder called");
      setLoading(true);

      await addOrderDB(order);

      const data = await getOrdersDB();

      setOrders(data as Order[]);
    } catch (err) {
      console.error("Failed to save order:", err);
    } finally {
      setLoading(false);
    }
  }

  async function deleteOrder(id: string) {
    try {
      setLoading(true);

      await deleteOrderDB(id);

      const data = await getOrdersDB();

      setOrders(data as Order[]);
    } catch (err) {
      console.error("Failed to delete order:", err);
    } finally {
      setLoading(false);
    }
  }

  return {
    orders,
    addOrder,
    deleteOrder,
    loading,
  };
}