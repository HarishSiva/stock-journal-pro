import { NavLink } from "react-router-dom";

const menuItems = [
  {
    title: "Dashboard",
    path: "/dashboard",
    icon: "🏠",
  },
  {
    title: "Orders",
    path: "/orders",
    icon: "📒",
  },
  {
    title: "Portfolio",
    path: "/portfolio",
    icon: "💼",
  },
  {
    title: "Watchlist",
    path: "/watchlist",
    icon: "⭐",
  },
  {
    title: "Reports",
    path: "/reports",
    icon: "📊",
  },
  {
    title: "Settings",
    path: "/settings",
    icon: "⚙️",
  },
];

export function Sidebar() {
  return (
    <aside style={sidebar}>
      <div style={logo}>
        Stock Journal Pro
      </div>

      <nav>
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            style={({ isActive }) => ({
              ...menuItem,
              background: isActive
                ? "#2563eb"
                : "transparent",
              color: isActive
                ? "#fff"
                : "#1f2937",
            })}
          >
            <span>{item.icon}</span>

            <span>{item.title}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}

const sidebar: React.CSSProperties = {
  width: 240,
  height: "100vh",
  background: "#f8fafc",
  borderRight: "1px solid #e5e7eb",
  padding: 20,
  boxSizing: "border-box",
};

const logo: React.CSSProperties = {
  fontSize: 22,
  fontWeight: 700,
  marginBottom: 40,
};

const menuItem: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 12,
  textDecoration: "none",
  padding: "12px 16px",
  borderRadius: 8,
  marginBottom: 8,
  transition: "all .2s",
};