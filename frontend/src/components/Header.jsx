
import {
  Search,
  Bell,
  ChevronDown
} from "lucide-react";

import { useLocation } from "react-router-dom";
import { getCurrentUser, getUserRole } from "../utils/auth";
import GlobalSearch from "./GlobalSearch";
import NotificationBell from "./NotificationBell";

const pageTitles = {
  "/dashboard": "Dashboard",
  "/citizens": "Citizens",
  "/requests": "Requests",
  "/permits": "Permits",
  "/finance": "Finance",
  "/projects": "Projects",
  "/reports": "Reports",
  "/users-roles": "Users & Roles",
  "/settings": "Settings",
  "/hr": "Human Resources",
  "/community": "Events & Announcements",
  "/documents": "Documents",
  "/audit-logs": "Audit Logs"
};

function Header() {
  const location = useLocation();

  // Retrieve the currently logged-in user
  const currentUser = getCurrentUser();

  const fullName = currentUser?.fullName || "Unknown User";
  const roleName = getUserRole() || "UNKNOWN";

  // Automatically update the page title
  const currentPage =
    pageTitles[location.pathname] || "Dashboard";

  // Get the first letter of the user's name
  const userInitial = fullName.charAt(0).toUpperCase();

  return (
    <header className="bg-white border-b border-slate-200 px-8 py-4">
      <div className="flex items-center justify-between gap-4">

        {/* Left section */}
        <div>
          <p className="text-sm text-slate-400 mb-1">
            Pages / {currentPage}
          </p>

          <h1 className="text-2xl font-bold text-[#17365D]">
            {currentPage}
          </h1>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-5">

          {/* Global Search */}
            <GlobalSearch />

          {/* Notifications */}
            <NotificationBell />

          {/* User profile */}
          <div className="flex items-center gap-3 border-l border-slate-200 pl-5">

            {/* User avatar */}
            <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
              {userInitial}
            </div>

            {/* User name and role */}
            <div className="hidden sm:block">
              <p className="text-sm font-semibold text-slate-800">
                {fullName}
              </p>

              <p className="text-xs text-slate-400">
                {roleName}
              </p>
            </div>

            <ChevronDown
              size={16}
              className="hidden sm:block text-slate-400"
            />
          </div>

        </div>
      </div>
    </header>
  );
}

export default Header;
