import { createContext, useEffect, useState } from "react";
import { loginUser, registerUser } from "../utils/services";

export const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setUser({ token, ...payload });
    }
    setLoading(false);
  }, []);

  const handleLogin = async (loginInfo) => {
    const data = await loginUser(loginInfo);
    localStorage.setItem("token", data.access_token);
    const payload = JSON.parse(atob(data.access_token.split(".")[1]));
    setUser({ token: data.access_token, ...payload });
    return data;
  };

  const handleRegister = async (registerInfo) => {
    const data = await registerUser(registerInfo);
    return data;
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        handleLogin,
        handleRegister,
        handleLogout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
