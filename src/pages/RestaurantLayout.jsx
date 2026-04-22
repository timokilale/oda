import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import WorkspaceShell from "../components/WorkspaceShell.jsx";
import { RestaurantWorkspaceContext } from "../context/RestaurantWorkspaceContext.jsx";
import { apiRequest } from "../lib/api.js";

function resolvePanelSection(section) {
  if (["orders", "menu", "tables", "reports", "settings"].includes(section)) {
    return section;
  }

  return "orders";
}

function buildRestaurantTabId(section) {
  return `restaurant-tab-${section}`;
}

function buildRestaurantPanelId(section) {
  return `restaurant-panel-${section}`;
}

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

export default function RestaurantLayout() {
  const { restaurantId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const [restaurant, setRestaurant] = useState(null);
  const [workspaceSummary, setWorkspaceSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);

  const currentSection = useMemo(
    () => resolveCurrentSection(location.pathname),
    [location.pathname],
  );
  const panelSection = useMemo(
    () => resolvePanelSection(currentSection),
    [currentSection],
  );

  const loadWorkspace = useCallback(async ({ background = false, signal } = {}) => {
    let aborted = false;

    if (!background) {
      setLoading(true);
      setError("");
    }

    try {
      const data = await apiRequest(`/restaurants/${restaurantId}`, { signal });

      if (signal?.aborted) {
        aborted = true;
        return null;
      }

      setRestaurant(data.restaurant);
      setWorkspaceSummary(data.workspaceSummary);
      if (!background) {
        setError("");
      }
      return data;
    } catch (loadError) {
      if (loadError.name === "AbortError" || signal?.aborted) {
        aborted = true;
        return null;
      }

      if (!background) {
        setError(loadError.message);
        return null;
      }

      throw loadError;
    } finally {
      if (!background && !aborted) {
        setLoading(false);
      }
    }
  }, [restaurantId]);

  const scrollActiveViewToTop = useCallback((behavior = "smooth") => {
    if (typeof window === "undefined" || typeof window.scrollTo !== "function") {
      return;
    }

    window.scrollTo({ top: 0, behavior });
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadWorkspace({ signal: controller.signal });

    return () => {
      controller.abort();
    };
  }, [loadWorkspace]);

  useEffect(() => {
    setFlash(null);
  }, [restaurantId]);

  useEffect(() => {
    if (location.state?.flash) {
      return;
    }

    setFlash(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!location.state?.flash) {
      return;
    }

    setFlash(location.state.flash);
    navigate(
      { pathname: location.pathname, search: location.search },
      { replace: true, state: null },
    );
  }, [location.pathname, location.search, location.state, navigate]);

  const workspaceContext = useMemo(
    () => ({
      restaurant,
      workspaceSummary,
      refreshWorkspace: () => loadWorkspace({ background: true }),
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
      currentSection={currentSection}
      restaurant={restaurant}
      flash={flash}
      onClearFlash={() => setFlash(null)}
    >
      <RestaurantWorkspaceContext.Provider value={workspaceContext}>
        <section
          id={buildRestaurantPanelId(panelSection)}
          className="workspace-tabpanel"
          role="tabpanel"
          aria-labelledby={buildRestaurantTabId(panelSection)}
        >
          <Outlet />
        </section>
      </RestaurantWorkspaceContext.Provider>
    </WorkspaceShell>
  );
}
