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
  tour_completed?: boolean;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isOnboarded: boolean;
  isNewUser: boolean;
  tourCompleted: boolean;
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
  const [tourCompleted, setTourCompleted] = useState(false);
  const dispatch = useDispatch();

  const checkAuth = async () => {
    try {
      if (typeof window === "undefined") return;

      const { default: lyzr } = await import("lyzr-agent");

      const tokenData = (await lyzr.getKeys()) as unknown as TokenData[];

      if (tokenData && tokenData[0]) {
        // Set cookies with 7-day expiration
        Cookies.set("user_id", tokenData[0].user_id, { expires: 7 });
        Cookies.set("token", tokenData[0].api_key, { expires: 7 });

        const response = await fetch("/api/auth");
        const data = await response.json();

        if (data.success) {
          setIsAuthenticated(true);
          setUserId(tokenData[0].user_id);
          setToken(tokenData[0].api_key);
          
          const userData = data.user as UserData;
          setIsOnboarded(userData.is_onboarded);
          setIsNewUser(userData.is_new_user || false);
          setTourCompleted(userData.tour_completed || false);
          
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
        // Check if we have stored cookies
        const storedUserId = Cookies.get("user_id");
        const storedToken = Cookies.get("token");
        
        if (storedUserId && storedToken) {
          // Validate stored tokens against backend
          try {
            const response = await fetch("/api/auth");
            const data = await response.json();
            
            if (data.success) {
              setIsAuthenticated(true);
              setUserId(storedUserId);
              setToken(storedToken);
              
              const userData = data.user as UserData;
              setIsOnboarded(userData.is_onboarded);
              setIsNewUser(userData.is_new_user || false);
              setTourCompleted(userData.tour_completed || false);
              
              if (userData.is_onboarded) {
                dispatch(completeOnboarding());
              }
              
              // Refresh cookies to extend expiration
              Cookies.set("user_id", storedUserId, { expires: 7 });
              Cookies.set("token", storedToken, { expires: 7 });
              
              return;
            }
          } catch (error) {
            console.error("Failed to validate stored tokens:", error);
          }
        }
        
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
    setTourCompleted(false);
    Cookies.remove("user_id");
    Cookies.remove("token");
    
    // Only redirect if we're not already on the home page
    if (window.location.pathname !== '/') {
      router.push("/");
    }
  };

  // Check authentication status when tab becomes visible again
  useEffect(() => {
    if (typeof window === "undefined") return;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        // Tab is now visible/active
        const storedUserId = Cookies.get("user_id");
        const storedToken = Cookies.get("token");
        
        // Check if cookies exist and we're not already authenticated
        if (storedUserId && storedToken) {
          if (!isAuthenticated) {
            checkAuth();
          }
        } else if (isAuthenticated) {
          // If cookies don't exist but we think we're authenticated, reset state
          handleAuthFailure();
        }
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // When the user navigates between pages, check auth status
    const handleRouteChange = () => {
      const storedUserId = Cookies.get("user_id");
      const storedToken = Cookies.get("token");
      
      if (!storedUserId || !storedToken) {
        if (isAuthenticated) {
          handleAuthFailure();
        }
      }
    };
    
    window.addEventListener('popstate', handleRouteChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('popstate', handleRouteChange);
    };
  }, [isAuthenticated]);

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
        tourCompleted,
        userId, 
        token, 
        checkAuth 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
} 