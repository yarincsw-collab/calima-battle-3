import { z } from "zod";
import { CATEGORIES, CategoryId, categoryById } from "./competition";

const categoryIds = CATEGORIES.map((c) => c.id) as [string, ...string[]];

// A URL or empty string. We accept empty when the user opts to send
// the document via WhatsApp instead of uploading.
const optionalUrl = z.union([z.string().url(), z.literal("")]).optional();

// Loose YouTube validator. We don't try to verify the video exists — judges
// will review it manually anyway. Just make sure it *looks* like youtube.
const YT_RE =
  /^(https?:\/\/)?(www\.|m\.)?(youtube\.com\/(watch\?v=|shorts\/|embed\/|live\/)|youtu\.be\/)[\w-]{6,}/;

export function isYoutubeUrl(s: string): boolean {
  return YT_RE.test(s.trim());
}

const optionalYoutube = z
  .union([z.string().regex(YT_RE, "הקישור חייב להיות לסרטון יוטיוב"), z.literal("")])
  .optional();

export const registrationSchema = z
  .object({
    categories: z.array(z.enum(categoryIds)).min(1, "יש לבחור לפחות מקצה אחד"),

    fullName: z.string().trim().min(2, "שם מלא חובה"),
    dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "תאריך לידה לא תקין"),
    email: z.string().trim().email("מייל לא תקין"),
    phone: z
      .string()
      .trim()
      .regex(/^0\d{1,2}[-\s]?\d{7}$/, "מספר טלפון לא תקין (לדוגמה 050-1234567)"),

    parentName: z.string().trim().optional(),
    parentPhone: z.string().trim().optional(),

    // Qualifying submission videos (YouTube unlisted/public, up to 60s).
    freestyleVideoUrl: optionalYoutube,
    enduranceVideoUrl: optionalYoutube,

    // URLs returned by Supabase Storage uploads (optional if sending via WhatsApp)
    healthDocUrl: optionalUrl,
    parentConsentUrl: optionalUrl,

    // Opt-out of uploading — user commits to sending the docs via WhatsApp.
    documentsViaWhatsapp: z.boolean().optional(),

    signatureUrl: z.string().url("חובה לחתום על קבלת אחריות"),

    liabilityAccepted: z.literal(true, {
      errorMap: () => ({ message: "יש לאשר את הצהרת האחריות" }),
    }),

    // Payment fields removed — payment is handled out-of-band: after admin
    // approval, athletes receive a payment link via WhatsApp/SMS from
    // iCredit. See the /admin dashboard for the workflow.
  })
  .superRefine((data, ctx) => {
    // 1. Documents: either uploaded OR explicitly committed to WhatsApp
    if (!data.documentsViaWhatsapp && !data.healthDocUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["healthDocUrl"],
        message: "חובה להעלות הצהרת בריאות, או לאשר שליחה בוואטסאפ",
      });
    }

    // 2. Video submissions per selected discipline
    const hasFreestyle = data.categories.some(
      (id) => categoryById(id as CategoryId)?.day === "freestyle"
    );
    const hasEndurance = data.categories.some(
      (id) => categoryById(id as CategoryId)?.day === "endurance"
    );
    if (hasFreestyle && !data.freestyleVideoUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["freestyleVideoUrl"],
        message: "חובה להגיש קישור יוטיוב לסרטון קבלה לפריסטייל",
      });
    }
    if (hasEndurance && !data.enduranceVideoUrl) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["enduranceVideoUrl"],
        message: "חובה להגיש קישור יוטיוב לסרטון קבלה לסיבולת",
      });
    }

    // 3. Age-based requirements (minors)
    const dob = new Date(data.dob);
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;

    if (age < 18) {
      if (!data.parentName || data.parentName.length < 2) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parentName"], message: "חובה למלא שם הורה לקטינים" });
      }
      if (!data.parentPhone || !/^0\d{1,2}[-\s]?\d{7}$/.test(data.parentPhone)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["parentPhone"], message: "חובה טלפון הורה לקטינים" });
      }
      // Parent consent: required unless sending via WhatsApp
      if (!data.documentsViaWhatsapp && !data.parentConsentUrl) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["parentConsentUrl"],
          message: "חובה להעלות אישור הורים חתום לקטינים, או לאשר שליחה בוואטסאפ",
        });
      }
    }
  });

export type RegistrationInput = z.infer<typeof registrationSchema>;

export function calcAge(dob: string): number {
  const d = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - d.getFullYear();
  const m = today.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < d.getDate())) age--;
  return age;
}

/* ─── Endurance points table (also rendered in the form for participants) */
export const ENDURANCE_POINTS = [
  { exercise: "עליות כוח (Muscle-up)", points: 4 },
  { exercise: "מתח (Pull-up)", points: 3 },
  { exercise: "מקבילים / בר-דיפס", points: 2 },
  { exercise: "שכיבת סמיכה / סקוואט", points: 1 },
] as const;
