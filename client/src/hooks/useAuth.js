// useAuth – manages admin JWT token in localStorage.
// Centralizes login/logout logic used by AdminSection.

import { useState, useCallback } from 'react';

const STORAGE_KEY = 'adminToken';

export default function useAuth() {
  const [token, setToken] = useState(() => localStorage.getItem(STORAGE_KEY));

  const login = useCallback((jwt) => {
    localStorage.setItem(STORAGE_KEY, jwt);
    setToken(jwt);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setToken(null);
  }, []);

  return { token, login, logout };
}
