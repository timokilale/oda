import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";
import FlashStack from "./FlashStack.jsx";
import QuickCreateRestaurant from "./QuickCreateRestaurant.jsx";

function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    try {
      if (typeof document === "undefined") return false;
      return document.documentElement.classList.contains("dark");
    } catch {
      return false;
    }
  });

  useEffect(() => {
    try {
      const stored = localStorage.getItem("theme");
      if (stored === "dark") {
        document.documentElement.classList.add("dark");
        setIsDark(true);
        return;
      }
      if (stored === "light") {
        document.documentElement.classList.remove("dark");
        setIsDark(false);
        return;
      }
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        document.documentElement.classList.add("dark");
        setIsDark(true);
      }
    } catch {
      // localStorage unavailable
    }
  }, []);

  useEffect(() => {
    try {
      if (isDark) {
        document.documentElement.classList.add("dark");
        localStorage.setItem("theme", "dark");
      } else {
        document.documentElement.classList.remove("dark");
        localStorage.setItem("theme", "light");
      }
    } catch {
      // localStorage unavailable
    }
  }, [isDark]);

  return [isDark, setIsDark];
}

const RESTAURANT_TABS = [
  { section: "orders", label: "Orders" },
  { section: "menu", label: "Menu" },
  { section: "tables", label: "Tables" },
  { section: "reports", label: "Reports" },
  { section: "settings", label: "Settings" },
];

function buildRestaurantTabId(section) {
  return `restaurant-tab-${section}`;
}

function buildRestaurantPanelId(section) {
  return `restaurant-panel-${section}`;
}

export default function WorkspaceShell({
  currentSection,
  restaurant,
  ownerCanAddRestaurant,
  onRestaurantCreated,
  flash,
  onClearFlash,
  appShellClassName = "",
  mainClassName = "",
  children,
}) {
  const navigate = useNavigate();
  const { owner, logout } = useAuth();
  const [isDark, setIsDark] = useDarkMode();
  const [ownedRestaurants, setOwnedRestaurants] = useState([]);
  const [resolvedCanAddRestaurant, setResolvedCanAddRestaurant] = useState(
    Boolean(ownerCanAddRestaurant),
  );
  const activeRestaurantSection = useMemo(
    () => (RESTAURANT_TABS.some((tab) => tab.section === currentSection) ? currentSection : "orders"),
    [currentSection],
  );
  const restaurantTabs = useMemo(
    () =>
      restaurant
        ? RESTAURANT_TABS.map((tab) => ({
            ...tab,
            id: buildRestaurantTabId(tab.section),
            panelId: buildRestaurantPanelId(tab.section),
            href: `/restaurants/${restaurant.id}/${tab.section}`,
            isActive: tab.section === activeRestaurantSection,
          }))
        : [],
    [activeRestaurantSection, restaurant],
  );

  const loadOwnedRestaurants = useCallback(async () => {
    if (!owner) {
      setOwnedRestaurants([]);
      setResolvedCanAddRestaurant(false);
      return null;
    }

    try {
      const data = await apiRequest("/restaurants");
      setOwnedRestaurants(data.restaurants || []);
      setResolvedCanAddRestaurant(Boolean(data.ownerCanAddRestaurant));
      return data;
    } catch {
      setOwnedRestaurants([]);
      setResolvedCanAddRestaurant(Boolean(ownerCanAddRestaurant));
      return null;
    }
  }, [owner, ownerCanAddRestaurant]);

  useEffect(() => {
    loadOwnedRestaurants();
  }, [loadOwnedRestaurants]);

  useEffect(() => {
    if (ownerCanAddRestaurant === undefined) {
      return;
    }

    setResolvedCanAddRestaurant(Boolean(ownerCanAddRestaurant));
  }, [ownerCanAddRestaurant]);

  async function handleLogout() {
    await logout();
    navigate("/login");
  }

  async function handleRestaurantCreated(createdRestaurant) {
    await loadOwnedRestaurants();
    onRestaurantCreated?.(createdRestaurant);
  }

  function buildRestaurantTarget(nextRestaurantId) {
    if (!nextRestaurantId) {
      return "/dashboard";
    }

    if (!currentSection || currentSection === "restaurants") {
      return `/restaurants/${nextRestaurantId}/orders`;
    }

    return `/restaurants/${nextRestaurantId}/${currentSection}`;
  }

  function handleRestaurantTabKeyDown(event) {
    if (!restaurantTabs.length) {
      return;
    }

    let nextIndex = restaurantTabs.findIndex((tab) => tab.section === activeRestaurantSection);
    if (nextIndex < 0) {
      nextIndex = 0;
    }

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        nextIndex = (nextIndex + 1) % restaurantTabs.length;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        nextIndex = (nextIndex - 1 + restaurantTabs.length) % restaurantTabs.length;
        break;
      case "Home":
        nextIndex = 0;
        break;
      case "End":
        nextIndex = restaurantTabs.length - 1;
        break;
      default:
        return;
    }

    event.preventDefault();
    navigate(restaurantTabs[nextIndex].href);
  }

  return (
    <div className={`mx-auto max-w-[1280px] px-4${appShellClassName ? ` ${appShellClassName}` : ""}`}>
      <a href="#main-content" className="sr-only sr-only-focusable">Skip to content</a>

      <header className="sticky top-0 z-30 -mx-4 px-4 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="flex items-center justify-between h-12">
          <div className="flex items-center gap-2 min-w-0">
            <Link to="/" className="text-xl font-bold tracking-tight text-foreground shrink-0 no-underline">
              ODA
            </Link>

            {owner ? (
              <nav className="flex items-center gap-0 overflow-x-auto scrollbar-none" aria-label="Workspace">
                {ownedRestaurants.length > 1 ? (
                  <Link
                    to="/dashboard"
                    className={`shrink-0 px-3 py-3 text-xs font-medium tracking-wider uppercase whitespace-nowrap border-b-2 transition-colors no-underline ${
                      currentSection === "restaurants"
                        ? "border-primary text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    Restaurants
                  </Link>
                ) : null}

                {restaurantTabs.length ? (
                  <div
                    className="flex items-center"
                    role="tablist"
                    aria-label={`${restaurant.name} sections`}
                    onKeyDown={handleRestaurantTabKeyDown}
                  >
                    {restaurantTabs.map((tab) => (
                      <Link
                        key={tab.section}
                        id={tab.id}
                        to={tab.href}
                        role="tab"
                        aria-selected={tab.isActive ? "true" : "false"}
                        aria-controls={tab.panelId}
                        tabIndex={tab.isActive ? 0 : -1}
                        className={`shrink-0 px-3 py-3 text-xs font-medium tracking-wider uppercase whitespace-nowrap border-b-2 transition-colors no-underline ${
                          tab.isActive
                            ? "border-primary text-foreground"
                            : "border-transparent text-muted-foreground hover:text-foreground"
                        }`}
                      >
                        {tab.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </nav>
            ) : null}
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {owner ? (
              <>
                {ownedRestaurants.length > 1 ? (
                  <label className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground font-mono">Restaurant</span>
                    <select
                      className="h-8 rounded-lg border border-input bg-background px-2 text-xs text-foreground"
                      value={restaurant?.id || ""}
                      onChange={(event) => navigate(buildRestaurantTarget(event.target.value))}
                    >
                      <option value="">Jump to restaurant</option>
                      {ownedRestaurants.map((ownedRestaurant) => (
                        <option key={ownedRestaurant.id} value={ownedRestaurant.id}>
                          {ownedRestaurant.name}
                        </option>
                      ))}
                    </select>
                  </label>
                ) : null}
                {resolvedCanAddRestaurant ? (
                  <QuickCreateRestaurant onCreated={handleRestaurantCreated} />
                ) : (
                  <span className="inline-flex items-center h-6 px-2 rounded-full text-[11px] font-medium border border-border bg-muted/50 text-muted-foreground uppercase tracking-wider">
                    Limit: {ownedRestaurants.length} restaurant{ownedRestaurants.length !== 1 ? "s" : ""}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setIsDark((prev) => !prev)}
                  className="inline-flex items-center justify-center h-8 w-8 rounded-lg border border-border bg-background text-foreground hover:bg-muted transition-colors"
                  aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
                >
                  {isDark ? (
                    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                      <circle cx="10" cy="10" r="3.5" stroke="currentColor" strokeWidth="1.3" />
                      <path d="M10 2v1.5M10 16.5V18M4.05 4.05l1.06 1.06M14.89 14.89l1.06 1.06M2 10h1.5M16.5 10H18M4.05 15.95l1.06-1.06M14.89 5.11l1.06-1.06" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" fill="none" className="w-4 h-4">
                      <path d="M15.5 11.5A6.5 6.5 0 0 1 8.5 4.5 6.5 6.5 0 1 0 15.5 11.5z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
                <button
                  type="button"
                  className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
                  onClick={handleLogout}
                >
                  Log out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors no-underline">
                  Log in
                </Link>
                <Link to="/register" className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors no-underline">
                  Create account
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <FlashStack flash={flash} onDismiss={onClearFlash} bottom />

      <main
        id="main-content"
        className={mainClassName || undefined}
      >
        {children}
      </main>
    </div>
  );
}
