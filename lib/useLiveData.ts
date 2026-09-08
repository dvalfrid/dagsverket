"use client";

import { useEffect } from "react";
import useSWR, { mutate, type SWRConfiguration } from "swr";

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}

async function jsonFetcher<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? res.statusText, res.status);
  }
  return res.json();
}

/** Fire a mutating request and return the parsed body (throws ApiError on failure). */
export async function apiFetch<T = unknown>(
  url: string,
  init: RequestInit & { json?: unknown } = {},
): Promise<T> {
  const { json, ...rest } = init;
  const res = await fetch(url, {
    ...rest,
    method: rest.method ?? (json ? "POST" : "GET"),
    headers: { "content-type": "application/json", accept: "application/json", ...rest.headers },
    body: json !== undefined ? JSON.stringify(json) : rest.body,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(body.error ?? res.statusText, res.status);
  }
  return res.json().catch(() => ({}) as T);
}

const KEY_PREFIX: Record<string, string> = {
  people: "/api/people",
  chores: "/api/chores",
  calendar: "/api/calendar",
  shopping: "/api/shopping",
  meals: "/api/meals",
  profiles: "/api/profiles",
  devices: "/api/devices",
};

let sseStarted = false;

function startSse() {
  if (sseStarted || typeof window === "undefined") return;
  sseStarted = true;

  const connect = () => {
    const es = new EventSource("/api/stream");
    es.addEventListener("invalidate", (event) => {
      try {
        const { keys } = JSON.parse((event as MessageEvent).data) as { keys: string[] };
        const prefixes = keys.map((k) => KEY_PREFIX[k]).filter(Boolean);
        if (prefixes.length) {
          mutate(
            (swrKey) =>
              typeof swrKey === "string" && prefixes.some((p) => swrKey.startsWith(p)),
            undefined,
            { revalidate: true },
          );
        }
      } catch {
        /* ignore malformed event */
      }
    });
    es.onerror = () => {
      es.close();
      setTimeout(connect, 3000);
    };
  };

  connect();
}

/**
 * SWR bound to the SSE invalidation stream. Polls as a fallback so a wall
 * display recovers even if the stream drops.
 */
export function useLiveData<T>(key: string | null, config?: SWRConfiguration<T>) {
  useEffect(startSse, []);
  return useSWR<T>(key, jsonFetcher, {
    revalidateOnFocus: true,
    refreshInterval: 60_000,
    keepPreviousData: true,
    ...config,
  });
}
