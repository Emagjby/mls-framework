"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import CourseHeader from "@/components/ui/CourseHeader";
import {
  fetchStageBySlugAndOrder,
  StageDetail,
  fetchCourseBySlug,
} from "@/utils/courses";
import { checkStageCompletion, markStageComplete } from "./actions";

export default function StagePage() {
  const params = useParams();
  const router = useRouter();
  const { slug, stageId } = params;

  const [lessonCompleted, setLessonCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [checkingCompletion, setCheckingCompletion] = useState(true);
  const [currentStage, setCurrentStage] = useState<StageDetail | null>(null);
  const [currentCourse, setCurrentCourse] = useState<{ name: string } | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get course and stage data
  const courseSlug = slug as string;
  const currentStageOrderIndex = parseInt(stageId as string);

  useEffect(() => {
    console.log("🔍 [DEBUG] useEffect triggered with:", {
      courseSlug,
      currentStageOrderIndex,
    });

    const loadData = async () => {
      console.log("🔍 [DEBUG] loadData function called");
      try {
        setLoading(true);
        console.log("🔍 [DEBUG] Loading state set to true");

        // Fetch course data first
        console.log("🔍 [DEBUG] Fetching course data");
        const fetchedCourse = await fetchCourseBySlug(courseSlug);
        console.log("🔍 [DEBUG] Course data:", fetchedCourse);

        if (fetchedCourse) {
          setCurrentCourse(fetchedCourse);
        }

        // Fetch stage data
        const fetchedStage = await fetchStageBySlugAndOrder(
          courseSlug,
          currentStageOrderIndex,
        );

        console.log(
          "🔍 [DEBUG] fetchStageBySlugAndOrder returned:",
          fetchedStage,
        );

        if (fetchedStage) {
          console.log("✅ [DEBUG] Setting currentStage:", fetchedStage);
          setCurrentStage(fetchedStage);
        } else {
          console.error("❌ [DEBUG] No stage returned, setting error");
          setError("Stage not found");
        }

        // Check if user has completed this stage
        const completionResult = await checkStageCompletion(
          courseSlug,
          currentStageOrderIndex,
        );
        if (completionResult.success && completionResult.data) {
          setLessonCompleted(completionResult.data.isCompleted || false);
        }
      } catch (err) {
        console.error("❌ [DEBUG] Error in loadData:", err);
        setError("Failed to load data");
        console.error("Error loading data:", err);
      } finally {
        console.log("🔍 [DEBUG] Setting loading to false");
        setLoading(false);
        setCheckingCompletion(false);
      }
    };

    if (courseSlug && currentStageOrderIndex) {
      console.log("✅ [DEBUG] Valid parameters, calling loadData");
      loadData();
    } else {
      console.log("❌ [DEBUG] Invalid parameters:", {
        courseSlug,
        currentStageOrderIndex,
      });
    }
  }, [courseSlug, currentStageOrderIndex]);

  console.log("🔍 [DEBUG] Component render - State:", {
    loading,
    error,
    currentStage: !!currentStage,
    currentCourse: !!currentCourse,
  });

  if (loading) {
    console.log("🔍 [DEBUG] Component rendering loading state");
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <CourseHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            {/* Hero Section Skeleton */}
            <div className="relative overflow-hidden rounded-3xl bg-gray-200 dark:bg-gray-700 p-8 mb-8">
              <div className="flex items-start space-x-6">
                <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-2xl"></div>
                <div className="flex-1">
                  <div className="h-8 bg-gray-300 dark:bg-gray-600 rounded mb-3"></div>
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                </div>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="grid lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 h-96"></div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 h-96"></div>
              </div>
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 h-48"></div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 h-64"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !currentStage) {
    console.log("🔍 [DEBUG] Component rendering error state:", {
      error,
      currentStage: !!currentStage,
    });
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {error || "Lesson Not Found"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            The lesson you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
          <Button
            variant="primary"
            onClick={() => router.push(`/course/${courseSlug}`)}
            className="w-full"
          >
            Back to Course
          </Button>
        </div>
      </div>
    );
  }

  const handleMarkComplete = async () => {
    setIsLoading(true);

    try {
      const result = await markStageComplete(
        courseSlug,
        currentStageOrderIndex,
      );

      if (result.success) {
        setLessonCompleted(true);
      } else {
        console.error("Failed to mark stage complete:", result.error);
        // You could add a notification here for error handling
      }
    } catch (error) {
      console.error("Error marking stage complete:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousStage = () => {
    if (currentStageOrderIndex > 1) {
      router.push(`/course/${courseSlug}/stage/${currentStageOrderIndex - 1}`);
    } else {
      router.push(`/course/${courseSlug}`);
    }
  };

  const handleTakeQuiz = () => {
    router.push(`/course/${courseSlug}/stage/${currentStageOrderIndex}/quiz`);
  };

  console.log("✅ [DEBUG] Component rendering with data:", {
    currentStage,
    currentCourse,
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <CourseHeader />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-8">
          <button
            onClick={() => router.push(`/course/${courseSlug}`)}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            {currentCourse?.name || courseSlug}
          </button>
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
          <span className="text-gray-900 dark:text-white font-medium">
            Lesson {currentStageOrderIndex}
          </span>
        </nav>

        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-4">
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                    Lesson {currentStageOrderIndex}
                  </span>
                  <span className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-medium">
                    {currentStage.difficulty}
                  </span>
                </div>
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-3 drop-shadow-lg">
                  {currentStage.title}
                </h1>
                <p className="text-xl text-blue-100 mb-6 max-w-2xl leading-relaxed">
                  {currentStage.subtitle}
                </p>
                <div className="flex items-center space-x-6 text-blue-100">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>{currentStage.duration} min</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5"
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
                    <span>{currentStage.readingTime}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Video Section */}
            {currentStage.videoUrl && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden backdrop-blur-sm">
                <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center mr-4">
                      <svg
                        className="w-5 h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-1">
                        Video Lesson
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        Watch the video to understand the concepts
                      </p>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <div
                    className="relative w-full"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <iframe
                      className="absolute top-0 left-0 w-full h-full"
                      src={currentStage.videoUrl}
                      title={currentStage.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Article Content */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden backdrop-blur-sm">
              <div className="p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-4">
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
                        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                      />
                    </svg>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-1">
                      Lesson Content
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      Read through the detailed lesson material
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <div
                  className="prose prose-lg max-w-none prose-headings:text-gray-900 prose-headings:dark:text-white prose-p:text-gray-700 prose-p:dark:text-gray-300 prose-strong:text-gray-900 prose-strong:dark:text-white"
                  dangerouslySetInnerHTML={{ __html: currentStage.content }}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-6">
            {/* Tags */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Topics Covered
                </h3>
              </div>
              <div className="flex flex-wrap gap-3">
                {currentStage.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 rounded-xl text-sm font-medium backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center mb-6">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m-6 3l6-3"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                  Navigation
                </h3>
              </div>

              <div className="space-y-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousStage}
                  disabled={currentStageOrderIndex === 1}
                  className="w-full justify-start bg-white/70 dark:bg-gray-800/70 border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600 rounded-md flex items-center justify-center mr-3">
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                  </div>
                  <span className="font-medium">Previous Lesson</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push(`/course/${courseSlug}`)}
                  className="w-full justify-start bg-white/70 dark:bg-gray-800/70 border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <div className="w-6 h-6 bg-gradient-to-br from-indigo-400 to-indigo-500 dark:from-indigo-500 dark:to-indigo-600 rounded-md flex items-center justify-center mr-3">
                    <svg
                      className="w-3 h-3 text-white"
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
                  </div>
                  <span className="font-medium">Back to Course</span>
                </Button>

                {!lessonCompleted && !checkingCompletion ? (
                  <Button
                    onClick={handleMarkComplete}
                    disabled={isLoading}
                    className="w-full justify-start bg-white/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                        Marking Complete...
                      </div>
                    ) : (
                      <>
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600 rounded-md flex items-center justify-center mr-3">
                          <svg
                            className="w-3 h-3 text-white"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                        <span className="font-medium">Mark as Complete</span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleTakeQuiz}
                    className="w-full justify-start bg-white/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-300 shadow-sm hover:shadow-md"
                  >
                    <div className="w-6 h-6 bg-gradient-to-br from-purple-400 to-purple-500 dark:from-purple-500 dark:to-purple-600 rounded-md flex items-center justify-center mr-3">
                      <svg
                        className="w-3 h-3 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                        />
                      </svg>
                    </div>
                    <span className="font-medium">Go to Quiz</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
