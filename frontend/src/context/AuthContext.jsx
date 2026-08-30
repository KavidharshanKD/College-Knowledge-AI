import React, { createContext, useContext, useState, useEffect } from "react";
import { loginUser, loginAdmin } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("college_ai_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Student login
  const login = async (name, email) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await loginUser(name, email);
      setUser(userData);
      localStorage.setItem("college_ai_user", JSON.stringify(userData));
      return userData;
    } catch (err) {
      setError(err.message || "Failed to enter portal");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Admin login
  const adminLogin = async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const userData = await loginAdmin(email, password);
      setUser(userData);
      localStorage.setItem("college_ai_user", JSON.stringify(userData));
      return userData;
    } catch (err) {
      setError(err.message || "Failed to log in as admin");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("college_ai_user");
  };

  return (
    <AuthContext.Provider value={{ user, login, adminLogin, logout, loading, error }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
