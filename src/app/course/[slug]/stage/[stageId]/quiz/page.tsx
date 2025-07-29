"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import CourseHeader from "@/components/ui/CourseHeader";
import SingleChoiceQuestion from "@/components/quiz/SingleChoiceQuestion";
import MultipleChoiceQuestion from "@/components/quiz/MultipleChoiceQuestion";
import Notification from "@/components/ui/Notification";
import {
  QuizState,
  calculateScore,
  validateAnswer,
  getQuizProgress,
  fetchQuizBySlugAndOrder,
  Quiz,
} from "@/utils/quiz";
import { saveQuizProgressClient } from "@/utils/progress-client";

export default function QuizPage() {
  const params = useParams();
  const router = useRouter();
  const { slug, stageId } = params;

  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    isComplete: false,
    score: 0,
    totalQuestions: 0,
    startTime: new Date(),
  });

  const [timeRemaining, setTimeRemaining] = useState<number | undefined>(
    undefined,
  );

  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [currentAnswerCorrect, setCurrentAnswerCorrect] = useState<
    boolean | null
  >(null);
  const [savingProgress, setSavingProgress] = useState(false);
  const [notification, setNotification] = useState({
    isVisible: false,
    type: "info" as "success" | "error" | "info" | "warning",
    title: "",
    message: "",
  });

  // Get course and quiz data
  const courseSlug = slug as string;
  const currentQuizOrderIndex = parseInt(stageId as string);

  // Fetch quiz data
  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);
        const fetchedQuiz = await fetchQuizBySlugAndOrder(
          courseSlug,
          currentQuizOrderIndex,
        );

        if (fetchedQuiz) {
          setQuiz(fetchedQuiz);
          setQuizState((prev) => ({
            ...prev,
            totalQuestions: fetchedQuiz.questions.length,
          }));
          setTimeRemaining(
            fetchedQuiz.timeLimit ? fetchedQuiz.timeLimit * 60 : undefined,
          );
        } else {
          setError("Quiz not found");
        }
      } catch (err) {
        setError("Failed to load quiz");
        console.error("Error loading quiz:", err);
      } finally {
        setLoading(false);
      }
    };

    if (courseSlug && currentQuizOrderIndex) {
      loadQuiz();
    }
  }, [courseSlug, currentQuizOrderIndex]);

  const currentQuestion = quiz?.questions[quizState.currentQuestionIndex];

  const handleFinishQuiz = useCallback(async () => {
    if (!quiz) return;

    const finalScore = calculateScore(quiz, quizState.answers);
    const endTime = new Date();

    setQuizState((prev) => ({
      ...prev,
      isComplete: true,
      score: finalScore,
      endTime: endTime,
    }));

    // Calculate time taken in minutes
    const timeTaken = Math.round(
      (endTime.getTime() - quizState.startTime.getTime()) / 1000 / 60,
    );

    setSavingProgress(true);

    try {
      // Save or update progress using client-side function
      const result = await saveQuizProgressClient(
        courseSlug,
        currentQuizOrderIndex,
        finalScore,
        timeTaken,
      );

      if (result.success) {
        console.log("Quiz progress saved successfully!");
        // Optionally show success notification
        setNotification({
          isVisible: true,
          type: "success",
          title: "Progress Saved",
          message: "Your quiz progress has been saved successfully!",
        });
      } else {
        console.error("Failed to save quiz progress:", result.error);
        // Show error notification
        setNotification({
          isVisible: true,
          type: "error",
          title: "Save Failed",
          message: "Failed to save your progress. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error saving quiz progress:", error);
      // Show error notification
      setNotification({
        isVisible: true,
        type: "error",
        title: "Save Error",
        message: "An error occurred while saving your progress.",
      });
    } finally {
      setSavingProgress(false);
    }

    setShowResults(true);
  }, [
    quiz,
    quizState.answers,
    quizState.startTime,
    courseSlug,
    currentQuizOrderIndex,
  ]);

  // Timer effect
  useEffect(() => {
    if (!quizStarted || timeRemaining === undefined || timeRemaining <= 0)
      return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === undefined || prev < 1) {
          // Handle async function properly
          handleFinishQuiz().catch(console.error);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, quizStarted, handleFinishQuiz]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
    setQuizState((prev) => ({
      ...prev,
      startTime: new Date(),
    }));
  };

  const handleAnswerChange = (answer: string | string[]) => {
    if (!currentQuestion) return;

    setQuizState((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: answer,
      },
    }));
    // Reset feedback when answer changes
    setShowFeedback(false);
    setCurrentAnswerCorrect(null);
  };

  const handleMarkAnswer = () => {
    if (!currentQuestion) return;

    const currentAnswer = quizState.answers[currentQuestion.id];
    if (!currentAnswer) {
      // Show notification to select answer first
      setNotification({
        isVisible: true,
        type: "info",
        title: "Please Select an Answer",
        message: "You must choose an answer to continue.",
      });
      return;
    }

    if (!currentQuestion) return;

    const isCorrect = validateAnswer(currentQuestion, currentAnswer);
    setCurrentAnswerCorrect(isCorrect);
    setShowFeedback(true);
  };

  const handleNextQuestion = () => {
    if (quizState.currentQuestionIndex < quizState.totalQuestions - 1) {
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
      setShowFeedback(false);
      setCurrentAnswerCorrect(null);
    } else {
      handleFinishQuiz();
    }
  };

  const handleRetakeQuiz = () => {
    if (!quiz) return;

    setQuizState({
      currentQuestionIndex: 0,
      answers: {},
      isComplete: false,
      score: 0,
      totalQuestions: quiz.questions.length,
      startTime: new Date(),
    });
    setShowResults(false);
    setQuizStarted(false);
    setShowFeedback(false);
    setCurrentAnswerCorrect(null);
    setTimeRemaining(quiz.timeLimit ? quiz.timeLimit * 60 : undefined);

    // Clear any existing notifications
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

  const closeNotification = () => {
    setNotification((prev) => ({ ...prev, isVisible: false }));
  };

  const renderQuestion = () => {
    if (!currentQuestion) return null;

    const currentAnswer = quizState.answers[currentQuestion.id];

    switch (currentQuestion.type) {
      case "single_choice":
        return (
          <SingleChoiceQuestion
            question={currentQuestion}
            selectedAnswer={currentAnswer as string}
            onAnswerChange={(answer: string) => handleAnswerChange(answer)}
            showResult={showFeedback}
          />
        );

      case "multiple_choice":
        return (
          <MultipleChoiceQuestion
            question={currentQuestion}
            selectedAnswers={(currentAnswer as string[]) || []}
            onAnswerChange={(answers: string[]) => handleAnswerChange(answers)}
            showResult={showFeedback}
          />
        );

      default:
        return <div>Unsupported question type</div>;
    }
  };

  const renderFeedback = () => {
    if (!showFeedback || !currentQuestion) return null;

    const isCorrect = currentAnswerCorrect;
    const hasAnswer = quizState.answers[currentQuestion.id];

    // Don't show feedback if no answer is selected (use notification instead)
    if (!hasAnswer) return null;

    return (
      <div
        className={`mt-8 p-6 sm:p-8 rounded-3xl border-2 shadow-xl ${
          isCorrect
            ? "bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 border-emerald-300 dark:border-emerald-600"
            : "bg-gradient-to-br from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20 border-red-300 dark:border-red-600"
        }`}
      >
        <div className="flex items-center space-x-4 sm:space-x-6">
          {/* Icon */}
          <div
            className={`w-12 h-12 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg ${
              isCorrect
                ? "bg-gradient-to-br from-emerald-500 to-green-600"
                : "bg-gradient-to-br from-red-500 to-pink-600"
            }`}
          >
            {isCorrect ? (
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-white"
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
            ) : (
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className="flex-1">
            <h4
              className={`font-bold text-xl sm:text-2xl mb-2 ${
                isCorrect
                  ? "text-emerald-800 dark:text-emerald-200"
                  : "text-red-800 dark:text-red-200"
              }`}
            >
              {isCorrect ? "Correct!" : "Incorrect!"}
            </h4>
            <p
              className={`text-sm sm:text-base ${
                isCorrect
                  ? "text-emerald-700 dark:text-emerald-300"
                  : "text-red-700 dark:text-red-300"
              }`}
            >
              {isCorrect
                ? "Great job! You got this question right."
                : "Don't worry, learning is a process. Keep going!"}
            </p>
          </div>
        </div>
      </div>
    );
  };

  const renderPreQuizHero = () => {
    if (!quiz) return null;

    return (
      <div className="space-y-8 sm:space-y-12">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl">
          {/* Background with animated gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 animate-gradient-xy"></div>
          <div className="absolute inset-0 bg-black/20"></div>

          {/* Floating elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-md animate-pulse delay-500"></div>

          <div className="relative z-10 p-8 sm:p-12 lg:p-16">
            {/* Quiz Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
                <svg
                  className="w-12 h-12 sm:w-16 sm:h-16 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                  />
                </svg>
              </div>
            </div>

            {/* Quiz Title and Description */}
            <div className="text-center mb-12">
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
                {quiz.title}
              </h1>
              <p className="text-white/90 text-lg sm:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed font-light">
                {quiz.description}
              </p>
            </div>

            {/* Quiz Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20">
                <div className="text-white font-bold text-2xl sm:text-3xl mb-2">
                  {quiz.questions.length}
                </div>
                <div className="text-white/80 text-sm font-medium">
                  Questions
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20">
                <div className="text-white font-bold text-2xl sm:text-3xl mb-2">
                  {quiz.passingScore}%
                </div>
                <div className="text-white/80 text-sm font-medium">
                  Passing Score
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20">
                <div className="text-white font-bold text-2xl sm:text-3xl mb-2">
                  {quiz.timeLimit || "∞"}
                </div>
                <div className="text-white/80 text-sm font-medium">Minutes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center border border-white/20">
                <div className="text-white font-bold text-2xl sm:text-3xl mb-2">
                  {
                    quiz.questions.filter((q) => q.type === "multiple_choice")
                      .length
                  }
                </div>
                <div className="text-white/80 text-sm font-medium">
                  Multi-Choice
                </div>
              </div>
            </div>

            {/* Start Button */}
            <div className="text-center">
              <Button
                onClick={handleStartQuiz}
                className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-12 sm:px-16 py-5 sm:py-6 rounded-2xl shadow-2xl hover:shadow-3xl transition-all duration-500 text-xl sm:text-2xl font-bold transform hover:scale-105"
              >
                <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                <div className="relative flex items-center">
                  <svg
                    className="w-6 h-6 sm:w-8 sm:h-8 mr-3 group-hover:rotate-12 transition-transform duration-300"
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
                  Start Quiz
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 sm:p-12">
          <div className="text-center mb-8">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              How to Take This Quiz
            </h2>
            <p className="text-gray-600 dark:text-gray-400 text-lg max-w-2xl mx-auto">
              Follow these simple steps to complete your quiz successfully
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-lg font-bold">1</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Read Carefully
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Take your time to read each question and all answer options
                    before selecting your response.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-lg font-bold">2</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Multiple Choice
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Some questions may have multiple correct answers. Select all
                    that apply.
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-lg font-bold">3</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Mark Your Answer
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    Click &quot;Mark Answer&quot; to see if you&apos;re correct,
                    then click &quot;Next&quot; to continue.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4 group">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <span className="text-white text-lg font-bold">4</span>
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    Review Results
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                    After completing the quiz, review your answers to learn from
                    any mistakes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuizHeader = () => {
    if (!quiz) return null;

    const progress = getQuizProgress(
      quizState.currentQuestionIndex,
      quizState.totalQuestions,
    );

    return (
      <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 sm:p-8 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          {/* Quiz Info */}
          <div className="flex items-center space-x-4 sm:space-x-6">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center shadow-lg">
              <svg
                className="w-6 h-6 sm:w-8 sm:h-8 text-white"
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
            <div>
              <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white mb-1 sm:mb-2">
                {quiz.title}
              </h1>
              <p className="text-sm sm:text-lg text-gray-600 dark:text-gray-400 font-medium">
                Question {quizState.currentQuestionIndex + 1} of{" "}
                {quizState.totalQuestions}
              </p>
            </div>
          </div>

          {/* Progress and Timer */}
          <div className="flex items-center space-x-6">
            {/* Progress */}
            <div className="text-center">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2 font-medium">
                {progress}% Complete
              </div>
              <div className="w-32 sm:w-40 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-500 shadow-lg"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Timer */}
            {timeRemaining !== undefined && (
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
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
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
                    {Math.floor(timeRemaining / 60)}:
                    {(timeRemaining % 60).toString().padStart(2, "0")}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                    Time Left
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!quiz) return null;

    const isPassed = quizState.score >= quiz.passingScore;
    const timeTaken =
      quizState.endTime && quizState.startTime
        ? Math.round(
            (quizState.endTime.getTime() - quizState.startTime.getTime()) /
              1000 /
              60,
          )
        : 0;

    return (
      <div className="space-y-8 sm:space-y-12">
        {/* Results Header */}
        <div className="relative overflow-hidden rounded-3xl">
          {/* Background with animated gradient */}
          <div
            className={`absolute inset-0 ${
              isPassed
                ? "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500"
                : "bg-gradient-to-br from-orange-500 via-red-500 to-pink-500"
            } animate-gradient-xy`}
          ></div>
          <div className="absolute inset-0 bg-black/20"></div>

          {/* Floating elements */}
          <div className="absolute top-10 right-10 w-32 h-32 bg-white/10 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute bottom-10 left-10 w-24 h-24 bg-white/5 rounded-full blur-lg animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/4 w-16 h-16 bg-white/10 rounded-full blur-md animate-pulse delay-500"></div>

          <div className="relative z-10 p-8 sm:p-12 lg:p-16 text-center">
            {/* Result Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-24 h-24 sm:w-32 sm:h-32 bg-white/20 backdrop-blur-sm rounded-3xl flex items-center justify-center shadow-2xl border border-white/30">
                {savingProgress ? (
                  <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-white"></div>
                ) : isPassed ? (
                  <svg
                    className="w-12 h-12 sm:w-16 sm:h-16 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                ) : (
                  <svg
                    className="w-12 h-12 sm:w-16 sm:h-16 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M9.75 9.75l4.5 4.5m0-4.5l-4.5 4.5M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 drop-shadow-2xl">
              {savingProgress
                ? "Saving Progress..."
                : isPassed
                  ? "Congratulations!"
                  : "Keep Learning!"}
            </h1>
            <p className="text-white/90 text-lg sm:text-xl lg:text-2xl max-w-4xl mx-auto leading-relaxed font-light mb-12">
              {isPassed
                ? "You've successfully completed the quiz and demonstrated your understanding of Python variables!"
                : "Don't worry, learning is a journey. Review the material and try again!"}
            </p>

            {/* Score Display */}
            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 sm:p-12 max-w-lg mx-auto border border-white/20">
              <div className="text-6xl sm:text-8xl font-bold text-white mb-4">
                {quizState.score}%
              </div>
              <div className="text-white/90 text-xl sm:text-2xl font-semibold mb-2">
                {isPassed ? "Passed" : "Not Passed"}
              </div>
              <div className="text-white/70 text-sm">
                Passing Score: {quiz.passingScore}%
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-500 group">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-white"
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
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {timeTaken}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  Minutes Taken
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-500 group">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-white"
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
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {
                    Object.keys(quizState.answers).filter((id) =>
                      validateAnswer(
                        quiz.questions.find((q) => q.id === id)!,
                        quizState.answers[id],
                      ),
                    ).length
                  }
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  Questions Right
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl p-8 shadow-2xl border border-gray-200/50 dark:border-gray-700/50 hover:shadow-3xl transition-all duration-500 group">
            <div className="flex items-center space-x-6">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                <svg
                  className="w-8 h-8 text-white"
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
              <div>
                <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">
                  {quizState.totalQuestions}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  Total Questions
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={handleRetakeQuiz}
            disabled={savingProgress}
            className={`group relative bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 sm:px-12 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 text-lg font-bold transform hover:scale-105 ${
              savingProgress ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative flex items-center">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 mr-3 group-hover:rotate-180 transition-transform duration-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              Retake Quiz
            </div>
          </Button>

          <Button
            onClick={() => router.push(`/course/${slug}/stage/${stageId}`)}
            disabled={savingProgress}
            className={`group relative bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white px-8 sm:px-12 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 text-lg font-bold transform hover:scale-105 ${
              savingProgress ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative flex items-center">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 mr-3 group-hover:-translate-x-1 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              Back to Lesson
            </div>
          </Button>

          <Button
            onClick={() => router.push(`/course/${slug}`)}
            disabled={savingProgress}
            className={`group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 sm:px-12 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 text-lg font-bold transform hover:scale-105 ${
              savingProgress ? "opacity-50 cursor-not-allowed" : ""
            }`}
          >
            <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
            <div className="relative flex items-center">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 mr-3 group-hover:-translate-y-1 transition-transform duration-300"
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
              Back to Course
            </div>
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-indigo-50/50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <CourseHeader />

      {/* Notification */}
      <Notification
        type={notification.type}
        title={notification.title}
        message={notification.message}
        isVisible={notification.isVisible}
        onClose={closeNotification}
        duration={4000}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                Loading quiz...
              </p>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
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
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Quiz Not Found
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
              <Button
                onClick={() => router.push(`/course/${slug}`)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl"
              >
                Back to Course
              </Button>
            </div>
          </div>
        )}

        {/* Quiz Content - Only show when not loading and no error */}
        {!loading && !error && quiz && (
          <>
            {/* Breadcrumbs */}
            <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6 sm:mb-8">
              <button
                onClick={() => router.push(`/course/${slug}`)}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              >
                Course
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
              <button
                onClick={() => router.push(`/course/${slug}/stage/${stageId}`)}
                className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              >
                Lesson {stageId}
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
                Quiz
              </span>
            </nav>

            {showResults ? (
              renderResults()
            ) : !quizStarted ? (
              renderPreQuizHero()
            ) : (
              <div className="space-y-6 sm:space-y-8">
                {/* Quiz Header */}
                {renderQuizHeader()}

                {/* Question Content */}
                <div className="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-3xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 overflow-hidden">
                  <div className="p-6 sm:p-8 lg:p-12">{renderQuestion()}</div>
                </div>

                {/* Mark Answer Button */}
                {!showFeedback && (
                  <div className="flex justify-center">
                    <Button
                      onClick={handleMarkAnswer}
                      className="group relative bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white px-8 sm:px-12 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 text-lg font-bold transform hover:scale-105"
                    >
                      <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                      <div className="relative flex items-center">
                        <svg
                          className="w-5 h-5 sm:w-6 sm:h-6 mr-3 group-hover:rotate-12 transition-transform duration-300"
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
                        Mark Answer
                      </div>
                    </Button>
                  </div>
                )}

                {/* Feedback Message */}
                {renderFeedback()}

                {/* Navigation - Only show Next after marking with an answer */}
                {showFeedback && currentAnswerCorrect !== null && (
                  <div className="flex justify-center">
                    {quizState.currentQuestionIndex ===
                    quizState.totalQuestions - 1 ? (
                      <Button
                        onClick={handleFinishQuiz}
                        className="group relative bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-8 sm:px-12 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 text-lg font-bold transform hover:scale-105"
                      >
                        <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <div className="relative flex items-center">
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 mr-3 group-hover:rotate-12 transition-transform duration-300"
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
                          Finish Quiz
                        </div>
                      </Button>
                    ) : (
                      <Button
                        onClick={handleNextQuestion}
                        className="group relative bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white px-8 sm:px-12 py-4 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-500 text-lg font-bold transform hover:scale-105"
                      >
                        <div className="absolute inset-0 bg-white/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all duration-500"></div>
                        <div className="relative flex items-center">
                          Next Question
                          <svg
                            className="w-5 h-5 sm:w-6 sm:h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300"
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
                      </Button>
                    )}
                  </div>
                )}

                {/* Progress Indicator */}
                <div className="flex flex-col items-center justify-center">
                  <div className="text-lg text-gray-600 dark:text-gray-400 mb-3 font-medium">
                    Question {quizState.currentQuestionIndex + 1} of{" "}
                    {quizState.totalQuestions}
                  </div>
                  <div className="w-48 h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden shadow-inner">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-indigo-600 rounded-full transition-all duration-500 shadow-lg"
                      style={{
                        width: `${getQuizProgress(quizState.currentQuestionIndex, quizState.totalQuestions)}%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
