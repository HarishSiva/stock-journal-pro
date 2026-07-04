import { Badge } from "@/shared/components/Badge";
import { useOrders } from "../hooks/useOrders";
import { useOrdersView } from "../hooks/useOrdersView";
import type { Order } from "../types/order";

type Filter = "ALL" | "BUY" | "SELL";

interface OrdersTableProps {
  onEditOrder?: (order: Order) => void;
}

export function OrdersTable({ onEditOrder }: OrdersTableProps) {
  const { deleteOrder } = useOrders();

  const {
    orders,
    filter,
    setFilter,
    search,
    setSearch,
    stats,
    loading,
  } = useOrdersView();

  if (loading) {
    return <div>Loading orders...</div>;
  }

  return (
    <div style={{ padding: 18, border: "1px solid #e5e7eb", borderRadius: 14, background: "white", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ margin: 0 }}>Orders</h2>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", color: "#6b7280", fontSize: 13 }}>
          <span>Orders: {stats.total}</span>
          <span>BUY: {stats.buyVolume.toFixed(2)}</span>
          <span>SELL: {stats.sellVolume.toFixed(2)}</span>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
        <input
          style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8, minWidth: 180 }}
          placeholder="Search symbol..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }}
          value={filter}
          onChange={(e) => setFilter(e.target.value as Filter)}
        >
          <option value="ALL">ALL</option>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
          }}
        >
          <thead>
            <tr style={{ background: "#f9fafb", textAlign: "left" }}>
              <th style={{ padding: "10px 8px" }}>Symbol</th>
              <th style={{ padding: "10px 8px" }}>Side</th>
              <th style={{ padding: "10px 8px" }}>Qty</th>
              <th style={{ padding: "10px 8px" }}>Price</th>
              <th style={{ padding: "10px 8px" }}>Broker</th>
              <th style={{ padding: "10px 8px" }}>Date</th>
              <th style={{ padding: "10px 8px" }}>Actions</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 8px", fontWeight: 600 }}>{order.symbol}</td>

                <td style={{ padding: "10px 8px" }}>
                  <Badge
                    label={order.side}
                    type={order.side === "BUY" ? "buy" : "sell"}
                  />
                </td>

                <td style={{ padding: "10px 8px" }}>{order.quantity}</td>
                <td style={{ padding: "10px 8px" }}>{order.price}</td>
                <td style={{ padding: "10px 8px" }}>{order.broker}</td>

                <td style={{ padding: "10px 8px" }}>
                  {order.date
                    ? new Date(order.date).toLocaleDateString()
                    : "-"}
                </td>

                <td style={{ padding: "10px 8px", display: "flex", gap: 8 }}>
                  <button
                    onClick={() => onEditOrder?.(order)}
                    style={{
                      color: "white",
                      background: "#2563eb",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void deleteOrder(order.id)}
                    style={{
                      color: "white",
                      background: "#d32f2f",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}

            {orders.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  style={{
                    textAlign: "center",
                    padding: 20,
                    color: "#6b7280",
                  }}
                >
                  No orders found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}