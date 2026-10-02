// Specialist + test suggestions (Spec §10). Comes from a versioned knowledge file, never from the LLM.
import data from "../../knowledge/referrals.json" with { type: "json" };
import { t, type Lang } from "../i18n/messages.js";
type Names = Record<string, string>;
const hit = (re: string, text: string) => new RegExp(re, "i").test(text);

export function suggest(text: string, lang: Lang) {
  const specialties = data.specialties.filter(s => hit(s.match, text)).map(s => (s.names as Names)[lang]);
  const seen = new Map<string, { tier: string; name: string }>();
  for (const x of data.tests) if (hit(x.match, text)) for (const i of x.items) {
    const k = (i.names as Names).en, prev = seen.get(k);
    if (!prev || (prev.tier === "possible" && i.tier === "likely")) seen.set(k, { tier: i.tier, name: (i.names as Names)[lang] });
  }
  const all = [...seen.values()], pick = (tier: string) => all.filter(a => a.tier === tier).map(a => a.name);
  return {
    referral: { title: t(lang, "ref_title"), specialties },
    tests: { note: t(lang, "tests_note"), likelyTitle: t(lang, "tests_likely"), likely: pick("likely"), possibleTitle: t(lang, "tests_possible"), possible: pick("possible") },
    reviewNote: data.reviewed ? null : t(lang, "review_note"),
  };
}
