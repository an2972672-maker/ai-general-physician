// Specialist + test suggestions (Spec §10). Comes from a versioned knowledge file, never from the LLM.
import data from "../../knowledge/referrals.js";
import { t,           } from "../i18n/messages.js";
                                    
const hit = (re        , text        ) => new RegExp(re, "i").test(text);

export function suggest(text        , lang      ) {
  const specialties = data.specialties.filter(s => hit(s.match, text)).map(s => (s.names         )[lang]);
  const seen = new Map                                        ();
  for (const x of data.tests) if (hit(x.match, text)) for (const i of x.items) {
    const k = (i.names         ).en, prev = seen.get(k);
    if (!prev || (prev.tier === "possible" && i.tier === "likely")) seen.set(k, { tier: i.tier, name: (i.names         )[lang] });
  }
  const all = [...seen.values()], pick = (tier        ) => all.filter(a => a.tier === tier).map(a => a.name);
  return {
    referral: { title: t(lang, "ref_title"), specialties },
    tests: { note: t(lang, "tests_note"), likelyTitle: t(lang, "tests_likely"), likely: pick("likely"), possibleTitle: t(lang, "tests_possible"), possible: pick("possible") },
    reviewNote: data.reviewed ? null : t(lang, "review_note"),
  };
}
