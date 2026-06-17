import { useSyncExternalStore, useCallback } from "react";
import { subscribeToLog, getApiLog, clearApiLog } from "../lib/api.js";

function getSnapshot() {
  return getApiLog();
}

export default function ApiLogPanel() {
  const log = useSyncExternalStore(subscribeToLog, getSnapshot);

  const clear = useCallback(() => {
    clearApiLog();
  }, []);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(log, null, 2));
  }, [log]);

  if (log.length === 0) return null;

  const bad = log.filter((e) => e.status === "error" || e.status === "timeout").length;

  return (
    <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2">
      <button
        onClick={clear}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-background border border-border shadow-sm hover:bg-muted transition-colors"
        title="Clear API log"
      >
        <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
          <path d="M2 4h12M5 4V3a1 1 0 011-1h4a1 1 0 011 1v1M12 4v9a1 1 0 01-1 1H5a1 1 0 01-1-1V4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
        Clear
      </button>

      <button
        onClick={copy}
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-medium bg-background border border-border shadow-sm hover:bg-muted transition-colors"
        title="Copy API log"
      >
        <svg viewBox="0 0 16 16" fill="none" className="w-3.5 h-3.5">
          <rect x="4" y="4" width="10" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
          <path d="M12 4V3a1 1 0 00-1-1H3a1 1 0 00-1 1v8a1 1 0 001 1h1" stroke="currentColor" strokeWidth="1.3"/>
        </svg>
      </button>

      <span
        className="inline-flex items-center gap-1.5 h-8 px-3 rounded-lg text-xs font-mono bg-background border border-border shadow-sm cursor-default"
        title={`${log.length} requests, ${bad} failed`}
      >
        <span className={`w-2 h-2 rounded-full ${bad > 0 ? "bg-red-500" : "bg-green-500"}`} />
        {log.length} req
        {bad > 0 && <span className="text-red-500">({bad} err)</span>}
      </span>
    </div>
  );
}
