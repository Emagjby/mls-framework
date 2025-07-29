import { createClient } from "@/utils/supabase/client";

export interface StageProgress {
  stageOrderIndex: number;
  stageCompleted: boolean;
  quizCompleted: boolean;
}

export interface CourseProgressData {
  progress: number;
  completedStages: number;
  totalStages: number;
  completedQuizzes: number;
  totalQuizzes: number;
  completedCount: number;
  stageProgress: StageProgress[];
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

/**
 * Get progress data for a specific course (client-side)
 */
export async function getCourseProgress(
  courseSlug: string,
): Promise<CourseProgressData | null> {
  try {
    const supabase = createClient();

    // Get the current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User not authenticated");
      return null;
    }

    // Get the course ID from the slug
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .single();

    if (courseError || !courseData) {
      console.error("Course not found");
      return null;
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
      console.error("Failed to fetch progress data");
      return null;
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

    return data;
  } catch (error) {
    console.error("Error in getCourseProgress:", error);
    return null;
  }
}

/**
 * Save quiz progress (client-side)
 */
export async function saveQuizProgressClient(
  courseSlug: string,
  stageOrderIndex: number,
  score: number,
  timeTaken: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

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

    // Get the quiz ID from course_id and order_index
    const { data: quizData, error: quizError } = await supabase
      .from("quizzes")
      .select("id")
      .eq("course_id", courseData.id)
      .eq("order_index", stageOrderIndex)
      .single();

    if (quizError || !quizData) {
      return { success: false, error: "Quiz not found" };
    }

    // Check if user already has progress for this quiz
    const { data: existingProgress, error: checkError } = await supabase
      .from("user_quiz_progress")
      .select("id, attempts_count, best_score")
      .eq("user_id", user.id)
      .eq("quiz_id", quizData.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      return { success: false, error: "Failed to check existing progress" };
    }

    const now = new Date().toISOString();

    if (existingProgress) {
      // Update existing progress
      const { error: updateError } = await supabase
        .from("user_quiz_progress")
        .update({
          score,
          attempts_count: existingProgress.attempts_count + 1,
          best_score: Math.max(existingProgress.best_score, score),
          time_taken: timeTaken,
          completed_at: now,
          updated_at: now,
        })
        .eq("id", existingProgress.id);

      if (updateError) {
        return { success: false, error: "Failed to update quiz progress" };
      }
    } else {
      // Insert new progress
      const { error: insertError } = await supabase
        .from("user_quiz_progress")
        .insert({
          user_id: user.id,
          course_id: courseData.id,
          quiz_id: quizData.id,
          score,
          is_completed: true,
          attempts_count: 1,
          best_score: score,
          time_taken: timeTaken,
          completed_at: now,
        });

      if (insertError) {
        return { success: false, error: "Failed to save quiz progress" };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error in saveQuizProgressClient:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Check if a specific stage is completed by the user (client-side)
 */
export async function checkStageCompletion(
  courseSlug: string,
  stageOrderIndex: number,
): Promise<{ isCompleted: boolean; error?: string }> {
  try {
    const supabase = createClient();

    // Get the current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      return { isCompleted: false, error: "User not authenticated" };
    }

    // Get the course ID from the slug
    const { data: courseData, error: courseError } = await supabase
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .single();

    if (courseError || !courseData) {
      return { isCompleted: false, error: "Course not found" };
    }

    // Get the stage ID from course_id and order_index
    const { data: stageData, error: stageError } = await supabase
      .from("learning_stages")
      .select("id")
      .eq("course_id", courseData.id)
      .eq("order_index", stageOrderIndex)
      .single();

    if (stageError || !stageData) {
      return { isCompleted: false, error: "Stage not found" };
    }

    // Check if user has completed this stage
    const { data: progressData, error: progressError } = await supabase
      .from("user_learning_stage_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("learning_stage_id", stageData.id)
      .single();

    if (progressError && progressError.code !== "PGRST116") {
      return { isCompleted: false, error: "Failed to check stage completion" };
    }

    return { isCompleted: !!progressData };
  } catch (error) {
    console.error("Error in checkStageCompletion:", error);
    return { isCompleted: false, error: "An unexpected error occurred" };
  }
}

/**
 * Mark stage as complete (client-side)
 */
export async function markStageCompleteClient(
  courseSlug: string,
  stageOrderIndex: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = createClient();

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

    // Get the stage ID from course_id and order_index
    const { data: stageData, error: stageError } = await supabase
      .from("learning_stages")
      .select("id")
      .eq("course_id", courseData.id)
      .eq("order_index", stageOrderIndex)
      .single();

    if (stageError || !stageData) {
      return { success: false, error: "Stage not found" };
    }

    // Check if user already has progress for this stage
    const { data: existingProgress, error: checkError } = await supabase
      .from("user_learning_stage_progress")
      .select("id")
      .eq("user_id", user.id)
      .eq("learning_stage_id", stageData.id)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      return { success: false, error: "Failed to check existing progress" };
    }

    if (!existingProgress) {
      // Insert new progress
      const { error: insertError } = await supabase
        .from("user_learning_stage_progress")
        .insert({
          user_id: user.id,
          course_id: courseData.id,
          learning_stage_id: stageData.id,
          completed_at: new Date().toISOString(),
        });

      if (insertError) {
        return { success: false, error: "Failed to mark stage as complete" };
      }
    }

    return { success: true };
  } catch (error) {
    console.error("Error in markStageCompleteClient:", error);
    return { success: false, error: "An unexpected error occurred" };
  }
}

/**
 * Get progress for all courses (client-side)
 */
export async function getAllCoursesProgress(): Promise<Array<{
  courseId: string;
  progress: number;
  completedStages: number;
  totalStages: number;
  completedQuizzes: number;
  totalQuizzes: number;
}> | null> {
  try {
    const supabase = createClient();

    // Get the current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User not authenticated");
      return null;
    }

    // Get all courses
    const { data: courses, error: coursesError } = await supabase
      .from("courses")
      .select("id");

    if (coursesError || !courses) {
      console.error("Failed to fetch courses");
      return null;
    }

    // Get all progress data in parallel
    const [
      userStagesResult,
      userQuizzesResult,
      allStagesResult,
      allQuizzesResult,
    ] = await Promise.all([
      supabase
        .from("user_learning_stage_progress")
        .select("course_id")
        .eq("user_id", user.id),
      supabase
        .from("user_quiz_progress")
        .select("course_id")
        .eq("user_id", user.id),
      supabase.from("learning_stages").select("course_id"),
      supabase.from("quizzes").select("course_id"),
    ]);

    if (
      userStagesResult.error ||
      userQuizzesResult.error ||
      allStagesResult.error ||
      allQuizzesResult.error
    ) {
      console.error("Failed to fetch progress data");
      return null;
    }

    // Create maps for efficient counting
    const userStagesByCourse = new Map<string, number>();
    const userQuizzesByCourse = new Map<string, number>();
    const totalStagesByCourse = new Map<string, number>();
    const totalQuizzesByCourse = new Map<string, number>();

    // Count user completed stages by course
    userStagesResult.data?.forEach((item) => {
      const count = userStagesByCourse.get(item.course_id) || 0;
      userStagesByCourse.set(item.course_id, count + 1);
    });

    // Count user completed quizzes by course
    userQuizzesResult.data?.forEach((item) => {
      const count = userQuizzesByCourse.get(item.course_id) || 0;
      userQuizzesByCourse.set(item.course_id, count + 1);
    });

    // Count total stages by course
    allStagesResult.data?.forEach((item) => {
      const count = totalStagesByCourse.get(item.course_id) || 0;
      totalStagesByCourse.set(item.course_id, count + 1);
    });

    // Count total quizzes by course
    allQuizzesResult.data?.forEach((item) => {
      const count = totalQuizzesByCourse.get(item.course_id) || 0;
      totalQuizzesByCourse.set(item.course_id, count + 1);
    });

    // Calculate progress for each course
    return courses.map((course) => {
      const completedStages = userStagesByCourse.get(course.id) || 0;
      const completedQuizzes = userQuizzesByCourse.get(course.id) || 0;
      const totalStages = totalStagesByCourse.get(course.id) || 0;
      const totalQuizzes = totalQuizzesByCourse.get(course.id) || 0;

      const totalItems = totalStages + totalQuizzes;
      const completedItems = completedStages + completedQuizzes;
      const progress =
        totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;

      return {
        courseId: course.id,
        progress,
        completedStages,
        totalStages,
        completedQuizzes,
        totalQuizzes,
      };
    });
  } catch (error) {
    console.error("Error in getAllCoursesProgress:", error);
    return null;
  }
}

/**
 * Get user statistics (client-side)
 */
export async function getUserStatsClient(): Promise<{
  average_score: number;
  completed_stages: number;
  total_stages: number;
  completed_quizzes: number;
  total_quizzes: number;
  total_courses: number;
  completed_courses: number;
} | null> {
  try {
    const supabase = createClient();

    // Get the current authenticated user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error("User not authenticated");
      return null;
    }

    // Get all stats data in parallel
    const [
      userQuizScoresResult,
      userStagesResult,
      userQuizzesResult,
      allStagesResult,
      allQuizzesResult,
      allCoursesResult,
    ] = await Promise.all([
      supabase
        .from("user_quiz_progress")
        .select("score")
        .eq("user_id", user.id),
      supabase
        .from("user_learning_stage_progress")
        .select("course_id")
        .eq("user_id", user.id),
      supabase
        .from("user_quiz_progress")
        .select("course_id")
        .eq("user_id", user.id),
      supabase.from("learning_stages").select("id"),
      supabase.from("quizzes").select("id"),
      supabase.from("courses").select("id"),
    ]);

    if (
      userQuizScoresResult.error ||
      userStagesResult.error ||
      userQuizzesResult.error ||
      allStagesResult.error ||
      allQuizzesResult.error ||
      allCoursesResult.error
    ) {
      console.error("Failed to fetch stats data");
      return null;
    }

    // Calculate average score
    const scores = userQuizScoresResult.data?.map((item) => item.score) || [];
    const averageScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length,
          )
        : 0;

    // Count completed items
    const completedStages = userStagesResult.data?.length || 0;
    const completedQuizzes = userQuizzesResult.data?.length || 0;

    // Count total items
    const totalStages = allStagesResult.data?.length || 0;
    const totalQuizzes = allQuizzesResult.data?.length || 0;
    const totalCourses = allCoursesResult.data?.length || 0;

    // Calculate completed courses
    // Get progress data for all courses to determine completion
    const coursesProgressData = await getAllCoursesProgress();
    const completedCourses = coursesProgressData
      ? coursesProgressData.filter((course) => course.progress >= 100).length
      : 0;

    return {
      average_score: averageScore,
      completed_stages: completedStages,
      total_stages: totalStages,
      completed_quizzes: completedQuizzes,
      total_quizzes: totalQuizzes,
      total_courses: totalCourses,
      completed_courses: completedCourses,
    };
  } catch (error) {
    console.error("Error in getUserStatsClient:", error);
    return null;
  }
}
