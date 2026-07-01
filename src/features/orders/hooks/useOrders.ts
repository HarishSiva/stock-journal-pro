import { useContext } from "react";
import { OrdersContext } from "../context/orders-context";

export function useOrders() {
  const context = useContext(OrdersContext);

  if (!context) {
    throw new Error("useOrders must be used inside OrdersProvider");
  }

  return context;
}