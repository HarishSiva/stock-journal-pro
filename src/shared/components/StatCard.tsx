import type { ReactNode } from "react";

type Props = {
  title: string;
  value: string | number;
  icon?: ReactNode;
  color?: string;
};

export function StatCard({ title, value, icon, color }: Props) {
  return (
    <div
      style={{
        padding: 16,
        borderRadius: 12,
        border: "1px solid #e5e7eb",
        background: "white",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontSize: 12, color: "#6b7280" }}>{title}</div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 600,
            color: color ?? "#111827",
          }}
        >
          {value}
        </div>
      </div>

      <div style={{ opacity: 0.6 }}>{icon}</div>
    </div>
  );
}