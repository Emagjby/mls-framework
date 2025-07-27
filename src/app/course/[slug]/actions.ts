"use server";

import { createClient } from "@/utils/supabase/server";

export interface StageProgress {
  stageOrderIndex: number;
  stageCompleted: boolean;
  quizCompleted: boolean;
}

interface UserStageProgressWithJoin {
  id: string;
  learning_stages: {
    order_index: number;
  }[];
}

interface UserQuizProgressWithJoin {
  id: string;
  quizzes: {
    order_index: number;
  }[];
}

export interface CourseProgressData {
  progress: number;
  completedStages: number;
  totalStages: number;
  completedQuizzes: number;
  totalQuizzes: number;
  completedCount: number; // min of completedStages and completedQuizzes
  stageProgress: StageProgress[];
}

export interface CourseProgressResult {
  success: boolean;
  data?: CourseProgressData;
  error?: string;
}

/**
 * Get progress data for a specific course
 */
export async function getCourseProgressAction(
  courseSlug: string,
): Promise<CourseProgressResult> {
  try {
    const supabase = await createClient();

    // Get the current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, error: "User not authenticated" };
    }

    // Get the course ID from the slug
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .single();

    if (courseError || !courseData) {
      return { success: false, error: "Course not found" };
    }

    const courseId = courseData.id;

    // Get all progress data in parallel
    const [
      userStagesResult,
      userQuizzesResult,
      courseStagesResult,
      courseQuizzesResult,
    ] = await Promise.all([
      supabase
        .from("user_learning_stage_progress")
        .select(
          `
          id,
          learning_stages!inner(order_index)
        `,
        )
        .eq("course_id", courseId)
        .eq("user_id", user.id),
      supabase
        .from("user_quiz_progress")
        .select(
          `
          id,
          quizzes!inner(order_index)
        `,
        )
        .eq("course_id", courseId)
        .eq("user_id", user.id),
      supabase
        .from("learning_stages")
        .select("id, order_index")
        .eq("course_id", courseId)
        .order("order_index"),
      supabase
        .from("quizzes")
        .select("id, order_index")
        .eq("course_id", courseId)
        .order("order_index"),
    ]);

    if (
      userStagesResult.error ||
      userQuizzesResult.error ||
      courseStagesResult.error ||
      courseQuizzesResult.error
    ) {
      return { success: false, error: "Failed to fetch progress data" };
    }

    const completedStages = userStagesResult.data?.length || 0;
    const completedQuizzes = userQuizzesResult.data?.length || 0;
    const totalStages = courseStagesResult.data?.length || 0;
    const totalQuizzes = courseQuizzesResult.data?.length || 0;

    const totalItems = totalStages + totalQuizzes;
    const completedItems = completedStages + completedQuizzes;
    const progress =
      totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

    // Completed count is the minimum of completed stages and completed quizzes
    const completedCount = Math.min(completedStages, completedQuizzes);

    // Create stage progress data for each stage
    const stageProgress: StageProgress[] = [];

    // Create sets for quick lookup of completed stages and quizzes
    const completedStageOrderIndices = new Set(
      (userStagesResult.data as UserStageProgressWithJoin[])?.map(
        (item) => item.learning_stages[0]?.order_index,
      ) || [],
    );
    const completedQuizOrderIndices = new Set(
      (userQuizzesResult.data as UserQuizProgressWithJoin[])?.map(
        (item) => item.quizzes[0]?.order_index,
      ) || [],
    );

    // Generate progress data for each stage
    for (let i = 1; i <= totalStages; i++) {
      stageProgress.push({
        stageOrderIndex: i,
        stageCompleted: completedStageOrderIndices.has(i),
        quizCompleted: completedQuizOrderIndices.has(i),
      });
    }

    const data: CourseProgressData = {
      progress,
      completedStages,
      totalStages,
      completedQuizzes,
      totalQuizzes,
      completedCount,
      stageProgress,
    };

    return { success: true, data };
  } catch (error) {
    console.error("Error in getCourseProgressAction:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}
