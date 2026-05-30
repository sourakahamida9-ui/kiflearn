// Types métier de KifLearn (alignés sur le schéma Supabase)

export type Choice = "a" | "b" | "c" | "d";
export type SessionStatus = "lobby" | "active" | "question_closed" | "finished";

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  created_at: string;
}

export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  creator_id: string;
  is_public?: boolean;
  created_at: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  position: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  correct_answer: Choice;
  time_limit: number;
  created_at: string;
}

// Version exposée aux étudiants : SANS la bonne réponse
export interface PublicQuestion {
  id: string;
  quiz_id: string;
  position: number;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string | null;
  option_d: string | null;
  time_limit: number;
}

export interface Session {
  id: string;
  quiz_id: string;
  host_id: string;
  join_code: string;
  status: SessionStatus;
  current_question_index: number;
  question_started_at: string | null;
  is_persistent?: boolean;
  salon_label?: string | null;
  created_at: string;
}

export interface Participant {
  id: string;
  session_id: string;
  user_name: string;
  score: number;
  created_at: string;
}

export interface Answer {
  id: string;
  participant_id: string;
  question_id: string;
  answer: Choice | null;
  is_correct: boolean;
  response_time: number | null;
  points: number;
  created_at: string;
}

export const CHOICES: Choice[] = ["a", "b", "c", "d"];

/** Lecture type-safe d'une option (évite l'indexation dynamique). */
export function optionOf(
  q: {
    option_a: string;
    option_b: string;
    option_c: string | null;
    option_d: string | null;
  },
  c: Choice,
): string | null {
  return c === "a"
    ? q.option_a
    : c === "b"
      ? q.option_b
      : c === "c"
        ? q.option_c
        : q.option_d;
}
