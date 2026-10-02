// Audit log for safety-critical events. Never logs message content (Spec §14).
export interface AuditEvent { action: string; actor: string; safetyEvent?: string; ts: string }
export const auditLog: AuditEvent[] = []; // TODO: persist to audit_logs table
export const audit = (action: string, actor: string, safetyEvent?: string) =>
  auditLog.push({ action, actor, safetyEvent, ts: new Date().toISOString() });
