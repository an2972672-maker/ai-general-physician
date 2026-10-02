import { randomUUID } from "node:crypto";
import { triage, emergencyMessage } from "../safety/triage.js";
import { audit } from "../audit/audit.js";
import { QUESTIONS, nextSlot, buildAssessment, type Profile, type Session, type Slot } from "./questions.js";

const sessions = new Map<string, Session>(); // TODO Phase 3: persist in PostgreSQL (consultations/symptoms tables)
const emergency = (userId: string, matched: { id: string; label: string }[]) => {
  audit("consult.emergency", userId, matched.map(m => m.id).join(","));
  return { status: "emergency" as const, redFlags: matched, reply: emergencyMessage(process.env.EMERGENCY_NUMBER ?? "1122") };
};
const ask = (s: Session) => {
  const slot = nextSlot(s);
  if (slot) { s.asked.push(slot); return { status: "question" as const, sessionId: s.id, slot, question: QUESTIONS[slot] }; }
  const flags = triage(Object.values(s.answers).join(" ") + " " + s.complaint).matched.map(m => m.label);
  audit("consult.assessment", s.userId);
  sessions.delete(s.id);
  return { status: "assessment" as const, assessment: buildAssessment(s, flags), disclaimer: "Yeh sirf maloomat hain, doctor ka mashwara ya prescription nahi." };
};

export function startConsult(userId: string, complaint: string, profile: Profile = {}) {
  const t = triage(complaint);                       // red flags FIRST
  if (t.risk === "emergency") return emergency(userId, t.matched);
  const s: Session = { id: randomUUID(), userId, complaint, profile, answers: {}, asked: [] };
  sessions.set(s.id, s);
  return ask(s);
}

export function answerConsult(userId: string, sessionId: string, text: string) {
  const s = sessions.get(sessionId);
  if (!s || s.userId !== userId) return { status: "error" as const, error: "Session nahi mila." };
  const t = triage(text);                            // every answer is screened too
  if (t.risk === "emergency") { sessions.delete(s.id); return emergency(userId, t.matched); }
  const slot = s.asked[s.asked.length - 1] as Slot;
  s.answers[slot] = text.slice(0, 500);
  return ask(s);
}
