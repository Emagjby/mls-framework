"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Button from "../ui/Button";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { logoutUser } from "@/utils/auth-client";
import { ThemeToggle } from "../ui/ThemeToggle";

export default function Header() {
  const [mounted, setMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  const { isLoggedIn, loading, refreshAuth } = useAuth();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (
        !target.closest(".mobile-menu") &&
        !target.closest(".hamburger-button")
      ) {
        setIsMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Prevent body scroll when menu is open
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isMobileMenuOpen]);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [router]);

  async function signOut() {
    try {
      console.log("🔍 Starting logout process...");

      const result = await logoutUser();

      if (!result.success) {
        console.error("❌ Logout error:", result.error);
        return;
      }

      console.log("✅ Logout successful");

      // Force refresh the auth state
      await refreshAuth();

      // Wait a bit to ensure the auth state has updated
      await new Promise((resolve) => setTimeout(resolve, 200));

      console.log("✅ Auth state refreshed, redirecting to login...");
      router.push("/login");
    } catch (error) {
      console.error("❌ Logout failed:", error);
    }
  }

  // Show loading state during hydration
  if (!mounted) {
    return (
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Skeleton */}
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
              <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            </div>

            {/* Navigation Skeleton */}
            <nav className="hidden md:flex space-x-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-16 h-8 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"
                ></div>
              ))}
            </nav>

            {/* Auth Buttons Skeleton */}
            <div className="flex items-center space-x-3">
              <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
            </div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header
        className={`bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 transition-all duration-300`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="flex items-center space-x-3 group">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-110">
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                    />
                  </svg>
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  MLS Framework
                </h1>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex space-x-1">
              <Link
                href="/"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Home
              </Link>
              <Link
                href="/courses"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Courses
              </Link>
              <Link
                href="/profile"
                className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-blue-50 dark:hover:bg-blue-900/20"
              >
                Profile
              </Link>
            </nav>

            {/* Desktop Auth Buttons */}
            <div className="hidden md:flex items-center space-x-3">
              {isLoggedIn && !loading && <ThemeToggle />}

              {!isLoggedIn && !loading && (
                <div className="flex items-center space-x-3">
                  <Link href="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                    >
                      Sign In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button
                      variant="primary"
                      size="sm"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                    >
                      Get Started
                    </Button>
                  </Link>
                </div>
              )}

              {isLoggedIn && !loading && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => signOut()}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign Out
                </Button>
              )}

              {loading && (
                <div className="flex items-center space-x-3">
                  <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                  <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"></div>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center space-x-3">
              {isLoggedIn && !loading && <ThemeToggle />}

              <button
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="hamburger-button p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                aria-label="Toggle mobile menu"
              >
                <div className="w-6 h-6 relative flex flex-col justify-center items-center">
                  <span
                    className={`w-5 h-0.5 bg-current transform transition-all duration-300 ease-in-out ${
                      isMobileMenuOpen
                        ? "rotate-45 translate-y-0"
                        : "translate-y-0"
                    }`}
                  />
                  <span
                    className={`w-5 h-0.5 bg-current transform transition-all duration-300 ease-in-out mt-1 ${
                      isMobileMenuOpen
                        ? "opacity-0 scale-0"
                        : "opacity-100 scale-100"
                    }`}
                  />
                  <span
                    className={`w-5 h-0.5 bg-current transform transition-all duration-300 ease-in-out mt-1 ${
                      isMobileMenuOpen
                        ? "-rotate-45 -translate-y-0"
                        : "translate-y-0"
                    }`}
                  />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile Menu Overlay */}
          <div
            className={`mobile-menu md:hidden transition-all duration-300 ease-out ${isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible"}`}
          >
            {/* Backdrop */}
            <div
              className={`fixed inset-0 bg-black/20 dark:bg-black/40 backdrop-blur-sm z-40 transition-all duration-300 ease-out ${isMobileMenuOpen ? "opacity-100" : "opacity-0"}`}
              onClick={() => setIsMobileMenuOpen(false)}
            />

            {/* Menu Panel */}
            <div
              className={`absolute top-0 left-0 right-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 shadow-2xl z-50 rounded-b-3xl transition-all duration-300 ease-out ${isMobileMenuOpen ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
            >
              <div className="px-4 pb-6 pt-3 space-y-4">
                {/* Header with Logo and Close Button */}
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                        />
                      </svg>
                    </div>
                    <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      MLS Framework
                    </h1>
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all duration-200"
                    aria-label="Close menu"
                  >
                    <svg
                      className="w-6 h-6"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
                {/* Navigation Links */}
                <nav className="space-y-2">
                  <Link
                    href="/"
                    className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-base font-medium transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                    Home
                  </Link>
                  <Link
                    href="/courses"
                    className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-base font-medium transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                    Courses
                  </Link>
                  <Link
                    href="/profile"
                    className="flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-xl text-base font-medium transition-all duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                      />
                    </svg>
                    Profile
                  </Link>
                </nav>

                {/* Divider */}
                <div className="border-t border-gray-200 dark:border-gray-700 my-4 -mx-4" />

                {/* Auth Buttons */}
                {!isLoggedIn && !loading && (
                  <div className="space-y-3">
                    <Link
                      href="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button
                        variant="ghost"
                        size="lg"
                        className="w-full text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                      >
                        <svg
                          className="w-5 h-5 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                          />
                        </svg>
                        Sign In
                      </Button>
                    </Link>
                    <Link
                      href="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      <Button
                        variant="primary"
                        size="lg"
                        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200"
                      >
                        <svg
                          className="w-5 h-5 mr-3"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
                          />
                        </svg>
                        Get Started
                      </Button>
                    </Link>
                  </div>
                )}

                {isLoggedIn && !loading && (
                  <Button
                    variant="outline"
                    size="lg"
                    onClick={() => {
                      signOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-300 dark:hover:border-red-700 hover:text-red-600 dark:hover:text-red-400 transition-all duration-200"
                  >
                    <svg
                      className="w-5 h-5 mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out
                  </Button>
                )}

                {loading && (
                  <div className="space-y-3">
                    <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                    <div className="h-12 w-full bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content Blur Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 bottom-0 bg-transparent pointer-events-none z-40">
          <style jsx global>{`
            main,
            .content-area {
              filter: blur(4px);
              transition: filter 0.3s ease-out;
            }
          `}</style>
        </div>
      )}
    </>
  );
}
