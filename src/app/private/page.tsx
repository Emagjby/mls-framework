"use client";

import { useAuth } from "@/hooks/useAuth";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

export default function PrivatePage() {
  const { user } = useAuth();

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-lg">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Private Page
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Hello {user?.email}! This is a protected page.
            </p>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
