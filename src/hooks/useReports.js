import { useCallback, useEffect, useState } from "react";
import { useRestaurantWorkspace } from "../context/RestaurantWorkspaceContext.jsx";
import { transformApiReportsToView } from "../types/managementTypes.js";
import * as reportService from "../services/reportService.js";

const PERIOD_REVERSE = {
  Today: "today",
  Week: "week",
  Month: "month",
  AllTime: "all",
};

const cache = new Map();

export default function useReports() {
  const { restaurant, setFlash } = useRestaurantWorkspace();
  const [period, setPeriod] = useState("Today");
  const [reports, setReports] = useState(() => {
    const k = `${restaurant.id}:Today`;
    return cache.get(k) || null;
  });
  const [loading, setLoading] = useState(!cache.has(`${restaurant.id}:Today`));

  const loadData = useCallback(async (p) => {
    const k = `${restaurant.id}:${p}`;
    if (cache.has(k)) {
      setReports(cache.get(k));
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const apiPeriod = PERIOD_REVERSE[p];
      const params = apiPeriod !== "all" ? `?period=${apiPeriod}` : "";
      const res = await reportService.getReports(restaurant.id, params);
      const mapped = transformApiReportsToView(res.reports);
      cache.set(k, mapped);
      setReports(mapped);
    } catch (error) {
      setFlash({ type: "error", message: error.message });
    } finally {
      setLoading(false);
    }
  }, [restaurant.id, setFlash]);

  useEffect(() => {
    loadData(period);
  }, [period, loadData]);

  const handleSetPeriod = useCallback((p) => {
    if (p !== period) {
      setPeriod(p);
    }
  }, [period]);

  return { reports, loading, period, setPeriod: handleSetPeriod, refresh: () => { cache.clear(); loadData(period); } };
}