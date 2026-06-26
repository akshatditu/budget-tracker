import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./api";
import type { User } from "../types/api";

const AUTH_KEY = ["auth", "me"];

/** Current user, or null when not authenticated. retry:false so a 401 resolves fast. */
export function useAuth() {
  return useQuery<User | null>({
    queryKey: AUTH_KEY,
    queryFn: async () => {
      try {
        return (await api.get<User>("/auth/me")).data;
      } catch {
        return null; // treat 401 (and any auth probe failure) as logged-out
      }
    },
    retry: false,
    staleTime: 60_000,
  });
}

/** Flip to logged-out when any request reports 401 (session expired). */
export function useAuthExpiryListener() {
  const qc = useQueryClient();
  useEffect(() => {
    const onUnauth = () => qc.setQueryData(AUTH_KEY, null);
    window.addEventListener("auth:unauthorized", onUnauth);
    return () => window.removeEventListener("auth:unauthorized", onUnauth);
  }, [qc]);
}

export async function logout() {
  try {
    await api.post("/auth/logout");
  } finally {
    window.location.href = "/";
  }
}
