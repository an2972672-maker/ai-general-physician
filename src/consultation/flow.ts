import { randomUUID } from "node:crypto";
import { triage } from "../safety/triage.js";
import { audit } from "../audit/audit.js";
import { t, type Lang } from "../i18n/messages.js";
import { questionText, nextSlot, buildAssessment, isFever, normalizeDigits, type Profile, type Session, type Slot } from "./questions.js";

const sessions = new Map<string, Session>(); // TODO: persist in-flight sessions in PostgreSQL
const emergency = (userId: string, matched: { id: string; label: string }[], lang: Lang) => {
  audit("consult.emergency", userId, matched.map(m => m.id).join(","));
  return { status: "emergency" as const, redFlags: matched, reply: t(lang, "emergency", { n: process.env.EMERGENCY_NUMBER ?? "1122" }) };
};
const ask = (s: Session) => {
  const slot = nextSlot(s);
  if (slot) { s.asked.push(slot); return { status: "question" as const, sessionId: s.id, slot, question: questionText(s.lang, slot) }; }
  const flags = triage(Object.values(s.answers).join(" ") + " " + s.complaint).matched.map(m => m.label);
  audit("consult.assessment", s.userId);
  sessions.delete(s.id);
  return { status: "assessment" as const, assessment: buildAssessment(s, flags), disclaimer: t(s.lang, "disclaimer") };
};

const TRIVIAL = /^\s*(ok|okay|k|thanks|thank you|thx|hi|hello|hmm|yes|no|salam|assalam o alaikum|shukriya|shukria|theek hai|thik hai|theek|thik|ji|haan|han|nahi|nh|شکریہ|ٹھیک ہے|جی|ہاں|سلام|धन्यवाद|शुक्रिया|ठीक है|हाँ|हां|नमस्ते)[\s.!۔?]*$/i;
export function startConsult(userId: string, complaint: string, profile: Profile = {}, lang: Lang = "ur-roman") {
  if (TRIVIAL.test(complaint)) return { status: "chat" as const, reply: t(lang, "ack") }; // "ok", "thanks", "hello" are not a new complaint
  const tr = triage(complaint);                      // red flags FIRST
  if (tr.risk === "emergency") return emergency(userId, tr.matched, lang);
  if (isFever(complaint) && profile.ageYears !== undefined && profile.ageYears * 12 < 3) { // baby under 3 months with fever (placeholder rule for clinician review)
    audit("consult.infant_fever", userId, "infant_fever");
    return { status: "urgent_stop" as const, reply: t(lang, "infant_fever") };
  }
  const s: Session = { id: randomUUID(), userId, lang, complaint, profile, answers: {}, asked: [] };
  sessions.set(s.id, s);
  return ask(s);
}

export function answerConsult(userId: string, sessionId: string, text: string) {
  const s = sessions.get(sessionId);
  if (!s || s.userId !== userId) return { status: "error" as const, error: "Session not found." };
  const tr = triage(text);                           // every answer is screened too
  if (tr.risk === "emergency") { sessions.delete(s.id); return emergency(userId, tr.matched, s.lang); }
  const slot = s.asked[s.asked.length - 1] as Slot;
  s.answers[slot] = text.slice(0, 500);
  if (slot === "weight") { const w = parseFloat(normalizeDigits(text)); if (w >= 1 && w <= 150) s.profile.weightKg = w; }
  return ask(s);
}
