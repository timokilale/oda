import { useCallback, useEffect, useState } from "react";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import { transformApiReportsToView, timeAgoLabel } from "../types/managementTypes.js";
import * as reportService from "../services/reportService.js";

const PERIOD_REVERSE = {
  Today: "today",
  Week: "week",
  Month: "month",
  AllTime: "all",
};

export default function useReports() {
  const { restaurant, setFlash } = useRestaurantWorkspace();
  const [reports, setReports] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("Today");

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const apiPeriod = PERIOD_REVERSE[period];
      const params = apiPeriod !== "all" ? `?period=${apiPeriod}` : "";
      const [reportsRes, ordersRes] = await Promise.all([
        reportService.getReports(restaurant.id, params),
        reportService.getOrders(restaurant.id),
      ]);

      setReports(transformApiReportsToView(reportsRes.reports));

      const rawOrders = (ordersRes.orders || []).slice(0, 10);
      const activityLog = rawOrders
        .flatMap((o) => {
          const table = `Table ${o.tableNumber}`;
          const id = `#${o.id}`;
          const entries = [];
          entries.push({
            id: `${o.id}-placed`,
            text: `${id} — ${table} placed order`,
            type: "pending",
            time: timeAgoLabel(o.createdAt),
          });
          if (o.status === "confirmed" || o.status === "completed") {
            entries.push({
              id: `${o.id}-confirmed`,
              text: `${id} — ${table} confirmed`,
              type: "success",
              time: timeAgoLabel(o.updatedAt || o.createdAt),
            });
          }
          if (o.status === "completed") {
            entries.push({
              id: `${o.id}-served`,
              text: `${id} — ${table} served`,
              type: "success",
              time: timeAgoLabel(o.updatedAt || o.createdAt),
            });
          }
          if (o.status === "cancelled") {
            entries.push({
              id: `${o.id}-cancelled`,
              text: `${id} — ${table} cancelled`,
              type: "error",
              time: timeAgoLabel(o.updatedAt || o.createdAt),
            });
          }
          return entries;
        })
        .sort((a, b) => a.time.localeCompare(b.time))
        .slice(-10);
      setLogs(activityLog);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [period, restaurant.id, setFlash]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalOrders =
    (reports?.pendingCount || 0) +
    (reports?.confirmedCount || 0) +
    (reports?.completedCount || 0);

  return { reports, logs, loading, period, setPeriod, totalOrders, refresh: loadData };
}
