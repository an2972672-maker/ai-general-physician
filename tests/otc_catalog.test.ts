import { describe, it, expect, afterEach } from "vitest";
import kb from "../knowledge/medications.json" with { type: "json" };
import { MSG, LANGS, type Key } from "../src/i18n/messages.js";
import { suggestOtc } from "../src/medication/otc.js";

const clean = { onset: "kal", duration: "1 din", severity: "4", associated: "nahi", history: "nahi", allergies: "nahi", medicines: "nahi" };
const run = (complaint: string, lang: any = "en") => suggestOtc({ complaint, answers: clean, profile: { sex: "male", ageYears: 30 }, lang, risk: "routine" }) as any;
afterEach(() => { delete process.env.OTC_PREVIEW; });

describe("OTC catalogue integrity", () => {
  it("every phrase id used exists in all 4 languages", () => {
    for (const e of kb.entries as any[]) for (const k of [e.usesKey, e.warnKey, ...e.howKeys])
      for (const l of LANGS) expect((MSG as any)[k]?.[l]?.length, `${e.generic}:${k}:${l}`).toBeGreaterThan(3);
  });
  it("every entry names a generic, chemical name and Pakistan + India brand lists", () => {
    for (const e of kb.entries as any[]) { expect(e.generic && e.chemicalName).toBeTruthy(); expect(Array.isArray(e.brandsByCountry.PK)).toBe(true); expect(Array.isArray(e.brandsByCountry.IN)).toBe(true); }
  });
  it("no usage text contains a numeric dose", () => {
    for (const [k, v] of Object.entries(MSG)) if (/^(h_|w_|u_)/.test(k)) for (const l of LANGS) expect((v as any)[l], k).not.toMatch(/\d+\s?(mg|ml|mcg|g\b)/i);
  });
  it("nothing is marked reviewed yet", () => { for (const e of kb.entries as any[]) expect(e.reviewed).toBe(false); });
});
describe("common ailments -> basic OTC with how-to", () => {
  const cases: [string, string][] = [["badan dard hai", "ibuprofen"], ["acidity hai", "sodium alginate antacid"], ["dast lage hain", "oral rehydration salts (ORS)"],
    ["blocked nose hai", "xylometazoline"], ["ringworm hai", "clotrimazole"], ["chhota wound hai", "povidone-iodine"], ["kamar dard hai", "diclofenac gel"]];
  for (const [complaint, generic] of cases) it(`${complaint} -> ${generic}`, () => {
    process.env.OTC_PREVIEW = "true";
    const r = run(complaint);
    const item = r.items.find((i: any) => i.generic === generic);
    expect(item, JSON.stringify(r.items.map((i: any) => i.generic))).toBeTruthy();
    expect(item.how.length).toBeGreaterThan(0);
    expect(item.warning.length).toBeGreaterThan(0);
  });
  it("shows Pakistan and India brands", () => { process.env.OTC_PREVIEW = "true"; const i = run("badan dard hai").items[0]; expect(i.brandsPK).toContain("Brufen"); expect(i.brandsIN).toContain("Ibugesic"); });
  it("works in Urdu script and Hindi", () => {
    process.env.OTC_PREVIEW = "true";
    expect(run("مجھے بخار ہے", "ur").items[0].how[0]).toMatch(/[\u0600-\u06FF]/);
    expect(run("मुझे बुखार है", "hi").items[0].how[0]).toMatch(/[\u0900-\u097F]/);
  });
  it("includes the 'stop and get help' note", () => { process.env.OTC_PREVIEW = "true"; expect(run("fever").stopNote.length).toBeGreaterThan(10); });
  it("default mode still hides unreviewed data", () => expect(run("fever").items).toHaveLength(0));
});
