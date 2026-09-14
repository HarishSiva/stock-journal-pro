
import { useMemo, useState } from "react";
import { usePortfolio } from "../hooks/usePortfolio";

type SortKey =
  | "symbol"
  | "quantity"
  | "totalBoughtQty"
  | "totalSoldQty"
  | "currentlyHeldQty"
  | "avgPrice"
  | "invested"
  | "currentPrice"
  | "currentValue"
  | "unrealizedPnL"
  | "unrealizedGainPct"
  | "gainPct"
  | "missedGain"
  | "missedGainPct"
  | "rule72"
  | "rule114"
  | "rule144"
  | "holdingAgeDays"
  | "lastUpdated"
  | "netPnl";

function safeNumber(value: unknown, fallback = 0): number {
  const num = Number(value ?? fallback);
  return Number.isFinite(num) ? num : fallback;
}

function formatInr(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(value);
}

function formatRuleYears(value: number | null) {
  if (value === null || !Number.isFinite(value) || value <= 0) {
    return "—";
  }

  return `${value.toFixed(2)} yrs`;
}

function getRuleValue(gainPct: number, factor: number) {
  if (!Number.isFinite(gainPct) || gainPct <= 0) {
    return null;
  }

  return factor / gainPct;
}

function getHoldingTradeSummary(holding: any) {
  const totalBoughtQty = safeNumber(
    holding?.totalBoughtQty,
    safeNumber(holding?.boughtQty, 0)
  );

  const totalSoldQty = safeNumber(
    holding?.totalSoldQty,
    safeNumber(holding?.soldQty, 0)
  );

  const currentlyHeldQty = safeNumber(
    holding?.currentlyHeldQty,
    safeNumber(
      holding?.holdingQty,
      safeNumber(holding?.quantity, 0)
    )
  );

  return {
    totalBoughtQty,
    totalSoldQty,
    currentlyHeldQty,
  };
}

// ============================================================
// Sort Value
// ============================================================

function getSortValue(
  holding: any,
  key: SortKey
) {
  const trade =
    getHoldingTradeSummary(holding);

  switch (key) {
    case "symbol":
      return (
        holding.symbol ?? ""
      )
        .toString()
        .toLowerCase();

    case "quantity":
      return safeNumber(
        holding.quantity
      );

    case "totalBoughtQty":
      return trade.totalBoughtQty;

    case "totalSoldQty":
      return trade.totalSoldQty;

    case "currentlyHeldQty":
      return trade.currentlyHeldQty;

    case "avgPrice":
      return safeNumber(
        holding.avgPrice
      );

    case "invested":
      return safeNumber(
        holding.invested
      );

    case "currentPrice":
      return safeNumber(
        holding.manualPrice ??
        holding.currentPrice
      );

    case "currentValue":
      return safeNumber(
        holding.currentValue
      );

    case "unrealizedPnL":
      return safeNumber(
        holding.unrealizedPnL
      );

    case "unrealizedGainPct":
      return safeNumber(
        holding.invested
      ) > 0
        ? (
            safeNumber(
              holding.unrealizedPnL
            ) /
            safeNumber(
              holding.invested,
              1
            )
          ) * 100
        : 0;

    case "gainPct":
      return safeNumber(
        holding.gainPct
      );

    // ========================================================
    // MISSED GAIN
    // ========================================================

    case "missedGain":
      return safeNumber(
        holding.missedGain
      );

    case "missedGainPct":
      return safeNumber(
        holding.missedGainPct
      );

    case "rule72":
      return (
        getRuleValue(
          safeNumber(
            holding.gainPct
          ),
          72
        ) ?? 0
      );

    case "rule114":
      return (
        getRuleValue(
          safeNumber(
            holding.gainPct
          ),
          114
        ) ?? 0
      );

    case "rule144":
      return (
        getRuleValue(
          safeNumber(
            holding.gainPct
          ),
          144
        ) ?? 0
      );

    case "holdingAgeDays":
      return safeNumber(
        holding.holdingAgeDays
      );

    case "lastUpdated":
      return (
        Number(
          new Date(
            holding.lastUpdated ?? 0
          ).getTime()
        ) || 0
      );

    case "netPnl":
      return safeNumber(
        holding.netPnl
      );

    default:
      return 0;
  }
}

// ============================================================
// Portfolio Page
// ============================================================

export function PortfolioPage() {
const {
  holdings,
  loading,
  setManualPrices,
} = usePortfolio();

const [showOpenOnly, setShowOpenOnly] = useState(true);

  // ==========================================================
  // Visible holdings
  //
  // Show either only open positions or all positions.
  // ==========================================================

  const visibleHoldings = useMemo(() => {
  if (!showOpenOnly) {
    return holdings;
  }

  return holdings.filter((holding) => {
    const trade =
      getHoldingTradeSummary(holding);

    return trade.currentlyHeldQty !== 0;
  });
}, [holdings, showOpenOnly]);

  // ==========================================================
  // Sorting
  // ==========================================================

  const [
    sortConfig,
    setSortConfig
  ] = useState<{
    key: SortKey;
    direction: "asc" | "desc";
  }>({
    key: "gainPct",
    direction: "desc",
  });

  // ==========================================================
  // Totals
  // ==========================================================

  const totals =
    visibleHoldings.reduce(
      (acc, h) => {
        const trade =
          getHoldingTradeSummary(h);

        const effectivePrice =
          safeNumber(
            h.manualPrice ??
            h.currentPrice
          );

        // IMPORTANT:
        // Current value is based on the actual
        // currently held signed quantity.
        const currentValue =
          trade.currentlyHeldQty *
          effectivePrice;

        return {
          invested:
            acc.invested +
            safeNumber(
              h.invested
            ),

          currentValue:
            acc.currentValue +
            currentValue,

          pnl:
            acc.pnl +
            safeNumber(
              h.netPnl
            ),

          missedGain:
            acc.missedGain +
            safeNumber(
              h.missedGain
            ),

          totalBoughtQty:
            acc.totalBoughtQty +
            trade.totalBoughtQty,

          totalSoldQty:
            acc.totalSoldQty +
            trade.totalSoldQty,

          currentlyHeldQty:
            acc.currentlyHeldQty +
            trade.currentlyHeldQty,
        };
      },
      {
        invested: 0,
        currentValue: 0,
        pnl: 0,
        missedGain: 0,
        totalBoughtQty: 0,
        totalSoldQty: 0,
        currentlyHeldQty: 0,
      }
    );

  // ==========================================================
  // Total Missed Gain %
  //
  // Weighted percentage based on total closed transaction
  // value is not directly available at page level.
  //
  // Therefore use the sum of individual missed-gain
  // percentages weighted by each holding's missed-gain base.
  //
  // For the portfolio display, a simple average of valid
  // missedGainPct values is more misleading, so we calculate
  // a weighted value using:
  //
  // |missedGain| / |missedGainPct|
  //
  // to reconstruct the approximate denominator.
  // ==========================================================

  const totalMissedGainPct =
    useMemo(() => {
      let missedGainBase = 0;

      visibleHoldings.forEach(
        (holding) => {
          const missedGain =
            safeNumber(
              holding.missedGain
            );

          const missedGainPct =
            safeNumber(
              holding.missedGainPct
            );

          if (
            missedGainPct !== 0
          ) {
            const denominator =
              Math.abs(
                missedGain /
                (missedGainPct / 100)
              );

            if (
              Number.isFinite(
                denominator
              )
            ) {
              missedGainBase +=
                denominator;
            }
          }
        }
      );

      return missedGainBase > 0
        ? (
            totals.missedGain /
            missedGainBase
          ) * 100
        : 0;
    }, [
      visibleHoldings,
      totals.missedGain,
    ]);

  // ==========================================================
  // Average Rule Values
  // ==========================================================

  const averageRuleValues =
    useMemo(() => {
      const validEntries =
        visibleHoldings
          .map(
            (holding) => {
              const gainPct =
                safeNumber(
                  holding.gainPct
                );

              return {
                rule72:
                  getRuleValue(
                    gainPct,
                    72
                  ),

                rule114:
                  getRuleValue(
                    gainPct,
                    114
                  ),

                rule144:
                  getRuleValue(
                    gainPct,
                    144
                  ),
              };
            }
          )
          .filter(
            (entry) =>
              entry.rule72 !== null &&
              entry.rule114 !== null &&
              entry.rule144 !== null
          );

      if (!validEntries.length) {
        return {
          rule72: null,
          rule114: null,
          rule144: null,
        };
      }

      const sum =
        validEntries.reduce(
          (acc, entry) => ({
            rule72:
              acc.rule72 +
              (entry.rule72 ?? 0),

            rule114:
              acc.rule114 +
              (entry.rule114 ?? 0),

            rule144:
              acc.rule144 +
              (entry.rule144 ?? 0),
          }),
          {
            rule72: 0,
            rule114: 0,
            rule144: 0,
          }
        );

      return {
        rule72:
          sum.rule72 /
          validEntries.length,

        rule114:
          sum.rule114 /
          validEntries.length,

        rule144:
          sum.rule144 /
          validEntries.length,
      };
    }, [visibleHoldings]);

  // ==========================================================
  // Sorted holdings
  // ==========================================================

  const sortedHoldings =
    useMemo(() => {
      const items =
        [...visibleHoldings];

      items.sort(
        (a, b) => {
          const aValue =
            getSortValue(
              a,
              sortConfig.key
            );

          const bValue =
            getSortValue(
              b,
              sortConfig.key
            );

          if (
            typeof aValue ===
              "string" &&
            typeof bValue ===
              "string"
          ) {
            return sortConfig.direction ===
              "asc"
              ? aValue.localeCompare(
                  bValue
                )
              : bValue.localeCompare(
                  aValue
                );
          }

          const comparison =
            aValue < bValue
              ? -1
              : aValue > bValue
              ? 1
              : 0;

          return sortConfig.direction ===
            "asc"
            ? comparison
            : -comparison;
        }
      );

      return items;
    }, [
      visibleHoldings,
      sortConfig,
    ]);

  // ==========================================================
  // Sort handler
  // ==========================================================

  const handleSort = (
    key: SortKey
  ) => {
    setSortConfig(
      (current) => {
        if (
          current.key === key
        ) {
          return {
            key,
            direction:
              current.direction ===
              "asc"
                ? "desc"
                : "asc",
          };
        }

        return {
          key,
          direction: "asc",
        };
      }
    );
  };
const downloadPortfolioCsv = () => {
  const headers = [
    "Symbol",
    "Qty Bought",
    "Qty Sold",
    "Currently Held",
    "Qty",
    "Avg Price",
    "Invested",
    "Current Price",
    "Current Value",
    "Unrealized Gain",
    "Unrealized Gain %",
    "Gain %",
    "Missed Gain",
    "Missed Gain %",
    "Rule of 72",
    "Rule of 114",
    "Rule of 144",
    "Holding Age (Days)",
    "Last Updated",
    "Net P&L",
  ];

  const escapeCsv = (value: unknown) => {
    const text = String(value ?? "");

    if (
      text.includes(",") ||
      text.includes('"') ||
      text.includes("\n")
    ) {
      return `"${text.replace(/"/g, '""')}"`;
    }

    return text;
  };

  const rows = sortedHoldings.map((h) => {
    const trade =
      getHoldingTradeSummary(h);

    const effectivePrice =
      safeNumber(
        h.manualPrice ??
        h.currentPrice
      );

    const currentValue =
      trade.currentlyHeldQty *
      effectivePrice;

    const invested =
      safeNumber(h.invested);

    const unrealizedPnL =
      safeNumber(h.unrealizedPnL);

    const unrealizedGainPct =
      invested > 0
        ? (unrealizedPnL / invested) * 100
        : 0;

    const gainPct =
      safeNumber(h.gainPct);

    const missedGain =
      safeNumber(h.missedGain);

    const missedGainPct =
      safeNumber(h.missedGainPct);

    const rule72 =
      getRuleValue(gainPct, 72);

    const rule114 =
      getRuleValue(gainPct, 114);

    const rule144 =
      getRuleValue(gainPct, 144);

    return [
      h.symbol,
      trade.totalBoughtQty,
      trade.totalSoldQty,
      trade.currentlyHeldQty,
      safeNumber(h.quantity),
      safeNumber(h.avgPrice).toFixed(2),
      invested.toFixed(2),
      effectivePrice.toFixed(2),
      currentValue.toFixed(2),
      unrealizedPnL.toFixed(2),
      unrealizedGainPct.toFixed(2),
      gainPct.toFixed(2),
      missedGain.toFixed(2),
      missedGainPct.toFixed(2),
      rule72 !== null
        ? rule72.toFixed(2)
        : "",
      rule114 !== null
        ? rule114.toFixed(2)
        : "",
      rule144 !== null
        ? rule144.toFixed(2)
        : "",
      safeNumber(h.holdingAgeDays),
      h.lastUpdated ?? "",
      safeNumber(h.netPnl).toFixed(2),
    ];
  });

  const csv = [
    headers.map(escapeCsv).join(","),
    ...rows.map((row) =>
      row.map(escapeCsv).join(",")
    ),
  ].join("\r\n");

  const blob = new Blob(
    ["\uFEFF" + csv],
    {
      type: "text/csv;charset=utf-8;",
    }
  );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  link.href = url;

  const viewName =
    showOpenOnly
      ? "open-positions"
      : "all-positions";

  const date =
    new Date()
      .toISOString()
      .slice(0, 10);

  link.download =
    `portfolio-${viewName}-${date}.csv`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};
  // ==========================================================
  // Header
  // ==========================================================

  const renderHeader = (
    label: string,
    key: SortKey
  ) => {
    const isActive =
      sortConfig.key === key;

    const arrow = isActive
      ? sortConfig.direction ===
        "asc"
        ? "↑"
        : "↓"
      : "↕";

    return (
      <button
        type="button"
        onClick={() =>
          handleSort(key)
        }
        style={{
          background:
            "transparent",
          border: "none",
          color: "inherit",
          cursor: "pointer",
          fontWeight: 700,
          display:
            "inline-flex",
          alignItems:
            "center",
          gap: 6,
          padding: 0,
        }}
      >
        <span>
          {label}
        </span>

        <span
          style={{
            fontSize: 12,
            opacity: 0.8,
          }}
        >
          {arrow}
        </span>
      </button>
    );
  };

  // ==========================================================
  // Render
  // ==========================================================

  return (
    <div
      style={{
        padding: 16,
      }}
    >
      {/* =====================================================
          Header
      ====================================================== */}

      <div
        style={{
          display: "flex",
          justifyContent:
            "space-between",
          alignItems:
            "center",
          gap: 12,
          flexWrap:
            "wrap",
        }}
      >
        <div>
          <h1
            style={{
              margin: 0,
            }}
          >
            Portfolio
          </h1>

          <p
            style={{
              margin:
                "4px 0 0",
              color:
                "#6b7280",
            }}
          >
            Current holdings and
            performance.
          </p>
        </div>

        {loading ? (
          <div
            style={{
              display:
                "inline-flex",
              alignItems:
                "center",
              gap: 8,
              padding:
                "6px 10px",
              borderRadius:
                999,
              background:
                "#f3f4f6",
              color:
                "#6b7280",
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius:
                  "50%",
                background:
                  "#60a5fa",
                display:
                  "inline-block",
              }}
            />

            Refreshing
            portfolio…
          </div>
        ) : null}
      </div>

      {/* =====================================================
          Rule Cards
      ====================================================== */}

      <div
        style={{
          marginTop: 16,
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(180px, 1fr))",
          gap: 12,
        }}
      >
        <div
          style={{
            padding: 12,
            border:
              "1px solid #e5e7eb",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginBottom: 6,
            }}
          >
            Running Avg Rule of 72
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {formatRuleYears(
              averageRuleValues.rule72
            )}
          </div>
        </div>

        <div
          style={{
            padding: 12,
            border:
              "1px solid #e5e7eb",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginBottom: 6,
            }}
          >
            Running Avg Rule of 114
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {formatRuleYears(
              averageRuleValues.rule114
            )}
          </div>
        </div>

        <div
          style={{
            padding: 12,
            border:
              "1px solid #e5e7eb",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginBottom: 6,
            }}
          >
            Running Avg Rule of 144
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {formatRuleYears(
              averageRuleValues.rule144
            )}
          </div>
        </div>

        {/* ===================================================
            Missed Gain Summary
        ==================================================== */}

        <div
          style={{
            padding: 12,
            border:
              "1px solid #e5e7eb",
            borderRadius: 10,
            background: "#fff",
          }}
        >
          <div
            style={{
              fontSize: 12,
              color: "#6b7280",
              marginBottom: 6,
            }}
          >
            Total Missed Gain
          </div>

          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              color:
                totals.missedGain >= 0
                  ? "#16a34a"
                  : "#dc2626",
            }}
          >
            {formatInr(
              totals.missedGain
            )}
          </div>

          <div
            style={{
              fontSize: 12,
              marginTop: 4,
              color:
                totalMissedGainPct >= 0
                  ? "#16a34a"
                  : "#dc2626",
            }}
          >
            {totalMissedGainPct >= 0
              ? "+"
              : ""}
            {totalMissedGainPct.toFixed(
              2
            )}
            %
          </div>
        </div>
      </div>
{/* =====================================================
    Portfolio Controls
====================================================== */}

<div
  style={{
    marginTop: 16,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    flexWrap: "wrap",
  }}
>
  {/* Open / All Toggle */}

  <div
    style={{
      display: "inline-flex",
      padding: 4,
      border: "1px solid #d1d5db",
      borderRadius: 10,
      background: "#f9fafb",
      gap: 4,
    }}
  >
    <button
      type="button"
      onClick={() =>
        setShowOpenOnly(true)
      }
      style={{
        padding: "8px 14px",
        borderRadius: 7,
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
        background: showOpenOnly
          ? "#111827"
          : "transparent",
        color: showOpenOnly
          ? "#ffffff"
          : "#6b7280",
      }}
    >
      Open Positions
    </button>

    <button
      type="button"
      onClick={() =>
        setShowOpenOnly(false)
      }
      style={{
        padding: "8px 14px",
        borderRadius: 7,
        border: "none",
        cursor: "pointer",
        fontWeight: 600,
        background: !showOpenOnly
          ? "#111827"
          : "transparent",
        color: !showOpenOnly
          ? "#ffffff"
          : "#6b7280",
      }}
    >
      All Positions
    </button>
  </div>

  {/* Download CSV */}

  <button
    type="button"
    onClick={
      downloadPortfolioCsv
    }
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      padding: "9px 16px",
      borderRadius: 8,
      border: "1px solid #d1d5db",
      background: "#ffffff",
      color: "#111827",
      cursor: "pointer",
      fontWeight: 600,
    }}
  >
    <span
      style={{
        fontSize: 16,
      }}
    >
      ↓
    </span>

    Download CSV
  </button>
</div>
      {/* =====================================================
          Portfolio Table
      ====================================================== */}

      <div
        style={{
          marginTop: 16,
          overflowX: "auto",
          border:
            "1px solid #e5e7eb",
          borderRadius: 12,
          background: "white",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse:
              "collapse",
          }}
        >
          <thead>
            <tr
              style={{
                background:
                  "#f9fafb",
                textAlign:
                  "left",
              }}
            >
              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Symbol",
                  "symbol"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Qty Bought",
                  "totalBoughtQty"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Qty Sold",
                  "totalSoldQty"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Currently Held",
                  "currentlyHeldQty"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Qty",
                  "quantity"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Avg Price",
                  "avgPrice"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Invested",
                  "invested"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Current Price",
                  "currentPrice"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Current Value",
                  "currentValue"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Unrealized Gain",
                  "unrealizedPnL"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Unrealized Gain %",
                  "unrealizedGainPct"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Gain %",
                  "gainPct"
                )}
              </th>

              {/* =================================================
                  NEW: MISSED GAIN
              ================================================== */}

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Missed Gain",
                  "missedGain"
                )}
              </th>

              {/* =================================================
                  NEW: MISSED GAIN %
              ================================================== */}

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Missed Gain %",
                  "missedGainPct"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Rule of 72",
                  "rule72"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Rule of 114",
                  "rule114"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Rule of 144",
                  "rule144"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Age",
                  "holdingAgeDays"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Last Updated",
                  "lastUpdated"
                )}
              </th>

              <th
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {renderHeader(
                  "Net P&L",
                  "netPnl"
                )}
              </th>
            </tr>
          </thead>

          <tbody>
            {sortedHoldings.map(
              (h) => {
                const trade =
                  getHoldingTradeSummary(
                    h
                  );

                const effectivePrice =
                  safeNumber(
                    h.manualPrice ??
                    h.currentPrice
                  );

                // IMPORTANT:
                // Use actual signed position,
                // not historical BUY quantity.
                const computedCurrentValue =
                  trade.currentlyHeldQty *
                  effectivePrice;

                const unrealizedGainPct =
                  safeNumber(
                    h.invested
                  ) > 0
                    ? (
                        safeNumber(
                          h.unrealizedPnL
                        ) /
                        safeNumber(
                          h.invested,
                          1
                        )
                      ) * 100
                    : 0;

                const missedGain =
                  safeNumber(
                    h.missedGain
                  );

                const missedGainPct =
                  safeNumber(
                    h.missedGainPct
                  );

                const rate =
                  safeNumber(
                    h.gainPct
                  ) > 0
                    ? safeNumber(
                        h.gainPct
                      )
                    : 0;

                const rule72 =
                  getRuleValue(
                    rate,
                    72
                  );

                const rule114 =
                  getRuleValue(
                    rate,
                    114
                  );

                const rule144 =
                  getRuleValue(
                    rate,
                    144
                  );

                return (
                  <tr
                    key={h.symbol}
                    style={{
                      borderBottom:
                        "1px solid #f3f4f6",
                    }}
                  >
                    {/* Symbol */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                        fontWeight:
                          600,
                      }}
                    >
                      {h.symbol}
                    </td>

                    {/* Qty Bought */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                      }}
                    >
                      {
                        trade.totalBoughtQty
                      }
                    </td>

                    {/* Qty Sold */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                      }}
                    >
                      {
                        trade.totalSoldQty
                      }
                    </td>

                    {/* Currently Held */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                        fontWeight:
                          600,
                        color:
                          trade.currentlyHeldQty >
                          0
                            ? "#16a34a"
                            : trade.currentlyHeldQty <
                              0
                            ? "#dc2626"
                            : "#6b7280",
                      }}
                    >
                      {
                        trade.currentlyHeldQty
                      }
                    </td>

                    {/* Quantity */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                      }}
                    >
                      {safeNumber(
                        h.quantity,
                        0
                      )}
                    </td>

                    {/* Average Price */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                      }}
                    >
                      {formatInr(
                        safeNumber(
                          h.avgPrice
                        )
                      )}
                    </td>

                    {/* Invested */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                      }}
                    >
                      {formatInr(
                        safeNumber(
                          h.invested
                        )
                      )}
                    </td>

                    {/* Current Price */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                      }}
                    >
                      <input
                        type="number"
                        step="0.01"
                        value={Number(
                          h.manualPrice ??
                            h.currentPrice ??
                            0
                        )}
                        onChange={(
                          event
                        ) => {
                          const nextValue =
                            Number(
                              event
                                .target
                                .value
                            );

                          setManualPrices(
                            (current) => {
                              const next =
                                {
                                  ...current,
                                };

                              if (
                                Number.isFinite(
                                  nextValue
                                ) &&
                                nextValue >=
                                  0
                              ) {
                                next[
                                  h.symbol
                                ] = {
                                  price:
                                    nextValue,

                                  lastUpdated:
                                    new Date().toISOString(),
                                };
                              } else {
                                delete next[
                                  h.symbol
                                ];
                              }

                              return next;
                            }
                          );
                        }}
                        style={{
                          width: 96,
                          padding:
                            "6px 8px",
                          borderRadius:
                            8,
                          border:
                            "1px solid #d1d5db",
                        }}
                      />
                    </td>

                    {/* Current Value */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                      }}
                    >
                      {formatInr(
                        computedCurrentValue
                      )}
                    </td>

                    {/* Unrealized Gain */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                        color:
                          safeNumber(
                            h.unrealizedPnL
                          ) >= 0
                            ? "#16a34a"
                            : "#dc2626",
                        fontWeight:
                          600,
                      }}
                    >
                      {formatInr(
                        safeNumber(
                          h.unrealizedPnL
                        )
                      )}
                    </td>

                    {/* Unrealized Gain % */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                        color:
                          unrealizedGainPct >=
                          0
                            ? "#16a34a"
                            : "#dc2626",
                        fontWeight:
                          600,
                      }}
                    >
                      {`${
                        unrealizedGainPct >=
                        0
                          ? "+"
                          : ""
                      }${unrealizedGainPct.toFixed(
                        1
                      )}%`}
                    </td>

                    {/* Gain % */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                        color:
                          safeNumber(
                            h.gainPct
                          ) >= 0
                            ? "#16a34a"
                            : "#dc2626",
                        fontWeight:
                          600,
                      }}
                    >
                      {`${
                        safeNumber(
                          h.gainPct
                        ) >= 0
                          ? "+"
                          : ""
                      }${safeNumber(
                        h.gainPct
                      ).toFixed(1)}%`}
                    </td>

                    {/* =================================================
                        MISSED GAIN
                    ================================================== */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                        color:
                          missedGain >= 0
                            ? "#16a34a"
                            : "#dc2626",
                        fontWeight:
                          700,
                      }}
                    >
                      {formatInr(
                        missedGain
                      )}
                    </td>

                    {/* =================================================
                        MISSED GAIN %
                    ================================================== */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                        color:
                          missedGainPct >=
                          0
                            ? "#16a34a"
                            : "#dc2626",
                        fontWeight:
                          700,
                      }}
                    >
                      {`${
                        missedGainPct >=
                        0
                          ? "+"
                          : ""
                      }${missedGainPct.toFixed(
                        2
                      )}%`}
                    </td>

                    {/* Rule 72 */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                        fontWeight:
                          600,
                        color:
                          "#111827",
                      }}
                    >
                      {formatRuleYears(
                        rule72
                      )}
                    </td>

                    {/* Rule 114 */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                        fontWeight:
                          600,
                        color:
                          "#111827",
                      }}
                    >
                      {formatRuleYears(
                        rule114
                      )}
                    </td>

                    {/* Rule 144 */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                        fontWeight:
                          600,
                        color:
                          "#111827",
                      }}
                    >
                      {formatRuleYears(
                        rule144
                      )}
                    </td>

                    {/* Holding Age */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                        fontSize: 12,
                        color:
                          "#6b7280",
                      }}
                    >
                      {h.holdingAgeDays ??
                        "New"}
                    </td>

                    {/* Last Updated */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                        fontSize: 12,
                        color:
                          "#6b7280",
                      }}
                    >
                      {h.lastUpdated
                        ? new Date(
                            h.lastUpdated
                          ).toLocaleString(
                            "en-IN",
                            {
                              dateStyle:
                                "medium",
                              timeStyle:
                                "short",
                            }
                          )
                        : "Not updated"}
                    </td>

                    {/* Net P&L */}

                    <td
                      style={{
                        padding:
                          "10px 8px",
                        color:
                          safeNumber(
                            h.netPnl
                          ) >= 0
                            ? "#16a34a"
                            : "#dc2626",
                        fontWeight:
                          600,
                      }}
                    >
                      {formatInr(
                        safeNumber(
                          h.netPnl
                        )
                      )}
                    </td>
                  </tr>
                );
              }
            )}

            {/* ===================================================
                TOTAL ROW
            ==================================================== */}

            <tr
              style={{
                background:
                  "#f9fafb",
                fontWeight: 700,
              }}
            >
              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                Total
              </td>

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {
                  totals.totalBoughtQty
                }
              </td>

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {
                  totals.totalSoldQty
                }
              </td>

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {
                  totals.currentlyHeldQty
                }
              </td>

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              />

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              />

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {formatInr(
                  totals.invested
                )}
              </td>

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              />

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              >
                {formatInr(
                  totals.currentValue
                )}
              </td>

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              />

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              />

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              />

              {/* Total Missed Gain */}

              <td
                style={{
                  padding:
                    "10px 8px",
                  color:
                    totals.missedGain >=
                    0
                      ? "#16a34a"
                      : "#dc2626",
                  fontWeight:
                    700,
                }}
              >
                {formatInr(
                  totals.missedGain
                )}
              </td>

              {/* Total Missed Gain % */}

              <td
                style={{
                  padding:
                    "10px 8px",
                  color:
                    totalMissedGainPct >=
                    0
                      ? "#16a34a"
                      : "#dc2626",
                  fontWeight:
                    700,
                }}
              >
                {`${
                  totalMissedGainPct >=
                  0
                    ? "+"
                    : ""
                }${totalMissedGainPct.toFixed(
                  2
                )}%`}
              </td>

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              />

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              />

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              />

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              />

              <td
                style={{
                  padding:
                    "10px 8px",
                }}
              />

              <td
                style={{
                  padding:
                    "10px 8px",
                  color:
                    totals.pnl >= 0
                      ? "#16a34a"
                      : "#dc2626",
                }}
              >
                {formatInr(
                  totals.pnl
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}