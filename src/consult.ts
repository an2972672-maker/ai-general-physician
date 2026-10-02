import { triage, emergencyMessage } from "./safety/triage.js";
import { getProvider, SYSTEM_PROMPT, validateResponse } from "./ai/provider.js";
import { audit } from "./audit/audit.js";

const DISCLAIMER = "Yeh sirf maloomat hain, doctor ka mashwara ya prescription nahi.";

export async function consult(userId: string, message: string) {
  const t = triage(message);                               // 1. deterministic safety first
  if (t.risk === "emergency") {
    audit("consult.emergency", userId, t.matched.map(m => m.id).join(","));
    return { risk: t.risk, redFlags: t.matched, reply: emergencyMessage(process.env.EMERGENCY_NUMBER ?? "1122") };
  }
  const raw = await getProvider().complete(SYSTEM_PROMPT, message); // 2. LLM (untrusted output)
  const v = validateResponse(raw);                          // 3. response validator
  if (!v.ok) audit("consult.response_blocked", "system", "dose_in_llm_output");
  audit("consult.completed", userId);
  return { risk: t.risk, redFlags: t.matched, reply: v.text, disclaimer: DISCLAIMER };
}
