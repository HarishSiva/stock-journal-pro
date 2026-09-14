import { useEffect, useMemo, useState } from "react";
import { ExpenseFormModal } from "../components/ExpenseFormModal";
import { useExpenseCategories } from "../hooks/useExpenseCategories";
import { useExpenses } from "../hooks/useExpenses";
import type { Expense, ExpenseCategory } from "../types/expense";

type ExpenseGroup =
  | "Income"
  | "Expense"
  | "Savings"
  | "Investments"
  | "Self Transfer";

const expenseGroups: ExpenseGroup[] = [
  "Income",
  "Expense",
  "Savings",
  "Investments",
  "Self Transfer",
];

function normalizeCategory(value?: string): string {
  return (value ?? "").toLowerCase().replace(/[\s_-]/g, "");
}

function getExpenseGroup(expense: Expense): ExpenseGroup {
  const category = normalizeCategory(expense.category);

  if (category === "selftransfer") {
    return "Self Transfer";
  }

  if (expense.type === "income" || category === "income") {
    return "Income";
  }

  if (category === "saving" || category === "savings") {
    return "Savings";
  }

  if (category === "investment" || category === "investments") {
    return "Investments";
  }

  return "Expense";
}

export function ExpenseTrackerPage() {
  const { categories } = useExpenseCategories();

  const {
    expenses,
    addExpense,
    removeExpense,
    updateExpense,
    bulkUpdateCategory,
  } = useExpenses();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<
    ExpenseCategory | "all"
  >("all");
  const [groupFilter, setGroupFilter] = useState<ExpenseGroup | "all">("all");
  const [bulkCategory, setBulkCategory] = useState<ExpenseCategory>(
    categories[0] ?? "Food"
  );

  useEffect(() => {
    if (
      categories.length > 0 &&
      !categories.includes(bulkCategory)
    ) {
      setBulkCategory(categories[0]);
    }
  }, [categories, bulkCategory]);

  const filteredExpenses = useMemo(() => {
    const query = searchText.trim().toLowerCase();

    return expenses.filter((expense) => {
      const matchesCategory =
        categoryFilter === "all" ||
        expense.category === categoryFilter;

      const matchesGroup =
        groupFilter === "all" ||
        getExpenseGroup(expense) === groupFilter;

      const searchableText = [
        expense.merchant,
        expense.category,
        expense.notes,
        expense.paymentMethod,
        expense.account,
        expense.type,
        expense.date,
        expense.amount,
      ]
        .join(" ")
        .toLowerCase();

      return (
        matchesCategory &&
        matchesGroup &&
        (query === "" || searchableText.includes(query))
      );
    });
  }, [expenses, searchText, categoryFilter, groupFilter]);

  const groupedExpenses = useMemo(() => {
    const groups: Record<ExpenseGroup, Expense[]> = {
      Income: [],
      Expense: [],
      Savings: [],
      Investments: [],
      "Self Transfer": [],
    };

    filteredExpenses.forEach((expense) => {
      groups[getExpenseGroup(expense)].push(expense);
    });

    return groups;
  }, [filteredExpenses]);

  const visibleSelectedCount = filteredExpenses.filter((expense) =>
    selectedIds.includes(expense.id)
  ).length;

  const allVisibleSelected =
    filteredExpenses.length > 0 &&
    visibleSelectedCount === filteredExpenses.length;

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
    setSelectedIds((current) =>
      current.includes(id)
        ? current.filter((item) => item !== id)
        : [...current, id]
    );
  };

  const toggleSelectAllVisible = () => {
    const visibleIds = filteredExpenses.map((expense) => expense.id);

    setSelectedIds((current) =>
      allVisibleSelected
        ? current.filter((id) => !visibleIds.includes(id))
        : [...new Set([...current, ...visibleIds])]
    );
  };

  const handleBulkCategoryUpdate = () => {
    if (selectedIds.length === 0) return;

    bulkUpdateCategory(selectedIds, bulkCategory);
    setSelectedIds([]);
  };

  return (
    <div style={{ padding: 16 }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1 style={{ margin: 0 }}>Expense Tracker</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>
            Manage income, expenses, savings, investments, and transfers.
          </p>
        </div>

        <button
          type="button"
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

      <div
        style={{
          marginTop: 16,
          padding: 16,
          borderRadius: 12,
          background: "white",
          border: "1px solid #e5e7eb",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            flexWrap: "wrap",
            marginBottom: 12,
          }}
        >
          <h3 style={{ margin: 0, marginRight: "auto" }}>
            Transactions
          </h3>

          <input
            type="search"
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
            placeholder="Search expenses..."
            style={{
              minWidth: 220,
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
            }}
          />

          <select
            value={groupFilter}
            onChange={(event) =>
              setGroupFilter(event.target.value as ExpenseGroup | "all")
            }
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
            }}
          >
            <option value="all">All groups</option>
            {expenseGroups.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>

          <select
            value={categoryFilter}
            onChange={(event) =>
              setCategoryFilter(
                event.target.value as ExpenseCategory | "all"
              )
            }
            style={{
              padding: "8px 12px",
              border: "1px solid #d1d5db",
              borderRadius: 8,
            }}
          >
            <option value="all">All categories</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        {filteredExpenses.length > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
              marginBottom: 16,
            }}
          >
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: 14,
              }}
            >
              <input
                type="checkbox"
                checked={allVisibleSelected}
                onChange={toggleSelectAllVisible}
              />
              Select all visible
            </label>

            <select
              value={bulkCategory}
              onChange={(event) =>
                setBulkCategory(event.target.value as ExpenseCategory)
              }
              style={{
                padding: "8px 12px",
                borderRadius: 6,
                border: "1px solid #d1d5db",
              }}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={handleBulkCategoryUpdate}
              disabled={selectedIds.length === 0}
              style={{
                padding: "8px 12px",
                borderRadius: 8,
                border: "1px solid #d1d5db",
                background:
                  selectedIds.length > 0 ? "#111827" : "#f3f4f6",
                color:
                  selectedIds.length > 0 ? "white" : "#9ca3af",
                cursor:
                  selectedIds.length > 0
                    ? "pointer"
                    : "not-allowed",
              }}
            >
              Apply Category ({selectedIds.length})
            </button>
          </div>
        )}

        {expenses.length === 0 ? (
          <div style={{ color: "#6b7280" }}>
            No transactions yet.
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div style={{ color: "#6b7280" }}>
            No transactions match the selected filters.
          </div>
        ) : (
          <div style={{ display: "grid", gap: 20 }}>
            {expenseGroups.map((group) => {
              const groupExpenses = groupedExpenses[group];

              if (groupExpenses.length === 0) {
                return null;
              }

              return (
                <section key={group}>
                  <h3
                    style={{
                      margin: "0 0 8px",
                      paddingBottom: 8,
                      borderBottom: "2px solid #e5e7eb",
                    }}
                  >
                    {group} ({groupExpenses.length})
                  </h3>

                  <div style={{ display: "grid", gap: 10 }}>
                    {groupExpenses.map((expense) => {
                      const isSelected = selectedIds.includes(
                        expense.id
                      );

                      return (
                        <div
                          key={expense.id}
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: 12,
                            padding: "10px 0",
                            borderBottom: "1px solid #f3f4f6",
                            flexWrap: "wrap",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() =>
                                toggleSelect(expense.id)
                              }
                            />

                            <div>
                              <div style={{ fontWeight: 700 }}>
                                {expense.merchant ||
                                  expense.category}{" "}
                                • {expense.category}
                              </div>

                              <div
                                style={{
                                  color: "#6b7280",
                                  fontSize: 13,
                                }}
                              >
                                {expense.date} •{" "}
                                {expense.paymentMethod} •{" "}
                                {expense.account}
                              </div>

                              {expense.notes && (
                                <div
                                  style={{
                                    color: "#6b7280",
                                    fontSize: 13,
                                    marginTop: 2,
                                  }}
                                >
                                  {expense.notes}
                                </div>
                              )}
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 10,
                            }}
                          >
                            <strong>
                              ₹{expense.amount.toFixed(2)}
                            </strong>

                            <button
                              type="button"
                              onClick={() =>
                                handleEditExpense(expense)
                              }
                              style={{
                                border: "1px solid #d1d5db",
                                background: "white",
                                borderRadius: 8,
                                padding: "6px 10px",
                                cursor: "pointer",
                              }}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => {
                                removeExpense(expense.id);
                                setSelectedIds((current) =>
                                  current.filter(
                                    (id) => id !== expense.id
                                  )
                                );
                              }}
                              style={{
                                border: "none",
                                background: "transparent",
                                color: "#dc2626",
                                cursor: "pointer",
                              }}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}