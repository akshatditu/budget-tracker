import axios from "axios";

export const api = axios.create({ baseURL: "/api" });

// Unwrap responses to data for terse hooks.
api.interceptors.response.use((r) => r);
