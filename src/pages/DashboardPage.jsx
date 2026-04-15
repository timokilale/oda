import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import WorkspaceShell from "../components/WorkspaceShell.jsx";
import { apiRequest } from "../lib/api.js";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [ownerCanAddRestaurant, setOwnerCanAddRestaurant] = useState(false);
  const [flash, setFlash] = useState(null);

  async function loadRestaurants() {
    setLoading(true);

    try {
      const data = await apiRequest("/restaurants");
      setRestaurants(data.restaurants);
      setOwnerCanAddRestaurant(data.ownerCanAddRestaurant);
    } catch (loadError) {
      setFlash({ type: "error", message: loadError.message });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRestaurants();
  }, []);

  return (
    <WorkspaceShell
      currentSection="restaurants"
      ownerCanAddRestaurant={ownerCanAddRestaurant}
      onRestaurantCreated={() => {
        setFlash({ type: "success", message: "Restaurant created" });
        loadRestaurants();
      }}
      flash={flash}
      onClearFlash={() => setFlash(null)}
    >
      <section className="page-header">
        <div>
          <p className="eyebrow">Owner</p>
          <h1 className="page-title">Restaurants</h1>
        </div>
      </section>

      <section className="page-section">
        {loading ? (
          <section className="surface empty-state">
            <div className="panel">
              <p className="empty-text">Loading restaurants...</p>
            </div>
          </section>
        ) : restaurants.length ? (
          <div className="restaurant-grid">
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/restaurants/${restaurant.id}/orders`}
                className="restaurant-card"
              >
                <div className="restaurant-card__media">
                  {restaurant.imageUrl ? (
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      className="restaurant-card__image"
                      style={{
                        objectPosition: `${restaurant.imagePositionX ?? 50}% ${restaurant.imagePositionY ?? 50}%`,
                      }}
                    />
                  ) : (
                    <div className="restaurant-card__placeholder" aria-hidden="true">
                      {restaurant.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="restaurant-card__body">
                  <div className="restaurant-card__topline">
                    <h2 className="entity-card__title">{restaurant.name}</h2>
                    <span className="status-pill">{restaurant.active ? "Active" : "Inactive"}</span>
                  </div>
                  <p className="meta-row">
                    {[restaurant.city, restaurant.country].filter(Boolean).join(", ") || "Location pending"}
                  </p>
                  <div className="restaurant-card__stats">
                    <span>{restaurant.openOrderCount} open</span>
                    <span>{restaurant.menuItemCount} menu</span>
                    <span>{restaurant.tableCount} tables</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <section className="surface empty-state">
            <div className="panel">
              <h2 className="panel-title">No restaurants yet</h2>
              <p className="empty-text">
                Use <strong>New restaurant</strong> in the header to create your first workspace.
              </p>
            </div>
          </section>
        )}
      </section>
    </WorkspaceShell>
  );
}
