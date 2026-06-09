"use client";

import { useRouter } from "next/navigation";
import React, { createContext, useContext, useState } from "react";

import { UserService } from './services/UserService';

export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber: string | null;
  role: string;
  isAdmin: boolean;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AuthContextType {
  token: string | null;
  user: User | null;
  signIn: (newToken: string, userData: User) => void;
  signOut: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  const router = useRouter();

  const signIn = (newToken: string, userData: User) => {
    setToken(newToken);
    setUser(userData);

    try {
      localStorage.setItem("userToken", String(newToken));
      localStorage.setItem("user", JSON.stringify(userData));
    } catch (err) {
      // localStorage could be disabled in some environments — fail silently.
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to persist auth to localStorage", err);
      }
    }
  };

  const signOut = () => {
    setToken(null);
    setUser(null);

    try {
      localStorage.removeItem("userToken");
      localStorage.removeItem("user");
    } catch (err) {
      if (process.env.NODE_ENV === 'development') {
        console.error("Failed to remove auth from localStorage", err);
      }
    }

    router.push(`/auth/login`);
  };

  // Restore token and user data from localStorage on initial load
  React.useEffect(() => {
    const restoreAuth = async () => {
      try {
        const storedToken = localStorage.getItem("userToken");

        // Guard against the string "undefined" or "null"
        if (storedToken && storedToken !== "undefined" && storedToken !== "null") {
          setToken(storedToken);

          // Try to fetch user profile from API if we have a token
          try {
            // Set token in HttpService first to ensure it's available
            if (typeof window !== 'undefined') {
              localStorage.setItem('userToken', storedToken);
            }
            
            const userService = new UserService();
            const profileData = await userService.getUserProfile<{ success: boolean; data: { user: User } }>();
            
            // Extract the actual user object from the API response
            // API returns: { success: true, data: { user: {...} } }
            const actualUser = profileData.data?.user || profileData.data || profileData;
            
            // Type assertion to ensure correct type
            setUser(actualUser as User);
          } catch (err) {
            console.warn('Failed to fetch user profile from API, using stored data:', err);
            // If API call fails, try to load from localStorage
            const storedUser = localStorage.getItem("user");
            if (storedUser && storedUser !== "undefined" && storedUser !== "null") {
              try {
                const parsed = JSON.parse(storedUser);
                // optional: validate shape before setUser(parsed)
                setUser(parsed);
              } catch (parseErr) {
                if (process.env.NODE_ENV === 'development') {
                  console.warn("Could not parse stored user, clearing invalid value.", parseErr);
                }
                // clear corrupt value so we don't try to parse it again
                localStorage.removeItem("user");
              }
            }
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV === 'development') {
          console.error("Error reading auth from localStorage", err);
        }
      }
    };

    restoreAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within an AuthProvider");
  }
  return context;
};