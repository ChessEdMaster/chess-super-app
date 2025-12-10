// ============================================
// CHESS ACADEMY TYPE DEFINITIONS
// ============================================

export type DifficultyLevel = 'Principiant' | 'Intermedi' | 'Avançat' | 'Tots';
export type ExerciseDifficulty = 'easy' | 'medium' | 'hard';

// ============================================
// COURSES & MODULES
// ============================================

export interface AcademyCourse {
    id: string;
    title: string;
    slug?: string;
    description: string;
    track: 'academic' | 'pedagogical' | 'sport' | 'vocational';
    target_grade: string;
    difficulty_level: string;
    image_url?: string;
    subject_tags?: string[];
    published?: boolean;
    created_at?: string;
    is_enrolled?: boolean; // UI helper
}

export interface AcademyModule {
    id: string;
    course_id?: string;
    title: string;
    description: string;
    icon: string; // lucide-react icon name
    level: DifficultyLevel;
    order: number;
    created_at?: string;
}

export interface AcademyEnrollment {
    id: string;
    user_id: string;
    course_id: string;
    assigned_by?: string;
    club_id?: string;
    created_at: string;
    course?: AcademyCourse;
}

// ============================================
// LESSONS
// ============================================

export interface LessonStep {
    fen: string;
    instruction: string;
    correctMoves: string[]; // UCI notation moves that are correct
    explanation: string; // Explanation shown after correct move
    highlightSquares?: string[]; // Optional squares to highlight
}

export interface LessonActivity {
    type: string;
    title: string;
    desc: string;
}

export interface LessonContent {
    steps?: LessonStep[];
    activities?: LessonActivity[];
    introduction?: string; // Optional intro text
    conclusion?: string; // Optional conclusion text
    // Additional types based on the seed
    type?: string;
    text?: string;
    piece?: string;
}

export interface AcademyLesson {
    id: string;
    module_id: string;
    title: string;
    description: string;
    content: LessonContent;
    order: number;
    difficulty: number; // 1-5
    is_free?: boolean;
    created_at?: string;
}

// ============================================
// USER PROGRESS
// ============================================

export interface UserLessonProgress {
    id: string;
    user_id: string;
    lesson_id: string;
    completed: boolean;
    score: number; // 0-100 percentage
    attempts: number;
    last_attempt_at: string;
    completed_at?: string;
}

export interface ModuleProgress {
    module: AcademyModule;
    totalLessons: number;
    completedLessons: number;
    progressPercentage: number;
}

// ============================================
// EXERCISES
// ============================================

export interface AcademyExercise {
    id: string;
    fen: string;
    solution: string[]; // Array of UCI moves
    difficulty: ExerciseDifficulty;
    tags: string[];
    rating: number;
    title?: string;
    description?: string;
    created_at?: string;
}

export interface UserExerciseProgress {
    id: string;
    user_id: string;
    exercise_id: string;
    solved: boolean;
    attempts: number;
    time_spent: number; // seconds
    hints_used: number;
    solved_at?: string;
}

// ============================================
// ACHIEVEMENTS
// ============================================

export type AchievementRequirementType =
    | 'lessons_completed'
    | 'exercises_solved'
    | 'streak_days'
    | 'perfect_lesson'
    | 'module_completed';

export interface AchievementRequirement {
    type: AchievementRequirementType;
    count?: number;
    module_id?: string;
}

export interface AcademyAchievement {
    id: string;
    title: string;
    description: string;
    icon: string;
    requirement: AchievementRequirement;
    created_at?: string;
}

export interface UserAchievement {
    id: string;
    user_id: string;
    achievement_id: string;
    unlocked_at: string;
    achievement?: AcademyAchievement; // Populated via join
}

// ============================================
// STATS & ANALYTICS
// ============================================

export interface UserAcademyStats {
    totalLessonsCompleted: number;
    totalExercisesSolved: number;
    currentStreak: number;
    longestStreak: number;
    totalTimeSpent: number; // seconds
    averageScore: number;
    achievementsUnlocked: number;
}
