// Adaptive structured questioning (Spec §5), multilingual. Deterministic; no diagnosis produced here.
import { t, type Key, type Lang } from "../i18n/messages.js";
import { suggest } from "../referral/referral.js";
export type Slot = "onset" | "duration" | "severity" | "location" | "associated" | "pregnancy" | "history" | "allergies" | "medicines";
export interface Profile { sex?: "male" | "female"; ageYears?: number }
export interface Session { id: string; userId: string; lang: Lang; complaint: string; profile: Profile; answers: Partial<Record<Slot, string>>; asked: Slot[] }

export const questionText = (lang: Lang, slot: Slot) => t(lang, `q_${slot}` as Key);
const SYSTEMIC = /fever|bukhar|cough|khansi|thakan|fatigue|weakness|kamzori|cold|zukam|بخار|کھانسی|تھکن|کمزوری|بुखار|बुखार|खांसी|खाँसी|थकान|कमज़ोरी/i;

export function normalizeDigits(s: string): string {
  return s.replace(/[\u0660-\u0669\u06F0-\u06F9\u0966-\u096F]/g, ch => {
    const c = ch.charCodeAt(0);
    return String(c - (c >= 0x966 && c <= 0x96f ? 0x966 : c >= 0x6f0 ? 0x6f0 : 0x660));
  });
}
export const parseSeverity = (s: string) => parseInt(normalizeDigits(s), 10);

export function applicableSlots(s: Pick<Session, "complaint" | "profile">): Slot[] {
  const slots: Slot[] = ["onset", "duration", "severity"];
  if (!SYSTEMIC.test(s.complaint)) slots.push("location");
  slots.push("associated");
  const age = s.profile.ageYears ?? 25;
  if (s.profile.sex === "female" && age >= 12 && age <= 55) slots.push("pregnancy");
  slots.push("history", "allergies", "medicines");
  return slots;
}
export const nextSlot = (s: Session): Slot | null => applicableSlots(s).find(sl => s.answers[sl] === undefined) ?? null;

export function buildAssessment(s: Session, redFlagLabels: string[]) {
  const L = s.lang, risk = redFlagLabels.length || parseSeverity(s.answers.severity ?? "") >= 9 ? "urgent" : "routine";
  const sg = suggest([s.complaint, ...Object.values(s.answers)].join(" "), L);
  return {
    reportedFacts: { complaint: s.complaint, ...s.answers },
    possibleExplanations: [] as string[], // TODO Phase 6: from RAG with citations, never from LLM alone
    uncertainty: t(L, "uncertainty"), risk,
    recommendedNextStep: t(L, risk === "urgent" ? "next_urgent" : "next_routine"),
    warningSigns: t(L, "warning"), followUp: t(L, "followup"),
    referral: sg.referral, tests: sg.tests, reviewNote: sg.reviewNote,
  };
}
