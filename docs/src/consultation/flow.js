const randomUUID = () => globalThis.crypto.randomUUID();
import { triage } from "../safety/triage.js";
import { audit } from "../audit/audit.js";
import { t,           } from "../i18n/messages.js";
import { questionText, nextSlot, buildAssessment, isFever, normalizeDigits,                                       } from "./questions.js";

const sessions = new Map                 (); // TODO: persist in-flight sessions in PostgreSQL
const emergency = (userId        , matched                                 , lang      ) => {
  audit("consult.emergency", userId, matched.map(m => m.id).join(","));
  return { status: "emergency"         , redFlags: matched, reply: t(lang, "emergency", { n: process.env.EMERGENCY_NUMBER ?? "1122" }) };
};
const ask = (s         ) => {
  const slot = nextSlot(s);
  if (slot) { s.asked.push(slot); return { status: "question"         , sessionId: s.id, slot, question: questionText(s.lang, slot) }; }
  const flags = triage(Object.values(s.answers).join(" ") + " " + s.complaint).matched.map(m => m.label);
  audit("consult.assessment", s.userId);
  sessions.delete(s.id);
  return { status: "assessment"         , assessment: buildAssessment(s, flags), disclaimer: t(s.lang, "disclaimer") };
};

const TRIVIAL = /^\s*(ok|okay|k|thanks|thank you|thx|hi|hello|hmm|yes|no|salam|assalam o alaikum|shukriya|shukria|theek hai|thik hai|theek|thik|ji|haan|han|nahi|nh|شکریہ|ٹھیک ہے|جی|ہاں|سلام|धन्यवाद|शुक्रिया|ठीक है|हाँ|हां|नमस्ते)[\s.!۔?]*$/i;
export function startConsult(userId        , complaint        , profile          = {}, lang       = "ur-roman") {
  if (TRIVIAL.test(complaint)) return { status: "chat"         , reply: t(lang, "ack") }; // "ok", "thanks", "hello" are not a new complaint
  const tr = triage(complaint);                      // red flags FIRST
  if (tr.risk === "emergency") return emergency(userId, tr.matched, lang);
  if (isFever(complaint) && profile.ageYears !== undefined && profile.ageYears * 12 < 3) { // baby under 3 months with fever (placeholder rule for clinician review)
    audit("consult.infant_fever", userId, "infant_fever");
    return { status: "urgent_stop"         , reply: t(lang, "infant_fever") };
  }
  const s          = { id: randomUUID(), userId, lang, complaint, profile, answers: {}, asked: [] };
  sessions.set(s.id, s);
  return ask(s);
}

export function answerConsult(userId        , sessionId        , text        ) {
  const s = sessions.get(sessionId);
  if (!s || s.userId !== userId) return { status: "error"         , error: "Session not found." };
  const tr = triage(text);                           // every answer is screened too
  if (tr.risk === "emergency") { sessions.delete(s.id); return emergency(userId, tr.matched, s.lang); }
  const slot = s.asked[s.asked.length - 1]        ;
  s.answers[slot] = text.slice(0, 500);
  if (slot === "weight") { const w = parseFloat(normalizeDigits(text)); if (w >= 1 && w <= 150) s.profile.weightKg = w; }
  return ask(s);
}
