import type { PromptAnswer } from "../../lib/api/findTypes.ts";

export type PromptDraft = { key: string; answer: string };

export function promptDraftsFromAnswers(answers: PromptAnswer[]): PromptDraft[] {
  return [...answers]
    .sort((left, right) => left.position - right.position)
    .map((item) => ({ key: item.key, answer: item.answer }));
}
