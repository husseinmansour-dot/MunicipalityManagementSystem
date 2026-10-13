
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
} from "react-router-dom";

import Requests from "./pages/Requests";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Dashboard from "./pages/Dashboard";
import Citizens from "./pages/Citizens";
import Login from "./pages/Login";
import Permits from "./pages/Permits";
import Finance from "./pages/Finance";
import Reports from "./pages/Reports";
import UsersRoles from "./pages/UsersRoles";
import Settings from "./pages/Settings";
import Projects from "./pages/Projects";
import HR from "./pages/HR";
import Community from "./pages/Community";
import Documents from "./pages/Documents";
import AuditLogs from "./pages/AuditLogs";

import { isAdmin } from "./utils/auth";

function MainLayout() {
  return (
    <div className="flex min-h-screen bg-[#F5F7FB]">
      <Sidebar />

      <div className="flex-1 min-w-0">
        <Header />

        <main className="p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

function ProtectedLayout() {
  const token = sessionStorage.getItem("token");

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />;
}

function AdminOnly({ children }) {
  return isAdmin()
    ? children
    : <Navigate to="/dashboard" replace />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public route */}
        <Route path="/login" element={<Login />} />

        {/* Protected routes */}
        <Route element={<ProtectedLayout />}>

          <Route path="/dashboard" element={<Dashboard />} />

          <Route path="/citizens" element={<Citizens />} />

          <Route path="/requests" element={<Requests />} />

          <Route path="/permits" element={<Permits />} />

          <Route path="/finance" element={<Finance />} />

          <Route path="/reports" element={<Reports />} />

          <Route path="/settings" element={<Settings />} />

          <Route path="/projects" element={<Projects />} />

          <Route path="/community" element={<Community />} />

          <Route path="/documents" element={<Documents />} />

          {/* Admin-only routes */}
          <Route
            path="/users-roles"
            element={
              <AdminOnly>
                <UsersRoles />
              </AdminOnly>
            }
          />

          <Route
            path="/hr"
            element={
              <AdminOnly>
                <HR />
              </AdminOnly>
            }
          />

          <Route
            path="/audit-logs"
            element={
              <AdminOnly>
                <AuditLogs />
              </AdminOnly>
            }
          />

        </Route>

        {/* Default route */}
        <Route
          path="*"
          element={<Navigate to="/dashboard" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
