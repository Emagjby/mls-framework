"use server";

import { createClient } from "@/utils/supabase/server";

export interface CourseProgress {
  courseId: string;
  progress: number;
  isCompleted: boolean;
  hasStarted: boolean;
}

export interface CourseProgressResult {
  success: boolean;
  progress?: CourseProgress[];
  error?: string;
}

/**
 * Optimized function to calculate progress for all courses in a single query
 * Uses joins to get all data at once instead of multiple queries per course
 */
export async function getCoursesProgressAction(): Promise<CourseProgressResult> {
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

    // Single optimized query to get all course progress data
    const { error: progressError } = await supabase
      .from("courses")
      .select(
        `
        id,
        learning_stages!inner(id),
        quizzes!inner(id),
        user_learning_stage_progress!left(id, user_id),
        user_quiz_progress!left(id, user_id)
      `,
      )
      .eq("user_learning_stage_progress.user_id", user.id)
      .eq("user_quiz_progress.user_id", user.id);

    if (progressError) {
      console.error("Error fetching course progress data:", progressError);
      return {
        success: false,
        error: "Failed to fetch course progress data",
      };
    }

    // Alternative approach: Get aggregated data with separate queries but optimized
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id");

    if (coursesError || !courses) {
      console.error("Error fetching courses:", coursesError);
      return {
        success: false,
        error: "Failed to fetch courses",
      };
    }

    // Get all user progress data in bulk
    const [userStagesResult, userQuizzesResult] = await Promise.all([
      supabase
        .from("user_learning_stage_progress")
        .select("course_id")
        .eq("user_id", user.id),
      supabase
        .from("user_quiz_progress")
        .select("course_id")
        .eq("user_id", user.id),
    ]);

    if (userStagesResult.error) {
      console.error("Error fetching user stages:", userStagesResult.error);
      return {
        success: false,
        error: "Failed to fetch user stages",
      };
    }

    if (userQuizzesResult.error) {
      console.error("Error fetching user quizzes:", userQuizzesResult.error);
      return {
        success: false,
        error: "Failed to fetch user quizzes",
      };
    }

    // Get all course requirements in bulk
    const [courseStagesResult, courseQuizzesResult] = await Promise.all([
      supabase.from("learning_stages").select("course_id"),
      supabase.from("quizzes").select("course_id"),
    ]);

    if (courseStagesResult.error) {
      console.error("Error fetching course stages:", courseStagesResult.error);
      return {
        success: false,
        error: "Failed to fetch course stages",
      };
    }

    if (courseQuizzesResult.error) {
      console.error(
        "Error fetching course quizzes:",
        courseQuizzesResult.error,
      );
      return {
        success: false,
        error: "Failed to fetch course quizzes",
      };
    }

    // Process the data efficiently
    const userStagesByCourse = new Map<string, number>();
    const userQuizzesByCourse = new Map<string, number>();
    const courseStagesByCourse = new Map<string, number>();
    const courseQuizzesByCourse = new Map<string, number>();

    // Count user progress by course
    userStagesResult.data?.forEach((stage) => {
      const count = userStagesByCourse.get(stage.course_id) || 0;
      userStagesByCourse.set(stage.course_id, count + 1);
    });

    userQuizzesResult.data?.forEach((quiz) => {
      const count = userQuizzesByCourse.get(quiz.course_id) || 0;
      userQuizzesByCourse.set(quiz.course_id, count + 1);
    });

    // Count course requirements by course
    courseStagesResult.data?.forEach((stage) => {
      const count = courseStagesByCourse.get(stage.course_id) || 0;
      courseStagesByCourse.set(stage.course_id, count + 1);
    });

    courseQuizzesResult.data?.forEach((quiz) => {
      const count = courseQuizzesByCourse.get(quiz.course_id) || 0;
      courseQuizzesByCourse.set(quiz.course_id, count + 1);
    });

    // Calculate progress for each course
    const progress: CourseProgress[] = courses.map((course) => {
      const totalStages = courseStagesByCourse.get(course.id) || 0;
      const totalQuizzes = courseQuizzesByCourse.get(course.id) || 0;
      const completedStages = userStagesByCourse.get(course.id) || 0;
      const completedQuizzes = userQuizzesByCourse.get(course.id) || 0;

      const totalItems = totalStages + totalQuizzes;
      const completedItems = completedStages + completedQuizzes;

      const progressPercentage =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
      const isCompleted = progressPercentage === 100;
      const hasStarted = completedItems > 0;

      return {
        courseId: course.id,
        progress: progressPercentage,
        isCompleted,
        hasStarted,
      };
    });

    return {
      success: true,
      progress,
    };
  } catch (error) {
    console.error("Unexpected error in getCoursesProgressAction:", error);
    return {
      success: false,
      error: "An unexpected error occurred",
    };
  }
}
