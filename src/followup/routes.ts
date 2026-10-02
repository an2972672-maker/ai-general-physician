import { Router } from "express";
import { pool } from "../db/pool.js";
import { audit } from "../audit/audit.js";
import { OUTCOMES, FOLLOWUP_QUESTION, dueHours, evaluateFollowUp, type Outcome } from "./followup.js";

// Saves a finished consultation and schedules its follow-up (followups table).
export async function saveConsultationWithFollowup(userId: string, assessment: { reportedFacts: unknown; risk: string }) {
  if (!pool) return;
  try {
    const { rows } = await pool.query(
      "INSERT INTO consultations(user_id, structured_symptoms, risk_level, assessment) VALUES($1,$2,$3,$4) RETURNING id",
      [userId, assessment.reportedFacts, assessment.risk, assessment]);
    await pool.query("INSERT INTO followups(consultation_id, due_at, questions) VALUES($1, now() + ($2 || ' hours')::interval, $3)",
      [rows[0].id, String(dueHours(assessment.risk)), JSON.stringify([FOLLOWUP_QUESTION])]);
  } catch { console.error("consultation/followup save failed"); }
}

export const followupRouter = Router(); // mounted AFTER auth middleware: res.locals.userId is set
const uid = (r: { locals: Record<string, unknown> }) => r.locals.userId as string;

followupRouter.get("/due", async (_q, r) => {
  if (!pool) return void r.status(503).json({ error: "Database configured nahi hai." });
  const { rows } = await pool.query(
    `SELECT f.id, f.due_at, f.questions, c.created_at AS consultation_at FROM followups f
     JOIN consultations c ON c.id = f.consultation_id
     WHERE c.user_id=$1 AND f.response IS NULL AND f.due_at <= now() ORDER BY f.due_at`, [uid(r)]);
  r.json(rows);
});

followupRouter.post("/:id/respond", async (q, r) => {
  if (!pool) return void r.status(503).json({ error: "Database configured nahi hai." });
  const id = Number(q.params.id), outcome = q.body?.outcome as Outcome, note = String(q.body?.note ?? "").slice(0, 500);
  if (!Number.isInteger(id) || !OUTCOMES.includes(outcome)) return void r.status(400).json({ error: "Sahi jawab chunein." });
  try {
    const own = await pool.query(
      `SELECT f.id FROM followups f JOIN consultations c ON c.id=f.consultation_id
       WHERE f.id=$1 AND c.user_id=$2 AND f.response IS NULL`, [id, uid(r)]);
    if (!own.rows[0]) return void r.status(404).json({ error: "Follow-up nahi mila." });
    const ev = evaluateFollowUp(outcome, note);
    await pool.query("UPDATE followups SET response=$1, escalation_status=$2 WHERE id=$3", [JSON.stringify({ outcome, note }), ev.escalation, id]);
    audit("followup.response", uid(r), ev.escalation !== "none" ? `followup_${ev.escalation}` : undefined);
    r.json(ev);
  } catch { r.status(500).json({ error: "Masla aaya." }); }
});
