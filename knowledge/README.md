# Medicine knowledge base — how to add or verify medicines (for pharmacists / clinicians)

`medications.json` is the ONLY source the app uses for medicine facts. The AI model never writes them.
Every medicine needs: generic + chemical name, `brandsByCountry` (PK, IN), `match` (symptom keywords in
English/Roman Urdu/Urdu/Hindi), `usesKey` / `howKeys` / `warnKey` (phrase ids in `src/i18n/messages.ts`, all 4 languages),
and `allergyKeys`.

## Verifying (what flips something from draft to live)
- Entry: set `reviewed: true`, a real `source` (not "TODO..."), and `reviewedAt`.
- Dose: set `dosing.reviewed: true`, `dosing.source`, `dosing.reviewedBy`, `dosing.reviewedAt`.
  Doses are ADULT-only (18+). Child/weight-based dosing is not supported in this version.
- `npm test` enforces these rules (tests/kb_guard.test.ts).

## Switches (environment variables)
- `OTC_PREVIEW=true`  show not-yet-reviewed medicines (demo only, always with a PREVIEW banner)
- `OTC_SHOW_DRAFT_DOSES=true`  show DRAFT adult doses (demo only, always with a DRAFT banner). Never enable in production.

## Child (weight-based) doses
Add `dosing.child` ONLY after a pharmacist verified it against an official source (label / national or WHO guideline):
`{ "minAgeMonths": n, "mgPerKgPerDose": n, "minGapHours": n, "maxMgPerKgPer24h": n, "maxMgPerDose": n, "maxMgPer24h": n, "maxDays": n }`
The app then calculates the dose from the child's weight, applies the caps, and tells the parent to ask a pharmacist for the ml/tablet
amount (liquid strengths differ by brand). Without a verified child rule, children always get "ask a pharmacist/doctor".
`FEVER_DOCTOR_DAYS` (default 3) is a placeholder threshold; clinicians should set it.
