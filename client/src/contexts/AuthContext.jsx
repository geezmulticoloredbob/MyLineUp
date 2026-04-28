import { createContext, useContext, useEffect, useState } from 'react';
import { fetchCurrentUser, loginUser, registerUser } from '../features/auth/services/authApi';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    fetchCurrentUser()
      .then(({ user }) => setUser(user))
      .catch(() => {
        localStorage.removeItem('token');
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  async function login(credentials) {
    const data = await loginUser(credentials);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  async function register(payload) {
    const data = await registerUser(payload);
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    return data;
  }

  function logout() {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  }

  function updateUser(updates) {
    setUser((prev) => (prev ? { ...prev, ...updates } : prev));
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, register, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
