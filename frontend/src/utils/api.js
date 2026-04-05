import axios from "axios";

/* ---------------- API URL ---------------- */

const rawApiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";
export const API_URL = rawApiUrl.replace(/\/$/, "") + (rawApiUrl.endsWith("/api") ? "" : "/api");

/* ---------------- AXIOS INSTANCE ---------------- */

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: false,
});

/* ---------------- REQUEST INTERCEPTOR ---------------- */

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

/* ---------------- RESPONSE INTERCEPTOR ---------------- */

api.interceptors.response.use(
  (response) => response,

  (error) => {
    const status = error?.response?.status;

    /* TOKEN INVALID / EXPIRED */

    if (status === 401) {
      console.warn("Unauthorized - logging out");

      localStorage.removeItem("token");

      /* redirect to login */

      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

/* ---------------- HELPER METHODS ---------------- */

export const get = (url, config = {}) => api.get(url, config);

export const post = (url, data = {}, config = {}) =>
  api.post(url, data, config);

export const put = (url, data = {}, config = {}) =>
  api.put(url, data, config);

export const del = (url, config = {}) => api.delete(url, config);