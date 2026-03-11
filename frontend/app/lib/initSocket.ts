/**
 * Boot the WebSocket and wire channel handlers to Redux.
 * Call once from the client layout.
 */

import { store } from "./store";
import { connect, subscribe } from "./ws/socket";
import { registerMarketsChannel } from "./ws/channels";
import { setLoading } from "./features/prices/pricesSlice";

let initialized = false;

export function initSocket() {
  if (initialized) return;
  initialized = true;

  const dispatch = store.dispatch;

  // Mark loading until first WS message arrives
  dispatch(setLoading(true));

  // Register channel handlers
  subscribe("markets", registerMarketsChannel(dispatch));

  // Open connection
  connect();
}