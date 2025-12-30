export interface AcademyLessonNew {
  meta: {
    level: number;
    lesson_number: number;
    title: string;
    concept_summary: string;
  };
  online_content: {
    video_script: {
      intro: string;
      key_concepts: string[];
      outro: string;
    };
    pgn_examples: {
      id: number;
      description: string;
      visual_cues: string; // Describes arrows, highlights, etc.
    }[];
    pgn_exercises_interactive: {
      id: number;
      instruction: string;
      setup_description: string;
      solution_mechanic: string; // "click_square", "drag_piece", etc.
    }[];
    quiz: {
      question: string;
      options: string[];
      correct_option_index: number;
    }[];
    gamification: {
      badge_name: string;
      badge_emoji: string;
      badge_description: string;
    };
  };
  classroom_content: {
    objectives: string[];
    age_adaptation: {
      infant_narrative: string;
      junior_logic: string;
      activity_game: {
        title: string;
        setup: string;
        levels: {
          level_a_basic: string;
          level_b_standard: string;
          level_c_advanced: string;
        };
      };
      printables: {
        worksheet_infant_desc: string;
        worksheet_general_desc: string;
      };
    };
  };
}

export interface AcademyCourseModule {
  title: string;
  lessons: AcademyLessonNew[];
}

export interface AcademyCourse {
  title: string;
  slug: string;
  description: string;
  modules: AcademyCourseModule[];
}
