import { createContext, useContext, useEffect, useState } from 'react';
import { fetchCurrentUser, loginUser, logoutUser, registerUser } from '../features/auth/services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentUser()
      .then(({ user }) => setUser(user))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function login(credentials) {
    const data = await loginUser(credentials);
    setUser(data.user);
    return data;
  }

  async function register(payload) {
    const data = await registerUser(payload);
    setUser(data.user);
    return data;
  }

  async function logout() {
    try {
      await logoutUser();
    } catch {
      // best-effort — clear local state regardless
    }
    setUser(null);
  }

  function updateUser(updates) {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
