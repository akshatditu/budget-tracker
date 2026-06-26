import axios from "axios";

// withCredentials so the session cookie set by Google SSO is sent on every call.
export const api = axios.create({ baseURL: "/api", withCredentials: true });

// On any 401 (e.g. the session expired mid-use), broadcast so the auth guard
// flips back to the login screen. The /auth/me probe handles its own 401.
api.interceptors.response.use(
  (r) => r,
  (error) => {
    const status = error?.response?.status;
    const url: string = error?.config?.url ?? "";
    if (status === 401 && !url.includes("/auth/me")) {
      window.dispatchEvent(new Event("auth:unauthorized"));
    }
    return Promise.reject(error);
  }
);
