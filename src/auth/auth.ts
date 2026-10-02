// Auth using only Node's built-in crypto (scrypt password hashing + HS256 token). Spec §14.
import { scryptSync, randomBytes, timingSafeEqual, createHmac } from "node:crypto";

const secret = (): string => {
  const s = process.env.JWT_SECRET;
  if (!s || s === "change-me") {
    if (process.env.NODE_ENV === "production") throw new Error("JWT_SECRET must be set in production");
    return "dev-only-secret";
  }
  return s;
};

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  return `${salt.toString("hex")}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, stored: string): boolean {
  const [s, h] = stored.split(":");
  if (!s || !h) return false;
  const a = scryptSync(password, Buffer.from(s, "hex"), 64), b = Buffer.from(h, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

const b64 = (x: string) => Buffer.from(x).toString("base64url");
const mac = (data: string) => createHmac("sha256", secret()).update(data).digest();

export function signToken(sub: string, ttlSec = 12 * 3600, nowSec = Date.now() / 1000): string {
  const data = `${b64(JSON.stringify({ alg: "HS256", typ: "JWT" }))}.${b64(JSON.stringify({ sub, exp: Math.floor(nowSec + ttlSec) }))}`;
  return `${data}.${mac(data).toString("base64url")}`;
}
export function verifyToken(token: string, nowSec = Date.now() / 1000): string | null {
  const p = token.split(".");
  if (p.length !== 3) return null;
  const want = mac(`${p[0]}.${p[1]}`), got = Buffer.from(p[2], "base64url");
  if (got.length !== want.length || !timingSafeEqual(got, want)) return null;
  try {
    const { sub, exp } = JSON.parse(Buffer.from(p[1], "base64url").toString());
    return typeof sub === "string" && exp > nowSec ? sub : null;
  } catch { return null; }
}
