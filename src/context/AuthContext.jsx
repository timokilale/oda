import { createContext, useCallback, useContext, useState } from "react";
import { apiRequest } from "../lib/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [owner, setOwner] = useState(null);
  const [loading, setLoading] = useState(false);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/auth/me");
      setOwner(data.owner);
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
