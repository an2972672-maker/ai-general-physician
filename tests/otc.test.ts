import { describe, it, expect, afterEach } from "vitest";
import { suggestOtc, isNo } from "../src/medication/otc.js";

const clean = { onset: "kal", duration: "1 din", severity: "4", associated: "nahi", history: "nahi", allergies: "nahi", medicines: "nahi" };
const ctx = (over: any = {}) => ({ complaint: "mujhe bukhar hai", answers: clean, profile: { sex: "male" as const, ageYears: 30 }, lang: "en" as const, risk: "routine" as const, ...over });
afterEach(() => { delete process.env.OTC_PREVIEW; });

describe("OTC suggestions", () => {
  it("default: unreviewed data is NOT shown, goes to pharmacist", () => expect(suggestOtc(ctx()).status).toBe("see_pharmacist"));
  it("preview mode shows generic + Pakistan + India brands, flagged as unreviewed", () => {
    process.env.OTC_PREVIEW = "true";
    const r: any = suggestOtc(ctx());
    expect(r.status).toBe("preview");
    expect(r.items[0].generic).toBe("paracetamol");
    expect(r.items[0].brandsPK).toContain("Panadol");
    expect(r.items[0].brandsIN).toContain("Crocin");
    expect(r.notes.length).toBeGreaterThan(0);
  });
  it("never outputs a dose", () => { process.env.OTC_PREVIEW = "true"; expect(JSON.stringify(suggestOtc(ctx()))).not.toMatch(/\d+\s?(mg|ml|mcg)/i); });
  it("allergy to the drug removes it", () => { process.env.OTC_PREVIEW = "true"; expect(suggestOtc(ctx({ answers: { ...clean, allergies: "paracetamol" } })).items).toHaveLength(0); });
  it("any existing condition -> pharmacist", () => { process.env.OTC_PREVIEW = "true"; expect(suggestOtc(ctx({ answers: { ...clean, history: "diabetes" } })).status).toBe("see_pharmacist"); });
  it("any current medicine -> pharmacist", () => { process.env.OTC_PREVIEW = "true"; expect(suggestOtc(ctx({ answers: { ...clean, medicines: "metformin" } })).status).toBe("see_pharmacist"); });
  it("pregnancy -> pharmacist", () => { process.env.OTC_PREVIEW = "true"; expect(suggestOtc(ctx({ profile: { sex: "female", ageYears: 28 }, answers: { ...clean, pregnancy: "yes" } })).status).toBe("see_pharmacist"); });
  it("unknown age -> pharmacist", () => { process.env.OTC_PREVIEW = "true"; expect(suggestOtc(ctx({ profile: { sex: "male" } })).status).toBe("see_pharmacist"); });
  it("child -> pharmacist", () => { process.env.OTC_PREVIEW = "true"; expect(suggestOtc(ctx({ profile: { sex: "male", ageYears: 6 } })).status).toBe("see_pharmacist"); });
  it("urgent risk -> see doctor, no medicines", () => { process.env.OTC_PREVIEW = "true"; const r = suggestOtc(ctx({ risk: "urgent" })); expect(r.status).toBe("see_doctor"); expect(r.items).toHaveLength(0); });
  it("works in Hindi and Urdu answers", () => { expect(isNo("नहीं")).toBe(true); expect(isNo("نہیں")).toBe(true); expect(isNo("diabetes")).toBe(false); expect(isNo(undefined)).toBe(false); });
  it("cetirizine Pakistan brand list is flagged as pending (empty)", () => {
    process.env.OTC_PREVIEW = "true";
    const r: any = suggestOtc(ctx({ complaint: "naak beh rahi hai aur chheenk" }));
    expect(r.items[0].generic).toBe("cetirizine");
    expect(r.items[0].brandsPK).toEqual([]);
  });
});
