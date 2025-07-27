"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { checkUserAuth, type AuthResult } from "@/utils/auth/user";

// Simple singleton to manage auth state
class AuthManager {
  private static instance: AuthManager;
  private authState: AuthResult = {
    isLoggedIn: false,
    user: null,
    session: null,
  };
  private loading = true;
  private listeners: Set<(state: AuthResult, loading: boolean) => void> =
    new Set();
  private initialized = false;
  private subscription: { unsubscribe: () => void } | null = null;
  private initializationPromise: Promise<void> | null = null;
  private isHydrating = true; // Track hydration state

  static getInstance(): AuthManager {
    if (!AuthManager.instance) {
      AuthManager.instance = new AuthManager();
    }
    return AuthManager.instance;
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => {
      try {
        listener(this.authState, this.loading);
      } catch (error) {
        console.error("Error in auth listener:", error);
      }
    });
  }

  // Mark hydration as complete
  setHydrationComplete() {
    this.isHydrating = false;
  }

  async initialize() {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    if (this.initialized) {
      return Promise.resolve();
    }

    this.initializationPromise = this._initialize();
    return this.initializationPromise;
  }

  private async _initialize() {
    if (this.initialized) return;

    const supabase = createClient();

    // Initial auth check with retry logic
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        // First, try to refresh the session
        const { error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn("Session error during initialization:", sessionError);
        }

        // Then check user auth
        const result = await checkUserAuth();
        this.authState = result;
        this.loading = false;
        this.notifyListeners();
        break;
      } catch (error) {
        console.error(`Auth check failed (attempt ${retryCount + 1}):`, error);
        retryCount++;

        if (retryCount >= maxRetries) {
          console.error("Max retries reached, setting default auth state");
          this.authState = { isLoggedIn: false, user: null, session: null };
          this.loading = false;
          this.notifyListeners();
        } else {
          // Wait before retrying
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * retryCount),
          );
        }
      }
    }

    // Listen for auth state changes with better error handling
    try {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        console.log(
          "Auth state change:",
          event,
          session ? "Session exists" : "No session",
        );

        try {
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            // User signed in or token refreshed
            const result = await checkUserAuth();
            this.authState = result;
            this.loading = false;
            this.notifyListeners();
          } else if (event === "SIGNED_OUT") {
            // User signed out
            this.authState = { isLoggedIn: false, user: null, session: null };
            this.loading = false;
            this.notifyListeners();
          } else if (event === "USER_UPDATED") {
            // User data updated
            const result = await checkUserAuth();
            this.authState = result;
            this.notifyListeners();
          }
        } catch (error) {
          console.error("Error handling auth state change:", error);
          // Don't update state on error, keep current state
        }
      });

      this.subscription = subscription;
    } catch (error) {
      console.error("Error setting up auth subscription:", error);
    }

    // Cleanup subscription on page unload
    if (typeof window !== "undefined") {
      const cleanup = () => {
        if (this.subscription) {
          try {
            this.subscription.unsubscribe();
          } catch (error) {
            console.error("Error unsubscribing from auth:", error);
          }
        }
      };

      window.addEventListener("beforeunload", cleanup);
      window.addEventListener("pagehide", cleanup);
    }

    this.initialized = true;
  }

  subscribe(listener: (state: AuthResult, loading: boolean) => void) {
    this.listeners.add(listener);
    // Immediately notify with current state
    listener(this.authState, this.loading);

    return () => {
      this.listeners.delete(listener);
    };
  }

  async refreshAuth() {
    this.loading = true;
    this.notifyListeners();

    try {
      const supabase = createClient();

      // First try to refresh the session
      const { error: sessionError } = await supabase.auth.getSession();

      if (sessionError) {
        console.warn("Session refresh error:", sessionError);
      }

      // Then check user auth
      const result = await checkUserAuth();
      this.authState = result;
      this.loading = false;
      this.notifyListeners();
    } catch (error) {
      console.error("Auth refresh failed:", error);
      this.authState = { isLoggedIn: false, user: null, session: null };
      this.loading = false;
      this.notifyListeners();
    }
  }

  getCurrentState() {
    return { ...this.authState, loading: this.loading };
  }

  getHydrationState() {
    return this.isHydrating;
  }
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthResult>({
    isLoggedIn: false,
    user: null,
    session: null,
  });
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const mountedRef = useRef(false);

  useEffect(() => {
    mountedRef.current = true;
    setMounted(true);

    const authManager = AuthManager.getInstance();

    // Mark hydration as complete after mount
    authManager.setHydrationComplete();

    // Initialize auth
    authManager.initialize().catch((error) => {
      console.error("Failed to initialize auth:", error);
    });

    // Subscribe to auth changes
    const unsubscribe = authManager.subscribe((state, loadingState) => {
      if (mountedRef.current) {
        setAuthState(state);
        setLoading(loadingState);
      }
    });

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, []);

  const refreshAuth = async () => {
    const authManager = AuthManager.getInstance();
    await authManager.refreshAuth();
  };

  // Return consistent state during hydration
  if (!mounted) {
    return {
      isLoggedIn: false,
      user: null,
      session: null,
      loading: true,
      refreshAuth,
    };
  }

  return {
    ...authState,
    loading,
    refreshAuth,
  };
}

// Shorthand hooks for specific use cases
export function useUser() {
  const { user, loading } = useAuth();
  return { user, loading };
}

export function useIsLoggedIn() {
  const { isLoggedIn, loading } = useAuth();
  return { isLoggedIn, loading };
}
