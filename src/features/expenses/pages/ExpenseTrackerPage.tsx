import { useState } from "react";
import { ExpenseFormModal } from "../components/ExpenseFormModal";
import { useExpenses } from "../hooks/useExpenses";
import { expenseCategories, type ExpenseCategory, type Expense } from "../types/expense";

const categories = expenseCategories;

export function ExpenseTrackerPage() {
  const { expenses, addExpense, removeExpense, updateExpense, bulkUpdateCategory } = useExpenses();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkCategory, setBulkCategory] = useState<ExpenseCategory>("Food");

  const handleOpenModal = () => {
    setEditingExpense(null);
    setIsModalOpen(true);
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingExpense(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  };

  const handleBulkCategoryUpdate = () => {
    if (selectedIds.length === 0) {
      return;
    }

    bulkUpdateCategory(selectedIds, bulkCategory);
    setSelectedIds([]);
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Expense Tracker</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>Record and manage your personal expenses.</p>
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
          + Add Expense
        </button>
      </div>

      <ExpenseFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={addExpense}
        editingExpense={editingExpense}
        onUpdate={updateExpense}
      />

      <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "white", border: "1px solid #e5e7eb" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <h3 style={{ margin: 0 }}>Expenses</h3>
          {expenses.length > 0 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 14 }}>
                <input
                  type="checkbox"
                  checked={selectedIds.length === expenses.length && expenses.length > 0}
                  onChange={() => {
                    setSelectedIds((current) => (current.length === expenses.length ? [] : expenses.map((expense) => expense.id)));
                  }}
                />
                Select all
              </label>
              <select value={bulkCategory} onChange={(event) => setBulkCategory(event.target.value as ExpenseCategory)} style={{padding: "8px 12px", borderRadius: 6, border: "1px solid #d1d5db"}}>
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <button
                type="button"
                onClick={handleBulkCategoryUpdate}
                disabled={selectedIds.length === 0}
                style={{ padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", background: selectedIds.length === 0 ? "#f3f4f6" : "#111827", color: selectedIds.length === 0 ? "#9ca3af" : "white", cursor: selectedIds.length === 0 ? "not-allowed" : "pointer" }}
              >
                Apply Category
              </button>
            </div>
          ) : null}
        </div>

        {expenses.length === 0 ? <div style={{ color: "#6b7280" }}>No expenses yet.</div> : (
          <div style={{ display: "grid", gap: 10 }}>
            {expenses.map((expense) => {
              const isSelected = selectedIds.includes(expense.id);

              return (
                <div key={expense.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px solid #f3f4f6", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
                    <input type="checkbox" checked={isSelected} onChange={() => toggleSelect(expense.id)} />
                    <div>
                      <div style={{ fontWeight: 700 }}>{expense.merchant || expense.category} • {expense.category}</div>
                      <div style={{ color: "#6b7280", fontSize: 13 }}>{expense.date} • {expense.paymentMethod} • {expense.account}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <strong>₹{expense.amount}</strong>
                    <button onClick={() => handleEditExpense(expense)} style={{ border: "1px solid #d1d5db", background: "white", borderRadius: 8, padding: "6px 10px", cursor: "pointer" }}>Edit</button>
                    <button onClick={() => removeExpense(expense.id)} style={{ border: "none", background: "transparent", color: "#dc2626", cursor: "pointer" }}>Delete</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
