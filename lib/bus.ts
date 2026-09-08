import { EventEmitter } from "node:events";

/**
 * Tiny in-process pub/sub used to push "something changed, refetch" hints to
 * every connected dashboard over SSE. Single-process only, which is all the NAS
 * deployment needs.
 */

export type DataKey =
  | "people"
  | "profiles"
  | "devices"
  | "chores"
  | "calendar"
  | "shopping"
  | "meals";

export type BusEvent = { type: "invalidate"; keys: DataKey[]; at: number };

const globalForBus = globalThis as unknown as { dvBus?: EventEmitter };
const emitter = globalForBus.dvBus ?? new EventEmitter();
emitter.setMaxListeners(100);
if (!globalForBus.dvBus) globalForBus.dvBus = emitter;

export function publish(...keys: DataKey[]): void {
  const event: BusEvent = { type: "invalidate", keys, at: Date.now() };
  emitter.emit("invalidate", event);
}

export function subscribe(listener: (event: BusEvent) => void): () => void {
  emitter.on("invalidate", listener);
  return () => emitter.off("invalidate", listener);
}
