// Over-the-counter suggestions (Spec §7-8). Facts come ONLY from the versioned knowledge file and
// pass the deterministic safety gate. The LLM is not involved. No doses are ever produced.
import kb from "../../knowledge/medications.json" with { type: "json" };
import { checkMedication, UNREVIEWED, type MedEntry } from "./engine.js";
import { t, type Key, type Lang } from "../i18n/messages.js";
import type { Profile } from "../consultation/questions.js";

const NO = /^\s*(no|n|nope|nah|na|nh|nhi|nai|nahi|nahin|nahi hai|nahin hai|none|nil|nothing|koi nahi|koi nahi hai|نہیں|نہی|نہ|کوئی نہیں|نہیں ہے|नहीं|नही|नहीं है|कोई नहीं)\s*[.!۔]*\s*$/i;
export const isNo = (s?: string) => s !== undefined && NO.test(s.trim()); // missing answer is NOT treated as "no"
const tokens = (s: string) => s.split(/[,;،]|\s(?:and|aur|और)\s/i).map(x => x.trim().toLowerCase()).filter(Boolean);

export interface OtcCtx { complaint: string; answers: Partial<Record<string, string>>; profile: Profile; lang: Lang; risk: "urgent" | "routine"; entries?: MedEntry[] }
export type OtcStatus = "suggestions" | "preview" | "see_pharmacist" | "see_doctor" | "none";

export function suggestOtc(c: OtcCtx) {
  const L = c.lang, a = c.answers;
  const out = { status: "none" as OtcStatus, title: t(L, "otc_title"), items: [] as unknown[], notes: [] as string[], doseNote: t(L, "otc_dose"), stopNote: t(L, "otc_stop"),
    labels: { generic: t(L, "otc_generic"), pk: t(L, "otc_pk"), india: t(L, "otc_in"), uses: t(L, "otc_uses"), warning: t(L, "otc_warning"), how: t(L, "otc_how"), pending: t(L, "otc_pending_brands") } };
  if (c.risk !== "routine") return { ...out, status: "see_doctor" as OtcStatus, notes: [t(L, "otc_see_doctor")] };

  const text = `${c.complaint} ${a.associated ?? ""}`;
  const entries = (c.entries ?? (kb.entries as unknown as MedEntry[])).filter(e => e.otc && e.match && new RegExp(e.match, "i").test(text));
  if (!entries.length) return out;

  // Anything beyond a clean history goes to a pharmacist (conservative starter rule, clinicians may relax it).
  const unclear = !isNo(a.history) || !isNo(a.medicines) || !isNo(a.allergies);
  const preg = (c.profile.ageYears ?? 99) < 12 ? false : a.pregnancy === undefined ? (c.profile.sex === "female" ? undefined : c.profile.sex === "male" ? false : undefined) : !isNo(a.pregnancy);
  const preview = process.env.OTC_PREVIEW === "true";
  let referToPharmacist = false, previewUsed = false;

  for (const e of entries) {
    const r = checkMedication({ generic: e.generic, ageYears: c.profile.ageYears, pregnant: preg,
      allergies: isNo(a.allergies) ? [] : tokens(a.allergies ?? ""), currentMeds: [], conditions: [] }, [e]);
    const reasons = r.reasons.filter(x => x !== UNREVIEWED), unreviewed = r.reasons.includes(UNREVIEWED);
    if (r.decision === "blocked" || reasons.length || unclear || (unreviewed && !preview)) { referToPharmacist = true; continue; }
    // Children (<12): only with a pharmacist-VERIFIED weight-based rule, a known weight, and an allowed age.
    const dr = e.dosing, ch = dr?.child, ageY = c.profile.ageYears, kg = c.profile.weightKg;
    const drOk = dr?.reviewed === true && !!dr.reviewedBy && !!dr.source && !dr.source.startsWith("TODO");
    const isChild = ageY !== undefined && ageY < 12;
    const childOk = isChild && !!ch && drOk && kg !== undefined && ageY! * 12 >= ch!.minAgeMonths;
    if (isChild && !childOk) { referToPharmacist = true; continue; }
    if (unreviewed) previewUsed = true;
    const b = e.brandsByCountry ?? { PK: [], IN: [] };
    // Doses: adults (18+) only, and only if a pharmacist verified them (reviewedBy + real source) or demo flag is on.
    const rule = e.dosing, ad = rule?.adult, lines: string[] = [];
    const verified = rule?.reviewed === true && !!rule.reviewedBy && !!rule.source && !rule.source.startsWith("TODO");
    const doseDraft = !verified;
    if (childOk && ch) {
      const r1 = (x: number) => Math.round(x * 10) / 10;
      lines.push(t(L, "dose_child", { kg: kg!, mg: Math.min(r1(ch.mgPerKgPerDose * kg!), ch.maxMgPerDose ?? Infinity) }),
        t(L, "dose_gap", { h: ch.minGapHours }),
        t(L, "dose_max", { max: `${Math.min(r1(ch.maxMgPerKgPer24h * kg!), ch.maxMgPer24h ?? Infinity)} mg` }));
      if (ch.maxDays) lines.push(t(L, "dose_days", { d: ch.maxDays }));
      lines.push(t(L, "dose_child_form"));
    }
    if (ad && (c.profile.ageYears ?? 0) >= 18 && (verified || process.env.OTC_SHOW_DRAFT_DOSES === "true")) {
      if (doseDraft) lines.push(t(L, "dose_draft"));
      lines.push(t(L, "dose_adult", { amount: ad.amount }));
      if (ad.minGapHours) lines.push(t(L, "dose_gap", { h: ad.minGapHours }));
      if (ad.max24h) lines.push(t(L, "dose_max", { max: ad.max24h }));
      if (ad.maxDays) lines.push(t(L, "dose_days", { d: ad.maxDays }));
    }
    out.items.push({ generic: e.generic, chemicalName: e.chemicalName, brandsPK: [...b.PK].sort(), brandsIN: [...b.IN].sort(),
      uses: e.usesKey ? t(L, e.usesKey as Key) : "", how: (e.howKeys ?? []).map(k => t(L, k as Key)), warning: e.warnKey ? t(L, e.warnKey as Key) : "", doseLines: lines, doseDraft: lines.length > 0 && doseDraft });
  }
  if (out.items.some((i: any) => i.doseLines.length)) out.doseNote = t(L, "otc_dose_verify");
  if (previewUsed) out.notes.push(t(L, "otc_preview"));
  if (referToPharmacist) out.notes.push(t(L, "otc_see_pharmacist"));
  out.status = out.items.length ? (previewUsed ? "preview" : "suggestions") : "see_pharmacist";
  return out;
}
