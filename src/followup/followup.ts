// Follow-up engine (Spec §11). Deterministic; re-runs red-flag screening on the patient's reply.
import { triage } from "../safety/triage.js";
import { t, type Lang } from "../i18n/messages.js";
export type Outcome = "improved" | "same" | "worse" | "new_symptoms";
export const OUTCOMES: Outcome[] = ["improved", "same", "worse", "new_symptoms"];
export const FOLLOWUP_QUESTION = "followup_status_check"; // stored key; UI shows it in the user's language

// PLACEHOLDER intervals (product config, NOT clinical advice). Clinicians must set real values per condition.
export function dueHours(risk: string): number {
  const v = Number(risk === "urgent" ? process.env.FOLLOWUP_HOURS_URGENT : process.env.FOLLOWUP_HOURS_ROUTINE);
  return Number.isFinite(v) && v > 0 ? v : risk === "urgent" ? 6 : 24;
}

export type Escalation = "none" | "urgent" | "emergency";
export function evaluateFollowUp(outcome: Outcome, note = "", lang: Lang = "ur-roman"): { escalation: Escalation; reply: string } {
  const tr = triage(note);
  if (tr.risk === "emergency") return { escalation: "emergency", reply: t(lang, "emergency", { n: process.env.EMERGENCY_NUMBER ?? "1122" }) };
  if (outcome === "worse" || outcome === "new_symptoms" || tr.risk === "urgent") return { escalation: "urgent", reply: t(lang, "fu_urgent") };
  return { escalation: "none", reply: t(lang, outcome === "same" ? "fu_same" : "fu_ok") };
}
