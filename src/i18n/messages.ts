// Patient-facing text in 4 languages. NOTE: translations need review by native-speaker clinicians before launch.
export type Lang = "en" | "ur" | "ur-roman" | "hi";
export const LANGS: Lang[] = ["en", "ur", "ur-roman", "hi"];
export const normalizeLang = (x: unknown): Lang => ((LANGS as string[]).includes(String(x)) ? (x as Lang) : "ur-roman");
type M = Record<Lang, string>;
const m = (en: string, ur: string, roman: string, hi: string): M => ({ en, ur, "ur-roman": roman, hi });

export const MSG = {
  emergency: m("These symptoms may be an emergency. Call emergency services ({n}) or go to the nearest hospital now. Do not try to treat yourself.",
    "یہ علامات ایمرجنسی ہو سکتی ہیں۔ فوراً ایمرجنسی نمبر ({n}) پر کال کریں یا قریبی ہسپتال جائیں۔ خود علاج کی کوشش نہ کریں۔",
    "Yeh symptoms emergency ho sakte hain. Fori tor par emergency number ({n}) par call karein ya nazdeeki hospital jayein. Khud ilaaj ki koshish na karein.",
    "ये लक्षण आपातकालीन हो सकते हैं। तुरंत आपातकालीन नंबर ({n}) पर कॉल करें या नज़दीकी अस्पताल जाएँ। खुद इलाज करने की कोशिश न करें।"),
  disclaimer: m("This is information only, not medical advice or a prescription.", "یہ صرف معلومات ہیں، ڈاکٹر کا مشورہ یا نسخہ نہیں۔",
    "Yeh sirf maloomat hain, doctor ka mashwara ya prescription nahi.", "यह केवल जानकारी है, डॉक्टर की सलाह या पर्चा नहीं।"),
  q_onset: m("When did this problem start?", "یہ تکلیف کب شروع ہوئی؟", "Yeh takleef kab shuru hui?", "यह तकलीफ़ कब शुरू हुई?"),
  q_duration: m("How long has it lasted, and is it constant or does it come and go?", "کتنے عرصے سے ہے، اور کیا لگاتار ہے یا آتی جاتی ہے؟",
    "Ab tak kitne arse se hai, aur kya lagataar hai ya aati jaati hai?", "कितने समय से है, और क्या लगातार रहती है या आती-जाती है?"),
  q_severity: m("How severe is it? Give a number from 1 (mild) to 10 (worst).", "تکلیف کتنی شدید ہے؟ 1 (ہلکی) سے 10 (سب سے زیادہ) میں نمبر بتائیں۔",
    "Takleef kitni shadeed hai? 1 (halki) se 10 (sab se zyada) mein number batayein.", "तकलीफ़ कितनी तेज़ है? 1 (हल्की) से 10 (सबसे ज़्यादा) में नंबर बताएँ।"),
  q_location: m("Where in the body is it?", "تکلیف جسم کے کس حصے میں ہے؟", "Takleef jism ke kis hisse mein hai?", "तकलीफ़ शरीर के किस हिस्से में है?"),
  q_associated: m("Any other symptoms with it (e.g. fever, vomiting, dizziness, cough)? Write 'no' if none.",
    "اس کے ساتھ اور کوئی علامات ہیں (جیسے بخار، الٹی، چکر، کھانسی)؟ نہ ہوں تو 'نہیں' لکھیں۔",
    "Is ke saath aur koi symptoms hain? (jaise bukhar, ulti, chakkar, khansi). Na hon to 'nahi' likhein.",
    "इसके साथ और कोई लक्षण हैं (जैसे बुखार, उल्टी, चक्कर, खाँसी)? न हों तो 'नहीं' लिखें।"),
  q_pregnancy: m("Are you pregnant, or could you be?", "کیا آپ حاملہ ہیں یا ہو سکتی ہیں؟", "Kya aap hamla (pregnant) hain ya ho sakti hain?", "क्या आप गर्भवती हैं या हो सकती हैं?"),
  q_history: m("Do you have any existing conditions (e.g. diabetes, blood pressure, heart, kidney, liver)? Write 'no' if none.",
    "کیا آپ کو پہلے سے کوئی بیماری ہے (جیسے شوگر، بلڈ پریشر، دل، گردے، جگر)؟ نہ ہو تو 'نہیں' لکھیں۔",
    "Kya aap ko pehle se koi bimari hai (jaise sugar, BP, dil, gurde, jigar)? Na ho to 'nahi'.",
    "क्या आपको पहले से कोई बीमारी है (जैसे शुगर, बीपी, दिल, गुर्दे, जिगर)? न हो तो 'नहीं' लिखें।"),
  q_allergies: m("Any allergy to a medicine or anything else? Write 'no' if none.", "کسی دوا یا چیز سے الرجی ہے؟ نہ ہو تو 'نہیں' لکھیں۔",
    "Kisi dawai ya cheez se allergy hai? Na ho to 'nahi'.", "किसी दवा या चीज़ से एलर्जी है? न हो तो 'नहीं' लिखें।"),
  q_medicines: m("Are you taking any medicines right now? Write 'no' if none.", "ابھی کوئی دوا استعمال کر رہے ہیں؟ نہ ہو تو 'نہیں' لکھیں۔",
    "Abhi koi dawai istemal kar rahe hain? Na ho to 'nahi'.", "अभी कोई दवा ले रहे हैं? न हो तो 'नहीं' लिखें।"),
  uncertainty: m("This is not a diagnosis. It is a summary of what you reported; the actual cause cannot be determined without a doctor's examination.",
    "یہ تشخیص نہیں ہے۔ یہ صرف آپ کی بتائی ہوئی معلومات کا خلاصہ ہے، اور ڈاکٹر کے معائنے کے بغیر اصل وجہ طے نہیں ہو سکتی۔",
    "Yeh tashkhees nahi hai. Yeh sirf aap ki batayi hui maloomat ka khulasa hai, aur doctor ke muaaynay ke baghair asal wajah tay nahi ho sakti.",
    "यह निदान नहीं है। यह केवल आपकी बताई जानकारी का सार है, और डॉक्टर की जाँच के बिना असली कारण तय नहीं हो सकता।"),
  next_urgent: m("See a doctor as soon as possible.", "جلد از جلد کسی ڈاکٹر سے رجوع کریں۔", "Jald az jald kisi doctor se rujoo karein.", "जल्द से जल्द किसी डॉक्टर से मिलें।"),
  next_routine: m("If it gets worse, does not improve, or new symptoms appear, see a doctor.", "اگر تکلیف بڑھے، ٹھیک نہ ہو، یا نئی علامات آئیں تو ڈاکٹر سے رجوع کریں۔",
    "Agar takleef barhe, theek na ho, ya naye symptoms aayein to doctor se rujoo karein.", "अगर तकलीफ़ बढ़े, ठीक न हो, या नए लक्षण आएँ तो डॉक्टर से मिलें।"),
  warning: m("Warning signs: severe chest pain, severe difficulty breathing, fainting or seizure, heavy bleeding.",
    "خطرے کی علامات: سینے میں شدید درد، سانس لینے میں شدید مشکل، بے ہوشی یا دورہ، بہت زیادہ خون بہنا۔",
    "Khatray ki alamaat: seene mein shadeed dard, saans mein shadeed mushkil, behoshi ya daura, bohat zyada khoon bahna.",
    "ख़तरे के लक्षण: सीने में तेज़ दर्द, साँस लेने में बहुत तकलीफ़, बेहोशी या दौरा, बहुत ज़्यादा खून बहना।"),
  followup: m("You will be asked later whether it got better, stayed the same, or got worse.", "بعد میں آپ سے پوچھا جائے گا کہ تکلیف بہتر ہوئی، ویسی ہی رہی، یا بڑھ گئی۔",
    "Aap se baad mein poochha jayega ke takleef behtar hui, waisi hi rahi, ya barh gayi.", "बाद में आपसे पूछा जाएगा कि तकलीफ़ बेहतर हुई, वैसी ही रही, या बढ़ गई।"),
  fu_urgent: m("If it is getting worse or new symptoms appeared, see a doctor as soon as possible.", "تکلیف بڑھنے یا نئی علامات آنے پر جلد از جلد ڈاکٹر سے رجوع کریں۔",
    "Takleef barhne ya naye symptoms aane par jald az jald doctor se rujoo karein.", "तकलीफ़ बढ़ने या नए लक्षण आने पर जल्द से जल्द डॉक्टर से मिलें।"),
  fu_same: m("It is unchanged. If it does not improve soon, see a doctor.", "تکلیف ویسی ہی ہے۔ اگر جلد بہتر نہ ہو تو ڈاکٹر سے رجوع کریں۔",
    "Takleef waisi hi hai. Agar jald behtar na ho to doctor se rujoo karein.", "तकलीफ़ वैसी ही है। अगर जल्द बेहतर न हो तो डॉक्टर से मिलें।"),
  fu_ok: m("Good to hear. If it comes back or gets worse, see a doctor.", "یہ اچھی بات ہے۔ اگر تکلیف دوبارہ بڑھے تو ڈاکٹر سے رجوع کریں۔",
    "Yeh achi baat hai. Agar takleef dobara barhe to doctor se rujoo karein.", "यह अच्छी बात है। अगर तकलीफ़ फिर बढ़े तो डॉक्टर से मिलें।"),
  ref_title: m("Specialist you could consider (not a diagnosis):", "ممکنہ ماہر ڈاکٹر (یہ تشخیص نہیں):", "Mumkin specialist (yeh tashkhees nahi):", "संभावित विशेषज्ञ (यह निदान नहीं):"),
  tests_likely: m("Tests a doctor may consider (more likely):", "ٹیسٹ جو ڈاکٹر کروا سکتا ہے (زیادہ ممکن):", "Tests jo doctor kara sakta hai (zyada mumkin):", "जाँचें जो डॉक्टर करा सकता है (ज़्यादा संभव):"),
  tests_possible: m("Tests that are possible but less certain:", "ٹیسٹ جو ممکن ہیں مگر کم یقینی:", "Tests jo mumkin hain lekin kam yaqeeni:", "जाँचें जो संभव हैं पर कम निश्चित:"),
  tests_note: m("Only a doctor decides which tests are needed; some may not be necessary.", "کون سے ٹیسٹ ضروری ہیں یہ صرف ڈاکٹر طے کرے گا؛ کچھ کی ضرورت نہ بھی ہو۔",
    "Kaun se tests zaroori hain yeh sirf doctor tay karega; kuch ki zaroorat na bhi ho.", "कौन-सी जाँचें ज़रूरी हैं यह सिर्फ़ डॉक्टर तय करेगा; कुछ की ज़रूरत न भी हो सकती है।"),
  review_note: m("These suggestions are a starter list and have not yet been reviewed by a clinician.", "یہ تجاویز ابھی ابتدائی ہیں اور کسی ڈاکٹر نے ان کا جائزہ نہیں لیا۔",
    "Yeh suggestions abhi shuruati hain aur kisi doctor ne review nahi kiye.", "ये सुझाव अभी शुरुआती हैं और किसी डॉक्टर ने इनकी समीक्षा नहीं की है।"),
};
export type Key = keyof typeof MSG;
export const t = (lang: Lang, key: Key, vars: Record<string, string | number> = {}): string =>
  Object.entries(vars).reduce((s, [k, v]) => s.replaceAll(`{${k}}`, String(v)), MSG[key][lang]);
