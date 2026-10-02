// Follow-up engine (Spec §11). Deterministic; re-runs red-flag screening on the patient's reply.
import { triage, emergencyMessage } from "../safety/triage.js";
export type Outcome = "improved" | "same" | "worse" | "new_symptoms";
export const OUTCOMES: Outcome[] = ["improved", "same", "worse", "new_symptoms"];
export const FOLLOWUP_QUESTION = "Pichli baar ke baad aap ki takleef behtar hui, waisi hi hai, zyada ho gayi, ya naye symptoms aaye?";

// PLACEHOLDER intervals (product config, NOT clinical advice). Clinicians must set real values per condition.
export function dueHours(risk: string): number {
  const v = Number(risk === "urgent" ? process.env.FOLLOWUP_HOURS_URGENT : process.env.FOLLOWUP_HOURS_ROUTINE);
  return Number.isFinite(v) && v > 0 ? v : risk === "urgent" ? 6 : 24;
}

export type Escalation = "none" | "urgent" | "emergency";
export function evaluateFollowUp(outcome: Outcome, note = ""): { escalation: Escalation; reply: string } {
  const t = triage(note);
  if (t.risk === "emergency") return { escalation: "emergency", reply: emergencyMessage(process.env.EMERGENCY_NUMBER ?? "1122") };
  if (outcome === "worse" || outcome === "new_symptoms" || t.risk === "urgent")
    return { escalation: "urgent", reply: "Takleef barhne ya naye symptoms aane par jald az jald doctor se rujoo karein." };
  if (outcome === "same") return { escalation: "none", reply: "Takleef waisi hi hai. Agar jald behtar na ho to doctor se rujoo karein." };
  return { escalation: "none", reply: "Yeh achi baat hai. Agar takleef dobara barhe to doctor se rujoo karein." };
}
