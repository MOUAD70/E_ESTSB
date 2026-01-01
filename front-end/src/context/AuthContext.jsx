import { createContext, useEffect, useState, useCallback } from "react";
import { loginUser, registerUser } from "../utils/services";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [error, setError] = useState(null);

  const parseToken = (token) => {
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        return null;
      }
      return payload;
    } catch {
      return null;
    }
  };

  const loadUserFromStorage = useCallback(() => {
    const token = localStorage.getItem("token");
    const payload = token ? parseToken(token) : null;
    if (payload) {
      setUser({ token, ...payload });
    } else {
      localStorage.removeItem("token");
      setUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUserFromStorage();
  }, [loadUserFromStorage]);

  const handleLogin = async (loginInfo) => {
    setAuthLoading(true);
    setError(null);
    try {
      const data = await loginUser(loginInfo);
      const payload = parseToken(data.access_token);
      if (!payload) throw new Error("Token invalide ou expiré");

      localStorage.setItem("token", data.access_token);
      setUser({ token: data.access_token, ...payload });

      return data;
    } catch (err) {
      setError(err.response?.data?.msg || err.message || "Erreur lors de la connexion");
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (registerInfo) => {
    setAuthLoading(true);
    setError(null);
    try {
      const data = await registerUser(registerInfo);
      return data;
    } catch (err) {
      setError(err.response?.data?.msg || err.message || "Erreur lors de la création de compte");
      throw err;
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        authLoading,
        error,
        handleLogin,
        handleRegister,
        handleLogout,
        reloadUser: loadUserFromStorage,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
