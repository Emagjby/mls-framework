"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Button from "@/components/ui/Button";
import CourseHeader from "@/components/ui/CourseHeader";
import {
  fetchCourseBySlug,
  fetchStagesByCourseId,
  Course,
  LearningStage,
} from "@/utils/courses";
import {
  getCourseProgress,
  type CourseProgressData,
} from "@/utils/progress-client";
import { useAuth } from "@/hooks/useAuth";

export default function CourseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useAuth();
  const courseSlug = params.slug as string;
  const [hoveredStage, setHoveredStage] = useState<string | null>(null);
  const [course, setCourse] = useState<Course | null>(null);
  const [stages, setStages] = useState<LearningStage[]>([]);
  const [courseProgress, setCourseProgress] =
    useState<CourseProgressData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadCourseAndStages = async () => {
      try {
        setLoading(true);

        // Fetch course data and progress data in parallel
        const [fetchedCourse, progressData] = await Promise.all([
          fetchCourseBySlug(courseSlug),
          user?.id ? getCourseProgress(courseSlug) : Promise.resolve(null),
        ]);

        if (fetchedCourse) {
          setCourse(fetchedCourse);
          // Fetch stages for this course
          const fetchedStages = await fetchStagesByCourseId(fetchedCourse.id);
          setStages(fetchedStages);
        } else {
          setError("Course not found");
        }

        // Set progress data if available
        if (progressData) {
          setCourseProgress(progressData);
        }
      } catch (err) {
        setError("Failed to load course");
        console.error("Error loading course:", err);
      } finally {
        setLoading(false);
      }
    };

    if (courseSlug) {
      loadCourseAndStages();
    }
  }, [courseSlug, user]);

  const getStageProgress = (stageOrderIndex: number) => {
    if (!courseProgress?.stageProgress) {
      return { stageCompleted: false, quizCompleted: false };
    }
    return (
      courseProgress.stageProgress.find(
        (progress) => progress.stageOrderIndex === stageOrderIndex,
      ) || { stageCompleted: false, quizCompleted: false }
    );
  };

  const getCardColorClasses = (stageOrderIndex: number) => {
    const progress = getStageProgress(stageOrderIndex);

    if (!progress.stageCompleted) {
      // Gray - not started
      return {
        background:
          "bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500",
        icon: "bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400",
        status: "text-gray-500 dark:text-gray-400",
      };
    } else if (progress.stageCompleted && !progress.quizCompleted) {
      // Blue - in progress (stage complete, quiz not complete)
      return {
        background:
          "bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-600 hover:border-blue-300 dark:hover:border-blue-500",
        icon: "bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
        status: "text-blue-600 dark:text-blue-400",
      };
    } else {
      // Green - completed (both stage and quiz complete)
      return {
        background:
          "bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-700 hover:border-green-300 dark:hover:border-green-600",
        icon: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        status: "text-green-600 dark:text-green-400",
      };
    }
  };

  const getStatusIcon = (stageOrderIndex: number) => {
    const progress = getStageProgress(stageOrderIndex);

    if (progress.stageCompleted && progress.quizCompleted) {
      return (
        <svg
          className="w-6 h-6 text-green-600 dark:text-green-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      );
    } else if (progress.stageCompleted && !progress.quizCompleted) {
      return (
        <svg
          className="w-6 h-6 text-blue-600 dark:text-blue-400"
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
      );
    }
    return (
      <svg
        className="w-6 h-6 text-gray-500 dark:text-gray-400"
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
    );
  };

  const getStatusText = (stageOrderIndex: number) => {
    const progress = getStageProgress(stageOrderIndex);

    if (progress.stageCompleted && progress.quizCompleted) {
      return "Completed";
    } else if (progress.stageCompleted && !progress.quizCompleted) {
      return "Quiz Pending";
    }
    return "Not Started";
  };

  const getNextItem = () => {
    return stages.find((stage) => !stage.completed);
  };

  const nextItem = getNextItem();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <CourseHeader />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="animate-pulse">
            {/* Hero Section Skeleton */}
            <div className="relative overflow-hidden rounded-3xl bg-gray-200 dark:bg-gray-700 p-8 mb-12">
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
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 h-48"></div>
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 h-64"></div>
              </div>
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 h-96"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <CourseHeader />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error || "Course not found"}
            </h1>
            <Button variant="primary" onClick={() => router.push("/courses")}>
              Back to Courses
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <CourseHeader />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-4 sm:p-8 mb-8 sm:mb-12 shadow-2xl">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="absolute top-0 right-0 w-32 h-32 sm:w-64 sm:h-64 bg-white/10 rounded-full -translate-y-16 sm:-translate-y-32 translate-x-16 sm:translate-x-32"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-48 sm:h-48 bg-white/5 rounded-full translate-y-12 sm:translate-y-24 -translate-x-12 sm:-translate-x-24"></div>

          <div className="relative z-10 flex flex-col sm:flex-row items-start space-y-4 sm:space-y-0 sm:space-x-6">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-3xl sm:text-5xl shadow-lg flex-shrink-0">
              {course.icon}
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-4xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg">
                {course.name}
              </h1>
              <p className="text-base sm:text-xl text-blue-100 mb-4 sm:mb-6 max-w-2xl leading-relaxed">
                {course.description}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Course Stats & Actions */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              {/* Progress Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Your Progress
                </h3>

                {/* Circular Progress */}
                <div className="flex items-center justify-center">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                    <svg
                      className="w-20 h-20 sm:w-24 sm:h-24 transform -rotate-90"
                      viewBox="0 0 100 100"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        className="text-gray-200 dark:text-gray-700"
                      />
                      <circle
                        cx="50"
                        cy="50"
                        r="40"
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="transparent"
                        strokeDasharray={`${2 * Math.PI * 40}`}
                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - (courseProgress?.progress || 0) / 100)}`}
                        className="text-blue-600 transition-all duration-1000 ease-out"
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-base sm:text-lg font-bold text-gray-900 dark:text-white">
                        {courseProgress?.progress || 0}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 sm:p-6 shadow-xl border border-gray-100 dark:border-gray-700">
                <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white mb-3 sm:mb-4">
                  Course Overview
                </h3>
                <div className="space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-between p-2 sm:p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="w-7 h-7 sm:w-8 sm:h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600 dark:text-blue-400"
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
                      <span className="text-sm sm:text-base text-gray-700 dark:text-gray-300">
                        Stages
                      </span>
                    </div>
                    <span className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white mr-1">
                      {courseProgress?.totalStages || course.totalStages}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-green-600 dark:text-green-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Completed
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white mr-1">
                      {courseProgress?.completedCount || 0}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-purple-600 dark:text-purple-400"
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
                      </div>
                      <span className="text-gray-700 dark:text-gray-300">
                        Duration
                      </span>
                    </div>
                    <span className="font-semibold text-gray-900 dark:text-white mr-1">
                      {course.duration}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                {nextItem ? (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 hover:from-blue-700 hover:via-purple-700 hover:to-indigo-700 hover:shadow-2xl transition-all duration-300 ease-out shadow-lg relative overflow-hidden group"
                    onClick={() =>
                      router.push(
                        `/course/${courseSlug}/stage/${nextItem.order_index}`,
                      )
                    }
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700 ease-out"></div>
                    <svg
                      className="w-5 h-5 mr-2 transform group-hover:translate-x-1 transition-transform duration-300 ease-out"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                    Continue Learning
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full h-14 text-lg font-semibold bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                    onClick={() => alert("Demo: Course completed!")}
                  >
                    <svg
                      className="w-5 h-5 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    Course Complete!
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Course Content */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                  Course Content
                </h2>
                <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">
                  Complete each stage to unlock the next one
                </p>
              </div>

              <div className="p-4 sm:p-6">
                <div className="space-y-3 sm:space-y-4">
                  {stages.map((stage: LearningStage, index: number) => {
                    const colorClasses = getCardColorClasses(stage.order_index);
                    const progress = getStageProgress(stage.order_index);

                    return (
                      <div
                        key={stage.id}
                        className={`group relative p-4 sm:p-6 rounded-2xl border-2 transition-all duration-300 cursor-pointer transform hover:scale-[1.02] ${colorClasses.background} ${
                          hoveredStage === stage.id ? "shadow-lg" : ""
                        }`}
                        onMouseEnter={() => setHoveredStage(stage.id)}
                        onMouseLeave={() => setHoveredStage(null)}
                        onClick={() =>
                          router.push(
                            `/course/${courseSlug}/stage/${stage.order_index}`,
                          )
                        }
                      >
                        <div className="flex items-start space-x-3 sm:space-x-4">
                          <div className="flex-shrink-0">
                            <div
                              className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-xl sm:text-2xl transition-all duration-300 ${colorClasses.icon}`}
                            >
                              {getStatusIcon(stage.order_index)}
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="mb-2">
                              <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {stage.name}
                              </h3>
                            </div>

                            <div className="flex items-center space-x-3 sm:space-x-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                              <span className="flex items-center space-x-1">
                                <span
                                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${progress.stageCompleted ? "bg-green-400" : "bg-gray-400"}`}
                                ></span>
                                <span>Lesson</span>
                              </span>
                              <span className="flex items-center space-x-1">
                                <span
                                  className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${progress.quizCompleted ? "bg-green-400" : "bg-gray-400"}`}
                                ></span>
                                <span>Quiz</span>
                              </span>
                            </div>

                            <div className="mt-2 sm:mt-3">
                              <span
                                className={`text-xs sm:text-sm font-medium ${colorClasses.status}`}
                              >
                                {getStatusText(stage.order_index)}
                              </span>
                            </div>
                          </div>

                          <div className="flex-shrink-0 flex flex-col items-center space-y-1 sm:space-y-2">
                            <div
                              className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                                progress.stageCompleted &&
                                progress.quizCompleted
                                  ? "bg-green-500 text-white"
                                  : progress.stageCompleted
                                    ? "bg-blue-500 text-white"
                                    : "bg-gray-200 dark:bg-gray-600 text-gray-400"
                              }`}
                            >
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
                            </div>
                            <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 flex items-center justify-center text-xs font-bold">
                              {index + 1}
                            </div>
                          </div>
                        </div>

                        {/* Hover Effect */}
                        {hoveredStage === stage.id && (
                          <div className="absolute inset-0 bg-gradient-to-r from-blue-500/5 to-purple-500/5 rounded-2xl pointer-events-none"></div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
