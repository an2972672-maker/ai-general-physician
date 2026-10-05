import { describe, it, expect } from "vitest";
import { isNo } from "../src/medication/otc.js";
import { startConsult, answerConsult } from "../src/consultation/flow.js";

describe("saying no", () => {
  it("accepts common short forms", () => { for (const w of ["nh", "nhi", "na", "n", "no", "nahi", "nahi hai", "None", "نہیں", "नहीं", "koi nahi"]) expect(isNo(w), w).toBe(true); });
  it("does not treat other answers as no", () => { for (const w of ["diabetes", "nahi pata", "no idea", "paracetamol", ""]) expect(isNo(w), w).toBe(false); });
});
describe("greetings and thanks", () => {
  it("do not start a new consultation", () => { for (const w of ["ok", "thanks", "shukriya", "hello", "theek hai", "ٹھیک ہے", "धन्यवाद"]) expect(startConsult("u", w).status, w).toBe("chat"); });
  it("a real complaint still starts one", () => { expect(startConsult("u", "bukhar").status).toBe("question"); expect(startConsult("u", "jisam main dard").status).toBe("question"); });
});
describe("summary shows readable questions", () => {
  it("assessment has question/answer pairs", () => {
    let r: any = startConsult("u", "jisam main dard", { sex: "male", ageYears: 30 });
    for (let i = 0; i < 20 && r.status === "question"; i++) r = answerConsult("u", r.sessionId, "nh");
    expect(r.status).toBe("assessment");
    expect(r.assessment.factsList.length).toBeGreaterThan(5);
    expect(r.assessment.factsList[0].q).toMatch(/shuru/);
  });
  it("with clean 'nh' answers an adult is no longer sent to the pharmacist for history reasons", () => {
    process.env.OTC_PREVIEW = "true";
    let r: any = startConsult("u", "mujhe bukhar hai", { sex: "male", ageYears: 30 });
    const ans: Record<string, string> = { feverDays: "1 din", feverPattern: "raat", feverMax: "38 C" };
    for (let i = 0; i < 20 && r.status === "question"; i++) r = answerConsult("u", r.sessionId, ans[r.slot] ?? "nh");
    delete process.env.OTC_PREVIEW;
    expect(r.assessment.otc.items.length).toBeGreaterThan(0);
  });
});
