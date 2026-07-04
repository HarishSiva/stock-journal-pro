import { useState } from "react";
import { Modal } from "@/shared/ui/Modal/Modal";
import type { Transaction } from "../types/transaction";

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Omit<Transaction, "id">) => Promise<void>;
  editingTransaction?: Transaction | null;
  onUpdate?: (transaction: Transaction) => Promise<void>;
}

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

export function TransactionFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingTransaction,
  onUpdate,
}: TransactionFormModalProps) {
  const [form, setForm] = useState(
    editingTransaction
      ? {
          symbol: editingTransaction.symbol,
          type: editingTransaction.type,
          quantity: editingTransaction.quantity,
          pricePerUnit: editingTransaction.pricePerUnit,
          amount: editingTransaction.amount,
          date: editingTransaction.date,
          broker: editingTransaction.broker,
          brokerage: editingTransaction.brokerage,
          stt: editingTransaction.stt,
          stampDuty: editingTransaction.stampDuty,
          sebiCharges: editingTransaction.sebiCharges,
          gst: editingTransaction.gst,
          otherCharges: editingTransaction.otherCharges,
          notes: editingTransaction.notes || "",
        }
      : emptyForm
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setForm((prev) => ({
      ...prev,
      [e.target.name]:
        e.target.type === "number" ? Number(e.target.value) : e.target.value,
    }));

    if (error) {
      setError("");
    }
  };

  const handleSubmit = async () => {
    if (!form.symbol.trim() || !form.broker.trim()) {
      setError("Symbol and broker are required.");
      return;
    }

    try {
      setLoading(true);

      const amount =
        Number(form.amount) || Number(form.quantity) * Number(form.pricePerUnit);
      const brokerage =
        Number(form.brokerage) || Math.max(20, Math.round(amount * 0.003));
      const stt = form.type === "SELL" ? Math.max(0, amount * 0.00025) : 0;
      const stampDuty = form.type === "BUY" ? amount * 0.00015 : 0;
      const sebiCharges = amount * 0.0000005;
      const gst = brokerage * 0.18;
      const otherCharges = Number(form.otherCharges) || 0;

      const payload = {
        symbol: form.symbol.trim().toUpperCase(),
        type: form.type,
        quantity: form.quantity,
        pricePerUnit: form.pricePerUnit,
        amount,
        date: form.date,
        broker: form.broker.trim(),
        brokerage,
        stt,
        stampDuty,
        sebiCharges,
        gst,
        otherCharges,
        notes: form.notes,
      };

      if (editingTransaction && onUpdate) {
        await onUpdate({
          ...payload,
          id: editingTransaction.id,
        });
      } else {
        await onSubmit(payload);
      }

      setForm(emptyForm);
      setError("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save transaction");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(emptyForm);
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingTransaction ? "Edit Transaction" : "Add Transaction"}
      size="lg"
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

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
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
              Type
            </label>
            <select
              name="type"
              value={form.type}
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
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
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

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              Price per Unit
            </label>
            <input
              type="number"
              name="pricePerUnit"
              value={form.pricePerUnit}
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

        <div style={{ background: "#f9fafb", padding: 12, borderRadius: 8, border: "1px solid #e5e7eb" }}>
          <h4 style={{ margin: "0 0 12px 0", fontSize: 14, fontWeight: 600 }}>Charges & Taxes</h4>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                Brokerage
              </label>
              <input
                type="number"
                name="brokerage"
                value={form.brokerage}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  boxSizing: "border-box",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                STT
              </label>
              <input
                type="number"
                name="stt"
                value={form.stt}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  boxSizing: "border-box",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                Stamp Duty
              </label>
              <input
                type="number"
                name="stampDuty"
                value={form.stampDuty}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  boxSizing: "border-box",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                SEBI Charges
              </label>
              <input
                type="number"
                name="sebiCharges"
                value={form.sebiCharges}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  boxSizing: "border-box",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                GST
              </label>
              <input
                type="number"
                name="gst"
                value={form.gst}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  boxSizing: "border-box",
                  fontSize: 13,
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: 4, fontWeight: 500, fontSize: 13 }}>
                Other Charges
              </label>
              <input
                type="number"
                name="otherCharges"
                value={form.otherCharges}
                onChange={handleChange}
                placeholder="0"
                step="0.01"
                style={{
                  width: "100%",
                  padding: "8px 10px",
                  border: "1px solid #d1d5db",
                  borderRadius: 6,
                  boxSizing: "border-box",
                  fontSize: 13,
                }}
              />
            </div>
          </div>
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
            {loading ? "Saving..." : editingTransaction ? "Update Transaction" : "Add Transaction"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
