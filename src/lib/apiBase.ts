const LIVE_WORKER_URL = "https://co-yen-content-importer.truongnq-vie.workers.dev";

export function apiBaseUrl(): string {
  if (typeof window !== "undefined" && window.location.hostname === "tienganhcoyen.online") {
    return LIVE_WORKER_URL;
  }
  return import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, "") ?? "http://localhost:8787";
}
