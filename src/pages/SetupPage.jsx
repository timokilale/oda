import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import WorkspaceShell from "../components/WorkspaceShell.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import usePageTitle from "../hooks/usePageTitle.js";
import { apiRequest } from "../lib/api.js";

const SETUP_STEPS = [
  { id: "menu", label: "Add your first menu items", description: "What's on the menu? Add a few items to get started." },
  { id: "table", label: "Create a table", description: "Every table needs a QR code so customers can order." },
  { id: "order", label: "Place a test order", description: "Scan your table QR and place an order to see it in action." },
  { id: "live", label: "Go live", description: "Turn on accepting orders and share your menu." },
];

function StepCircle({ done, current }) {
  if (done) {
    return (
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 shrink-0">
        <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5">
          <path d="M5 10l3 3 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    );
  }

  if (current) {
    return (
      <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary border-2 border-primary shrink-0">
        <span className="w-2 h-2 rounded-full bg-primary" />
      </span>
    );
  }

  return (
    <span className="flex items-center justify-center w-8 h-8 rounded-full bg-muted text-muted-foreground shrink-0">
      <span className="w-2 h-2 rounded-full bg-current" />
    </span>
  );
}

export default function SetupPage() {
  const navigate = useNavigate();
  const { owner } = useAuth();
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState("menu");
  const [menuCount, setMenuCount] = useState(0);
  const [tableCount, setTableCount] = useState(0);
  const [testOrderPlaced, setTestOrderPlaced] = useState(false);
  const [restaurant, setRestaurant] = useState(null);
  const [newMenuItem, setNewMenuItem] = useState({ name: "", price: "" });
  const [addingItem, setAddingItem] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  usePageTitle("Set up your restaurant");

  const setupProgress = useMemo(() => {
    let done = 0;
    if (menuCount > 0) done++;
    if (tableCount > 0) done++;
    if (testOrderPlaced) done++;
    return done;
  }, [menuCount, tableCount, testOrderPlaced]);

  const loadData = useCallback(async () => {
    try {
      const data = await apiRequest("/restaurants");
      setRestaurants(data.restaurants);
      const r = data.restaurants?.[0];
      if (r) {
        setRestaurant(r);
        const ws = await apiRequest(`/restaurants/${r.id}`);
        setMenuCount(ws.workspaceSummary?.menuItemCount || 0);
        setTableCount(ws.workspaceSummary?.tableCount || 0);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (menuCount > 0 && step === "menu") setStep("table");
    if (tableCount > 0 && step === "table") setStep("order");
    if (testOrderPlaced && step === "order") setStep("live");
  }, [menuCount, tableCount, testOrderPlaced, step]);

  async function handleAddMenuItem(event) {
    event.preventDefault();
    if (!newMenuItem.name.trim() || !newMenuItem.price.trim()) return;
    setAddingItem(true);

    try {
      await apiRequest(`/restaurants/${restaurant.id}/menu-items`, {
        method: "POST",
        body: {
          name: newMenuItem.name.trim(),
          price: newMenuItem.price.trim(),
          category: "Main",
        },
      });
      setMenuCount((c) => c + 1);
      setNewMenuItem({ name: "", price: "" });
    } catch (error) {
      // ignore
    } finally {
      setAddingItem(false);
    }
  }

  async function handleCreateTable() {
    try {
      await apiRequest(`/restaurants/${restaurant.id}/tables`, {
        method: "POST",
        body: { tableNumber: "1" },
      });
      setTableCount((c) => c + 1);
    } catch (error) {
      // ignore
    }
  }

  function handleMarkTestOrder() {
    setTestOrderPlaced(true);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
  }

  async function handleGoLive() {
    try {
      const formData = new FormData();
      formData.set("active", "true");
      await apiRequest(`/restaurants/${restaurant.id}`, {
        method: "PATCH",
        formData,
      });
      navigate(`/restaurants/${restaurant.id}/orders`);
    } catch {
      // ignore
    }
  }

  if (loading) {
    return (
      <WorkspaceShell>
        <section className="py-6">
          <div className="max-w-2xl mx-auto px-4">
            <div className="h-8 bg-muted rounded w-1/3 mb-4 animate-pulse" />
            <div className="h-4 bg-muted rounded w-2/3 mb-8 animate-pulse" />
          </div>
        </section>
      </WorkspaceShell>
    );
  }

  if (!restaurant) {
    return (
      <WorkspaceShell>
        <section className="py-6 text-center">
          <h1 className="text-2xl font-bold text-foreground">No restaurant found</h1>
          <p className="text-sm text-muted-foreground mt-2">Create a restaurant first to get started.</p>
          <Link to="/dashboard" className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors no-underline mt-4">
            Go to dashboard
          </Link>
        </section>
      </WorkspaceShell>
    );
  }

  return (
    <WorkspaceShell>
      <section className="max-w-2xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Get {restaurant.name} ready
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {setupProgress < 4
              ? `${setupProgress} of 4 steps done`
              : "All done! You're ready to go live."}
          </p>
        </div>

        <div className="mb-8">
          <div className="flex items-center gap-2 mb-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex-1 h-2 rounded-full transition-colors ${
                  i < setupProgress
                    ? "bg-emerald-500"
                    : i === setupProgress
                      ? "bg-primary/40"
                      : "bg-muted"
                }`}
              />
            ))}
          </div>
        </div>

        {showConfetti ? (
          <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: "-10px",
                  backgroundColor: ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"][i % 5],
                  animation: `fall ${1.5 + Math.random() * 2}s linear forwards`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
            <style>{`
              @keyframes fall {
                to {
                  transform: translateY(100vh) rotate(720deg);
                  opacity: 0;
                }
              }
            `}</style>
          </div>
        ) : null}

        <div className="grid gap-4">
          {SETUP_STEPS.map((s, i) => {
            const isDone =
              (s.id === "menu" && menuCount > 0) ||
              (s.id === "table" && tableCount > 0) ||
              (s.id === "order" && testOrderPlaced) ||
              (s.id === "live");
            const isCurrent = !isDone && step === s.id;

            return (
              <div
                key={s.id}
                className={`rounded-xl border p-5 transition-all ${
                  isCurrent
                    ? "border-primary shadow-sm bg-card"
                    : isDone
                      ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50/50 dark:bg-emerald-950/20"
                      : "border-border bg-card opacity-60"
                }`}
              >
                <div className="flex items-start gap-3">
                  <StepCircle done={isDone} current={isCurrent} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-muted-foreground">Step {i + 1}</span>
                      {isDone ? (
                        <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Complete</span>
                      ) : null}
                    </div>
                    <h3 className={`font-semibold ${isDone ? "text-emerald-700 dark:text-emerald-300" : "text-foreground"}`}>
                      {s.label}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{s.description}</p>

                    {isCurrent && s.id === "menu" ? (
                      <form onSubmit={handleAddMenuItem} className="mt-3 grid gap-2">
                        <div className="flex items-center gap-2">
                          <input
                            className="flex-1 h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                            placeholder="Item name"
                            value={newMenuItem.name}
                            onChange={(e) => setNewMenuItem((p) => ({ ...p, name: e.target.value }))}
                          />
                          <input
                            className="w-24 h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground"
                            placeholder="Price"
                            value={newMenuItem.price}
                            onChange={(e) => setNewMenuItem((p) => ({ ...p, price: e.target.value }))}
                          />
                        </div>
                        <button
                          type="submit"
                          disabled={addingItem || !newMenuItem.name.trim() || !newMenuItem.price.trim()}
                          className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 w-fit"
                        >
                          {addingItem ? "Adding..." : "Quick add item"}
                        </button>
                      </form>
                    ) : null}

                    {isCurrent && s.id === "table" ? (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={handleCreateTable}
                          className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                        >
                          Create Table 1
                        </button>
                      </div>
                    ) : null}

                    {isCurrent && s.id === "order" ? (
                      <div className="mt-3 grid gap-2">
                        <p className="text-sm text-muted-foreground">
                          Open the customer menu and place a test order to see how it flows.
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={handleMarkTestOrder}
                            className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                          >
                            I placed a test order!
                          </button>
                          <a
                            href={`/order/${restaurant.ref}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center justify-center h-10 px-4 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors no-underline"
                          >
                            Open customer menu
                          </a>
                        </div>
                      </div>
                    ) : null}

                    {isCurrent && s.id === "live" ? (
                      <div className="mt-3">
                        <button
                          type="button"
                          onClick={handleGoLive}
                          className="inline-flex items-center justify-center h-12 px-6 rounded-xl text-base font-bold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors"
                        >
                          Turn on & start accepting orders
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {setupProgress === 4 ? (
          <div className="mt-8 text-center">
            <h2 className="text-xl font-bold text-foreground">You're live! 🎉</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Your restaurant is ready to accept orders. Share your QR codes with customers.
            </p>
            <button
              type="button"
              onClick={() => navigate(`/restaurants/${restaurant.id}/orders`)}
              className="inline-flex items-center justify-center h-12 px-6 rounded-xl text-base font-bold bg-primary text-primary-foreground hover:bg-primary/90 transition-colors mt-4"
            >
              Go to orders
            </button>
          </div>
        ) : null}
      </section>
    </WorkspaceShell>
  );
}
