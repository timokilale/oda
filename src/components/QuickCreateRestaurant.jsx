import { useState } from "react";
import { apiRequest } from "../lib/api.js";

export default function QuickCreateRestaurant({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.set("restaurantName", name);
    formData.set("city", "");
    formData.set("country", "");

    try {
      const data = await apiRequest("/restaurants", {
        method: "POST",
        formData,
      });

      setName("");
      setOpen(false);
      await onCreated?.(data.restaurant);
    } catch (submissionError) {
      setError(submissionError.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    setOpen(false);
    setError("");
    setName("");
  }

  return (
    <div className="relative">
      {!open ? (
        <button
          type="button"
          className="inline-flex items-center justify-center h-8 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          onClick={() => setOpen(true)}
        >
          New restaurant
        </button>
      ) : null}

      {open ? (
        <div className="absolute right-0 top-full mt-2 z-50 w-[min(calc(100vw-32px),360px)] rounded-xl border border-border bg-card shadow-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-foreground">New restaurant</span>
            <button
              type="button"
              className="inline-flex items-center justify-center h-7 px-2 rounded-lg text-xs font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors"
              onClick={handleClose}
              disabled={submitting}
            >
              Close
            </button>
          </div>
          <form onSubmit={handleSubmit} className="grid gap-3">
            <div className="grid gap-1.5">
              <label className="text-sm font-medium text-foreground" htmlFor="quick_create_name">
                Restaurant name
              </label>
              <input
                className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground transition-colors"
                id="quick_create_name"
                type="text"
                placeholder="e.g. Mama's Kitchen"
                value={name}
                onChange={(event) => setName(event.target.value)}
                required
              />
            </div>
            {error ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
                {error}
              </div>
            ) : null}
            <div className="flex items-center gap-2 pt-1">
              <button type="submit" className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50" disabled={submitting}>
                {submitting ? "Creating" : "Create"}
              </button>
              <button type="button" className="inline-flex items-center justify-center h-9 px-3 rounded-lg text-sm font-medium border border-border bg-background text-foreground hover:bg-muted transition-colors disabled:opacity-50" onClick={handleClose} disabled={submitting}>
                Cancel
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
