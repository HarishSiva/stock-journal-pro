import { useState } from "react";
import { OrderFormModal } from "../components/OrderFormModal";
import { OrdersDashboard } from "../components/OrdersDashBoard";
import { OrdersTable } from "../components/OrdersTable";
import { useOrders } from "../hooks/useOrders";
import type { Order } from "../types/order";

export function OrdersPage() {
  const { orders, addOrder, updateOrder } = useOrders();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  const handleOpenModal = () => {
    setEditingOrder(null);
    setIsModalOpen(true);
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingOrder(null);
  };

  return (
    <div
      style={{
        padding: 24,
        maxWidth: 1200,
        margin: "0 auto",
      }}
    >
      <div style={{ marginBottom: 20, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ margin: 0 }}>Orders</h1>
          <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
            Capture every buy and sell decision in one place.
          </p>
        </div>
        <button
          onClick={handleOpenModal}
          style={{
            padding: "10px 16px",
            background: "#2563eb",
            color: "white",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 500,
          }}
        >
          + Add Order
        </button>
      </div>

      <OrderFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={addOrder}
        editingOrder={editingOrder}
        onUpdate={updateOrder}
      />

      <div style={{ height: 20 }} />

      <OrdersDashboard orders={orders} />

      <div style={{ height: 20 }} />

      <OrdersTable onEditOrder={handleEditOrder} />
    </div>
  );
}