const DEFAULT_API_BASE_URL = "http://localhost:8081/api";

function normalizeBaseUrl(url: string) {
  return url.trim().replace(/\/+$/, "");
}

export const API_BASE_URL = normalizeBaseUrl(
  import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
);
