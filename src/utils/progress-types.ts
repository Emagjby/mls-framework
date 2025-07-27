/**
 * Shared types for progress tracking system
 */

export interface QuizProgressData {
  slug: string;
  orderIndex: number;
  score: number;
  timeTaken: number; // in minutes
}

export interface SaveQuizProgressResult {
  success: boolean;
  error?: string;
  data?:
    | {
        id?: string;
        user_id?: string;
        course_id?: string;
        quiz_id?: string;
        score?: number;
        is_completed?: boolean;
        attempts_count?: number;
        best_score?: number;
        time_taken?: number;
        completed_at?: string;
        created_at?: string;
        updated_at?: string;
      }
    | {
        id?: string;
        user_id?: string;
        course_id?: string;
        quiz_id?: string;
        score?: number;
        is_completed?: boolean;
        attempts_count?: number;
        best_score?: number;
        time_taken?: number;
        completed_at?: string;
        created_at?: string;
        updated_at?: string;
        quizzes?: {
          id: string;
          name: string;
          order_index: number;
        };
      }[];
}

export interface UserQuizProgress {
  id: string;
  user_id: string;
  course_id: string;
  quiz_id: string;
  score: number;
  is_completed: boolean;
  attempts_count: number;
  best_score: number;
  time_taken: number;
  completed_at: string;
  created_at: string;
  updated_at: string;
}

export interface CourseProgressSummary {
  total_quizzes: number;
  completed_quizzes: number;
  average_score: number;
  total_time_spent: number;
  last_activity: string;
}
