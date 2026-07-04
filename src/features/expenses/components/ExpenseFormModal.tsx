import { useState } from "react";
import { Modal } from "@/shared/ui/Modal/Modal";
import { expenseCategories, type ExpenseCategory, type Expense } from "../types/expense";

interface ExpenseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (expense: Omit<Expense, "id">) => Promise<void>;
  editingExpense?: Expense | null;
  onUpdate?: (id: string, expense: Omit<Expense, "id">) => Promise<void>;
}

export function ExpenseFormModal({
  isOpen,
  onClose,
  onSubmit,
  editingExpense,
  onUpdate,
}: ExpenseFormModalProps) {
  const [form, setForm] = useState(
    editingExpense
      ? {
          amount: editingExpense.amount.toString(),
          category: editingExpense.category,
          paymentMethod: editingExpense.paymentMethod,
          account: editingExpense.account,
          merchant: editingExpense.merchant,
          notes: editingExpense.notes,
          date: editingExpense.date,
          receiptImage: editingExpense.receiptImage ?? "",
        }
      : {
          amount: "",
          category: "Food" as ExpenseCategory,
          paymentMethod: "Card",
          account: "Main",
          merchant: "",
          notes: "",
          date: new Date().toISOString().slice(0, 10),
          receiptImage: "",
        }
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
    const amount = Number(form.amount);
    if (!amount || Number.isNaN(amount) || amount <= 0) {
      setError("Amount must be a positive number");
      return;
    }

    try {
      setLoading(true);

      const payload = {
        amount,
        category: form.category,
        paymentMethod: form.paymentMethod,
        account: form.account,
        merchant: form.merchant,
        notes: form.notes,
        date: form.date,
        receiptImage: form.receiptImage || undefined,
      };

      if (editingExpense && onUpdate) {
        await onUpdate(editingExpense.id, payload);
      } else {
        await onSubmit(payload);
      }

      setForm({
        amount: "",
        category: "Food",
        paymentMethod: "Card",
        account: "Main",
        merchant: "",
        notes: "",
        date: new Date().toISOString().slice(0, 10),
        receiptImage: "",
      });
      setError("");
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save expense");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm({
      amount: "",
      category: "Food",
      paymentMethod: "Card",
      account: "Main",
      merchant: "",
      notes: "",
      date: new Date().toISOString().slice(0, 10),
      receiptImage: "",
    });
    setError("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={editingExpense ? "Edit Expense" : "Add Expense"}
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
              Amount
            </label>
            <input
              type="number"
              name="amount"
              value={form.amount}
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
              Category
            </label>
            <select
              name="category"
              value={form.category}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                boxSizing: "border-box",
              }}
            >
              {expenseCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              Payment Method
            </label>
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                boxSizing: "border-box",
              }}
            >
              <option value="Card">Card</option>
              <option value="Cash">Cash</option>
              <option value="UPI">UPI</option>
              <option value="Bank Transfer">Bank Transfer</option>
            </select>
          </div>

          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              Account
            </label>
            <select
              name="account"
              value={form.account}
              onChange={handleChange}
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #d1d5db",
                borderRadius: 8,
                boxSizing: "border-box",
              }}
            >
              <option value="Main">Main</option>
              <option value="Savings">Savings</option>
              <option value="Credit">Credit</option>
            </select>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ display: "block", marginBottom: 6, fontWeight: 500, fontSize: 14 }}>
              Merchant
            </label>
            <input
              type="text"
              name="merchant"
              value={form.merchant}
              onChange={handleChange}
              placeholder="e.g., Amazon, Starbucks"
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
            {loading ? "Saving..." : editingExpense ? "Update Expense" : "Add Expense"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
