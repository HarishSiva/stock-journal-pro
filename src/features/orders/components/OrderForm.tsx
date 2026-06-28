import { useState } from "react";
import type { Order } from "../types/order";

type Props = {
  onSubmit: (order: Order) => Promise<void>;
};

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

export function OrderForm({ onSubmit }: Props) {
  const [form, setForm] = useState(initialState);
  const [error, setError] = useState("");

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit() {
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

    await onSubmit({
      id: crypto.randomUUID(),
      symbol,
      side: form.side,
      quantity,
      price,
      broker: form.broker.trim(),
      date: form.date || new Date().toISOString(),
      investmentThesis: form.investmentThesis,
      notes: form.notes,
    });

    setForm(initialState);
    setError("");
  }

  return (
    <div style={{ padding: 18, border: "1px solid #e5e7eb", borderRadius: 14, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.04)", marginBottom: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <h3 style={{ margin: 0 }}>Add Order</h3>
        <span style={{ color: "#6b7280", fontSize: 13 }}>Capture your next trade</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 12 }}>
        <input style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }} name="symbol" value={form.symbol} onChange={handleChange} placeholder="Symbol" />

        <select style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }} name="side" value={form.side} onChange={handleChange}>
          <option value="BUY">BUY</option>
          <option value="SELL">SELL</option>
        </select>

        <input style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }} name="quantity" value={form.quantity} onChange={handleChange} placeholder="Quantity" />

        <input style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }} name="price" value={form.price} onChange={handleChange} placeholder="Price" />

        <input style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }} name="broker" value={form.broker} onChange={handleChange} placeholder="Broker" />

        <input style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }} type="date" name="date" value={form.date} onChange={handleChange} />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginTop: 12 }}>
        <input style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }} name="investmentThesis" value={form.investmentThesis} onChange={handleChange} placeholder="Investment Thesis" />
        <input style={{ padding: "10px 12px", border: "1px solid #d1d5db", borderRadius: 8 }} name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" />
      </div>

      {error ? (
        <div style={{ marginTop: 12, color: "#b91c1c", fontSize: 13 }}>{error}</div>
      ) : null}

      <div style={{ marginTop: 14, display: "flex", justifyContent: "flex-end" }}>
        <button onClick={handleSubmit} style={{ padding: "10px 14px", border: "none", borderRadius: 8, background: "#111827", color: "white", cursor: "pointer" }}>
          Save Order
        </button>
      </div>
    </div>
  );
}