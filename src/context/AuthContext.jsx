function getCookie(name) {
  const match = document.cookie.match(new RegExp(`(^| )${name}=([^;]+)`));
  return match ? decodeURIComponent(match[2]) : null;
}

function decodeJwtPayload(token) {
  try {
    const payload = token.split(".")[1];
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json);
  } catch {
    return null;
  }
}

import { createContext, useCallback, useContext, useState } from "react";
import { apiRequest } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const token = getCookie("oda_owner_token");
      if (!token) {
        setOwner(null);
        return;
      }
      const payload = decodeJwtPayload(token);
      if (!payload || payload.exp < Math.floor(Date.now() / 1000)) {
        setOwner(null);
        return;
      }
      setOwner({
        id: payload.sub,
        phoneNumber: payload.phone,
        isAdmin: payload.admin,
        canManageMultipleRestaurants: payload.multi,
      });
    } catch {
      setOwner(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const value = {
    owner,
    loading,
    async requestLoginOtp(phoneNumber) {
      return apiRequest("/auth/login/request-otp", {
        method: "POST",
        body: { phoneNumber },
      });
    },
    async verifyLoginOtp(payload) {
      const data = await apiRequest("/auth/login/verify-otp", {
        method: "POST",
        body: payload,
      });
      setOwner(data.owner);
      return data;
    },
    async requestRegisterOtp(formData) {
      return apiRequest("/auth/register/request-otp", {
        method: "POST",
        formData,
      });
    },
    async verifyRegisterOtp(payload) {
      const data = await apiRequest("/auth/register/verify-otp", {
        method: "POST",
        body: payload,
      });
      setOwner(data.owner);
      return data;
    },
    async requestChangePhoneOtp(newPhoneNumber) {
      return apiRequest("/auth/change-phone/request-otp", {
        method: "POST",
        body: { newPhoneNumber },
      });
    },
    async verifyChangePhoneOtp(payload) {
      const data = await apiRequest("/auth/change-phone/verify-otp", {
        method: "POST",
        body: payload,
      });
      setOwner(data.owner);
      return data;
    },
    async logout() {
      try {
        await apiRequest("/auth/logout", {
          method: "POST",
        });
      } finally {
        setOwner(null);
      }
    },
    refreshSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
