import express, { type Request, type Response } from "express";
import { consult } from "./consult.js";
import { startConsult, answerConsult } from "./consultation/flow.js";
import { checkMedication } from "./medication/engine.js";
import { hashPassword, verifyPassword, signToken, verifyToken } from "./auth/auth.js";
import { pool } from "./db/pool.js";
import { audit } from "./audit/audit.js";
import { followupRouter, saveConsultationWithFollowup } from "./followup/routes.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));
app.get("/health", (_q, r) => void r.json({ ok: true }));

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const noDb = (r: Response) => void r.status(503).json({ error: "Database configured nahi hai." });

// TODO: add rate limiting on /auth/* (brute-force protection) before public launch.
app.post("/auth/register", async (q, r) => {
  if (!pool) return noDb(r);
  const { email, password, name } = q.body ?? {};
  if (!EMAIL.test(String(email)) || String(password ?? "").length < 8) return void r.status(400).json({ error: "Sahi email aur kam az kam 8 harf ka password dein." });
  try {
    const { rows } = await pool.query("INSERT INTO users(name, email, password_hash) VALUES($1,$2,$3) RETURNING id",
      [String(name ?? "").slice(0, 100), String(email).toLowerCase(), hashPassword(String(password))]);
    audit("auth.register", rows[0].id);
    r.json({ token: signToken(rows[0].id) });
  } catch { r.status(409).json({ error: "Account nahi ban saka." }); }
});
app.post("/auth/login", async (q, r) => {
  if (!pool) return noDb(r);
  const { rows } = await pool.query("SELECT id, password_hash FROM users WHERE email=$1", [String(q.body?.email ?? "").toLowerCase()]);
  const u = rows[0];
  if (!u || !verifyPassword(String(q.body?.password ?? ""), u.password_hash)) { audit("auth.login_failed", "anonymous"); return void r.status(401).json({ error: "Email ya password ghalat hai." }); }
  audit("auth.login", u.id);
  r.json({ token: signToken(u.id) });
});

app.use("/api", (q, r, next) => {
  const id = verifyToken(q.header("authorization")?.replace(/^Bearer /, "") ?? "");
  if (!id) return void r.status(401).json({ error: "login required" });
  r.locals.userId = id; next();
});
const uid = (r: Response) => r.locals.userId as string;

app.use("/api/followups", followupRouter);
app.get("/api/me", (_q, r) => void r.json({ id: uid(r) }));
app.post("/api/consult", async (q: Request, r) => {
  const msg = String(q.body?.message ?? "").slice(0, 4000);
  if (!msg) return void r.status(400).json({ error: "message required" });
  r.json(await consult(uid(r), msg));
});
app.post("/api/consult/start", (q, r) => {
  const msg = String(q.body?.message ?? "").slice(0, 2000);
  if (!msg) return void r.status(400).json({ error: "message required" });
  const sex = q.body?.sex === "male" || q.body?.sex === "female" ? q.body.sex : undefined;
  r.json(startConsult(uid(r), msg, { sex, ageYears: Number(q.body?.ageYears) || undefined }));
});
app.post("/api/consult/answer", async (q, r) => {
  const out = answerConsult(uid(r), String(q.body?.sessionId ?? ""), String(q.body?.answer ?? ""));
  if (out.status === "assessment") await saveConsultationWithFollowup(uid(r), out.assessment);
  r.json(out);
});
app.get("/api/consultations", async (_q, r) => {
  if (!pool) return noDb(r);
  const { rows } = await pool.query("SELECT id, risk_level, assessment, created_at FROM consultations WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50", [uid(r)]);
  r.json(rows);
});
app.post("/api/medication/check", (q, r) => {
  const b = q.body ?? {};
  r.json(checkMedication({ generic: String(b.generic ?? ""), ageYears: b.ageYears, pregnant: b.pregnant,
    allergies: b.allergies ?? [], currentMeds: b.currentMeds ?? [], conditions: b.conditions ?? [] }));
});
app.listen(Number(process.env.PORT ?? 3000), () => console.log("API running"));
