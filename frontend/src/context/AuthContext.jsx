import { createContext, useContext, useEffect, useMemo, useState } from "react";
import * as authApi from "../api/auth.api.js";
import {
  clearAccessToken,
  setAccessToken,
  setAuthExpiredHandler,
} from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [sessionError, setSessionError] = useState("");

  useEffect(() => {
    let active = true;
    setAuthExpiredHandler(() => {
      if (active) setUser(null);
    });

    authApi
      .refreshSession()
      .then((data) => {
        if (!data.accessToken) throw new Error("The session response was incomplete.");
        setAccessToken(data.accessToken);
        return authApi.getCurrentUser();
      })
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch((error) => {
        clearAccessToken();
        if (active && ![401, 403].includes(error.response?.status)) {
          setSessionError(
            "Your session could not be restored. You can still browse movies and sign in again.",
          );
        }
      })
      .finally(() => {
        if (active) setReady(true);
      });

    return () => {
      active = false;
      setAuthExpiredHandler(null);
    };
  }, []);

  const signIn = async (credentials) => {
    const result = await authApi.login(credentials);
    setAccessToken(result.accessToken);
    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
      setSessionError("");
      return currentUser;
    } catch (error) {
      clearAccessToken();
      setUser(null);
      throw error;
    }
  };

  const signUp = async (details) => {
    return authApi.register(details);
  };

  const signOut = async () => {
    try {
      await authApi.logout();
    } finally {
      clearAccessToken();
      setUser(null);
    }
  };

  const value = useMemo(
    () => ({ user, ready, sessionError, signIn, signUp, signOut }),
    [user, ready, sessionError],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
