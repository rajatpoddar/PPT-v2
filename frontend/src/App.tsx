import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import { Layout } from "./components/layout/Layout";
import { LoginPage } from "./pages/auth/LoginPage";
import { OwnerDashboard } from "./pages/owner/Dashboard";
import { SitesList } from "./pages/owner/sites/SitesList";
import { SiteDetail } from "./pages/owner/sites/SiteDetail";
import { CreateSite } from "./pages/owner/sites/CreateSite";
import { LaboursList } from "./pages/owner/labours/LaboursList";
import { AddLabour } from "./pages/owner/labours/AddLabour";
import { PaymentsPage } from "./pages/owner/payments/PaymentsPage";
import { ExpensesPage } from "./pages/owner/expenses/ExpensesPage";
import { EquipmentPage } from "./pages/owner/equipment/EquipmentPage";
import { InvestorsList } from "./pages/owner/investors/InvestorsList";
import { ReportsPage } from "./pages/owner/reports/ReportsPage";
import { SettingsPage } from "./pages/owner/settings/SettingsPage";
import { InvestorPortal } from "./pages/investor/InvestorPortal";
import type { UserRole } from "./types";

// Route guard
function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Redirect to appropriate dashboard
    if (user.role === "investor") return <Navigate to="/investor-portal" replace />;
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Redirect based on role after login
function RoleRedirect() {
  const { user } = useAuthStore();
  if (user?.role === "investor") return <Navigate to="/investor-portal" replace />;
  return <Navigate to="/dashboard" replace />;
}

export default function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route
          path="/login"
          element={isAuthenticated ? <RoleRedirect /> : <LoginPage />}
        />

        {/* Root redirect */}
        <Route
          path="/"
          element={
            isAuthenticated ? <RoleRedirect /> : <Navigate to="/login" replace />
          }
        />

        {/* Owner + Site Incharge routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["owner", "site_incharge"]}>
              <Layout>
                <OwnerDashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Sites */}
        <Route
          path="/sites"
          element={
            <ProtectedRoute allowedRoles={["owner", "site_incharge"]}>
              <Layout>
                <SitesList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sites/new"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Layout>
                <CreateSite />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/sites/:id"
          element={
            <ProtectedRoute allowedRoles={["owner", "site_incharge"]}>
              <Layout>
                <SiteDetail />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Labour */}
        <Route
          path="/labours"
          element={
            <ProtectedRoute allowedRoles={["owner", "site_incharge"]}>
              <Layout>
                <LaboursList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/labours/new"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Layout>
                <AddLabour />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Attendance (global view) */}
        <Route
          path="/attendance"
          element={
            <ProtectedRoute allowedRoles={["owner", "site_incharge"]}>
              <Layout>
                <SitesList />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Payments */}
        <Route
          path="/payments"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Layout>
                <PaymentsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Expenses */}
        <Route
          path="/expenses"
          element={
            <ProtectedRoute allowedRoles={["owner", "site_incharge"]}>
              <Layout>
                <ExpensesPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Equipment */}
        <Route
          path="/equipment"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Layout>
                <EquipmentPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Investors */}
        <Route
          path="/investors"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Layout>
                <InvestorsList />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Reports */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute allowedRoles={["owner"]}>
              <Layout>
                <ReportsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Settings */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Investor Portal */}
        <Route
          path="/investor-portal"
          element={
            <ProtectedRoute allowedRoles={["investor"]}>
              <Layout>
                <InvestorPortal />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* More page (mobile) */}
        <Route
          path="/more"
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
