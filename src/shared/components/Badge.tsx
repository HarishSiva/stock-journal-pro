type Props = {
  label: string;
  type?: "buy" | "sell" | "neutral";
};

export function Badge({ label, type = "neutral" }: Props) {
  const colors = {
    buy: { bg: "#dcfce7", color: "#166534" },
    sell: { bg: "#fee2e2", color: "#991b1b" },
    neutral: { bg: "#e5e7eb", color: "#111827" },
  };

  return (
    <span
      style={{
        padding: "4px 8px",
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        background: colors[type].bg,
        color: colors[type].color,
      }}
    >
      {label}
    </span>
  );
}