import {
  HashRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AppShell } from "../layout/AppShell";

import { DashboardPage } from "../features/dashboard/pages/DashboardPage";
import { OrdersPage } from "../features/orders/pages/OrdersPage";
import { PortfolioPage } from "../features/portfolio/pages/PortfolioPage";
import { TransactionsPage } from "../features/transactions/pages/TransactionsPage";
import { WatchlistPage } from "../features/watchlist/pages/WatchlistPage";
import { ExpenseDashboardPage } from "../features/expenses/pages/ExpenseDashboardPage";
import { ExpenseTrackerPage } from "../features/expenses/pages/ExpenseTrackerPage";
import { ExpenseReportsPage } from "../features/expenses/pages/ExpenseReportsPage";
import { SavingsDashboardPage } from "../features/expenses/pages/SavingsDashboardPage";
import { ReportsPage } from "../features/reports/pages/ReportsPage";
import { SettingsPage } from "../features/settings/pages/SettingsPage";

export function AppRouter() {
  return (
    <HashRouter>
      <AppShell>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/portfolio" element={<PortfolioPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/expenses-dashboard" element={<ExpenseDashboardPage />} />
          <Route path="/savings" element={<SavingsDashboardPage />} />
          <Route path="/expenses" element={<ExpenseTrackerPage />} />
          <Route path="/expense-reports" element={<ExpenseReportsPage />} />
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}