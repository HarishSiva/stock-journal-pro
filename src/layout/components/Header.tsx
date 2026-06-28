import type { CSSProperties } from "react";

export function Header() {
  return (
    <header style={header}>
      <div>
        <h2 style={title}>Stock Journal Pro</h2>
        <p style={subtitle}>
          Offline-first Portfolio & Trading Journal
        </p>
      </div>

      <div style={actions}>
        <input
          placeholder="Search..."
          style={searchBox}
        />

        <button style={iconButton}>
          🌙
        </button>

        <button style={iconButton}>
          👤
        </button>
      </div>
    </header>
  );
}

const header: CSSProperties = {
  height: 70,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "0 24px",
  borderBottom: "1px solid #e5e7eb",
  background: "#ffffff",
};

const title: CSSProperties = {
  margin: 0,
  fontSize: 22,
};

const subtitle: CSSProperties = {
  margin: 0,
  fontSize: 13,
  color: "#6b7280",
};

const actions: CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const searchBox: CSSProperties = {
  padding: "8px 12px",
  width: 220,
  borderRadius: 8,
  border: "1px solid #d1d5db",
  outline: "none",
};

const iconButton: CSSProperties = {
  width: 40,
  height: 40,
  borderRadius: 8,
  border: "1px solid #d1d5db",
  background: "#fff",
  cursor: "pointer",
  fontSize: 18,
};