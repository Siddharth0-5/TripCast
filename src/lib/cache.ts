/**
 * Small in-memory TTL cache for source data and finished briefings.
 * Per server instance and lost on restart; it only saves repeat work.
 */
type Entry = { value: unknown; expires: number };

// Stored on globalThis so it survives hot reloads in development.
const g = globalThis as unknown as { __tripcastCache?: Map<string, Entry> };
const store: Map<string, Entry> = (g.__tripcastCache ??= new Map());

const MAX_ENTRIES = 300;

export const HOUR = 60 * 60 * 1000;

export async function remember<T>(key: string, ttlMs: number, make: () => Promise<T>): Promise<T> {
  const hit = store.get(key);
  if (hit && hit.expires > Date.now()) return hit.value as T;

  const value = await make(); // errors propagate and are not cached
  if (store.size >= MAX_ENTRIES) store.delete(store.keys().next().value!); // evict oldest
  store.set(key, { value, expires: Date.now() + ttlMs });
  return value;
}

export function peek<T>(key: string): T | undefined {
  const hit = store.get(key);
  return hit && hit.expires > Date.now() ? (hit.value as T) : undefined;
}

export function put(key: string, value: unknown, ttlMs: number) {
  store.set(key, { value, expires: Date.now() + ttlMs });
}
