import { createContext } from "react";
import type { Order } from "../types/order";

export type OrdersContextType = {
  orders: Order[];
  loading: boolean;
  refresh: () => Promise<void>;
  addOrder: (order: Order) => Promise<void>;
  deleteOrder: (id: string) => Promise<void>;
};

export const OrdersContext =
  createContext<OrdersContextType | undefined>(undefined);