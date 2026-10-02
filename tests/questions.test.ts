import { describe, it, expect } from "vitest";
import { startConsult, answerConsult } from "../src/consultation/flow.js";
import { applicableSlots } from "../src/consultation/questions.js";

describe("adaptive questions", () => {
  it("skips location for fever", () => expect(applicableSlots({ complaint: "mujhe bukhar hai", profile: {} })).not.toContain("location"));
  it("asks location for pain", () => expect(applicableSlots({ complaint: "pet dard", profile: {} })).toContain("location"));
  it("asks pregnancy only for females of child-bearing age", () => {
    expect(applicableSlots({ complaint: "pet dard", profile: { sex: "female", ageYears: 28 } })).toContain("pregnancy");
    expect(applicableSlots({ complaint: "pet dard", profile: { sex: "male", ageYears: 28 } })).not.toContain("pregnancy");
  });
  it("stops on emergency in the first message", () => expect(startConsult("u", "severe chest pain").status).toBe("emergency"));
  it("stops on emergency hidden in an answer", () => {
    const r = startConsult("u", "headache") as { sessionId: string };
    expect(answerConsult("u", r.sessionId, "ab saans nahi aa raha").status).toBe("emergency");
  });
  it("finishes with assessment, never a diagnosis", () => {
    let r: any = startConsult("u", "headache");
    for (let i = 0; i < 12 && r.status === "question"; i++) r = answerConsult("u", r.sessionId, "nahi");
    expect(r.status).toBe("assessment");
    expect(r.assessment.possibleExplanations).toEqual([]);
  });
  it("rejects another user's session", () => {
    const r = startConsult("a", "headache") as { sessionId: string };
    expect(answerConsult("b", r.sessionId, "x").status).toBe("error");
  });
});
