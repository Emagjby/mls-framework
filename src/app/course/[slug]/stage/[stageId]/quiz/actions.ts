"use server";

import { createClient } from "@/utils/supabase/server";
import {
  saveQuizProgressServer,
  updateQuizProgressServer,
} from "@/utils/progress-server";
import type {
  QuizProgressData,
  SaveQuizProgressResult,
} from "@/utils/progress-types";

/**
 * Check if user has existing progress for a specific quiz
 */
export async function checkExistingProgress(
  courseSlug: string,
  orderIndex: number,
): Promise<boolean> {
  try {
    const supabase = await createClient();

    // Get the current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return false;
    }

    // Get the course ID from the slug
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .single();

    if (courseError || !courseData) {
      return false;
    }

    // Get the quiz ID from course_id and order_index
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("course_id", courseData.id)
      .eq("order_index", orderIndex)
      .single();

    if (quizError || !quizData) {
      return false;
    }

    // Check if user already has progress for this quiz
    const { data: existingProgress, error: checkError } = await supabase
      .from("user_quiz_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("quiz_id", quizData.id)
      .single();

    return !checkError && existingProgress !== null;
  } catch (error) {
    console.error("Error checking existing progress:", error);
    return false;
  }
}

/**
 * Save or update quiz progress based on existing data
 */
export async function saveQuizProgressAction(
  progressData: QuizProgressData,
): Promise<SaveQuizProgressResult> {
  try {
    // Check if user has existing progress for this quiz
    const hasExistingProgress = await checkExistingProgress(
      progressData.slug,
      progressData.orderIndex,
    );

    // Save or update progress based on existing data
    const result = hasExistingProgress
      ? await updateQuizProgressServer(progressData)
      : await saveQuizProgressServer(progressData);

    return result;
  } catch (error) {
    console.error("Error in saveQuizProgressAction:", error);
    return {
      success: false,
      error: "An unexpected error occurred while saving progress",
    };
  }
}

/**
 * Get user's quiz progress for a specific quiz
 */
export async function getUserQuizProgress(
  courseSlug: string,
  orderIndex: number,
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
      .eq("slug", courseSlug)
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
      .eq("order_index", orderIndex)
      .single();

    if (quizError || !quizData) {
      return {
        success: false,
        error: "Quiz not found",
      };
    }

    // Get user's progress for this quiz
    const { data, error } = await supabase
      .from("user_quiz_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("quiz_id", quizData.id)
      .single();

    if (error) {
      return {
        success: false,
        error: "Failed to fetch quiz progress",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error in getUserQuizProgress:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Get user's course progress summary
 */
export async function getUserCourseProgress(
  courseSlug: string,
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
      .eq("slug", courseSlug)
      .single();

    if (courseError || !courseData) {
      return {
        success: false,
        error: "Course not found",
      };
    }

    // Get user's progress for this course
    const { data, error } = await supabase
      .from("user_quiz_progress")
      .select(
        `
        *,
        quizzes!inner(
          id,
          name,
          order_index
        )
      `,
      )
      .eq("user_id", user.id)
      .eq("course_id", courseData.id)
      .order("quizzes.order_index");

    if (error) {
      return {
        success: false,
        error: "Failed to fetch course progress",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error in getUserCourseProgress:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
