import type { ReactNode } from "react";

type Props = {
  title: string;
  value: ReactNode;
};

export function DashboardCard({ title, value }: Props) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        borderRadius: 8,
        padding: 16,
        background: "#fff",
      }}
    >
      <h4>{title}</h4>

      <div
        style={{
          fontSize: 24,
          fontWeight: 700,
        }}
      >
        {value}
      </div>
    </div>
  );
}