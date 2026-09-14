import { useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { useExpenseCategories } from "../hooks/useExpenseCategories";
import { useExpenses } from "../hooks/useExpenses";

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(value);
}

export function ExpenseDashboardPage() {
  const { expenses, importExpensesFromCsv, removeAllExpenses } = useExpenses();
  const [selectedRange, setSelectedRange] = useState<"today" | "month" | "all">("all");
  const [importMessage, setImportMessage] = useState("");
  const [importWarnings, setImportWarnings] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const filteredExpenses = useMemo(() => {
    const now = new Date();
    return expenses.filter((expense) => {
      const date = new Date(expense.date);
      if (selectedRange === "today") {
        return date.toDateString() === now.toDateString();
      }

      if (selectedRange === "month") {
        return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [expenses, selectedRange]);

  const { categories } = useExpenseCategories();

  const totals = useMemo(() => {
    const expenseTotal = filteredExpenses.filter((expense) => expense.type === "expense").reduce((sum, expense) => sum + expense.amount, 0);
    const incomeTotal = filteredExpenses.filter((expense) => expense.type === "income").reduce((sum, expense) => sum + expense.amount, 0);
    const savings = incomeTotal - expenseTotal;
    const byCategory = categories.map((category) => ({
      category,
      amount: filteredExpenses.filter((expense) => expense.category === category).reduce((sum, expense) => sum + expense.amount, 0),
    }));

    return { expenseTotal, incomeTotal, savings, byCategory };
  }, [filteredExpenses, categories]);

  const parseFileAsCsv = async (file: File) => {
    const fileName = file.name.toLowerCase();
    if (fileName.endsWith(".xlsx") || fileName.endsWith(".xls")) {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: "array" });
      const firstSheet = workbook.SheetNames[0];
      if (!firstSheet) {
        throw new Error("Excel file contains no sheets.");
      }
      return XLSX.utils.sheet_to_csv(workbook.Sheets[firstSheet]);
    }

    return file.text();
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    try {
      const text = await parseFileAsCsv(file);
      const result = importExpensesFromCsv(text);
      setImportMessage(
        `${result.imported.length} expense item(s) imported from ${file.name}.` +
          (result.skipped > 0 ? ` ${result.skipped} row(s) were skipped.` : ""),
      );
      setImportWarnings(result.errors);
    } catch (error) {
      setImportMessage(`Unable to import ${file.name}.`);
      setImportWarnings([error instanceof Error ? error.message : String(error)]);
    } finally {
      event.target.value = "";
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Personal Expense Dashboard</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>Track spending and stay on budget.</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ padding: "10px 14px", border: "1px solid #d1d5db", borderRadius: 8, background: "white", cursor: "pointer" }}
          >
            Import Bank Statement
          </button>
          <button
            type="button"
            onClick={() => {
              removeAllExpenses();
              setImportMessage("All imported expenses were removed.");
            }}
            style={{ padding: "10px 14px", border: "1px solid #fecaca", borderRadius: 8, background: "#fff1f2", color: "#991b1b", cursor: "pointer" }}
          >
            Delete All
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=",.csv,.txt,text/csv,text/plain,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            hidden
            onChange={handleImport}
          />
          <select
            value={selectedRange}
            onChange={(event) => setSelectedRange(event.target.value as "today" | "month" | "all")}
            style={{ padding: "8px 10px", borderRadius: 8, border: "1px solid #d1d5db" }}
          >
            <option value="all">All</option>
            <option value="today">Today</option>
            <option value="month">This month</option>
          </select>
        </div>
      </div>

      {importMessage ? <div style={{ marginTop: 12, color: "#047857", fontSize: 13 }}>{importMessage}</div> : null}
      {importWarnings.length > 0 ? (
        <div style={{ marginTop: 8, color: "#b45309", fontSize: 13, padding: 12, background: "#fffbeb", borderRadius: 8, border: "1px solid #fcd34d" }}>
          <strong>Import warnings:</strong>
          <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
            {importWarnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      ) : null}

      <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12 }}>
        {[
          { label: selectedRange === "today" ? "Today's spending" : "This month's spending", value: totals.expenseTotal },
          { label: selectedRange === "today" ? "Today's income" : "This month's income", value: totals.incomeTotal },
          { label: "Savings", value: totals.savings },
          { label: "Budget remaining", value: Math.max(0, 8000 - totals.expenseTotal) },
          { label: "Points earned", value: Math.max(0, Math.round(totals.savings / 10)) },
          { label: "Financial score", value: Math.min(100, Math.round((totals.savings > 0 ? 60 : 20) + (totals.expenseTotal > 0 ? 20 : 0))) },
        ].map((item) => (
          <div key={item.label} style={{ padding: 14, borderRadius: 12, background: "#f9fafb", border: "1px solid #e5e7eb" }}>
            <div style={{ color: "#6b7280", fontSize: 13 }}>{item.label}</div>
            <div style={{ marginTop: 6, fontSize: 20, fontWeight: 700 }}>{item.label === "Financial score" ? `${item.value}/100` : formatInr(item.value)}</div>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 16, padding: 16, borderRadius: 12, background: "white", border: "1px solid #e5e7eb" }}>
        <h3 style={{ marginTop: 0 }}>Category Breakdown</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {totals.byCategory.map((item) => (
            <div key={item.category} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{item.category}</span>
              <strong>{formatInr(item.amount)}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
