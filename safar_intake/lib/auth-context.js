'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const response = await fetch('/api/auth/me', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.ok && data.user) {
          setUser(data.user);
        }
      }
    } catch (error) {
      // Session check failed, user not logged in
      console.error('Session check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: data.error || 'Login failed' };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const register = async (name, email, password, role) => {
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: data.error || 'Registration failed' };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
    }
  };

  const loginWithPhone = async (idToken) => {
    try {
      const response = await fetch('/api/auth/verify-phone', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, error: data.error || 'Phone login failed' };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const loginWithGoogle = async (idToken, intent) => {
    try {
      const response = await fetch('/api/auth/verify-google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ idToken, ...(intent ? { intent } : {}) }),
      });

      const data = await response.json();

      if (response.ok && data.ok) {
        setUser(data.user);
        return { success: true, user: data.user, hostApplicationPending: !!data.hostApplicationPending };
      }

      return { success: false, error: data.error || 'Google sign-in failed' };
    } catch (error) {
      return { success: false, error: 'Network error. Please try again.' };
    }
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    loginWithPhone,
    loginWithGoogle,
    checkSession,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
