"use server";

import { createClient } from "@/utils/supabase/server";

export interface StageProgressResult {
  success: boolean;
  error?: string;
  data?: {
    isCompleted?: boolean;
    message?: string;
    id?: string;
  };
}

/**
 * Check if user has completed a specific learning stage
 */
export async function checkStageCompletion(
  courseSlug: string,
  orderIndex: number,
): Promise<StageProgressResult> {
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

    // Get the learning stage ID from course_id and order_index
    const { data: stageData, error: stageError } = await supabase
      .from("learning_stages")
      .select("id")
      .eq("course_id", courseData.id)
      .eq("order_index", orderIndex)
      .single();

    if (stageError || !stageData) {
      return {
        success: false,
        error: "Learning stage not found",
      };
    }

    // Check if user has completed this stage
    const { data: progressData, error: progressError } = await supabase
      .from("user_learning_stage_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("learning_stage_id", stageData.id)
      .single();

    return {
      success: true,
      data: {
        isCompleted: !progressError && progressData !== null,
      },
    };
  } catch (error) {
    console.error("Error checking stage completion:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}

/**
 * Mark a learning stage as complete
 */
export async function markStageComplete(
  courseSlug: string,
  orderIndex: number,
): Promise<StageProgressResult> {
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

    // Get the learning stage ID from course_id and order_index
    const { data: stageData, error: stageError } = await supabase
      .from("learning_stages")
      .select("id")
      .eq("course_id", courseData.id)
      .eq("order_index", orderIndex)
      .single();

    if (stageError || !stageData) {
      return {
        success: false,
        error: "Learning stage not found",
      };
    }

    // Check if user already has progress for this stage
    const { data: existingProgress, error: checkError } = await supabase
      .from("user_learning_stage_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("learning_stage_id", stageData.id)
      .single();

    if (!checkError && existingProgress) {
      return {
        success: true,
        data: { message: "Stage already completed" },
      };
    }

    // Insert the stage completion record
    const { data, error } = await supabase
      .from("user_learning_stage_progress")
      .insert({
        user_id: user.id,
        course_id: courseData.id,
        learning_stage_id: stageData.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error marking stage complete:", error);
      return {
        success: false,
        error: "Failed to mark stage as complete",
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error("Error marking stage complete:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
