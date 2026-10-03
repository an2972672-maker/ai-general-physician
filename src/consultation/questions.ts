// Adaptive structured questioning (Spec §5), multilingual. Deterministic; no diagnosis produced here.
import { t, type Key, type Lang } from "../i18n/messages.js";
import { suggest } from "../referral/referral.js";
import { suggestOtc } from "../medication/otc.js";
export type Slot = "onset" | "duration" | "severity" | "location" | "associated" | "pregnancy" | "history" | "allergies" | "medicines"
  | "weight" | "feverDays" | "feverPattern" | "feverMax" | "childDrinking" | "childUrine" | "childActivity" | "painType" | "painTrigger";
export interface Profile { sex?: "male" | "female"; ageYears?: number; weightKg?: number }
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

export const isFever = (c: string) => /fever|bukhar|بخار|बुखार/i.test(c);
const PAIN = /pain|dard|ache|درد|दर्द/i;
export function applicableSlots(s: Pick<Session, "complaint" | "profile">): Slot[] {
  const age = s.profile.ageYears, child = age !== undefined && age < 12, slots: Slot[] = [];
  if (isFever(s.complaint)) slots.push("feverDays", "feverPattern", "feverMax");
  else {
    slots.push("onset", "duration", "severity");
    if (!SYSTEMIC.test(s.complaint)) slots.push("location");
    if (PAIN.test(s.complaint)) slots.push("painType", "painTrigger");
  }
  slots.push("associated");
  if (child) { if (s.profile.weightKg === undefined) slots.push("weight"); slots.push("childDrinking", "childUrine", "childActivity"); }
  const a2 = age ?? 25;
  if (s.profile.sex === "female" && a2 >= 12 && a2 <= 55) slots.push("pregnancy");
  slots.push("history", "allergies", "medicines");
  return slots;
}

// Deterministic "see a doctor" rules from the history. PLACEHOLDER thresholds: clinicians must review/tune.
const BAD_DRINK = /less|not at all|refus|kam|bilkul nahi|nahi pi|کم|بالکل نہیں|कम|बिल्कुल नहीं|नहीं पी/i;
const BAD_URINE = /less|none|not at all|kam|nahi|کم|نہیں|कम|नहीं/i;
const BAD_ACTIVITY = /sleepy|drowsy|lethargic|floppy|sust|so raha|سست|سو رہا|सुस्त|सो रहा/i;
export function urgentReasons(s: Pick<Session, "profile" | "answers">): string[] {
  const a = s.answers, r: string[] = [];
  const days = parseInt(normalizeDigits(a.feverDays ?? ""), 10), lim = Number(process.env.FEVER_DOCTOR_DAYS) > 0 ? Number(process.env.FEVER_DOCTOR_DAYS) : 3;
  if (days >= lim) r.push("fever_days");
  let tmax = parseFloat(normalizeDigits(a.feverMax ?? ""));
  if (tmax > 45) tmax = ((tmax - 32) * 5) / 9; // looks like Fahrenheit
  if (tmax >= 40) r.push("fever_high");
  if (s.profile.ageYears !== undefined && s.profile.ageYears < 12) {
    if (BAD_DRINK.test(a.childDrinking ?? "")) r.push("child_drinking");
    if (BAD_URINE.test(a.childUrine ?? "")) r.push("child_urine");
    if (BAD_ACTIVITY.test(a.childActivity ?? "")) r.push("child_activity");
  }
  return r;
}
export const nextSlot = (s: Session): Slot | null => applicableSlots(s).find(sl => s.answers[sl] === undefined) ?? null;

export function buildAssessment(s: Session, redFlagLabels: string[]) {
  const L = s.lang, reasons = urgentReasons(s), risk = redFlagLabels.length || reasons.length || parseSeverity(s.answers.severity ?? "") >= 9 ? "urgent" : "routine";
  const sg = suggest([s.complaint, ...Object.values(s.answers)].join(" "), L);
  return {
    reportedFacts: { complaint: s.complaint, ...s.answers }, urgentReasons: reasons,
    possibleExplanations: [] as string[], // TODO Phase 6: from RAG with citations, never from LLM alone
    uncertainty: t(L, "uncertainty"), risk,
    recommendedNextStep: t(L, risk === "urgent" ? "next_urgent" : "next_routine"),
    warningSigns: t(L, "warning"), followUp: t(L, "followup"),
    referral: sg.referral, tests: sg.tests, reviewNote: sg.reviewNote,
    otc: suggestOtc({ complaint: s.complaint, answers: s.answers, profile: s.profile, lang: L, risk }),
  };
}
