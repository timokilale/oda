const listeners = new Map();
let pollingId = null;
let sseConnection = null;
let currentUrl = null;

function notify(type, payload) {
  const cbs = listeners.get(type);
  if (!cbs) return;
  cbs.forEach((cb) => {
    try { cb(payload); } catch {}
  });
}

function startSSE(url) {
  try {
    const es = new EventSource(url, { withCredentials: true });

    es.addEventListener("orders", (event) => {
      try {
        const data = JSON.parse(event.data);
        notify("orders", data);
      } catch {}
    });

    es.addEventListener("error", () => {
      es.close();
      sseConnection = null;
      if (currentUrl) startSSE(currentUrl);
    });

    sseConnection = es;
  } catch {}
}

export function subscribe(eventType, callback, url) {
  if (!listeners.has(eventType)) {
    listeners.set(eventType, new Set());
  }
  listeners.get(eventType).add(callback);

  if (!sseConnection && !pollingId && url) {
    currentUrl = url;
    startSSE(url);
  }

  return () => {
    const cbs = listeners.get(eventType);
    if (!cbs) return;
    cbs.delete(callback);
    if (cbs.size === 0) listeners.delete(eventType);
    if (listeners.size === 0) {
      if (pollingId) { clearInterval(pollingId); pollingId = null; }
      if (sseConnection) { currentUrl = null; sseConnection.close(); sseConnection = null; }
    }
  };
}
