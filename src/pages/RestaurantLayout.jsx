import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import WorkspaceShell from "../components/WorkspaceShell.jsx";
import { RestaurantWorkspaceContext } from "../context/RestaurantWorkspaceContext.jsx";
import { apiRequest } from "../lib/api.js";
import MenuCreatePage from "./MenuCreatePage.jsx";
import MenuPage from "./MenuPage.jsx";
import OrdersPage from "./OrdersPage.jsx";
import ReportsPage from "./ReportsPage.jsx";
import RestaurantSettingsPage from "./RestaurantSettingsPage.jsx";
import TablesCreatePage from "./TablesCreatePage.jsx";
import TablesPage from "./TablesPage.jsx";

const PRELOADED_VIEW_KEYS = ["orders", "menu", "tables", "reports", "settings"];

function resolveCurrentSection(pathname) {
  if (pathname.includes("/orders")) {
    return "orders";
  }

  if (pathname.includes("/menu")) {
    return "menu";
  }

  if (pathname.includes("/tables")) {
    return "tables";
  }

  if (pathname.includes("/reports")) {
    return "reports";
  }

  if (pathname.includes("/settings")) {
    return "settings";
  }

  return "restaurants";
}

function resolveViewKey(pathname) {
  if (pathname.includes("/menu/new")) {
    return "menu-new";
  }

  if (pathname.includes("/tables/new")) {
    return "tables-new";
  }

  if (pathname.includes("/orders")) {
    return "orders";
  }

  if (pathname.includes("/menu")) {
    return "menu";
  }

  if (pathname.includes("/tables")) {
    return "tables";
  }

  if (pathname.includes("/reports")) {
    return "reports";
  }

  if (pathname.includes("/settings")) {
    return "settings";
  }

  return "orders";
}

export default function RestaurantLayout() {
  const { restaurantId } = useParams();
  const location = useLocation();
  const [restaurant, setRestaurant] = useState(null);
  const [workspaceSummary, setWorkspaceSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [mountedViews, setMountedViews] = useState(() => new Set(PRELOADED_VIEW_KEYS));
  const panelRefs = useRef({});

  const currentSection = useMemo(
    () => resolveCurrentSection(location.pathname),
    [location.pathname],
  );
  const currentViewKey = useMemo(
    () => resolveViewKey(location.pathname),
    [location.pathname],
  );

  const loadWorkspace = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await apiRequest(`/restaurants/${restaurantId}`);
      setRestaurant(data.restaurant);
      setWorkspaceSummary(data.workspaceSummary);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  const registerPanelRef = useCallback((viewKey, element) => {
    if (!element) {
      delete panelRefs.current[viewKey];
      return;
    }

    panelRefs.current[viewKey] = element;
  }, []);

  const scrollActiveViewToTop = useCallback((behavior = "smooth") => {
    const activePanel = panelRefs.current[currentViewKey];

    if (!activePanel || typeof activePanel.scrollTo !== "function") {
      return;
    }

    activePanel.scrollTo({ top: 0, behavior });
  }, [currentViewKey]);

  useEffect(() => {
    loadWorkspace();
  }, [loadWorkspace]);

  useEffect(() => {
    setMountedViews((current) => {
      if (current.has(currentViewKey)) {
        return current;
      }

      const next = new Set(current);
      next.add(currentViewKey);
      return next;
    });
  }, [currentViewKey]);

  useEffect(() => {
    if (!location.state?.flash) {
      setFlash(null);
    }
  }, [location.pathname, location.state]);

  const workspaceContext = useMemo(
    () => ({
      restaurant,
      workspaceSummary,
      refreshWorkspace: loadWorkspace,
      setWorkspaceSummary,
      flash,
      setFlash,
      clearFlash: () => setFlash(null),
      scrollActiveViewToTop,
    }),
    [flash, loadWorkspace, restaurant, scrollActiveViewToTop, workspaceSummary],
  );

  if (loading) {
    return (
      <WorkspaceShell currentSection={currentSection} restaurant={restaurant}>
        <section className="page-header">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1 className="page-title">Loading restaurant</h1>
            <p className="page-subtitle">Preparing the workspace and latest metrics.</p>
          </div>
        </section>
      </WorkspaceShell>
    );
  }

  if (error) {
    return (
      <WorkspaceShell currentSection={currentSection} restaurant={restaurant}>
        <section className="page-header">
          <div>
            <p className="eyebrow">Workspace</p>
            <h1 className="page-title">Restaurant unavailable</h1>
            <p className="page-subtitle">{error}</p>
          </div>
        </section>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell
      appShellClassName="app-shell--tabbed"
      currentSection={currentSection}
      mainClassName="workspace-main workspace-main--tabbed"
      restaurant={restaurant}
      flash={flash}
      onClearFlash={() => setFlash(null)}
    >
      <RestaurantWorkspaceContext.Provider value={workspaceContext}>
        <section className="restaurant-tabs-shell" aria-label="Restaurant workspace panels">
          {mountedViews.has("orders") ? (
            <div
              ref={(element) => registerPanelRef("orders", element)}
              id="restaurant-panel-orders"
              className={`restaurant-tab-panel${currentViewKey === "orders" ? " is-active" : ""}`}
              role="tabpanel"
              aria-hidden={currentViewKey === "orders" ? undefined : "true"}
            >
              <OrdersPage />
            </div>
          ) : null}

          {mountedViews.has("menu") ? (
            <div
              ref={(element) => registerPanelRef("menu", element)}
              id="restaurant-panel-menu"
              className={`restaurant-tab-panel${currentViewKey === "menu" ? " is-active" : ""}`}
              role="tabpanel"
              aria-hidden={currentViewKey === "menu" ? undefined : "true"}
            >
              <MenuPage />
            </div>
          ) : null}

          {mountedViews.has("tables") ? (
            <div
              ref={(element) => registerPanelRef("tables", element)}
              id="restaurant-panel-tables"
              className={`restaurant-tab-panel${currentViewKey === "tables" ? " is-active" : ""}`}
              role="tabpanel"
              aria-hidden={currentViewKey === "tables" ? undefined : "true"}
            >
              <TablesPage />
            </div>
          ) : null}

          {mountedViews.has("reports") ? (
            <div
              ref={(element) => registerPanelRef("reports", element)}
              id="restaurant-panel-reports"
              className={`restaurant-tab-panel${currentViewKey === "reports" ? " is-active" : ""}`}
              role="tabpanel"
              aria-hidden={currentViewKey === "reports" ? undefined : "true"}
            >
              <ReportsPage />
            </div>
          ) : null}

          {mountedViews.has("settings") ? (
            <div
              ref={(element) => registerPanelRef("settings", element)}
              id="restaurant-panel-settings"
              className={`restaurant-tab-panel${currentViewKey === "settings" ? " is-active" : ""}`}
              role="tabpanel"
              aria-hidden={currentViewKey === "settings" ? undefined : "true"}
            >
              <RestaurantSettingsPage />
            </div>
          ) : null}

          {mountedViews.has("menu-new") ? (
            <div
              ref={(element) => registerPanelRef("menu-new", element)}
              id="restaurant-panel-menu-new"
              className={`restaurant-tab-panel${currentViewKey === "menu-new" ? " is-active" : ""}`}
              role="tabpanel"
              aria-hidden={currentViewKey === "menu-new" ? undefined : "true"}
            >
              <MenuCreatePage />
            </div>
          ) : null}

          {mountedViews.has("tables-new") ? (
            <div
              ref={(element) => registerPanelRef("tables-new", element)}
              id="restaurant-panel-tables-new"
              className={`restaurant-tab-panel${currentViewKey === "tables-new" ? " is-active" : ""}`}
              role="tabpanel"
              aria-hidden={currentViewKey === "tables-new" ? undefined : "true"}
            >
              <TablesCreatePage />
            </div>
          ) : null}
        </section>
      </RestaurantWorkspaceContext.Provider>
    </WorkspaceShell>
  );
}
