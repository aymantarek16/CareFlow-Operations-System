/**
 * Centralised Zod schemas + validation helpers used across forms.
 *
 * Why centralise:
 *   - One source of truth for "what counts as a valid email/phone/etc."
 *   - Easier to evolve constraints (e.g. tighten password policy) without
 *     touching every form.
 *   - Lets us pair every schema with sanitization (zod runs AFTER we
 *     strip control chars so the DB only ever sees clean values).
 *
 * Each schema returns an Arabic error message so it can be surfaced
 * directly to end users.
 */

import { z } from "zod";
import {
  sanitizeEmail,
  sanitizePhone,
  sanitizeText,
  sanitizeDate,
} from "@/lib/sanitize";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export const emailSchema = z
  .string()
  .transform(sanitizeEmail)
  .refine((v) => EMAIL_RE.test(v), { message: "بريد إلكتروني غير صالح" })
  .refine((v) => v.length <= 254, { message: "البريد الإلكتروني طويل جداً" });

export const passwordSchema = z
  .string()
  .min(8, "كلمة المرور لا تقل عن 8 أحرف")
  .max(128, "كلمة المرور طويلة جداً")
  .refine((v) => /[A-Za-z]/.test(v) && /\d/.test(v), {
    message: "كلمة المرور يجب أن تحتوي على حروف وأرقام",
  });

/** Used for admin-created accounts (less strict than user-chosen passwords). */
export const adminAssignedPasswordSchema = z
  .string()
  .min(8, "كلمة المرور لا تقل عن 8 أحرف")
  .max(128, "كلمة المرور طويلة جداً");

export const phoneSchema = z
  .string()
  .transform(sanitizePhone)
  .refine((v) => v.replace(/\D/g, "").length >= 7, {
    message: "رقم هاتف غير صالح",
  })
  .refine((v) => v.replace(/\D/g, "").length <= 20, {
    message: "رقم الهاتف طويل جداً",
  });

export const optionalPhoneSchema = z
  .string()
  .transform(sanitizePhone)
  .refine((v) => v === "" || v.replace(/\D/g, "").length >= 7, {
    message: "رقم هاتف غير صالح",
  });

export const fullNameSchema = z
  .string()
  .transform((v) => sanitizeText(v, { maxLength: 80 }))
  .refine((v) => v.length >= 2, { message: "الاسم قصير جداً" })
  .refine((v) => v.split(/\s+/).length >= 1, { message: "الاسم مطلوب" });

export const shortTextSchema = (max = 120, label = "هذا الحقل") =>
  z
    .string()
    .transform((v) => sanitizeText(v, { maxLength: max }))
    .refine((v) => v.length > 0, { message: `${label} مطلوب` })
    .refine((v) => v.length <= max, {
      message: `${label} طويل جداً (الحد ${max} حرفاً)`,
    });

export const optionalShortTextSchema = (max = 200) =>
  z.string().transform((v) => sanitizeText(v, { maxLength: max }));

export const optionalMultilineSchema = (max = 4000) =>
  z.string().transform((v) =>
    // multiline notes / diagnosis — preserve newlines but cap length
    v
      ? v
          // strip any HTML tags
          .replace(/<\/?[a-z][^>]*>/gi, "")
          // strip control chars
          // eslint-disable-next-line no-control-regex
          .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F\u007F]/g, "")
          .slice(0, max)
          .trim()
      : "",
  );

export const dateOfBirthSchema = z
  .string()
  .transform(sanitizeDate)
  .refine((v) => v !== "", { message: "تاريخ ميلاد غير صالح" })
  .refine(
    (v) => {
      const ts = Date.parse(v);
      return Number.isFinite(ts) && ts <= Date.now();
    },
    { message: "تاريخ الميلاد لا يمكن أن يكون في المستقبل" },
  );

export const futureOrTodayDateSchema = z
  .string()
  .transform(sanitizeDate)
  .refine((v) => v !== "", { message: "تاريخ غير صالح" })
  .refine(
    (v) => {
      const ts = Date.parse(v);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      return Number.isFinite(ts) && ts >= todayStart.getTime();
    },
    { message: "التاريخ يجب أن يكون اليوم أو في المستقبل" },
  );

export const timeSchema = z
  .string()
  .transform((v) => v.trim().slice(0, 5))
  .refine((v) => /^([01]?\d|2[0-3]):[0-5]\d$/.test(v), {
    message: "الوقت غير صالح (HH:MM)",
  });

export const genderSchema = z.enum(["male", "female", "other"], {
  errorMap: () => ({ message: "النوع غير صالح" }),
});

export const roleSchema = z.enum(["admin", "doctor", "patient", "receptionist"], {
  errorMap: () => ({ message: "الدور غير صالح" }),
});

export const appointmentStatusSchema = z.enum(
  ["scheduled", "checked-in", "in-progress", "completed", "cancelled", "no-show"],
  { errorMap: () => ({ message: "حالة موعد غير صالحة" }) },
);

export const invoiceStatusSchema = z.enum(
  ["pending", "paid", "cancelled", "refunded"],
  { errorMap: () => ({ message: "حالة فاتورة غير صالحة" }) },
);

export const invoiceAmountSchema = z
  .union([z.number(), z.string()])
  .transform((v) => {
    if (typeof v === "number") return v;
    const n = Number(String(v).replace(/[^\d.]/g, ""));
    return Number.isFinite(n) ? n : NaN;
  })
  .refine((v) => Number.isFinite(v) && v >= 0, { message: "المبلغ غير صالح" })
  .refine((v) => v <= 10_000_000, { message: "المبلغ خارج النطاق المسموح" });

// ─── Composite schemas ────────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "كلمة المرور مطلوبة").max(128),
});

export const registerPatientSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: passwordSchema,
  phone: phoneSchema,
  gender: genderSchema,
  dateOfBirth: dateOfBirthSchema,
});

export const adminCreatePatientSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: adminAssignedPasswordSchema,
  phone: phoneSchema,
  gender: genderSchema,
  dateOfBirth: dateOfBirthSchema,
});

export const adminCreateDoctorSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: adminAssignedPasswordSchema,
  specialty: shortTextSchema(80, "التخصص"),
  phone: phoneSchema,
});

export const adminCreateStaffSchema = z.object({
  fullName: fullNameSchema,
  email: emailSchema,
  password: adminAssignedPasswordSchema,
  phone: optionalPhoneSchema,
});

/**
 * Run a Zod schema and return either parsed data or the first error message.
 */
export function safeValidate<T>(
  schema: z.ZodType<T>,
  input: unknown,
): { data: T | null; error: string | null } {
  const result = schema.safeParse(input);
  if (result.success) return { data: result.data, error: null };
  const first = result.error.errors[0];
  return { data: null, error: first?.message ?? "بيانات غير صالحة" };
}
