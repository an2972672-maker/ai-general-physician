// Deterministic red-flag screening. Runs BEFORE any LLM call (Spec §6).
// Rules are data; clinical team must review/extend before real deployment.
export type Risk = "emergency" | "urgent" | "routine";
export interface Rule { id: string; risk: Risk; label: string; patterns: RegExp[] }

export const RULES: Rule[] = [
  { id: "chest_pain", risk: "emergency", label: "Severe chest pain",
    patterns: [/chest (pain|pressure|tightness)/i, /seene? (me|mein|main) (shadeed |bohat )?dard/i] },
  { id: "breathing", risk: "emergency", label: "Severe breathing difficulty",
    patterns: [/(can'?t|cannot|unable to) breathe/i, /severe (shortness of breath|breathing)/i, /saans (nahi|lene mein (shadeed )?mushkil)/i] },
  { id: "stroke", risk: "emergency", label: "Stroke-like symptoms",
    patterns: [/face droop/i, /slurred speech/i, /sudden (weakness|numbness) (on|in) (one|my) (side|arm|leg)/i, /zubaan (larkhara|lar khara)/i] },
  { id: "unconscious", risk: "emergency", label: "Unconsciousness",
    patterns: [/unconscious|passed out|not responding|behosh/i] },
  { id: "seizure", risk: "emergency", label: "Seizure",
    patterns: [/seizure|convulsion|fits?\b|daura/i] },
  { id: "bleeding", risk: "emergency", label: "Severe bleeding",
    patterns: [/(severe|heavy|uncontrol\w*) bleeding/i, /khoon (nahi ruk|bohat beh)/i] },
  { id: "anaphylaxis", risk: "emergency", label: "Severe allergic reaction",
    patterns: [/anaphyla/i, /(throat|tongue|lips?) (swelling|swollen)/i] },
  { id: "self_harm", risk: "emergency", label: "Risk of self-harm",
    patterns: [/(kill|hurt) myself|suicid|khudkushi/i] },
  { id: "high_fever_infant", risk: "urgent", label: "Fever in infant",
    patterns: [/(newborn|infant|baby).*(fever|bukhar)/i] },
];

export interface TriageResult { risk: Risk; matched: { id: string; label: string }[] }

export function triage(text: string): TriageResult {
  const matched = RULES.filter(r => r.patterns.some(p => p.test(text))).map(r => ({ id: r.id, label: r.label, risk: r.risk }));
  const risk: Risk = matched.some(m => m.risk === "emergency") ? "emergency" : matched.length ? "urgent" : "routine";
  return { risk, matched: matched.map(({ id, label }) => ({ id, label })) };
}

export const emergencyMessage = (num: string) =>
  `Yeh symptoms emergency ho sakte hain. Fori tor par emergency number (${num}) par call karein ya nazdeeki hospital jayein. Khud ilaaj ki koshish na karein.`;
