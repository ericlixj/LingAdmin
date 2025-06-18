import type { AuthProvider } from "@refinedev/core";
import axiosInstance, { REFRESH_TOKEN_KEY, TOKEN_KEY } from "./utils/axiosInstance";
export const PERMISSIONS_KEY = "permissions";

export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const response = await axiosInstance.post(`/login`, {
        email,
        password,
      });
      localStorage.setItem(TOKEN_KEY, response.data.access_token);
      localStorage.setItem(REFRESH_TOKEN_KEY, response.data.refresh_token);

      const me = await axiosInstance.get("/me");
      localStorage.setItem(PERMISSIONS_KEY, JSON.stringify(me.data.permissions));
      return {
        success: true,
        redirectTo: "/",
      };
    } catch (error: any) {
      const message =
        error?.response?.data?.detail || "Invalid email or password";
      return {
        success: false,
        error: {
          name: "LoginError",
          message,
        },
      };
    }
  },

  logout: async () => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    return {
      success: true,
      redirectTo: "/login",
    };
  },

  check: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    return {
      authenticated: !!token,
      redirectTo: token ? undefined : "/login",
    };
  },

  getPermissions: async () => {
    return JSON.parse(localStorage.getItem(PERMISSIONS_KEY) || "[]");
  },

  getIdentity: async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) return null;

    try {
      const response = await axiosInstance.get(`/me`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      return response.data;
    } catch {
      return null;
    }
  },

  onError: async (error) => {
    if (error?.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      return { logout: true, redirectTo: "/login" };
    }
    return { error };
  },
};
