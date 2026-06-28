import { OrdersProvider } from "@/features/orders/context/OrdersContext";
import { AppRouter } from "./router";

export default function App() {
  return (
    <OrdersProvider>
      <AppRouter />
    </OrdersProvider>
  );
}