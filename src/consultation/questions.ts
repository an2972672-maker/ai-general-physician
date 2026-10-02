// Adaptive structured questioning (Spec §5). Deterministic: which question comes next is
// decided by rules, not by the LLM. No diagnosis is produced here.
export type Slot = "onset" | "duration" | "severity" | "location" | "associated" | "pregnancy" | "history" | "allergies" | "medicines";
export interface Profile { sex?: "male" | "female"; ageYears?: number }
export interface Session { id: string; userId: string; complaint: string; profile: Profile; answers: Partial<Record<Slot, string>>; asked: Slot[] }

export const QUESTIONS: Record<Slot, string> = {
  onset: "Yeh takleef kab shuru hui?",
  duration: "Ab tak kitne arse se hai, aur kya lagataar hai ya aati jaati hai?",
  severity: "Takleef kitni shadeed hai? 1 (halki) se 10 (sab se zyada) mein number batayein.",
  location: "Takleef jism ke kis hisse mein hai?",
  associated: "Is ke saath aur koi symptoms hain? (jaise bukhar, ulti, chakkar, khansi). Na hon to 'nahi' likhein.",
  pregnancy: "Kya aap hamla (pregnant) hain ya ho sakti hain?",
  history: "Kya aap ko pehle se koi bimari hai (jaise sugar, BP, dil, gurde, jigar)? Na ho to 'nahi'.",
  allergies: "Kisi dawai ya cheez se allergy hai? Na ho to 'nahi'.",
  medicines: "Abhi koi dawai istemal kar rahe hain? Na ho to 'nahi'.",
};

const SYSTEMIC = /fever|bukhar|cough|khansi|thakan|fatigue|weakness|kamzori|cold|zukam/i;

// Which slots apply to this session (adaptive rules).
export function applicableSlots(s: Pick<Session, "complaint" | "profile">): Slot[] {
  const slots: Slot[] = ["onset", "duration", "severity"];
  if (!SYSTEMIC.test(s.complaint)) slots.push("location");        // location irrelevant for systemic complaints
  slots.push("associated");
  if (s.profile.sex === "female" && (s.profile.ageYears ?? 25) >= 12 && (s.profile.ageYears ?? 25) <= 55) slots.push("pregnancy");
  slots.push("history", "allergies", "medicines");
  return slots;
}

export function nextSlot(s: Session): Slot | null {
  return applicableSlots(s).find(sl => s.answers[sl] === undefined) ?? null;
}

export function buildAssessment(s: Session, redFlagLabels: string[]) {
  const sev = parseInt(s.answers.severity ?? "", 10);
  const risk = redFlagLabels.length || sev >= 9 ? "urgent" : "routine";
  return {
    reportedFacts: { complaint: s.complaint, ...s.answers },
    possibleExplanations: [] as string[], // TODO Phase 6: filled from RAG with citations, never from LLM alone
    uncertainty: "Yeh diagnosis nahi hai. Sirf aap ki batayi hui maloomat ka khulasa hai, aur doctor ke muaaynay ke baghair asal wajah tay nahi ho sakti.",
    risk,
    recommendedNextStep: risk === "urgent"
      ? "Jald az jald kisi doctor se rujoo karein."
      : "Agar takleef barhe, theek na ho, ya naye symptoms aayein to doctor se rujoo karein.",
    warningSigns: ["Seene mein shadeed dard", "Saans lene mein shadeed mushkil", "Behoshi ya daura", "Bohat zyada khoon bahna"],
    followUp: "Aap se baad mein poochha jayega ke takleef behtar hui, waisi hi rahi, ya barh gayi.",
  };
}
