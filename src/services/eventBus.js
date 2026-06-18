const listeners = new Map();
let lastEventId = 0;
let pollingId = null;
let sseConnection = null;

function notify(type, payload) {
  const cbs = listeners.get(type);
  if (!cbs) return;
  cbs.forEach((cb) => {
    try { cb(payload); } catch {}
  });
}

function startPolling() {
  if (pollingId) return;
  pollingId = setInterval(async () => {
    try {
      const res = await fetch(`/api/events?since=${lastEventId}`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const batch = await res.json();
      (batch.events || []).forEach((ev) => {
        if (ev.id > lastEventId) lastEventId = ev.id;
        notify(ev.type, ev.data);
      });
    } catch {}
  }, 5000);
}

function startSSE() {
  try {
    const es = new EventSource("/api/events", { withCredentials: true });

    es.addEventListener("message", (event) => {
      try {
        const { type, data, id } = JSON.parse(event.data);
        if (id && id > lastEventId) lastEventId = id;
        notify(type, data);
      } catch {}
    });

    es.addEventListener("error", () => {
      es.close();
      sseConnection = null;
      startPolling();
    });

    sseConnection = es;
  } catch {
    startPolling();
  }
}

export function subscribe(eventType, callback) {
  if (!listeners.has(eventType)) {
    listeners.set(eventType, new Set());
  }
  listeners.get(eventType).add(callback);

  if (!sseConnection && !pollingId) {
    startSSE();
  }

  return () => {
    const cbs = listeners.get(eventType);
    if (!cbs) return;
    cbs.delete(callback);
    if (cbs.size === 0) listeners.delete(eventType);
    if (listeners.size === 0) {
      if (pollingId) { clearInterval(pollingId); pollingId = null; }
      if (sseConnection) { sseConnection.close(); sseConnection = null; }
    }
  };
}
