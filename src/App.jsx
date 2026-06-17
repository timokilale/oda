import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import { apiRequest } from "./lib/api.js";
import ApiLogPanel from "./components/ApiLogPanel.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MenuCreatePage from "./pages/MenuCreatePage.jsx";
import MenuPage from "./pages/MenuPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import PublicOrderPage from "./pages/PublicOrderPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import RestaurantSettingsPage from "./pages/RestaurantSettingsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import RestaurantLayout from "./pages/RestaurantLayout.jsx";
import SetupPage from "./pages/SetupPage.jsx";
import TablesCreatePage from "./pages/TablesCreatePage.jsx";
import TablesPage from "./pages/TablesPage.jsx";

function RedirectToCanonicalOrder() {
  const { restaurantRef } = useParams();
  const [searchParams] = useSearchParams();
  const query = searchParams.toString();
  return <Navigate to={`/order/${restaurantRef}${query ? `?${query}` : ""}`} replace />;
}

function ProtectedOutlet() {
  const { owner, loading, refreshSession } = useAuth();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (checking) {
      if (owner) {
        setChecking(false);
      } else {
        refreshSession().finally(() => setChecking(false));
      }
    }
  }, [checking, owner, refreshSession]);

  if (checking || loading) {
    return <div className="mx-auto max-w-[1280px] px-4 py-8 text-muted-foreground">Loading your workspace...</div>;
  }

  if (!owner) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function HomeRedirect() {
  const navigate = useNavigate();

  useEffect(() => {
    apiRequest("/auth/me").then((data) => {
      navigate(data.owner ? "/dashboard" : "/login", { replace: true });
    }).catch(() => {
      navigate("/login", { replace: true });
    });
  }, [navigate]);

  return <div className="mx-auto max-w-[1280px] px-4 py-8 text-muted-foreground">Loading...</div>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ApiLogPanel />
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedOutlet />}>
          <Route
            path="/dashboard"
            element={
              <ErrorBoundary fallbackMessage="Dashboard crashed">
                <DashboardPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/setup"
            element={
              <ErrorBoundary fallbackMessage="Setup crashed">
                <SetupPage />
              </ErrorBoundary>
            }
          />
          <Route path="/restaurants/:restaurantId" element={<RestaurantLayout />}>
            <Route index element={<Navigate to="orders" replace />} />
            <Route
              path="orders"
              element={
                <ErrorBoundary fallbackMessage="Orders page crashed">
                  <OrdersPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="menu/new"
              element={
                <ErrorBoundary fallbackMessage="Menu editor crashed">
                  <MenuCreatePage />
                </ErrorBoundary>
              }
            />
            <Route
              path="menu"
              element={
                <ErrorBoundary fallbackMessage="Menu page crashed">
                  <MenuPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="tables/new"
              element={
                <ErrorBoundary fallbackMessage="Table creator crashed">
                  <TablesCreatePage />
                </ErrorBoundary>
              }
            />
            <Route
              path="tables"
              element={
                <ErrorBoundary fallbackMessage="Tables page crashed">
                  <TablesPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="reports"
              element={
                <ErrorBoundary fallbackMessage="Reports page crashed">
                  <ReportsPage />
                </ErrorBoundary>
              }
            />
            <Route
              path="settings"
              element={
                <ErrorBoundary fallbackMessage="Settings page crashed">
                  <RestaurantSettingsPage />
                </ErrorBoundary>
              }
            />
          </Route>
        </Route>

        <Route
          path="/order/:restaurantRef"
          element={
            <ErrorBoundary fallbackMessage="Order page crashed">
              <PublicOrderPage />
            </ErrorBoundary>
          }
        />
        <Route path="/r/:restaurantRef/order" element={<RedirectToCanonicalOrder />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
