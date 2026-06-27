import { createBrowserRouter } from "react-router-dom";

import AppLayout from "../components/layout/AppLayout";

import DashboardPage from "../features/dashboard/pages/DashboardPage";
import PortfolioPage from "../features/portfolio/pages/PortfolioPage";
import OrdersPage from "../features/orders/pages/OrdersPage";
import AnalyticsPage from "../features/analytics/pages/AnalyticsPage";
import ReportsPage from "../features/reports/pages/ReportsPage";
import SettingsPage from "../features/settings/pages/SettingsPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "portfolio",
        element: <PortfolioPage />,
      },
      {
        path: "orders",
        element: <OrdersPage />,
      },
      {
        path: "analytics",
        element: <AnalyticsPage />,
      },
      {
        path: "reports",
        element: <ReportsPage />,
      },
      {
        path: "settings",
        element: <SettingsPage />,
      },
    ],
  },
]);