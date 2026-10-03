import { describe, it, expect } from "vitest";
import { suggestOtc } from "../src/medication/otc.js";

const clean = { feverDays: "1 din", feverPattern: "raat", feverMax: "38 C", associated: "nahi", history: "nahi", allergies: "nahi", medicines: "nahi" };
// TEST-ONLY numbers (not real medical data) to prove the calculator and its gates work.
const entry = (child: any, over: any = {}): any => ({ generic: "testdrug", brands: [], otc: true, match: "fever|bukhar", usesKey: "u_fever_pain", howKeys: [], warnKey: "w_paracetamol",
  allergyKeys: [], interactsWith: [], minAgeMonths: null, minAgeYears: null, pregnancyWarning: true, contraindications: [], source: "Test v1", reviewed: true, reviewedAt: "2026-01-01",
  brandsByCountry: { PK: [], IN: [] }, chemicalName: "t",
  dosing: { child, source: "Test v1", reviewed: true, reviewedBy: "Pharmacist A", reviewedAt: "2026-01-01", ...over } });
const rule = { minAgeMonths: 6, mgPerKgPerDose: 10, minGapHours: 6, maxMgPerKgPer24h: 40, maxMgPerDose: 500, maxDays: 3 };
const run = (profile: any, e: any) => suggestOtc({ complaint: "bukhar", answers: clean, profile, lang: "en", risk: "routine", entries: [e] }) as any;

describe("child dose calculator", () => {
  it("calculates from weight with a verified rule", () => {
    const r = run({ ageYears: 4, weightKg: 20 }, entry(rule));
    expect(r.status).toBe("suggestions");
    expect(r.items[0].doseLines.join(" ")).toContain("200 mg");
    expect(r.items[0].doseLines.join(" ")).toContain("800 mg");
    expect(r.items[0].doseLines.join(" ")).toMatch(/pharmacist/i);
  });
  it("applies the per-dose cap", () => expect(run({ ageYears: 11, weightKg: 80 }, entry(rule)).items[0].doseLines.join(" ")).toContain("500 mg per dose"));
  it("no weight -> pharmacist", () => expect(run({ ageYears: 4 }, entry(rule)).items).toHaveLength(0));
  it("younger than the allowed age -> pharmacist", () => expect(run({ ageYears: 0.25, weightKg: 5 }, entry(rule)).items).toHaveLength(0));
  it("child with no child rule -> pharmacist", () => expect(run({ ageYears: 4, weightKg: 20 }, entry(undefined)).items).toHaveLength(0));
  it("unverified child rule -> pharmacist", () => expect(run({ ageYears: 4, weightKg: 20 }, entry(rule, { reviewed: false })).items).toHaveLength(0));
  it("real data file has no child doses yet, so real children always go to a pharmacist", () => {
    const r = suggestOtc({ complaint: "bukhar", answers: clean, profile: { ageYears: 4, weightKg: 18 }, lang: "en", risk: "routine" });
    expect(r.items).toHaveLength(0);
  });
});
