import type { Choice } from "@/lib/types";

export type AiQuestionDraft = {
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: Choice;
  time_limit: number;
};

/** Prompt à copier dans ChatGPT — l'utilisateur colle ensuite la réponse JSON. */
export function buildChatGptPrompt(topic: string, count = 5): string {
  return `Tu es un assistant pour créer un quiz scolaire en français.

Sujet du quiz : "${topic.trim() || "général"}"
Nombre de questions : ${count}

Réponds UNIQUEMENT avec un bloc JSON valide (sans texte avant ni après), exactement dans ce format :

{
  "questions": [
    {
      "question": "Énoncé de la question ?",
      "option_a": "Première réponse",
      "option_b": "Deuxième réponse",
      "option_c": "Troisième (optionnel)",
      "option_d": "Quatrième (optionnel)",
      "correct_answer": "a",
      "time_limit": 20
    }
  ]
}

Règles :
- correct_answer doit être "a", "b", "c" ou "d"
- time_limit entre 10 et 60 (secondes)
- Au moins 2 options remplies par question (a et b obligatoires)
- Questions claires, niveau collège/lycée`;
}

function extractJson(raw: string): unknown {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const body = fenced ? fenced[1].trim() : trimmed;
  const start = body.indexOf("{");
  const end = body.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Pas de JSON trouvé.");
  return JSON.parse(body.slice(start, end + 1));
}

export function parseChatGptQuizResponse(raw: string): AiQuestionDraft[] {
  const data = extractJson(raw) as { questions?: unknown[] };
  if (!Array.isArray(data.questions) || data.questions.length === 0) {
    throw new Error("Le JSON doit contenir un tableau \"questions\".");
  }

  const out: AiQuestionDraft[] = [];
  for (const item of data.questions) {
    const q = item as Record<string, unknown>;
    const question = String(q.question ?? "").trim();
    const option_a = String(q.option_a ?? "").trim();
    const option_b = String(q.option_b ?? "").trim();
    if (!question || !option_a || !option_b) continue;

    let correct = String(q.correct_answer ?? "a").toLowerCase();
    if (!["a", "b", "c", "d"].includes(correct)) correct = "a";

    let time = Number(q.time_limit ?? 20);
    if (!Number.isFinite(time) || time < 10) time = 20;
    if (time > 60) time = 60;

    out.push({
      question,
      option_a,
      option_b,
      option_c: String(q.option_c ?? "").trim(),
      option_d: String(q.option_d ?? "").trim(),
      correct_answer: correct as Choice,
      time_limit: time,
    });
  }

  if (out.length === 0) {
    throw new Error("Aucune question valide dans la réponse.");
  }
  return out;
}
