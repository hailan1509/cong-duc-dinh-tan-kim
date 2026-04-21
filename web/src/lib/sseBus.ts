type Listener = (event: { type: string; data: unknown }) => void;

const globalForBus = globalThis as unknown as {
  __cdtk_sse_listeners?: Set<Listener>;
};

function listeners() {
  if (!globalForBus.__cdtk_sse_listeners) globalForBus.__cdtk_sse_listeners = new Set();
  return globalForBus.__cdtk_sse_listeners;
}

export function subscribe(listener: Listener) {
  listeners().add(listener);
  return () => listeners().delete(listener);
}

export function publish(event: { type: string; data: unknown }) {
  for (const l of listeners()) {
    try {
      l(event);
    } catch {
      // ignore
    }
  }
}

