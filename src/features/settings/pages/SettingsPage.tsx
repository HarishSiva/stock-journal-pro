import { useState } from "react";
import { useExpenseCategories } from "../../expenses/hooks/useExpenseCategories";

export function SettingsPage() {
  const { categories, defaultCategories, addCategory, removeCategory } = useExpenseCategories();
  const [newCategory, setNewCategory] = useState("");
  const [error, setError] = useState("");

  const handleAddCategory = () => {
    const trimmed = newCategory.trim();
    if (!trimmed) {
      setError("Enter a category name.");
      return;
    }

    if (categories.some((category) => category.toLowerCase() === trimmed.toLowerCase())) {
      setError("That category already exists.");
      return;
    }

    addCategory(trimmed);
    setNewCategory("");
    setError("");
  };

  return (
    <div style={{ padding: 16 }}>
      <div>
        <h1 style={{ margin: 0 }}>Settings</h1>
        <p style={{ margin: "6px 0 0", color: "#6b7280" }}>
          Configure expense categories and add your own labels for income and spending.
        </p>
      </div>

      <div style={{ marginTop: 24, maxWidth: 680 }}>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
          <input
            value={newCategory}
            onChange={(event) => {
              setNewCategory(event.target.value);
              if (error) setError("");
            }}
            placeholder="Add category"
            style={{ flex: 1, minWidth: 220, padding: "10px 14px", borderRadius: 8, border: "1px solid #d1d5db" }}
          />
          <button
            type="button"
            onClick={handleAddCategory}
            style={{ padding: "10px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: 8, cursor: "pointer" }}
          >
            Add category
          </button>
        </div>

        {error && <div style={{ color: "#b91c1c", marginBottom: 16 }}>{error}</div>}

        <div style={{ display: "grid", gap: 12 }}>
          {categories.map((category) => {
            const isDefault = defaultCategories.includes(category as any);
            return (
              <div key={category} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: 14, borderRadius: 12, background: "white", border: "1px solid #e5e7eb" }}>
                <div>
                  <div style={{ fontWeight: 700 }}>{category}</div>
                  <div style={{ color: "#6b7280", fontSize: 13 }}>{isDefault ? "Default category" : "Custom category"}</div>
                </div>
                {!isDefault ? (
                  <button
                    type="button"
                    onClick={() => removeCategory(category)}
                    style={{ padding: "8px 12px", border: "1px solid #d1d5db", borderRadius: 8, background: "white", cursor: "pointer" }}
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}