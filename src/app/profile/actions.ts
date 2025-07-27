"use server";

import { createClient } from "@/utils/supabase/server";
import type { UserStats, StatsResult } from "@/utils/auth/stats";

/**
 * Checks if a course is completed by comparing user progress with course requirements
 * A course is completed when:
 * 1. User has completed all learning stages in the course
 * 2. User has completed all quizzes in the course
 */
async function checkCourseCompletion(
  userId: string,
  courseId: string,
): Promise<boolean> {
  const supabase = await createClient();

  // Get all learning stages for this course
  const { data: courseStages, error: stagesError } = await supabase
    .from("learning_stages")
    .select("id")
    .eq("course_id", courseId);

  if (stagesError || !courseStages) {
    console.error("Error fetching course stages:", stagesError);
    return false;
  }

  // Get all quizzes for this course
  const { data: courseQuizzes, error: quizzesError } = await supabase
    .from("quizzes")
    .select("id")
    .eq("course_id", courseId);

  if (quizzesError || !courseQuizzes) {
    console.error("Error fetching course quizzes:", quizzesError);
    return false;
  }

  // If course has no stages or quizzes, consider it completed
  if (courseStages.length === 0 && courseQuizzes.length === 0) {
    return true;
  }

  // Check if user completed all stages
  let stagesCompleted = true;
  if (courseStages.length > 0) {
    const stageIds = courseStages.map((stage) => stage.id);
    const { count: completedStagesCount, error: completedStagesError } =
      await supabase
        .from("user_learning_stage_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("learning_stage_id", stageIds);

    if (completedStagesError) {
      console.error("Error checking completed stages:", completedStagesError);
      stagesCompleted = false;
    } else {
      stagesCompleted = (completedStagesCount || 0) === courseStages.length;
    }
  }

  // Check if user completed all quizzes
  let quizzesCompleted = true;
  if (courseQuizzes.length > 0) {
    const quizIds = courseQuizzes.map((quiz) => quiz.id);
    const { count: completedQuizzesCount, error: completedQuizzesError } =
      await supabase
        .from("user_quiz_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("quiz_id", quizIds);

    if (completedQuizzesError) {
      console.error("Error checking completed quizzes:", completedQuizzesError);
      quizzesCompleted = false;
    } else {
      quizzesCompleted = (completedQuizzesCount || 0) === courseQuizzes.length;
    }
  }

  // Course is completed if both stages and quizzes are completed
  return stagesCompleted && quizzesCompleted;
}

export async function getUserStatsAction(): Promise<StatsResult> {
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

    // Get average score from user_quiz_progress
    const { data: quizScores, error: quizScoresError } = await supabase
      .from("user_quiz_progress")
      .select("score")
      .eq("user_id", user.id);

    if (quizScoresError) {
      console.error("Error fetching quiz scores:", quizScoresError);
      return {
        success: false,
        error: "Failed to fetch quiz scores",
      };
    }

    // Calculate average score
    const averageScore =
      quizScores && quizScores.length > 0
        ? Math.round(
            (quizScores.reduce((sum, record) => sum + record.score, 0) /
              quizScores.length) *
              100,
          ) / 100
        : 0;

    // Get completed stages count
    const { count: completedStagesCount, error: completedStagesError } =
      await supabase
        .from("user_learning_stage_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

    if (completedStagesError) {
      console.error("Error fetching completed stages:", completedStagesError);
      return {
        success: false,
        error: "Failed to fetch completed stages",
      };
    }

    // Get total stages count
    const { count: totalStagesCount, error: totalStagesError } = await supabase
      .from("learning_stages")
      .select("*", { count: "exact", head: true });

    if (totalStagesError) {
      console.error("Error fetching total stages:", totalStagesError);
      return {
        success: false,
        error: "Failed to fetch total stages",
      };
    }

    // Get completed quizzes count
    const { count: completedQuizzesCount, error: completedQuizzesError } =
      await supabase
        .from("user_quiz_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

    if (completedQuizzesError) {
      console.error("Error fetching completed quizzes:", completedQuizzesError);
      return {
        success: false,
        error: "Failed to fetch completed quizzes",
      };
    }

    // Get total quizzes count
    const { count: totalQuizzesCount, error: totalQuizzesError } =
      await supabase
        .from("quizzes")
        .select("*", { count: "exact", head: true });

    if (totalQuizzesError) {
      console.error("Error fetching total quizzes:", totalQuizzesError);
      return {
        success: false,
        error: "Failed to fetch total quizzes",
      };
    }

    // Get total courses count
    const { count: totalCoursesCount, error: totalCoursesError } =
      await supabase
        .from("courses")
        .select("*", { count: "exact", head: true });

    if (totalCoursesError) {
      console.error("Error fetching total courses:", totalCoursesError);
      return {
        success: false,
        error: "Failed to fetch total courses",
      };
    }

    // Get all courses to check completion
    const { data: allCourses, error: allCoursesError } = await supabase
      .from("courses")
      .select("id");

    if (allCoursesError) {
      console.error("Error fetching all courses:", allCoursesError);
      return {
        success: false,
        error: "Failed to fetch all courses",
      };
    }

    // Check completion for each course
    let completedCoursesCount = 0;
    if (allCourses) {
      for (const course of allCourses) {
        const isCompleted = await checkCourseCompletion(user.id, course.id);
        if (isCompleted) {
          completedCoursesCount++;
        }
      }
    }

    const stats: UserStats = {
      total_courses: totalCoursesCount || 0,
      completed_courses: completedCoursesCount,
      total_stages: totalStagesCount || 0,
      completed_stages: completedStagesCount || 0,
      total_quizzes: totalQuizzesCount || 0,
      completed_quizzes: completedQuizzesCount || 0,
      average_score: averageScore,
    };

    return {
      success: true,
      stats,
    };
  } catch (error) {
    console.error("Unexpected error in getUserStatsAction:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
