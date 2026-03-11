import axios from "axios";

const normalizeApiBaseUrl = (rawValue) => {
  if (typeof rawValue !== "string") return "/api";

  const trimmed = rawValue.trim();
  if (!trimmed) return "/api";

  const withoutTrailingSlash = trimmed.replace(/\/+$/, "");
  if (!withoutTrailingSlash) return "/api";

  // If only an origin is provided (e.g. https://api.example.com), default to /api.
  if (/^https?:\/\//i.test(withoutTrailingSlash)) {
    try {
      const parsedUrl = new URL(withoutTrailingSlash);
      if (parsedUrl.pathname === "" || parsedUrl.pathname === "/") {
        parsedUrl.pathname = "/api";
      }
      return parsedUrl.toString().replace(/\/+$/, "");
    } catch {
      return "/api";
    }
  }

  return withoutTrailingSlash;
};

export const API_BASE_URL = normalizeApiBaseUrl(import.meta.env.VITE_API_URL);

export const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("courierflow_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
