
import {
  Landmark,
  LayoutDashboard,
  Users,
  ClipboardList,
  FileCheck,
  Wallet,
  ChartNoAxesCombined,
  UserCog,
  Settings,
  FolderKanban,
  LogOut,
  BriefcaseBusiness,
  Megaphone,
  Files,
  ScrollText
} from "lucide-react";

import { NavLink, useNavigate } from "react-router-dom";
import {
  getCurrentUser,
  getUserRole,
  isAdmin
} from "../utils/auth";

const menuItems = [
  {
    name: "Dashboard",
    icon: LayoutDashboard,
    path: "/dashboard"
  },
  {
    name: "Citizens",
    icon: Users,
    path: "/citizens"
  },
  {
    name: "Requests",
    icon: ClipboardList,
    path: "/requests"
  },
  {
    name: "Permits",
    icon: FileCheck,
    path: "/permits"
  },
  {
    name: "Finance",
    icon: Wallet,
    path: "/finance"
  },
  {
    name: "Reports",
    icon: ChartNoAxesCombined,
    path: "/reports"
  },
  {
    name: "Users & Roles",
    icon: UserCog,
    path: "/users-roles",
    adminOnly: true
  },
  {
    name: "Settings",
    icon: Settings,
    path: "/settings"
  },
  {
    name: "Projects",
    icon: FolderKanban,
    path: "/projects"
  },
  {
    name: "Human Resources",
    icon: BriefcaseBusiness,
    path: "/hr",
    adminOnly: true
  },
  {
    name: "Events & Announcements",
    icon: Megaphone,
    path: "/community"
  },
  {
    name: "Documents",
    icon: Files,
    path: "/documents"
  },
  {
    name: "Audit Logs",
    icon: ScrollText,
    path: "/audit-logs",
    adminOnly: true
  }
];

function Sidebar() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const fullName = currentUser?.fullName || "Unknown User";
  const roleName = getUserRole() || "UNKNOWN";
  const admin = isAdmin();

  const visibleMenuItems = menuItems.filter(
    (item) => !item.adminOnly || admin
  );

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
    navigate("/login", { replace: true });
  };

  return (
    <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col bg-[#102A43] text-white">

      {/* Municipality Logo */}
      <div className="shrink-0 border-b border-white/10 px-4 py-6">
        <div className="flex items-center gap-3">
          <div className="shrink-0 rounded-lg bg-blue-500 p-2">
            <Landmark size={24} />
          </div>

          <div className="min-w-0">
            <h2 className="text-base font-bold leading-tight">
              Municipality
            </h2>

            <p className="text-xs text-slate-300">
              Management System
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-6">
        <p className="mb-4 px-4 text-xs uppercase tracking-wider text-slate-400">
          Main Menu
        </p>

        {visibleMenuItems.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              <Icon size={19} className="shrink-0" />

              <span className="text-sm font-medium">
                {item.name}
              </span>
            </NavLink>
          );
        })}
      </nav>

      {/* User Information */}
      <div className="shrink-0 border-t border-white/10 p-4">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-500 font-bold">
            {fullName.charAt(0).toUpperCase()}
          </div>

          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">
              {fullName}
            </p>

            <p className="text-xs text-slate-400">
              {roleName}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-slate-300 transition-colors hover:bg-white/10 hover:text-white"
        >
          <LogOut size={18} />
          <span className="text-sm">Logout</span>
        </button>
      </div>

    </aside>
  );
}

export default Sidebar;
