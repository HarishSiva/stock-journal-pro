import { OrderForm } from "../components/OrderForm";
import { OrdersDashboard } from "../components/OrdersDashBoard";
import { OrdersTable } from "../components/OrdersTable";
import { useOrders } from "../hooks/useOrders";

export function OrdersPage() {
  const { orders, addOrder } = useOrders();

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Orders</h1>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          Capture every buy and sell decision in one place.
        </p>
      </div>

      <OrderForm onSubmit={addOrder} />

      <div style={{ height: 20 }} />

      <OrdersDashboard orders={orders} />

      <div style={{ height: 20 }} />

      <OrdersTable />
    </div>
  );
}