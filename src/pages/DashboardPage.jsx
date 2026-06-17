import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import LoadingSkeleton from "../components/LoadingSkeleton.jsx";
import WorkspaceShell from "../components/WorkspaceShell.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [restaurants, setRestaurants] = useState([]);
  const [ownerCanAddRestaurant, setOwnerCanAddRestaurant] = useState(false);
  const [flash, setFlash] = useState(null);

  usePageTitle("Restaurants");

  const loadRestaurants = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadRestaurants();
  }, [loadRestaurants]);

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
      <section className="py-6">
        <div className="mb-6">
          <p className="text-xs uppercase tracking-widest text-muted-foreground font-mono">Owner</p>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight leading-tight text-foreground mt-1">
            Restaurants
          </h1>
        </div>
      </section>

      <section>
        {loading ? (
          <LoadingSkeleton variant="card" count={2} />
        ) : restaurants.length ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(240px,1fr))] gap-4">
            {restaurants.map((restaurant) => (
              <Link
                key={restaurant.id}
                to={`/restaurants/${restaurant.id}/orders`}
                className="group rounded-xl border border-border bg-card shadow-sm overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all no-underline"
              >
                <div className="aspect-[4/3] overflow-hidden bg-muted">
                  {restaurant.imageUrl ? (
                    <img
                      src={restaurant.imageUrl}
                      alt={restaurant.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      style={{
                        objectPosition: `${restaurant.imagePositionX ?? 50}% ${restaurant.imagePositionY ?? 50}%`,
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl font-bold text-muted-foreground/40" aria-hidden="true">
                      {restaurant.name.slice(0, 1)}
                    </div>
                  )}
                </div>
                <div className="p-4 grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="text-lg font-semibold text-foreground truncate">{restaurant.name}</h2>
                    <span
                      className={`inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium border uppercase tracking-wider ${
                        restaurant.active
                          ? "border-success/30 bg-success/15 text-success"
                          : "border-border bg-muted text-muted-foreground"
                      }`}
                      role="status"
                      aria-label={`Restaurant status: ${restaurant.active ? "active" : "inactive"}`}
                    >
                      {restaurant.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {[restaurant.city, restaurant.country].filter(Boolean).join(", ") || "Location pending"}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground font-mono">
                    <span>{restaurant.openOrderCount} open</span>
                    <span>{restaurant.menuItemCount} menu</span>
                    <span>{restaurant.tableCount} tables</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border bg-card p-10 text-center">
            <svg viewBox="0 0 48 48" fill="none" className="w-14 h-14 mx-auto mb-4 text-muted-foreground/30">
              <rect x="6" y="18" width="36" height="24" rx="2" stroke="currentColor" strokeWidth="1.5" />
              <rect x="10" y="22" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <rect x="26" y="22" width="12" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" />
              <line x1="20" y1="38" x2="28" y2="38" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
              <rect x="18" y="6" width="12" height="14" rx="2" stroke="currentColor" strokeWidth="1.2" />
              <polyline points="24,8 24,12 27,12" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h2 className="text-lg font-semibold text-foreground">No restaurants yet</h2>
            <p className="text-sm text-muted-foreground mt-2">
              Use <strong>New restaurant</strong> in the header to create your first workspace.
            </p>
          </div>
        )}
      </section>
    </WorkspaceShell>
  );
}
