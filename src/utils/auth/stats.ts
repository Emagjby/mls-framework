import { createClient } from "@/utils/supabase/client";

export interface UserStats {
  total_courses: number;
  completed_courses: number;
  total_stages: number;
  completed_stages: number;
  total_quizzes: number;
  completed_quizzes: number;
  average_score: number;
}

export interface StatsResult {
  success: boolean;
  stats?: UserStats;
  error?: string;
}

export async function getUserStats(userId: string): Promise<StatsResult> {
  try {
    const supabase = createClient();

    // Get average score from user_quiz_progress
    const { data: quizScores, error: quizScoresError } = await supabase
      .from("user_quiz_progress")
      .select("score")
      .eq("user_id", userId);

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
        .eq("user_id", userId);

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
        .eq("user_id", userId);

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

    const stats: UserStats = {
      total_courses: totalCoursesCount || 0,
      completed_courses: 0, // Will be implemented in next prompt
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
    console.error("Unexpected error in getUserStats:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
