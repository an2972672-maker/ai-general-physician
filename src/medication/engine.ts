// Deterministic medication-safety gate (Spec §7). The LLM never produces doses.
import kb from "../../knowledge/medications.json" with { type: "json" };

export interface MedEntry { generic: string; brands: string[]; allergyKeys: string[]; interactsWith: string[];
  minAgeYears: number | null; pregnancyWarning: boolean; contraindications: string[];
  dosing: null | { text: string }; source: string; reviewed: boolean; reviewedAt: string | null }
export interface MedInput { generic: string; ageYears?: number; pregnant?: boolean; allergies: string[]; currentMeds: string[]; conditions?: string[] }
export type Decision = "info_allowed" | "escalate_to_clinician" | "blocked";
export interface MedResult { decision: Decision; reasons: string[]; entry?: Omit<MedEntry, "dosing">; dosing?: string; kbVersion: string }

const n = (s: string) => s.trim().toLowerCase();

export function checkMedication(i: MedInput, entries: MedEntry[] = kb.entries as MedEntry[]): MedResult {
  const kbVersion = kb.version;
  const e = entries.find(x => n(x.generic) === n(i.generic) || x.brands.some(b => n(b) === n(i.generic)));
  if (!e) return { decision: "escalate_to_clinician", reasons: ["Medicine knowledge base mein nahi hai."], kbVersion };
  const reasons: string[] = [];
  if (i.allergies.some(a => e.allergyKeys.map(n).includes(n(a)))) return { decision: "blocked", reasons: ["Documented allergy."], kbVersion };
  if (i.currentMeds.some(m => e.interactsWith.map(n).includes(n(m)))) reasons.push("Possible interaction with current medicine.");
  if (e.minAgeYears !== null && (i.ageYears ?? 0) < e.minAgeYears) reasons.push("Age restriction.");
  if (i.ageYears === undefined || i.ageYears < 12) reasons.push("Pediatric/unknown age.");
  if (i.pregnant || (e.pregnancyWarning && i.pregnant === undefined)) reasons.push("Pregnancy status requires clinician review.");
  if (e.contraindications.some(c => (i.conditions ?? []).map(n).includes(n(c)))) reasons.push("Contraindicated condition.");
  if (!e.reviewed || !e.source || e.source.startsWith("TODO")) reasons.push("Record not clinically reviewed / no traceable source.");
  if (reasons.length) return { decision: "escalate_to_clinician", reasons, kbVersion };
  const { dosing, ...safe } = e;
  return { decision: "info_allowed", reasons: [], entry: safe, dosing: dosing?.text, kbVersion };
}
