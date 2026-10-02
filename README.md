# AI General Physician Assistant (MVP scaffold)
Built from `AI_General_Physician_Master_Project_Spec`. Education/decision-support only — NOT a doctor, NOT a prescriber.

## Implemented
- Deterministic red-flag triage (runs before LLM) — `src/safety/triage.ts`
- Medication-safety gate (allergy/interaction/age/pregnancy/unreviewed-source → escalate/block; LLM never gives doses) — `src/medication/engine.ts`
- Provider-agnostic LLM layer + response validator — `src/ai/provider.ts`
- Audit log (no message content), PostgreSQL schema, API, simple chat UI, unit tests

## Not yet built (see spec §20)
Real auth, DB persistence, adaptive questioning, RAG, report analyzer, follow-up scheduler, admin dashboard, mobile app, Docker.
`knowledge/medications.json` is a PLACEHOLDER: clinicians/pharmacists must populate + sign off every record.

## Run
```
npm install && cp .env.example .env && npm test && npm run dev
```
Open http://localhost:3000 (API needs `x-user-id` header until real auth is added).

## Push to GitHub
```
git init && git add . && git commit -m "Initial scaffold"
git branch -M main && git remote add origin https://github.com/<you>/ai-general-physician.git && git push -u origin main
```
