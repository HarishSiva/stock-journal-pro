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
import { WatchlistPage } from "../features/watchlist/pages/WatchlistPage";
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
          <Route path="/watchlist" element={<WatchlistPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </AppShell>
    </HashRouter>
  );
}