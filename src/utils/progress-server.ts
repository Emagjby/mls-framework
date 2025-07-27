import { createClient } from "@/utils/supabase/server";
import type {
  QuizProgressData,
  SaveQuizProgressResult,
} from "./progress-types";

/**
 * Server-side version: Saves quiz progress to the user_quiz_progress table
 *
 * This function handles both first-time attempts and retakes by using upsert.
 * For first-time attempts, it creates a new record. For retakes, it updates
 * the existing record and increments the attempts count.
 *
 * @param progressData - Object containing quiz completion data
 * @returns Promise<SaveQuizProgressResult> - Success status and data or error
 */
export async function saveQuizProgressServer(
  progressData: QuizProgressData,
): Promise<SaveQuizProgressResult> {
  try {
    const supabase = await createClient();

    // Get the current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Get the course ID from the slug
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", progressData.slug)
      .single();

    if (courseError || !courseData) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    // Get the quiz ID from course_id and order_index
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("course_id", courseData.id)
      .eq("order_index", progressData.orderIndex)
      .single();

    if (quizError || !quizData) {
      return {
        success: false,
        error: "Quiz not found",
      };
    }

    // Check if user already has progress for this quiz
    const { data: existingProgress, error: checkError } = await supabase
      .from("user_quiz_progress")
      .select("attempts_count, best_score")
      .eq("user_id", user.id)
      .eq("quiz_id", quizData.id)
      .single();

    let attemptsCount = 1;
    let bestScore = progressData.score;

    // If user has existing progress, update attempts and best score
    if (existingProgress && !checkError) {
      attemptsCount = existingProgress.attempts_count + 1;
      bestScore = Math.max(existingProgress.best_score, progressData.score);
    }

    // Insert or update the quiz progress
    const { data, error } = await supabase.from("user_quiz_progress").upsert(
      {
        user_id: user.id,
        course_id: courseData.id,
        quiz_id: quizData.id,
        score: progressData.score,
        is_completed: true,
        attempts_count: attemptsCount,
        best_score: bestScore,
        time_taken: progressData.timeTaken,
        completed_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id,quiz_id",
      },
    );

    if (error) {
      console.error("Error saving quiz progress:", error);
      return {
        success: false,
        error: "Failed to save quiz progress",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Unexpected error in saveQuizProgressServer:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Server-side version: Updates existing quiz progress (for retakes)
 * @param progressData - Object containing quiz completion data
 * @returns Promise<SaveQuizProgressResult>
 */
export async function updateQuizProgressServer(
  progressData: QuizProgressData,
): Promise<SaveQuizProgressResult> {
  try {
    const supabase = await createClient();

    // Get the current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        error: "User not authenticated",
      };
    }

    // Get the course ID from the slug
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", progressData.slug)
      .single();

    if (courseError || !courseData) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    // Get the quiz ID from course_id and order_index
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("course_id", courseData.id)
      .eq("order_index", progressData.orderIndex)
      .single();

    if (quizError || !quizData) {
      return {
        success: false,
        error: "Quiz not found",
      };
    }

    // Get existing progress to update attempts and best score
    const { data: existingProgress, error: checkError } = await supabase
      .from("user_quiz_progress")
      .select("attempts_count, best_score")
      .eq("user_id", user.id)
      .eq("quiz_id", quizData.id)
      .single();

    if (checkError || !existingProgress) {
      return {
        success: false,
        error: "No existing progress found to update",
      };
    }

    const attemptsCount = existingProgress.attempts_count + 1;
    const bestScore = Math.max(existingProgress.best_score, progressData.score);

    // Update the quiz progress
    const { data, error } = await supabase
      .from("user_quiz_progress")
      .update({
        score: progressData.score,
        is_completed: true,
        attempts_count: attemptsCount,
        best_score: bestScore,
        time_taken: progressData.timeTaken,
        completed_at: new Date().toISOString(),
      })
      .eq("user_id", user.id)
      .eq("quiz_id", quizData.id)
      .select()
      .single();

    if (error) {
      console.error("Error updating quiz progress:", error);
      return {
        success: false,
        error: "Failed to update quiz progress",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Unexpected error in updateQuizProgressServer:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
