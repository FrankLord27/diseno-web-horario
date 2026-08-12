"use client";

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { AuthTokens, LoginInput } from "@horarios/shared-types";
import { apiClient } from "@/lib/api-client";
import {
  clearTokens,
  getAccessToken,
  getStoredUser,
  setTokens,
} from "@/lib/auth-storage";

export function useCurrentUser() {
  const [user, setUser] = useState<AuthTokens["user"] | null>(null);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    setUser(getStoredUser());
    setChecked(true);
  }, []);

  const role = user?.role ?? null;
  return {
    user,
    checked,
    role,
    isSuperAdmin: role === "SUPER_ADMIN",
    // "admin" = puede gestionar el sistema (super admin o admin).
    isAdmin: role === "SUPER_ADMIN" || role === "ADMIN",
    isMaestro: role === "MAESTRO",
    isEstudiante: role === "ESTUDIANTE",
  };
}

export function useLogin() {
  return useMutation({
    mutationFn: (data: LoginInput) =>
      apiClient.postNoAuthCheck<AuthTokens>("/auth/login", data),
    onSuccess: (data) => {
      setTokens(data.accessToken, data.refreshToken, data.user);
    },
  });
}

export function logout(): void {
  clearTokens();
  if (typeof window !== "undefined") {
    window.location.href = "/login";
  }
}

export function hasSession(): boolean {
  return Boolean(getAccessToken() && getStoredUser());
}
