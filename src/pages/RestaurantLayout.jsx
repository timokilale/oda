import { useCallback, useEffect, useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import RestomanageShell from "../components/management/RestomanageShell.jsx";
import { RestaurantWorkspaceContext } from "../context/RestaurantWorkspaceContext.jsx";
import FlashStack from "../components/FlashStack.jsx";
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
  const { owner, logout } = useAuth();
  const [restaurant, setRestaurant] = useState(null);
  const [workspaceSummary, setWorkspaceSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [flash, setFlash] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(true);

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

  const handleSectionChange = useCallback((section) => {
    navigate(`/restaurants/${restaurantId}/${section}`);
  }, [navigate, restaurantId]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

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

  const shellProps = {
    currentSection,
    onSectionChange: handleSectionChange,
    restaurant,
    soundEnabled,
    onToggleSound: () => setSoundEnabled((v) => !v),
    notificationsCount: 0,
    onNotificationsClick: () => {},
    onLogout: handleLogout,
  };

  if (loading) {
    return (
      <RestomanageShell {...shellProps}>
        <section className="py-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">
              Loading restaurant
            </h1>
            <p className="text-sm text-muted-foreground mt-2">Preparing your workspace...</p>
          </div>
        </section>
      </RestomanageShell>
    );
  }

  if (error) {
    return (
      <RestomanageShell {...shellProps}>
        <section className="py-6">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">
              Restaurant unavailable
            </h1>
            <p className="text-sm text-muted-foreground mt-2">{error}</p>
          </div>
        </section>
      </RestomanageShell>
    );
  }

  return (
    <RestomanageShell {...shellProps}>
      <FlashStack flash={flash} onDismiss={() => setFlash(null)} bottom />
      <RestaurantWorkspaceContext.Provider value={workspaceContext}>
        <section
          id={buildRestaurantPanelId(panelSection)}
          role="tabpanel"
          aria-labelledby={buildRestaurantTabId(panelSection)}
        >
          <Outlet />
        </section>
      </RestaurantWorkspaceContext.Provider>
    </RestomanageShell>
  );
}
