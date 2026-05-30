"use client";

import { useState } from "react";
import {
  buildChatGptPrompt,
  parseChatGptQuizResponse,
  type AiQuestionDraft,
} from "@/lib/ai-prompt";

export function AiQuizImport({
  onImport,
}: {
  onImport: (questions: AiQuestionDraft[]) => void;
}) {
  const [topic, setTopic] = useState("");
  const [paste, setPaste] = useState("");
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function copyPrompt() {
    const text = buildChatGptPrompt(topic, 5);
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function importPaste() {
    setError(null);
    try {
      const questions = parseChatGptQuizResponse(paste);
      onImport(questions);
      setPaste("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Réponse invalide.");
    }
  }

  return (
    <div className="card mt-6 border-2 border-brand/20 bg-brand/5">
      <h2 className="font-display text-xl font-bold text-ink">
        Générer avec ChatGPT (simple)
      </h2>
      <p className="mt-2 text-sm text-ink/60">
        1) Décris ton sujet → 2) Copie le prompt dans ChatGPT → 3) Colle la
        réponse JSON ici.
      </p>

      <label className="mt-4 block text-sm font-semibold text-ink/55">
        De quoi parle ton quiz ?
      </label>
      <input
        className="field mt-1"
        placeholder="Ex : Les fractions en 6ème"
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
      />

      <button type="button" onClick={copyPrompt} className="btn-outline mt-3 w-full">
        {copied ? "✓ Prompt copié !" : "📋 Copier le prompt pour ChatGPT"}
      </button>

      <label className="mt-4 block text-sm font-semibold text-ink/55">
        Colle ici la réponse de ChatGPT (JSON)
      </label>
      <textarea
        className="field mt-1 min-h-[140px] font-mono text-sm"
        placeholder='{"questions": [ ... ]}'
        value={paste}
        onChange={(e) => setPaste(e.target.value)}
      />

      {error && (
        <p className="mt-2 rounded-xl border border-brand/30 bg-brand-light px-4 py-2 text-sm text-brand-deep">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={importPaste}
        disabled={!paste.trim()}
        className="btn-brand mt-3 w-full"
      >
        Importer les questions
      </button>
    </div>
  );
}
