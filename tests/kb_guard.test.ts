import { describe, it, expect } from "vitest";
import kb from "../knowledge/medications.json" with { type: "json" };

describe("knowledge base guardrails", () => {
  const entries = kb.entries as any[];
  it("a reviewed entry must have a real source and date", () => {
    for (const e of entries) if (e.reviewed) { expect(e.source && !e.source.startsWith("TODO"), e.generic).toBeTruthy(); expect(e.reviewedAt, e.generic).toBeTruthy(); }
  });
  it("a reviewed dose must have source, reviewer and date", () => {
    for (const e of entries) if (e.dosing?.reviewed) for (const k of ["source", "reviewedBy", "reviewedAt"]) expect(e.dosing[k] && !String(e.dosing[k]).startsWith("TODO"), `${e.generic}.${k}`).toBeTruthy();
  });
  it("adult dose is complete; child dose only if verified", () => {
    for (const e of entries) if (e.dosing) {
      if (e.dosing.child) expect(e.dosing.reviewed, e.generic + ": a child dose may only be stored once a pharmacist verified it").toBe(true);
      expect(e.dosing.adult?.amount, e.generic).toBeTruthy();
      expect(typeof e.dosing.adult?.minGapHours, e.generic).toBe("number");
      expect(e.dosing.adult?.max24h, e.generic).toBeTruthy();
    }
  });
});
