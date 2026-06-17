const logStyles = {
  req: "color:#8b5cf6;font-weight:bold",
  ok: "color:#22c55e;font-weight:bold",
  err: "color:#ef4444;font-weight:bold",
  dim: "color:#6b7280",
};

let requestId = 0;

/* ── In-memory log store (shared with ApiLogPanel) ── */
let _log = [];
const _listeners = new Set();

export function subscribeToLog(cb) {
  _listeners.add(cb);
  return () => _listeners.delete(cb);
}

function notifyListeners() {
  _listeners.forEach((cb) => cb());
}

function pushLog(entry) {
  _log = _log.concat(entry);
  if (_log.length > 200) _log = _log.slice(_log.length - 200);
  if (typeof sessionStorage !== "undefined") {
    try {
      sessionStorage.setItem("oda_api_log", JSON.stringify(_log));
    } catch {
      // silent
    }
  }
  notifyListeners();
}

export function clearApiLog() {
  _log = [];
  if (typeof sessionStorage !== "undefined") {
    sessionStorage.removeItem("oda_api_log");
  }
  notifyListeners();
}

export function getApiLog() {
  return _log;
}

if (typeof window !== "undefined") {
  window.__apiLogGet = () => _log;
  window.__apiLogClear = clearApiLog;
}

function truncate(v, max = 500) {
  const s = typeof v === "string" ? v : JSON.stringify(v, null, 2);
  if (s.length <= max) return s;
  return s.slice(0, max) + `\n… truncated (${s.length - max} more chars)`;
}

export async function apiRequest(path, options = {}) {
  const { method = "GET", body, formData, signal: externalSignal, timeout = 30000 } = options;

  const id = ++requestId;
  const start = performance.now();
  const ts = new Date().toISOString();

  const logData = { id, method, path, ts, status: "pending" };

  console.groupCollapsed(`%c[API ${id}] %c${method} %c/api${path}`, logStyles.req, logStyles.req, logStyles.dim);
  console.log("Started at:", ts);
  if (body) console.log("Body:", body);
  if (formData) {
    const entries = [...formData.entries()].map(([k, v]) => [k, v instanceof File ? `File(${v.name}, ${v.size}b)` : v]);
    console.log("FormData:", Object.fromEntries(entries));
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const signal = externalSignal
    ? anySignal([externalSignal, controller.signal])
    : controller.signal;

  const requestOptions = {
    method,
    credentials: "include",
    signal,
  };

  if (formData) {
    requestOptions.body = formData;
  } else if (body !== undefined) {
    requestOptions.body = JSON.stringify(body);
    requestOptions.headers = {
      "Content-Type": "application/json",
    };
  }

  try {
    const response = await fetch(`/api${path}`, requestOptions);
    const elapsed = Math.round(performance.now() - start);
    const contentType = response.headers.get("content-type") || "";
    const payload = contentType.includes("application/json")
      ? await response.json()
      : await response.text();

    logData.status = response.ok ? "success" : "error";
    logData.elapsed = elapsed;
    logData.statusCode = response.status;

    if (!response.ok) {
      const message =
        typeof payload === "object" && payload && "error" in payload
          ? payload.error
          : `HTTP ${response.status}`;
      logData.error = message;
      logData.payload = payload;

      console.log(`%c✗ ${response.status} %c${elapsed}ms`, logStyles.err, logStyles.dim);
      console.log("Response:", truncate(payload));
      console.groupEnd();
      pushLog(logData);

      throw new Error(message);
    }

    console.log(`%c✓ ${response.status} %c${elapsed}ms`, logStyles.ok, logStyles.dim);
    console.log("Response:", truncate(payload));
    console.groupEnd();
    logData.elapsed = elapsed;
    pushLog(logData);

    return payload;
  } catch (error) {
    const elapsed = Math.round(performance.now() - start);

    if (error.name === "AbortError") {
      logData.status = "timeout";
      logData.elapsed = elapsed;
      console.log(`%c✗ TIMEOUT %c${elapsed}ms`, logStyles.err, logStyles.dim);
      console.groupEnd();
      pushLog(logData);
      throw new Error("Request timed out. Please check your connection and try again.");
    }

    logData.status = "error";
    logData.elapsed = elapsed;
    logData.error = error.message;
    console.log(`%c✗ FAILED %c${elapsed}ms`, logStyles.err, logStyles.dim);
    console.log("Error:", error);
    console.groupEnd();
    pushLog(logData);
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function anySignal(signals) {
  const controller = new AbortController();
  for (const sig of signals) {
    if (sig.aborted) {
      controller.abort(sig.reason);
      return controller.signal;
    }
    sig.addEventListener("abort", () => controller.abort(sig.reason), { once: true });
  }
  return controller.signal;
}
