import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { apiRequest } from "../lib/api.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import FlashStack from "./FlashStack.jsx";
import QuickCreateRestaurant from "./QuickCreateRestaurant.jsx";

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
  const [ownedRestaurants, setOwnedRestaurants] = useState([]);
  const [resolvedCanAddRestaurant, setResolvedCanAddRestaurant] = useState(
    Boolean(ownerCanAddRestaurant),
  );
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
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

  useEffect(() => {
    const previousClassName = document.body.className;
    document.body.className = "workspace-page";

    return () => {
      document.body.className = previousClassName;
    };
  }, []);

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
    setLogoutConfirmOpen(false);
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
    <div className={`app-shell${appShellClassName ? ` ${appShellClassName}` : ""}`}>
      <a href="#main-content" className="sr-only sr-only-focusable">Skip to content</a>

      <header className="topbar">
        <div className="topbar__left">
          <Link to="/" className="brand">
            ODA
          </Link>

          {owner ? (
            <nav className="workspace-tabbar" aria-label="Workspace">
              <Link
                to="/dashboard"
                className={`nav-chip workspace-home-tab${currentSection === "restaurants" ? " is-active" : ""}`}
              >
                Restaurants
              </Link>

              {restaurantTabs.length ? (
                <div
                  className="workspace-tablist"
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
                      className={`nav-chip workspace-tab${tab.isActive ? " is-active" : ""}`}
                    >
                      {tab.label}
                    </Link>
                  ))}
                </div>
              ) : null}
            </nav>
          ) : null}
        </div>

        <div className="topbar__right">
          {owner ? (
            <>
              {ownedRestaurants.length > 1 ? (
                <label className="workspace-picker">
                  <span className="workspace-picker__label">Restaurant</span>
                  <select
                    className="field-control workspace-picker__control"
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
                <span className="status-pill status-pill--inactive" title="You have reached the maximum number of restaurants for your account">
                  Limit: {ownedRestaurants.length} restaurant{ownedRestaurants.length !== 1 ? "s" : ""}
                </span>
              )}
              <span className="muted-text">{owner.phoneNumber}</span>
              <button type="button" className="button" onClick={() => setLogoutConfirmOpen(true)}>
                Log out
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="button">
                Log in
              </Link>
              <Link to="/register" className="button button-confirm">
                Create account
              </Link>
            </>
          )}
        </div>
      </header>

      <FlashStack flash={flash} onDismiss={onClearFlash} bottom />

      <main
        id="main-content"
        className={mainClassName || undefined}
      >
        {children}
      </main>

      <ConfirmDialog
        open={logoutConfirmOpen}
        title="Log out?"
        message="Any unsaved changes will be lost."
        confirmLabel="Log out"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleLogout}
        onCancel={() => setLogoutConfirmOpen(false)}
      />
    </div>
  );
}
