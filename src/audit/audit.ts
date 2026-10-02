// Audit log for safety-critical events. Never logs message content (Spec §14).
import { pool } from "../db/pool.js";
export interface AuditEvent { action: string; actor: string; safetyEvent?: string; ts: string }
export const auditLog: AuditEvent[] = []; // in-memory copy (capped); durable copy goes to audit_logs
export const audit = (action: string, actor: string, safetyEvent?: string) => {
  auditLog.push({ action, actor, safetyEvent, ts: new Date().toISOString() });
  if (auditLog.length > 1000) auditLog.shift();
  pool?.query("INSERT INTO audit_logs(action, actor, safety_event) VALUES($1,$2,$3)", [action, actor, safetyEvent ?? null])
    .catch(() => console.error("audit persist failed"));
};
