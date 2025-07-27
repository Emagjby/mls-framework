"use client";

import React from "react";
import { Quiz, getQuizProgress } from "@/utils/quiz";

interface QuizHeaderProps {
  quiz: Quiz;
  currentQuestionIndex: number;
  totalQuestions: number;
  timeRemaining?: number; // in seconds
}

export default function QuizHeader({
  quiz,
  currentQuestionIndex,
  totalQuestions,
  timeRemaining,
}: QuizHeaderProps) {
  const progress = getQuizProgress(currentQuestionIndex, totalQuestions);

  return (
    <div className="relative bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl shadow-2xl border border-purple-500/20 overflow-hidden">
      {/* Background Pattern - Fixed positioning to cover full screen */}
      <div className="fixed inset-0 bg-black/10 pointer-events-none z-0"></div>
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-32 translate-x-32"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-24 -translate-x-24"></div>

      <div className="relative z-10 p-4 sm:p-6">
        {/* Quiz Title and Description */}
        <div className="text-center mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 drop-shadow-lg">
            {quiz.title}
          </h1>
          <p className="text-purple-100 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed px-2">
            {quiz.description}
          </p>
        </div>

        {/* Progress and Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-center">
          {/* Question Progress */}
          <div className="text-center">
            <div className="flex items-center justify-center mb-2">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3">
                <svg
                  className="w-4 h-4 sm:w-6 sm:h-6 text-white"
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
              <div className="text-left">
                <div className="text-white font-bold text-lg sm:text-xl">
                  {currentQuestionIndex + 1} / {totalQuestions}
                </div>
                <div className="text-purple-100 text-xs sm:text-sm">
                  Questions
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="text-center">
            <div className="mb-2">
              <span className="text-white font-semibold text-base sm:text-lg">
                {progress}% Complete
              </span>
            </div>
            <div className="w-full bg-white/20 backdrop-blur-sm rounded-full h-2 sm:h-3 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-500 ease-out shadow-lg"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Time Remaining */}
          <div className="text-center">
            {timeRemaining !== undefined && (
              <div className="flex items-center justify-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-3">
                  <svg
                    className="w-4 h-4 sm:w-6 sm:h-6 text-white"
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
                <div className="text-left">
                  <div className="text-white font-bold text-lg sm:text-xl">
                    {Math.floor(timeRemaining / 60)}:
                    {(timeRemaining % 60).toString().padStart(2, "0")}
                  </div>
                  <div className="text-purple-100 text-xs sm:text-sm">
                    Time Left
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quiz Stats */}
        <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-white/20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 text-center">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <div className="text-white font-bold text-base sm:text-lg">
                {totalQuestions}
              </div>
              <div className="text-purple-100 text-xs sm:text-sm">
                Total Questions
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <div className="text-white font-bold text-base sm:text-lg">
                {
                  quiz.questions.filter((q) => q.type === "multiple_choice")
                    .length
                }
              </div>
              <div className="text-purple-100 text-xs sm:text-sm">
                Multi-Choice
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <div className="text-white font-bold text-base sm:text-lg">
                {quiz.passingScore}%
              </div>
              <div className="text-purple-100 text-xs sm:text-sm">
                Passing Score
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4">
              <div className="text-white font-bold text-base sm:text-lg">
                {quiz.timeLimit || "∞"}
              </div>
              <div className="text-purple-100 text-xs sm:text-sm">
                Time Limit (min)
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
