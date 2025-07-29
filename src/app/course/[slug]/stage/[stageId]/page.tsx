"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import CourseHeader from "@/components/ui/CourseHeader";
import { MediaPlayer, MediaProvider } from "@vidstack/react";
import {
  defaultLayoutIcons,
  DefaultVideoLayout,
} from "@vidstack/react/player/layouts/default";
import "@vidstack/react/player/styles/default/theme.css";
import "@vidstack/react/player/styles/default/layouts/video.css";
import {
  fetchStageBySlugAndOrder,
  StageDetail,
  fetchCourseBySlug,
} from "@/utils/courses";
import {
  markStageCompleteClient,
  checkStageCompletion,
} from "@/utils/progress-client";

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

        // Check if stage is already completed
        console.log("🔍 [DEBUG] Checking stage completion status");
        const completionResult = await checkStageCompletion(
          courseSlug,
          currentStageOrderIndex,
        );

        console.log("🔍 [DEBUG] Stage completion result:", completionResult);

        if (completionResult.isCompleted) {
          setLessonCompleted(true);
          console.log("✅ [DEBUG] Stage is already completed");
        } else {
          setLessonCompleted(false);
          console.log("🔍 [DEBUG] Stage is not completed yet");
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
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="animate-pulse">
            {/* Hero Section Skeleton */}
            <div className="relative overflow-hidden rounded-3xl bg-gray-200 dark:bg-gray-700 p-4 sm:p-8 mb-6 sm:mb-8">
              <div className="flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gray-300 dark:bg-gray-600 rounded-2xl flex-shrink-0"></div>
                <div className="flex-1">
                  <div className="h-6 sm:h-8 bg-gray-300 dark:bg-gray-600 rounded mb-2 sm:mb-3"></div>
                  <div className="h-4 sm:h-6 bg-gray-300 dark:bg-gray-600 rounded w-3/4"></div>
                </div>
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
              <div className="lg:col-span-2 space-y-6 sm:space-y-8">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 h-64 sm:h-96"></div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 h-64 sm:h-96"></div>
              </div>
              <div className="lg:col-span-1 space-y-4 sm:space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 h-32 sm:h-48"></div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 h-48 sm:h-64"></div>
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
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <div className="text-center max-w-md mx-auto p-6 sm:p-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <svg
              className="w-8 h-8 sm:w-10 sm:h-10 text-red-600 dark:text-red-400"
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-3 sm:mb-4">
            {error || "Lesson Not Found"}
          </h1>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-6 sm:mb-8">
            The lesson you&apos;re looking for doesn&apos;t exist or has been
            moved.
          </p>
          <Button
            variant="primary"
            onClick={() => router.push(`/course/${courseSlug}`)}
            className="w-full text-sm sm:text-base py-2 sm:py-3"
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
      console.log("🔍 [DEBUG] Marking stage as complete:", {
        courseSlug,
        currentStageOrderIndex,
      });

      const result = await markStageCompleteClient(
        courseSlug,
        currentStageOrderIndex,
      );

      console.log("🔍 [DEBUG] Mark complete result:", result);

      if (result.success) {
        setLessonCompleted(true);
        console.log("✅ [DEBUG] Successfully marked stage as complete");
        // You could add a success notification here
      } else {
        console.error(
          "❌ [DEBUG] Failed to mark stage complete:",
          result.error,
        );
        // You could add an error notification here
        alert(`Failed to mark stage as complete: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ [DEBUG] Error marking stage complete:", error);
      alert("An unexpected error occurred while marking the stage as complete");
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

      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Breadcrumbs */}
        <nav className="flex items-center space-x-2 text-xs sm:text-sm text-gray-500 mb-6 sm:mb-8">
          <button
            onClick={() => router.push(`/course/${courseSlug}`)}
            className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
          >
            {currentCourse?.name || courseSlug}
          </button>
          <svg
            className="w-3 h-3 sm:w-4 sm:h-4"
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
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-4 sm:p-8 mb-6 sm:mb-8 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white/10 rounded-full -translate-y-16 sm:-translate-y-32 translate-x-16 sm:translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-white/5 rounded-full translate-y-12 sm:translate-y-24 -translate-x-12 sm:-translate-x-24"></div>

          <div className="relative z-10">
            <div className="flex items-start justify-between mb-4 sm:mb-6">
              <div className="flex-1">
                <div className="flex items-center space-x-2 sm:space-x-3 mb-3 sm:mb-4">
                  <span className="px-2 py-1 sm:px-3 sm:py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-medium">
                    Lesson {currentStageOrderIndex}
                  </span>
                  <span className="px-2 py-1 sm:px-3 sm:py-1 bg-white/20 backdrop-blur-sm rounded-full text-white text-xs sm:text-sm font-medium">
                    {currentStage.difficulty}
                  </span>
                </div>
                <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg">
                  {currentStage.title}
                </h1>
                <p className="text-base sm:text-xl text-blue-100 mb-4 sm:mb-6 max-w-2xl leading-relaxed">
                  {currentStage.subtitle}
                </p>
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-6 text-blue-100">
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
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
                    <span className="text-sm sm:text-base">
                      {currentStage.duration} min
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5"
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
                    <span className="text-sm sm:text-base">
                      {currentStage.readingTime}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6 sm:gap-8 overflow-hidden">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6 sm:space-y-8 min-w-0">
            {/* Video Section */}
            {currentStage.videoUrl && (
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden backdrop-blur-sm">
                <div className="p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                  <div className="flex items-center">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-1 truncate">
                        Video Lesson
                      </h2>
                      <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                        Watch the video to understand the concepts
                      </p>
                    </div>
                  </div>
                </div>
                <div className="relative overflow-hidden rounded-b-2xl p-2 sm:p-4">
                  <MediaPlayer
                    title={currentStage.title}
                    src={currentStage.videoUrl}
                    playsInline
                    className="w-full aspect-video rounded-lg overflow-hidden shadow-md"
                  >
                    <MediaProvider />
                    <DefaultVideoLayout
                      icons={defaultLayoutIcons}
                      thumbnails={currentStage.videoUrl}
                    />
                  </MediaPlayer>
                </div>
              </div>
            )}

            {/* Article Content */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden backdrop-blur-sm">
              <div className="p-4 sm:p-6 border-b border-gray-200/50 dark:border-gray-700/50">
                <div className="flex items-center">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mr-3 sm:mr-4 flex-shrink-0">
                    <svg
                      className="w-4 h-4 sm:w-5 sm:h-5 text-white"
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
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent mb-1 truncate">
                      Lesson Content
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400 text-xs sm:text-sm">
                      Read through the detailed lesson material
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-4 sm:p-6 overflow-hidden">
                <div
                  className="prose prose-sm sm:prose-lg max-w-none prose-headings:text-gray-900 prose-headings:dark:text-white prose-p:text-gray-700 prose-p:dark:text-gray-300 prose-strong:text-gray-900 prose-strong:dark:text-white prose-pre:overflow-x-auto prose-code:break-words prose-table:overflow-x-auto prose-img:max-w-full prose-img:h-auto"
                  style={{ wordWrap: "break-word", overflowWrap: "break-word" }}
                  dangerouslySetInnerHTML={{ __html: currentStage.content }}
                />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1 space-y-4 sm:space-y-6 min-w-0">
            {/* Tags */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-white"
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
                <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                  Topics Covered
                </h3>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {currentStage.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200/50 dark:border-blue-700/50 text-blue-700 dark:text-blue-300 rounded-xl text-xs sm:text-sm font-medium backdrop-blur-sm shadow-sm hover:shadow-md transition-all duration-300 hover:scale-105"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Navigation */}
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-200/50 dark:border-gray-700/50 backdrop-blur-sm">
              <div className="flex items-center mb-4 sm:mb-6">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-2 sm:mr-3 flex-shrink-0">
                  <svg
                    className="w-3 h-3 sm:w-4 sm:h-4 text-white"
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
                <h3 className="text-base sm:text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent truncate">
                  Navigation
                </h3>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <Button
                  variant="outline"
                  onClick={handlePreviousStage}
                  disabled={currentStageOrderIndex === 1}
                  className="w-full justify-start bg-white/70 dark:bg-gray-800/70 border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base py-2 sm:py-3"
                >
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-gray-400 to-gray-500 dark:from-gray-500 dark:to-gray-600 rounded-md flex items-center justify-center mr-2 sm:mr-3">
                    <svg
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
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
                  <span className="font-medium truncate">Previous Lesson</span>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => router.push(`/course/${courseSlug}`)}
                  className="w-full justify-start bg-white/70 dark:bg-gray-800/70 border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-indigo-300 dark:hover:border-indigo-600 hover:text-indigo-700 dark:hover:text-indigo-300 transition-all duration-300 shadow-sm hover:shadow-md text-sm sm:text-base py-2 sm:py-3"
                >
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-indigo-400 to-indigo-500 dark:from-indigo-500 dark:to-indigo-600 rounded-md flex items-center justify-center mr-2 sm:mr-3">
                    <svg
                      className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
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
                  <span className="font-medium truncate">Back to Course</span>
                </Button>

                {!lessonCompleted && !checkingCompletion ? (
                  <Button
                    onClick={handleMarkComplete}
                    disabled={isLoading}
                    className="w-full justify-start bg-white/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-600 hover:text-blue-700 dark:hover:text-blue-300 transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base py-2 sm:py-3"
                  >
                    {isLoading ? (
                      <div className="flex items-center">
                        <svg
                          className="animate-spin -ml-1 mr-3 h-4 w-4 sm:h-5 sm:w-5"
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
                        <span className="text-xs sm:text-sm">
                          Marking Complete...
                        </span>
                      </div>
                    ) : (
                      <>
                        <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-blue-400 to-blue-500 dark:from-blue-500 dark:to-blue-600 rounded-md flex items-center justify-center mr-2 sm:mr-3">
                          <svg
                            className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
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
                        <span className="font-medium truncate">
                          Mark as Complete
                        </span>
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleTakeQuiz}
                    className="w-full justify-start bg-white/70 dark:bg-gray-800/70 border border-gray-300/50 dark:border-gray-600/50 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 hover:border-purple-300 dark:hover:border-purple-600 hover:text-purple-700 dark:hover:text-purple-300 transition-all duration-300 shadow-sm hover:shadow-md text-sm sm:text-base py-2 sm:py-3"
                  >
                    <div className="w-4 h-4 sm:w-6 sm:h-6 bg-gradient-to-br from-purple-400 to-purple-500 dark:from-purple-500 dark:to-purple-600 rounded-md flex items-center justify-center mr-2 sm:mr-3">
                      <svg
                        className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white"
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
                    <span className="font-medium truncate">Go to Quiz</span>
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
