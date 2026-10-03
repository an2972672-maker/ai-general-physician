import { describe, it, expect } from "vitest";
import { applicableSlots, urgentReasons } from "../src/consultation/questions.js";
import { startConsult, answerConsult } from "../src/consultation/flow.js";

describe("history modules", () => {
  it("fever asks days, pattern and max temperature (not generic severity)", () => {
    const s = applicableSlots({ complaint: "mujhe bukhar hai", profile: { ageYears: 30 } });
    expect(s.slice(0, 3)).toEqual(["feverDays", "feverPattern", "feverMax"]); expect(s).not.toContain("severity");
  });
  it("child asks weight (if unknown) and drinking, urine, activity", () => {
    const s = applicableSlots({ complaint: "bachche ko bukhar", profile: { ageYears: 4 } });
    for (const k of ["weight", "childDrinking", "childUrine", "childActivity"]) expect(s).toContain(k);
    expect(applicableSlots({ complaint: "bachche ko bukhar", profile: { ageYears: 4, weightKg: 16 } })).not.toContain("weight");
  });
  it("adult is not asked child questions", () => expect(applicableSlots({ complaint: "bukhar", profile: { ageYears: 30 } })).not.toContain("childDrinking"));
  it("pain asks type and triggers", () => expect(applicableSlots({ complaint: "pet dard", profile: {} })).toEqual(expect.arrayContaining(["painType", "painTrigger"])));
});
describe("urgent rules from history", () => {
  const u = (answers: any, profile: any = { ageYears: 30 }) => urgentReasons({ answers, profile });
  it("fever 3+ days", () => { expect(u({ feverDays: "4 din" })).toContain("fever_days"); expect(u({ feverDays: "۵ دن" })).toContain("fever_days"); expect(u({ feverDays: "2 din" })).toEqual([]); });
  it("very high temperature in C or F", () => { expect(u({ feverMax: "104 F" })).toContain("fever_high"); expect(u({ feverMax: "39 C" })).toEqual([]); expect(u({ feverMax: "naapa nahi" })).toEqual([]); });
  it("child not drinking / no urine / very sleepy", () => {
    const kid = { ageYears: 3 };
    expect(u({ childDrinking: "bilkul nahi" }, kid)).toContain("child_drinking");
    expect(u({ childDrinking: "बिल्कुल नहीं" }, kid)).toContain("child_drinking");
    expect(u({ childDrinking: "theek" }, kid)).toEqual([]);
    expect(u({ childUrine: "kam" }, kid)).toContain("child_urine");
    expect(u({ childActivity: "bohat sust" }, kid)).toContain("child_activity");
  });
  it("child answers are ignored for adults", () => expect(u({ childDrinking: "bilkul nahi" })).toEqual([]));
});
describe("flow", () => {
  it("baby under 3 months with fever -> urgent stop", () => expect(startConsult("u", "bachche ko bukhar hai", { ageYears: 0.1 }).status).toBe("urgent_stop"));
  it("child flow collects weight, flags a child who is not drinking, and shows no OTC without a verified child dose", () => {
    const ans: Record<string, string> = { feverDays: "1 din", feverPattern: "raat ko", feverMax: "38 C", associated: "nahi", weight: "16", childDrinking: "bilkul nahi", childUrine: "theek", childActivity: "active", history: "nahi", allergies: "nahi", medicines: "nahi" };
    let r: any = startConsult("kid", "bachche ko bukhar hai", { ageYears: 4 });
    for (let i = 0; i < 20 && r.status === "question"; i++) r = answerConsult("kid", r.sessionId, ans[r.slot] ?? "nahi");
    expect(r.status).toBe("assessment");
    expect(r.assessment.urgentReasons).toContain("child_drinking");
    expect(r.assessment.risk).toBe("urgent");
    expect(r.assessment.otc.items).toHaveLength(0);
  });
});
