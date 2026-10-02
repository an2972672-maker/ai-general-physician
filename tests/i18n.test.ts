import { describe, it, expect } from "vitest";
import { MSG, LANGS, t, normalizeLang } from "../src/i18n/messages.js";
import { triage } from "../src/safety/triage.js";
import { suggest } from "../src/referral/referral.js";
import { parseSeverity } from "../src/consultation/questions.js";
import { evaluateFollowUp } from "../src/followup/followup.js";

describe("translations", () => {
  it("every message exists in all 4 languages", () => {
    for (const [k, v] of Object.entries(MSG)) for (const l of LANGS) expect(v[l]?.trim().length, `${k}/${l}`).toBeGreaterThan(3);
  });
  it("emergency text includes the number in every language", () => { for (const l of LANGS) expect(t(l, "emergency", { n: "1122" })).toContain("1122"); });
  it("falls back to Roman Urdu for unknown language", () => expect(normalizeLang("xx")).toBe("ur-roman"));
});
describe("multilingual red flags", () => {
  it("Urdu script chest pain", () => expect(triage("مجھے سینے میں شدید درد ہے").risk).toBe("emergency"));
  it("Hindi chest pain", () => expect(triage("मुझे सीने में तेज दर्द है").risk).toBe("emergency"));
  it("Hindi breathing", () => expect(triage("सांस नहीं आ रही").risk).toBe("emergency"));
  it("Urdu breathing", () => expect(triage("سانس نہیں آ رہی").risk).toBe("emergency"));
  it("follow-up note in Hindi escalates", () => expect(evaluateFollowUp("improved", "अब सीने में दर्द है", "hi").escalation).toBe("emergency"));
});
describe("severity digits", () => {
  it("parses Latin, Urdu and Hindi digits", () => { expect(parseSeverity("9")).toBe(9); expect(parseSeverity("۹")).toBe(9); expect(parseSeverity("९")).toBe(9); });
});
describe("referrals and tests", () => {
  it("stomach complaint -> gastroenterology in each language", () => {
    for (const l of LANGS) expect(suggest("pet dard", l).referral.specialties.length).toBeGreaterThan(0);
    expect(suggest("मुझे पेट में दर्द है", "hi").referral.specialties.length).toBeGreaterThan(0);
  });
  it("fever suggests CBC as likely and is flagged unreviewed", () => {
    const r = suggest("bukhar", "en");
    expect(r.tests.likely).toContain("Complete blood count (CBC)");
    expect(r.reviewNote).not.toBeNull();
  });
  it("no match -> empty suggestions", () => expect(suggest("xyz", "en").referral.specialties).toEqual([]));
});
