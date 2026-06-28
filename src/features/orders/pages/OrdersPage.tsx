import { OrderForm } from "../components/OrderForm";
import { OrdersDashboard } from "../components/OrdersDashBoard";
import { OrdersTable } from "../components/OrdersTable";
import { useOrdersStore } from "../store/ordersStore";

export function OrdersPage() {
  const {
    orders,
    addOrder,
    deleteOrder,
    loading,
  } = useOrdersStore();

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <h1>Stock Journal Pro</h1>

      <OrderForm onSubmit={addOrder} />

      <div style={{ height: 24 }} />

      <OrdersDashboard orders={orders} />

      <OrdersTable
        orders={orders}
        loading={loading}
        onDelete={deleteOrder}
      />
    </div>
  );
}