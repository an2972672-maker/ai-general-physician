import express from "express";
import { consult } from "./consult.js";
import { checkMedication } from "./medication/engine.js";

const app = express();
app.use(express.json({ limit: "1mb" }));
app.use(express.static("public"));
app.get("/health", (_q, r) => void r.json({ ok: true }));
// TODO(auth): replace with real JWT/session auth (Spec §14). Header is a placeholder only.
app.use("/api", (req, res, next) => (req.header("x-user-id") ? next() : void res.status(401).json({ error: "auth required" })));

app.post("/api/consult", async (q, r) => {
  const msg = String(q.body?.message ?? "").slice(0, 4000);
  if (!msg) return void r.status(400).json({ error: "message required" });
  r.json(await consult(q.header("x-user-id")!, msg));
});
app.post("/api/medication/check", (q, r) => {
  const b = q.body ?? {};
  r.json(checkMedication({ generic: String(b.generic ?? ""), ageYears: b.ageYears, pregnant: b.pregnant,
    allergies: b.allergies ?? [], currentMeds: b.currentMeds ?? [], conditions: b.conditions ?? [] }));
});
app.listen(Number(process.env.PORT ?? 3000), () => console.log("API running"));
