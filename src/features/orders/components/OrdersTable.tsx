import type { CSSProperties } from "react";
import type { Order } from "../types/order";

type Props = {
  orders: Order[];
  loading: boolean;
  onDelete: (id: string) => void | Promise<void>;
};

export function OrdersTable({
  orders,
  loading,
  onDelete,
}: Props) {
  if (orders.length === 0) {
    return (
      <p style={emptyState}>
        No orders yet. Add your first trade.
      </p>
    );
  }

  return (
    <div style={tableWrapper}>
      <table style={table}>
        <thead>
          <tr style={headerRow}>
            <th style={th}>Symbol</th>
            <th style={th}>Side</th>
            <th style={th}>Qty</th>
            <th style={th}>Price</th>
            <th style={th}>Broker</th>
            <th style={th}>Date</th>
            <th style={th}>Action</th>
          </tr>
        </thead>

        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td style={td}>{order.symbol}</td>

              <td
                style={{
                  ...td,
                  color:
                    order.side === "BUY"
                      ? "#16a34a"
                      : "#dc2626",
                  fontWeight: 600,
                }}
              >
                {order.side}
              </td>

              <td style={td}>{order.quantity}</td>

              <td style={td}>
                ₹ {order.price.toFixed(2)}
              </td>

              <td style={td}>{order.broker}</td>

              <td style={td}>{order.date}</td>

              <td style={td}>
                <button
                  disabled={loading}
                  onClick={() => onDelete(order.id)}
                  style={{
                    ...deleteBtn,
                    opacity: loading ? 0.5 : 1,
                    cursor: loading
                      ? "not-allowed"
                      : "pointer",
                  }}
                >
                  🗑 Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------- Styles ---------------- */

const emptyState: CSSProperties = {
  padding: 20,
  opacity: 0.6,
};

const tableWrapper: CSSProperties = {
  overflowX: "auto",
  border: "1px solid #e5e7eb",
  borderRadius: 8,
};

const table: CSSProperties = {
  width: "100%",
  borderCollapse: "collapse",
};

const headerRow: CSSProperties = {
  background: "#f8fafc",
};

const th: CSSProperties = {
  textAlign: "left",
  padding: "12px",
  borderBottom: "1px solid #e5e7eb",
  fontWeight: 600,
};

const td: CSSProperties = {
  padding: "12px",
  borderBottom: "1px solid #f1f5f9",
};

const deleteBtn: CSSProperties = {
  padding: "6px 12px",
  border: "none",
  borderRadius: 6,
  background: "#ef4444",
  color: "white",
  fontWeight: 500,
};