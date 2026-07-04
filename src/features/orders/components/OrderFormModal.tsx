import { useState } from "react";
import { Modal } from "@/shared/ui/Modal/Modal";
import type { Order } from "../types/order";

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (order: Order) => Promise<void>;
  editingOrder?: Order | null;
  onUpdate?: (order: Order) => Promise<void>;
}

const initialState = {
  symbol: "",
  side: "BUY" as const,
  quantity: "",
  price: "",
  broker: "",
  date: "",
  investmentThesis: "",
  notes: "",
};

export function OrderFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingOrder,
  onUpdate,
}: OrderFormModalProps) {
  const [form, setForm] = useState(
    editingOrder
      ? {
          symbol: editingOrder.symbol,
          side: editingOrder.side,
          quantity: editingOrder.quantity.toString(),
          price: editingOrder.price.toString(),
          broker: editingOrder.broker,
          date: editingOrder.date,
          investmentThesis: editingOrder.investmentThesis || "",
          notes: editingOrder.notes || "",
        }
      : initialState
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async () => {
    const symbol = form.symbol.trim().toUpperCase();
    const quantity = Number(form.quantity);
    const price = Number(form.price);

    if (!symbol || !form.quantity || !form.price) {
      setError("Symbol, quantity, and price are required.");
      return;
    }

    if (!Number.isFinite(quantity) || quantity <= 0) {
      setError("Quantity must be a positive number.");
      return;
    }

    if (!Number.isFinite(price) || price <= 0) {
      setError("Price must be a positive number.");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        id: editingOrder?.id || crypto.randomUUID(),
        symbol,
        side: form.side,
        quantity,
        price,
        broker: form.broker.trim(),
        date: form.date || new Date().toISOString().slice(0, 10),
        investmentThesis: form.investmentThesis,
        notes: form.notes,
      };

      if (editingOrder && onUpdate) {
        await onUpdate(payload);
      } else {
        await onSubmit(payload);
      }

      setForm(initialState);
      setError("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save order");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(initialState);
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingOrder ? "Edit Order" : "Add Order"}
      size="md"
    >
      <div style={{ display: "grid", gap: 16 }}>
        {error && (
          <div
            style={{
              padding: "12px 14px",
              borderRadius: 8,
              background: "#fee2e2",
              border: "1px solid #fecaca",
              color: "#dc2626",
              fontSize: 14,
            }}
          >
            {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              Symbol
            </label>
            <input
              type="text"
              name="symbol"
              value={form.symbol}
              onChange={handleChange}
              placeholder="e.g., TCS"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              Side
            </label>
            <select
              name="side"
              value={form.side}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                boxSizing: "border-box",
              }}
            >
              <option value="BUY">BUY</option>
              <option value="SELL">SELL</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              Quantity
            </label>
            <input
              type="number"
              name="quantity"
              value={form.quantity}
              onChange={handleChange}
              placeholder="0"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              Price
            </label>
            <input
              type="number"
              name="price"
              value={form.price}
              onChange={handleChange}
              placeholder="0"
              step="0.01"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              Broker
            </label>
            <input
              type="text"
              name="broker"
              value={form.broker}
              onChange={handleChange}
              placeholder="e.g., AngelOne"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                boxSizing: "border-box",
              }}
            />
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              Date
            </label>
            <input
              type="date"
              name="date"
              value={form.date}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                boxSizing: "border-box",
              }}
            />
          </div>
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
            Investment Thesis
          </label>
          <textarea
            name="investmentThesis"
            value={form.investmentThesis}
            onChange={handleChange}
            placeholder="Why are you making this trade?"
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              boxSizing: "border-box",
              minHeight: 80,
              fontFamily: "inherit",
            }}
          />
        </div>

        <div>
          <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
            Notes
          </label>
          <textarea
            name="notes"
            value={form.notes}
            onChange={handleChange}
            placeholder="Any additional notes..."
            style={{
              width: "100%",
              padding: "10px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              boxSizing: "border-box",
              minHeight: 60,
              fontFamily: "inherit",
            }}
          />
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button
            onClick={handleClose}
            disabled={loading}
            style={{
              padding: "10px 20px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
              background: "white",
              cursor: "pointer",
              fontWeight: 500,
              opacity: loading ? 0.6 : 1,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            style={{
              padding: "10px 20px",
              border: "none",
              borderRadius: 8,
              background: "#2563eb",
              color: "white",
              cursor: "pointer",
              fontWeight: 500,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? "Saving..." : editingOrder ? "Update Order" : "Add Order"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
