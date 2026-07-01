import type { ReactNode } from "react";

type Props = {
  title: string;
  value: ReactNode;
};

export function DashboardCard({ title, value }: Props) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: 12,
        padding: 16,
        background: "#f9fafb",
        boxShadow: "0 1px 2px rgba(0,0,0,0.03)",
      }}
    >
      <div style={{ color: "#6b7280", fontSize: 13 }}>{title}</div>

      <div
        style={{
          marginTop: 6,
          fontSize: 22,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}