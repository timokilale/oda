import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useResolvedCanAddRestaurant } from "../hooks/useResolvedCanAddRestaurant.js";
import { apiRequest } from "../lib/api.js";
import ConfirmDialog from "./ConfirmDialog.jsx";
import FlashStack from "./FlashStack.jsx";
import QuickCreateRestaurant from "./QuickCreateRestaurant.jsx";

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
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const { resolvedCanAddRestaurant, refreshResolvedCanAddRestaurant } =
    useResolvedCanAddRestaurant(owner, ownerCanAddRestaurant);

  useEffect(() => {
    const previousClassName = document.body.className;
    document.body.className = "workspace-page";

    return () => {
      document.body.className = previousClassName;
    };
  }, []);

  useEffect(() => {
    let active = true;

    async function loadOwnedRestaurants() {
      if (!owner) {
        if (active) {
          setOwnedRestaurants([]);
        }
        return;
      }

      try {
        const data = await apiRequest("/restaurants");
        if (active) {
          setOwnedRestaurants(data.restaurants || []);
        }
      } catch {
        if (active) {
          setOwnedRestaurants([]);
        }
      }
    }

    loadOwnedRestaurants();

    return () => {
      active = false;
    };
  }, [owner]);

  async function handleLogout() {
    setLogoutConfirmOpen(false);
    await logout();
    navigate("/login");
  }

  async function handleRestaurantCreated(createdRestaurant) {
    await Promise.all([
      refreshResolvedCanAddRestaurant({ forceRemote: true }),
      apiRequest("/restaurants")
        .then((data) => setOwnedRestaurants(data.restaurants || []))
        .catch(() => undefined),
    ]);
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

  return (
    <div className={`app-shell${appShellClassName ? ` ${appShellClassName}` : ""}`}>
      <a href="#main-content" className="sr-only sr-only-focusable">Skip to content</a>

      <header className="topbar">
        <div className="topbar__left">
          <Link to="/" className="brand">
            ODA
          </Link>

          {owner ? (
            <nav className="nav-row" aria-label="Workspace">
              <Link
                to="/dashboard"
                className={`nav-chip${currentSection === "restaurants" ? " is-active" : ""}`}
              >
                Restaurants
              </Link>

              {restaurant ? (
                <>
                  <Link
                    to={`/restaurants/${restaurant.id}/orders`}
                    className={`nav-chip${currentSection === "orders" ? " is-active" : ""}`}
                  >
                    Orders
                  </Link>
                  <Link
                    to={`/restaurants/${restaurant.id}/menu`}
                    className={`nav-chip${currentSection === "menu" ? " is-active" : ""}`}
                  >
                    Menu
                  </Link>
                  <Link
                    to={`/restaurants/${restaurant.id}/tables`}
                    className={`nav-chip${currentSection === "tables" ? " is-active" : ""}`}
                  >
                    Tables
                  </Link>
                  <Link
                    to={`/restaurants/${restaurant.id}/reports`}
                    className={`nav-chip${currentSection === "reports" ? " is-active" : ""}`}
                  >
                    Reports
                  </Link>
                  <Link
                    to={`/restaurants/${restaurant.id}/settings`}
                    className={`nav-chip${currentSection === "settings" ? " is-active" : ""}`}
                  >
                    Settings
                  </Link>
                </>
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

      <FlashStack flash={flash} onDismiss={onClearFlash} />

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
