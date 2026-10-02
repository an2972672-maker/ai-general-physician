import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword, signToken, verifyToken } from "../src/auth/auth.js";

describe("passwords", () => {
  it("verifies correct and rejects wrong", () => {
    const h = hashPassword("correct-horse");
    expect(verifyPassword("correct-horse", h)).toBe(true);
    expect(verifyPassword("wrong", h)).toBe(false);
  });
  it("never stores plaintext", () => expect(hashPassword("secret123")).not.toContain("secret123"));
  it("rejects malformed hash", () => expect(verifyPassword("x", "garbage")).toBe(false));
});
describe("tokens", () => {
  it("round-trips", () => expect(verifyToken(signToken("user-1"))).toBe("user-1"));
  it("rejects tampering", () => {
    const [h, , s] = signToken("user-1").split(".");
    const forged = Buffer.from(JSON.stringify({ sub: "admin", exp: 9999999999 })).toString("base64url");
    expect(verifyToken(`${h}.${forged}.${s}`)).toBeNull();
  });
  it("rejects expired", () => expect(verifyToken(signToken("u", 10, 1000), 2000)).toBeNull());
  it("rejects garbage", () => expect(verifyToken("abc")).toBeNull());
});
