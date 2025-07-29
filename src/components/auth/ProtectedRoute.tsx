"use client";

import { useEffect, ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  redirectTo?: string;
  loadingComponent?: ReactNode;
}

export default function ProtectedRoute({
  children,
  redirectTo = "/login",
  loadingComponent,
}: ProtectedRouteProps) {
  const { isLoggedIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !isLoggedIn) {
      router.push(redirectTo);
    }
  }, [isLoggedIn, loading, router, redirectTo]);

  // Show loading while checking auth
  if (loading) {
    return (
      loadingComponent || (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading...</p>
          </div>
        </div>
      )
    );
  }

  // Show nothing while redirecting
  if (!isLoggedIn) {
    return null;
  }

  return <>{children}</>;
}
