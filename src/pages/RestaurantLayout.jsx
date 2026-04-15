import { useEffect, useState } from "react";
import { Outlet, useOutletContext, useParams } from "react-router-dom";
import { apiRequest } from "../lib/api.js";
import WorkspaceShell from "../components/WorkspaceShell.jsx";

export function useRestaurantWorkspace() {
  return useOutletContext();
}

export default function RestaurantLayout() {
  const { restaurantId } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [workspaceSummary, setWorkspaceSummary] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  async function loadWorkspace() {
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
  }

  useEffect(() => {
    loadWorkspace();
  }, [restaurantId]);

  if (loading) {
    return (
      <WorkspaceShell currentSection="restaurants">
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
      <WorkspaceShell currentSection="restaurants">
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
    <Outlet
      context={{
        restaurant,
        workspaceSummary,
        refreshWorkspace: loadWorkspace,
        setWorkspaceSummary,
      }}
    />
  );
}
