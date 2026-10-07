// Deterministic medication-safety gate (Spec §7). The LLM never produces doses.
import kb from "../../knowledge/medications.js";

                                                                                                                                      
                                                                                                                                                                                
                                                                                               
                                                                                                              
                                                                                     
                                                                                        
                                                                                                         
                                                          
                                                                                                                                                       
                                                                            
                                                                                                                                          

export const UNREVIEWED = "Record not clinically reviewed / no traceable source.";
const n = (s        ) => s.trim().toLowerCase();

export function checkMedication(i          , entries             = kb.entries              )            {
  const kbVersion = kb.version;
  const e = entries.find(x => n(x.generic) === n(i.generic) || x.brands.some(b => n(b) === n(i.generic)));
  if (!e) return { decision: "escalate_to_clinician", reasons: ["Medicine knowledge base mein nahi hai."], kbVersion };
  const reasons           = [];
  if (i.allergies.some(a => e.allergyKeys.map(n).includes(n(a)))) return { decision: "blocked", reasons: ["Documented allergy."], kbVersion };
  if (i.currentMeds.some(m => e.interactsWith.map(n).includes(n(m)))) reasons.push("Possible interaction with current medicine.");
  if (e.minAgeYears !== null && (i.ageYears ?? 0) < e.minAgeYears) reasons.push("Age restriction.");
  if (i.ageYears === undefined || (i.ageYears < 12 && !(e.dosing?.child && e.dosing.reviewed === true && !!e.dosing.reviewedBy))) reasons.push("Pediatric/unknown age.");
  if (i.pregnant || (e.pregnancyWarning && i.pregnant === undefined)) reasons.push("Pregnancy status requires clinician review.");
  if (e.contraindications.some(c => (i.conditions ?? []).map(n).includes(n(c)))) reasons.push("Contraindicated condition.");
  if (!e.reviewed || !e.source || e.source.startsWith("TODO")) reasons.push(UNREVIEWED);
  if (reasons.length) return { decision: "escalate_to_clinician", reasons, kbVersion };
  const { dosing, ...safe } = e;
  return { decision: "info_allowed", reasons: [], entry: safe, dosing: dosing?.text, kbVersion };
}
