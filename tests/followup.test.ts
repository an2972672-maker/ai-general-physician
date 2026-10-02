import { describe, it, expect } from "vitest";
import { evaluateFollowUp, dueHours } from "../src/followup/followup.js";

describe("follow-up evaluation", () => {
  it("improved -> no escalation", () => expect(evaluateFollowUp("improved").escalation).toBe("none"));
  it("same -> no escalation", () => expect(evaluateFollowUp("same").escalation).toBe("none"));
  it("worse -> urgent", () => expect(evaluateFollowUp("worse").escalation).toBe("urgent"));
  it("new symptoms -> urgent", () => expect(evaluateFollowUp("new_symptoms").escalation).toBe("urgent"));
  it("red flag in note overrides 'improved'", () => expect(evaluateFollowUp("improved", "ab chest pain hai").escalation).toBe("emergency"));
});
describe("due time", () => {
  it("urgent is sooner than routine", () => expect(dueHours("urgent")).toBeLessThan(dueHours("routine")));
});
