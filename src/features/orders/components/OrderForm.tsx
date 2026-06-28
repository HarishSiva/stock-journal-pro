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

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
  if (!form.symbol || !form.quantity || !form.price) return;

  await onSubmit({
    id: crypto.randomUUID(),
    symbol: form.symbol,
    side: form.side,
    quantity: Number(form.quantity),
    price: Number(form.price),
    broker: form.broker,
    date: form.date,
    investmentThesis: form.investmentThesis,
    notes: form.notes,
  });

  setForm(initialState);
}

  return (
    <div style={{ padding: 16, border: "1px solid #ddd", marginBottom: 16 }}>
      <h3>Add Order</h3>

      <input name="symbol" value={form.symbol} onChange={handleChange} placeholder="Symbol" />

      <select name="side" value={form.side} onChange={handleChange}>
        <option value="BUY">BUY</option>
        <option value="SELL">SELL</option>
      </select>

      <input name="quantity" value={form.quantity} onChange={handleChange} placeholder="Quantity" />
      <input name="price" value={form.price} onChange={handleChange} placeholder="Price" />
      <input name="broker" value={form.broker} onChange={handleChange} placeholder="Broker" />
      <input type="date" name="date" value={form.date} onChange={handleChange} />

      <input name="investmentThesis" value={form.investmentThesis} onChange={handleChange} placeholder="Thesis" />
      <input name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" />

      <button onClick={handleSubmit}>Save Order</button>
    </div>
  );
}