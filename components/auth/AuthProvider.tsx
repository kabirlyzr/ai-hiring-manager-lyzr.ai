/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import Cookies from "js-cookie";
import { useDispatch } from 'react-redux';
import { completeOnboarding } from '@/store/onboardingSlice';

interface TokenData {
  user_id: string;
  api_key: string;
}

interface UserData {
  user_id: string;
  is_onboarded: boolean;
  is_new_user?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  isNewUser: boolean;
  userId: string | null;
  token: string | null;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [isNewUser, setIsNewUser] = useState(false);
  const dispatch = useDispatch();

  const checkAuth = async () => {
    try {
      if (typeof window === "undefined") return;

      const { default: lyzr } = await import("lyzr-agent");

      const tokenData = (await lyzr.getKeys()) as unknown as TokenData[];

      if (tokenData && tokenData[0]) {
        Cookies.set("user_id", tokenData[0].user_id);
        Cookies.set("token", tokenData[0].api_key);

        const response = await fetch("/api/auth");
        const data = await response.json();

        if (data.success) {
          setIsAuthenticated(true);
          setUserId(tokenData[0].user_id);
          setToken(tokenData[0].api_key);
          
          const userData = data.user as UserData;
          setIsOnboarded(userData.is_onboarded);
          setIsNewUser(userData.is_new_user || false);
          
          // Sync database isOnboarded state to Redux
          if (userData.is_onboarded) {
            dispatch(completeOnboarding());
          }

          // Redirect new users or non-onboarded users to onboarding
          if (userData.is_new_user || !userData.is_onboarded) {
            router.push('/onboarding');
          }
        } else {
          handleAuthFailure();
        }
      } else {
        handleAuthFailure();
      }
    } catch (err) {
      console.error("Auth check failed:", err);
      handleAuthFailure();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthFailure = () => {
    setIsAuthenticated(false);
    setUserId(null);
    setToken(null);
    setIsOnboarded(false);
    setIsNewUser(false);
    Cookies.remove("user_id");
    Cookies.remove("token");
    router.push("/");
  };

  useEffect(() => {
    const init = async () => {
      if (typeof window === "undefined") return;

      try {
        const { default: lyzr } = await import("lyzr-agent");
        await lyzr.init("pk_c14a2728e715d9ea67bf");

        const unsubscribe = lyzr.onAuthStateChange((isAuthenticated) => {
          if (isAuthenticated) {
            checkAuth();
          } else {
            handleAuthFailure();
          }
        });

        await checkAuth();

        return () => unsubscribe();
      } catch (err) {
        console.error("Init failed:", err);
        setIsLoading(false);
      }
    };

    init();
  }, []);

  return (
    <AuthContext.Provider
      value={{ 
        isAuthenticated, 
        isLoading, 
        isOnboarded,
        isNewUser,
        userId, 
        token, 
        checkAuth 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 