import {
  BarChart3,
  Briefcase,
  ClipboardList,
  FileText,
  Home,
  Settings,
} from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/", label: "Dashboard", icon: Home },
  { to: "/portfolio", label: "Portfolio", icon: Briefcase },
  { to: "/orders", label: "Orders", icon: ClipboardList },
  { to: "/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/reports", label: "Reports", icon: FileText },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="flex h-screen w-64 flex-col border-r bg-white">
      <div className="border-b p-6">
        <h1 className="text-xl font-bold">📈 Stock Journal Pro</h1>
      </div>

      <nav className="flex-1 p-4">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "mb-2 flex items-center gap-3 rounded-lg px-3 py-2 transition-colors",
                isActive
                  ? "bg-slate-900 text-white"
                  : "text-slate-700 hover:bg-slate-100",
              ].join(" ")
            }
          >
            <Icon size={18} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}