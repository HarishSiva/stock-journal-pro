import { useMemo, useState } from "react";
import { TransactionFormModal } from "../components/TransactionFormModal";
import { useTransactions } from "../hooks/useTransactions";
import type { Transaction } from "../types/transaction";

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

export function TransactionsPage() {
  const { transactions, addTransaction, removeTransaction, totals } = useTransactions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const transactionTotal = useMemo(() => {
    return transactions.reduce((sum, tx) => sum + tx.amount + tx.brokerage + tx.stt + tx.stampDuty + tx.sebiCharges + tx.gst + tx.otherCharges, 0);
  }, [transactions]);

  const handleOpenModal = () => {
    setEditingTransaction(null);
    setIsModalOpen(true);
  };

  const handleEditTransaction = (transaction: Transaction) => {
    setEditingTransaction(transaction);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTransaction(null);
  };

  const handleUpdateTransaction = async (transaction: Transaction) => {
    // For now, we'll remove and re-add since there's no update in the DB
    await removeTransaction(transaction.id);
    await addTransaction({
      symbol: transaction.symbol,
      type: transaction.type,
      quantity: transaction.quantity,
      pricePerUnit: transaction.pricePerUnit,
      amount: transaction.amount,
      date: transaction.date,
      broker: transaction.broker,
      brokerage: transaction.brokerage,
      stt: transaction.stt,
      stampDuty: transaction.stampDuty,
      sebiCharges: transaction.sebiCharges,
      gst: transaction.gst,
      otherCharges: transaction.otherCharges,
      notes: transaction.notes,
    });
  };

  return (
    <div style={{ padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ margin: 0 }}>Transactions</h1>
          <p style={{ margin: "4px 0 0", color: "#6b7280" }}>Log broker trades, charges, and taxes to refine your P&amp;L.</p>
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
          + Add Transaction
        </button>
      </div>

      <TransactionFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSubmit={addTransaction}
        editingTransaction={editingTransaction}
        onUpdate={handleUpdateTransaction}
      />

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

      <div style={{ marginTop: 16, overflowX: "auto", border: "1px solid #e5e7eb", borderRadius: 12, background: "white" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f9fafb", textAlign: "left" }}>
              <th style={{ padding: "10px 8px" }}>Symbol</th>
              <th style={{ padding: "10px 8px" }}>Type</th>
              <th style={{ padding: "10px 8px" }}>Qty</th>
              <th style={{ padding: "10px 8px" }}>Price</th>
              <th style={{ padding: "10px 8px" }}>Brokerage</th>
              <th style={{ padding: "10px 8px" }}>STT</th>
              <th style={{ padding: "10px 8px" }}>Stamp Duty</th>
              <th style={{ padding: "10px 8px" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((tx) => (
              <tr key={tx.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 8px", fontWeight: 600 }}>{tx.symbol}</td>
                <td style={{ padding: "10px 8px" }}>{tx.type}</td>
                <td style={{ padding: "10px 8px" }}>{tx.quantity}</td>
                <td style={{ padding: "10px 8px" }}>{formatInr(tx.pricePerUnit)}</td>
                <td style={{ padding: "10px 8px" }}>{formatInr(tx.brokerage)}</td>
                <td style={{ padding: "10px 8px" }}>{formatInr(tx.stt)}</td>
                <td style={{ padding: "10px 8px" }}>{formatInr(tx.stampDuty)}</td>
                <td style={{ padding: "10px 8px", display: "flex", gap: 8 }}>
                  <button
                    onClick={() => handleEditTransaction(tx)}
                    style={{
                      color: "white",
                      background: "#2563eb",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => void removeTransaction(tx.id)}
                    style={{
                      color: "white",
                      background: "#d32f2f",
                      border: "none",
                      padding: "6px 10px",
                      borderRadius: 6,
                      cursor: "pointer",
                      fontSize: 12,
                    }}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
