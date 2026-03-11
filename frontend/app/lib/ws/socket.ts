/**
 * Low-level singleton WebSocket with auto-reconnect.
 * No Redux dependency — pure infrastructure.
 */

type MessageHandler = (data: unknown) => void;

let ws: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
const listeners = new Map<string, Set<MessageHandler>>();
const RECONNECT_DELAY = 3_000;

function getUrl() {
  const base = process.env.NEXT_PUBLIC_WS_BACK_END ?? "ws://localhost:4000";
  return `${base}/markets/ws`;
}

export function connect() {
  if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
    return;
  }

  ws = new WebSocket(getUrl());

  ws.onopen = () => {
    console.log("[ws] connected");
  };

  ws.onmessage = (event) => {
    try {
      const msg = JSON.parse(event.data) as { channel: string; data: unknown };
      const handlers = listeners.get(msg.channel);
      if (handlers) {
        handlers.forEach((fn) => fn(msg.data));
      }
    } catch {
      console.warn("[ws] invalid message", event.data);
    }
  };

  ws.onclose = () => {
    console.log("[ws] disconnected — reconnecting…");
    scheduleReconnect();
  };

  ws.onerror = () => {
    // onclose fires after onerror, reconnect is handled there
    ws?.close();
  };
}

function scheduleReconnect() {
  if (reconnectTimer) return;
  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    connect();
  }, RECONNECT_DELAY);
}

/** Subscribe to a channel. Returns an unsubscribe function. */
export function subscribe(channel: string, handler: MessageHandler): () => void {
  if (!listeners.has(channel)) {
    listeners.set(channel, new Set());
  }
  listeners.get(channel)!.add(handler);

  return () => {
    listeners.get(channel)?.delete(handler);
  };
}

/** Send a JSON message to the server. */
export function send(data: Record<string, unknown>) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

/** Tear down — useful for cleanup in tests or HMR. */
export function disconnect() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  ws?.close();
  ws = null;
}
