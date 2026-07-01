import { useMemo, useState } from "react";
import { useTransactions } from "../hooks/useTransactions";
import type { Transaction } from "../types/transaction";

const emptyForm = {
  symbol: "",
  type: "BUY" as const,
  quantity: 0,
  pricePerUnit: 0,
  amount: 0,
  date: new Date().toISOString().slice(0, 10),
  broker: "",
  brokerage: 0,
  stt: 0,
  stampDuty: 0,
  sebiCharges: 0,
  gst: 0,
  otherCharges: 0,
  notes: "",
};

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function TransactionsPage() {
  const { transactions, addTransaction, removeTransaction, totals } = useTransactions();
  const [form, setForm] = useState(emptyForm);

  const transactionTotal = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + tx.amount + tx.brokerage + tx.stt + tx.stampDuty + tx.sebiCharges + tx.gst + tx.otherCharges, 0);
  }, [transactions]);

  const submit = (event: React.FormEvent) => {
    event.preventDefault();

    const amount = Number(form.amount) || Number(form.quantity) * Number(form.pricePerUnit);
    const brokerage = Number(form.brokerage) || Math.max(20, Math.round(amount * 0.003));
    const stt = form.type === "SELL" ? Math.max(0, amount * 0.00025) : 0;
    const stampDuty = form.type === "BUY" ? amount * 0.00015 : 0;
    const sebiCharges = amount * 0.0000005;
    const gst = brokerage * 0.18;
    const otherCharges = Number(form.otherCharges) || 0;

    addTransaction({
      ...form,
      amount,
      brokerage,
      stt,
      stampDuty,
      sebiCharges,
      gst,
      otherCharges,
    });

    setForm(emptyForm);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Transactions</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>Log broker trades, charges, and taxes to refine your P&amp;L.</p>
        </div>
      </div>

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        <div style={{ padding: 14, borderRadius: 12, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
          <div style={{ color: "#6b7280", fontSize: 13 }}>Total trade value</div>
          <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700 }}>{formatInr(transactionTotal)}</div>
        </div>
        <div style={{ padding: 14, borderRadius: 12, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
          <div style={{ color: "#6b7280", fontSize: 13 }}>Brokerage + taxes</div>
          <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700 }}>{formatInr(totals.totalBrokerage + totals.totalStt + totals.totalStampDuty + totals.totalSebiCharges + totals.totalGst + totals.totalOtherCharges)}</div>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "white", border: "1px solid #e5e7eb" }}>
        <h3 style={{ marginTop: 0 }}>Add transaction</h3>
        <form onSubmit={submit} style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 4 }}>
              Symbol
              <input value={form.symbol} onChange={(event) => setForm({ ...form, symbol: event.target.value.toUpperCase() })} required style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              Type
              <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Transaction["type"] })} style={inputStyle}>
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              Quantity
              <input type="number" value={form.quantity} onChange={(event) => setForm({ ...form, quantity: Number(event.target.value) })} required style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              Price / unit
              <input type="number" value={form.pricePerUnit} onChange={(event) => setForm({ ...form, pricePerUnit: Number(event.target.value) })} required style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              Amount
              <input type="number" value={form.amount} onChange={(event) => setForm({ ...form, amount: Number(event.target.value) })} style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              Date
              <input type="date" value={form.date} onChange={(event) => setForm({ ...form, date: event.target.value })} required style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              Broker
              <input value={form.broker} onChange={(event) => setForm({ ...form, broker: event.target.value })} style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              Brokerage
              <input type="number" value={form.brokerage} onChange={(event) => setForm({ ...form, brokerage: Number(event.target.value) })} style={inputStyle} />
            </label>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 }}>
            <label style={{ display: "grid", gap: 4 }}>
              STT
              <input type="number" value={form.stt} onChange={(event) => setForm({ ...form, stt: Number(event.target.value) })} style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              Stamp duty
              <input type="number" value={form.stampDuty} onChange={(event) => setForm({ ...form, stampDuty: Number(event.target.value) })} style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              SEBI charges
              <input type="number" value={form.sebiCharges} onChange={(event) => setForm({ ...form, sebiCharges: Number(event.target.value) })} style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              GST
              <input type="number" value={form.gst} onChange={(event) => setForm({ ...form, gst: Number(event.target.value) })} style={inputStyle} />
            </label>
            <label style={{ display: "grid", gap: 4 }}>
              Other charges
              <input type="number" value={form.otherCharges} onChange={(event) => setForm({ ...form, otherCharges: Number(event.target.value) })} style={inputStyle} />
            </label>
          </div>

          <label style={{ display: "grid", gap: 4 }}>
            Notes
            <textarea value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} style={{ ...inputStyle, minHeight: 72 }} />
          </label>

          <button type="submit" style={{ width: 140, padding: "10px 12px", borderRadius: 8, border: "none", background: "#2563eb", color: "white", fontWeight: 600, cursor: "pointer" }}>
            Save transaction
          </button>
        </form>
      </div>

      <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "white", border: "1px solid #e5e7eb" }}>
        <h3 style={{ marginTop: 0 }}>Recent transactions</h3>
        {transactions.length === 0 ? (
          <div style={{ color: "#6b7280" }}>No transactions yet.</div>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {transactions.map((tx) => (
              <div key={tx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3f4f6", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{tx.symbol} • {tx.type}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{tx.date} • Qty {tx.quantity} • {tx.broker || "No broker"}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700 }}>{formatInr(tx.amount + tx.brokerage + tx.stt + tx.stampDuty + tx.sebiCharges + tx.gst + tx.otherCharges)}</div>
                  <button onClick={() => removeTransaction(tx.id)} style={{ marginTop: 4, border: "none", background: "transparent", color: "#dc2626", cursor: "pointer" }}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding: "8px 10px",
  borderRadius: 8,
  border: "1px solid #d1d5db",
  fontSize: 14,
};
