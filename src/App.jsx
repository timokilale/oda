import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MenuPage from "./pages/MenuPage.jsx";
import OrdersPage from "./pages/OrdersPage.jsx";
import PublicOrderPage from "./pages/PublicOrderPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import RestaurantSettingsPage from "./pages/RestaurantSettingsPage.jsx";
import ReportsPage from "./pages/ReportsPage.jsx";
import RestaurantLayout from "./pages/RestaurantLayout.jsx";
import TablesPage from "./pages/TablesPage.jsx";

function ProtectedOutlet() {
  const { owner, loading } = useAuth();

  if (loading) {
    return <div className="app-shell">Loading your workspace...</div>;
  }

  if (!owner) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}

function HomeRedirect() {
  const { owner, loading } = useAuth();

  if (loading) {
    return <div className="app-shell">Loading your workspace...</div>;
  }

  return <Navigate to={owner ? "/dashboard" : "/login"} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeRedirect />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedOutlet />}>
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/restaurants/:restaurantId" element={<RestaurantLayout />}>
            <Route index element={<Navigate to="orders" replace />} />
            <Route path="orders" element={<OrdersPage />} />
            <Route path="menu" element={<MenuPage />} />
            <Route path="tables" element={<TablesPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<RestaurantSettingsPage />} />
          </Route>
        </Route>

        <Route path="/order/:restaurantRef" element={<PublicOrderPage />} />
        <Route path="/r/:restaurantRef/order" element={<PublicOrderPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
