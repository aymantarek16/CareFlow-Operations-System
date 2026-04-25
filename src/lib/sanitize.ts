/**
 * Input sanitization & defensive helpers.
 *
 * The app does NOT render arbitrary HTML — React escapes everything by
 * default — so the primary concerns we guard against here are:
 *
 *   1. **Storage poisoning.** Pasted control characters, NULs, and bidi
 *      override characters can corrupt later display contexts (PDFs,
 *      CSV exports, third-party tools). We strip them on the way in.
 *   2. **DoS via huge strings.** Free-text fields without a length cap
 *      can be abused to insert megabytes of garbage. Every helper enforces
 *      a sensible upper bound.
 *   3. **Whitespace abuse.** Trim and collapse so blank "    " values
 *      don't sneak past `required` validation.
 *
 * These helpers are dependency-free and safe to call on every form submit.
 */

const CONTROL_CHARS_RE =
  // C0 control chars except \t \n \r — and the Unicode bidi override block
  // U+202A..U+202E + U+2066..U+2069 which can be abused for visual spoofing.
  // eslint-disable-next-line no-control-regex
  /[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F\u202A-\u202E\u2066-\u2069]/g;

const HTML_TAG_RE = /<\/?[a-z][^>]*>/gi;

/** Strip control / bidi-override characters from a string. */
export function stripControlChars(input: string): string {
  return input.replace(CONTROL_CHARS_RE, "");
}

/**
 * Best-effort plain-text sanitizer.
 *
 * - Trims surrounding whitespace.
 * - Collapses internal whitespace runs to a single space (for short fields).
 * - Strips HTML tags so a paste of "<script>" never reaches the DB.
 * - Strips control / bidi-override characters.
 * - Caps the length to prevent abuse.
 */
export function sanitizeText(
  input: string,
  options: { maxLength?: number; collapseWhitespace?: boolean } = {},
): string {
  if (typeof input !== "string") return "";
  const { maxLength = 500, collapseWhitespace = true } = options;
  let out = stripControlChars(input);
  out = out.replace(HTML_TAG_RE, "");
  out = out.trim();
  if (collapseWhitespace) out = out.replace(/\s+/g, " ");
  if (out.length > maxLength) out = out.slice(0, maxLength);
  return out;
}

/**
 * Sanitize multi-line free text (notes, diagnosis, medical history).
 * Keeps newlines but strips HTML / control chars / over-long strings.
 */
export function sanitizeMultiline(
  input: string,
  options: { maxLength?: number } = {},
): string {
  if (typeof input !== "string") return "";
  const { maxLength = 4000 } = options;
  let out = stripControlChars(input);
  out = out.replace(HTML_TAG_RE, "");
  out = out.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (out.length > maxLength) out = out.slice(0, maxLength);
  return out;
}

/** Normalize an email for storage and comparison. */
export function sanitizeEmail(input: string): string {
  return sanitizeText(input, { maxLength: 254, collapseWhitespace: true })
    .toLowerCase();
}

/** Keep only digits, plus, parentheses, dashes and spaces; cap at 32. */
export function sanitizePhone(input: string): string {
  if (typeof input !== "string") return "";
  return input.replace(/[^0-9+()\-\s]/g, "").trim().slice(0, 32);
}

/** Validate an ISO-8601 date string (YYYY-MM-DD) and reject implausible values. */
export function sanitizeDate(input: string): string {
  if (typeof input !== "string") return "";
  const trimmed = input.trim().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return "";
  const ts = Date.parse(trimmed);
  if (!Number.isFinite(ts)) return "";
  const year = Number(trimmed.slice(0, 4));
  if (year < 1900 || year > 2100) return "";
  return trimmed;
}

/**
 * Generic Arabic-friendly translation of opaque database / network errors
 * into messages safe to show end users. Keeps the technical detail OUT of
 * the UI.
 */
export function friendlyErrorMessage(raw: unknown): string {
  const msg = (raw instanceof Error ? raw.message : String(raw ?? "")).toLowerCase();
  if (!msg) return "حدث خطأ غير متوقع. حاول مرة أخرى.";
  if (msg.includes("network") || msg.includes("fetch")) {
    return "تعذّر الاتصال بالخادم. تحقّق من اتصالك بالإنترنت.";
  }
  if (msg.includes("invalid login") || msg.includes("credentials")) {
    return "البريد الإلكتروني أو كلمة المرور غير صحيحة.";
  }
  if (msg.includes("rate limit") || msg.includes("too many")) {
    return "محاولات كثيرة في وقت قصير. حاول مرة أخرى بعد قليل.";
  }
  if (msg.includes("already registered") || msg.includes("duplicate") || msg.includes("unique")) {
    return "هذه البيانات مستخدمة بالفعل.";
  }
  if (msg.includes("permission") || msg.includes("denied") || msg.includes("rls")) {
    return "ليست لديك الصلاحية للقيام بهذه العملية.";
  }
  if (msg.includes("not found") || msg.includes("no rows")) {
    return "العنصر المطلوب غير موجود.";
  }
  if (msg.includes("password") && msg.includes("short")) {
    return "كلمة المرور قصيرة جداً.";
  }
  return "تعذّر إتمام العملية. حاول مرة أخرى.";
}
