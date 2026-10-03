import { describe, it, expect, afterEach } from "vitest";
import { suggestOtc } from "../src/medication/otc.js";

const clean = { onset: "kal", duration: "1 din", severity: "4", associated: "nahi", history: "nahi", allergies: "nahi", medicines: "nahi" };
const base = { complaint: "bukhar hai", answers: clean, profile: { sex: "male" as const, ageYears: 30 }, lang: "en" as const, risk: "routine" as const };
afterEach(() => { delete process.env.OTC_PREVIEW; delete process.env.OTC_SHOW_DRAFT_DOSES; });
const first = (r: any) => r.items[0];

const verifiedEntry: any = { generic: "testdrug", brands: [], otc: true, match: "fever|bukhar", usesKey: "u_fever_pain", howKeys: [], warnKey: "w_paracetamol",
  allergyKeys: [], interactsWith: [], minAgeYears: null, pregnancyWarning: true, contraindications: [], source: "Test source v1", reviewed: true, reviewedAt: "2026-01-01",
  brandsByCountry: { PK: [], IN: [] }, chemicalName: "t",
  dosing: { adult: { amount: "X mg", minGapHours: 6, max24h: "Y mg", maxDays: 3 }, source: "Test source v1", reviewed: true, reviewedBy: "Pharmacist A", reviewedAt: "2026-01-01" } };

describe("dose display", () => {
  it("no doses by default, even in preview", () => { process.env.OTC_PREVIEW = "true"; expect(first(suggestOtc(base)).doseLines).toEqual([]); });
  it("draft doses only with the demo flag, labelled DRAFT", () => {
    process.env.OTC_PREVIEW = "true"; process.env.OTC_SHOW_DRAFT_DOSES = "true";
    const it0 = first(suggestOtc(base));
    expect(it0.doseLines[0]).toMatch(/DRAFT/);
    expect(it0.doseLines.join(" ")).toContain("500 mg");
    expect(it0.doseDraft).toBe(true);
  });
  it("under 18 never gets a dose", () => {
    process.env.OTC_PREVIEW = "true"; process.env.OTC_SHOW_DRAFT_DOSES = "true";
    expect(first(suggestOtc({ ...base, profile: { sex: "male", ageYears: 16 } })).doseLines ?? []).toEqual([]);
  });
  it("pharmacist-verified dose shows without a draft banner", () => {
    const r: any = suggestOtc({ ...base, entries: [verifiedEntry] });
    expect(r.status).toBe("suggestions");
    expect(r.items[0].doseLines[0]).not.toMatch(/DRAFT/);
    expect(r.items[0].doseLines.join(" ")).toContain("X mg");
    expect(r.items[0].doseDraft).toBe(false);
  });
  it("dose flagged reviewed but with no reviewer stays hidden", () => {
    const e = { ...verifiedEntry, dosing: { ...verifiedEntry.dosing, reviewedBy: undefined } };
    expect(first(suggestOtc({ ...base, entries: [e] })).doseLines).toEqual([]);
  });
  it("urgent risk never shows a dose", () => {
    process.env.OTC_PREVIEW = "true"; process.env.OTC_SHOW_DRAFT_DOSES = "true";
    expect(suggestOtc({ ...base, risk: "urgent" }).items).toHaveLength(0);
  });
  it("works in Hindi", () => {
    process.env.OTC_PREVIEW = "true"; process.env.OTC_SHOW_DRAFT_DOSES = "true";
    expect(first(suggestOtc({ ...base, lang: "hi", complaint: "बुखार है" })).doseLines.join(" ")).toMatch(/[\u0900-\u097F]/);
  });
});
