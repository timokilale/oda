import { cn } from "./utils.js";

/**
 * Shared, theme-aware status badge styles built on semantic design tokens.
 * Each entry pairs a tinted background with an accessible foreground color.
 */
const ORDER_STATUS_STYLES = {
  pending: "border-warning/30 bg-warning/15 text-warning-foreground dark:text-warning",
  confirmed: "border-primary/30 bg-primary/12 text-primary",
  completed: "border-success/30 bg-success/15 text-success",
  cancelled: "border-destructive/30 bg-destructive/12 text-destructive",
};

const NEUTRAL_STATUS = "border-border bg-muted text-muted-foreground";

export function orderStatusBadgeClass(status) {
  return ORDER_STATUS_STYLES[status] || NEUTRAL_STATUS;
}

export function activeStatusBadgeClass(isActive) {
  return isActive
    ? "border-success/30 bg-success/15 text-success"
    : "border-border bg-muted text-muted-foreground";
}

export function statusBadge(extra) {
  return cn(
    "inline-flex items-center h-5 px-2 rounded-full text-[11px] font-medium border uppercase tracking-wider",
    extra,
  );
}
