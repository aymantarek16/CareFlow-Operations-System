/**
 * Bilingual medical specialty labels.
 *
 * The database stores specialty names as free-form strings (historically the
 * English form: "Cardiology", "Pediatrics", …). To help users who scan in
 * Arabic OR English we render both side by side in every dropdown / chip
 * via `formatSpecialtyBilingual`.
 *
 * The value submitted back to Supabase is always the original raw string —
 * only the display label changes. That keeps the existing data intact.
 */

// Canonical Arabic translation for each English specialty name. Add more as
// the clinic adds departments; the helper below falls back gracefully for
// anything not in this map.
const EN_TO_AR: Record<string, string> = {
  "cardiology":        "طب القلب",
  "pediatrics":        "طب الأطفال",
  "dermatology":       "الجلدية",
  "orthopedics":       "العظام",
  "neurology":         "المخ والأعصاب",
  "general medicine":  "الطب العام",
  "ophthalmology":     "العيون",
  "ent":               "الأنف والأذن والحنجرة",
  "dentistry":         "الأسنان",
  "gynecology":        "النساء والتوليد",
  "urology":           "المسالك البولية",
  "oncology":          "الأورام",
  "psychiatry":        "الطب النفسي",
  "radiology":         "الأشعة",
  "surgery":           "الجراحة العامة",
  "internal medicine": "الباطنة",
  "endocrinology":     "الغدد الصماء",
  "gastroenterology":  "الجهاز الهضمي",
  "nephrology":        "الكلى",
  "pulmonology":       "الصدر",
  "rheumatology":      "الروماتيزم",
  "hematology":        "أمراض الدم",
  "emergency":         "الطوارئ",
  "anesthesiology":    "التخدير",
  "physiotherapy":     "العلاج الطبيعي",
  "nutrition":         "التغذية",
  "general":           "عام",
};

// Inverse map — lowercased Arabic name -> canonical English name.
const AR_TO_EN: Record<string, string> = Object.fromEntries(
  Object.entries(EN_TO_AR).map(([en, ar]) => [ar.trim(), toTitle(en)]),
);

function toTitle(s: string) {
  return s
    .split(/\s+/)
    .map((w) => (w === "ent" ? "ENT" : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ");
}

function containsArabic(s: string) {
  return /[\u0600-\u06FF]/.test(s);
}

/**
 * Return "Arabic / English" for known specialties; otherwise the raw value
 * unchanged. Handles:
 *   "Cardiology"        -> "طب القلب / Cardiology"
 *   "cardiology"        -> "طب القلب / Cardiology"
 *   "طب القلب"          -> "طب القلب / Cardiology"
 *   "Something Custom"  -> "Something Custom"
 */
export function formatSpecialtyBilingual(raw?: string | null): string {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return "";

  if (containsArabic(trimmed)) {
    const en = AR_TO_EN[trimmed];
    return en ? `${trimmed} / ${en}` : trimmed;
  }

  const ar = EN_TO_AR[trimmed.toLowerCase()];
  return ar ? `${ar} / ${toTitle(trimmed)}` : trimmed;
}
