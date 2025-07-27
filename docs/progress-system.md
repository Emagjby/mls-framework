# Progress Tracking System

## Overview

The progress tracking system automatically saves and manages user quiz completion data using Supabase and Next.js server actions.

## Architecture

### Files Structure

```
src/
├── utils/
│   ├── progress.ts          # Browser client functions (for future use)
│   └── progress-server.ts   # Server-side functions
├── app/course/[slug]/stage/[stageId]/quiz/
│   ├── actions.ts           # Server actions
│   └── page.tsx            # Quiz page with progress integration
```

### Database Schema

#### `user_quiz_progress` Table

```sql
CREATE TABLE user_quiz_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
  score INTEGER NOT NULL, -- percentage (0-100)
  is_completed BOOLEAN DEFAULT false,
  attempts_count INTEGER DEFAULT 1,
  best_score INTEGER, -- highest score achieved
  time_taken INTEGER, -- minutes taken to complete
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, quiz_id)
);
```

## How It Works

### 1. Quiz Completion Flow

1. User completes quiz
2. `handleFinishQuiz()` calculates score and time
3. `saveQuizProgressAction()` server action is called
4. System checks for existing progress
5. Either saves new record or updates existing one
6. User gets success/error notification

### 2. Smart Save/Update Logic

- **First Attempt**: Creates new record with `attempts_count = 1`
- **Retake**: Updates existing record and increments `attempts_count`
- **Best Score**: Always maintains the highest score achieved
- **Time Tracking**: Records completion time in minutes

### 3. Authentication

- Uses Supabase SSR with server client
- Proper session management via cookies
- RLS policies ensure data security

## API Reference

### Server Actions

#### `saveQuizProgressAction(progressData)`

Saves or updates quiz progress based on existing data.

**Parameters:**

```typescript
interface QuizProgressData {
  slug: string; // Course slug
  orderIndex: number; // Quiz order index
  score: number; // Quiz score (0-100)
  timeTaken: number; // Time taken in minutes
}
```

**Returns:**

```typescript
interface SaveQuizProgressResult {
  success: boolean;
  error?: string;
  data?: any;
}
```

#### `getUserQuizProgress(courseSlug, orderIndex)`

Gets user's progress for a specific quiz.

#### `getUserCourseProgress(courseSlug)`

Gets user's progress for an entire course.

### Server Functions

#### `saveQuizProgressServer(progressData)`

Server-side function that handles the actual database operations.

#### `updateQuizProgressServer(progressData)`

Server-side function for updating existing progress records.

## Usage Examples

### Basic Quiz Progress Saving

```typescript
import { saveQuizProgressAction } from "./actions";

const result = await saveQuizProgressAction({
  slug: "python-basics",
  orderIndex: 1,
  score: 85,
  timeTaken: 12,
});

if (result.success) {
  console.log("Progress saved!");
} else {
  console.error("Error:", result.error);
}
```

### Getting User Progress

```typescript
import { getUserQuizProgress } from "./actions";

const progress = await getUserQuizProgress("python-basics", 1);
if (progress.success) {
  console.log("User score:", progress.data.score);
  console.log("Attempts:", progress.data.attempts_count);
}
```

## Error Handling

The system includes comprehensive error handling:

- **Authentication Errors**: User not logged in
- **Database Errors**: Course/quiz not found, save failures
- **Network Errors**: Connection issues
- **Validation Errors**: Invalid data

All errors are logged and returned to the client with user-friendly messages.

## Security

- **RLS Policies**: Database-level security
- **Server Actions**: Server-side execution
- **Session Validation**: Proper authentication checks
- **Input Validation**: Data sanitization

## Performance

- **Server-Side Operations**: Reduced client bundle size
- **Efficient Queries**: Optimized database queries
- **Caching**: Leverages Next.js caching
- **Minimal Network**: Single server action call

## Future Enhancements

- [ ] Progress analytics dashboard
- [ ] Learning streak tracking
- [ ] Achievement system
- [ ] Progress export functionality
- [ ] Real-time progress updates
- [ ] Progress comparison features
