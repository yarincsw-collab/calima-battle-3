// Centralised configuration for the Calima Battles 3 competition.
// Editing this single file updates the landing page, registration form
// and pricing in one go.

export type EventDay = "freestyle" | "endurance";

export type CategoryId =
  | "freestyle_pro_national"
  | "freestyle_national"
  | "freestyle_calima"
  | "freestyle_women"
  | "endurance_national"
  | "endurance_calima_youth"
  | "endurance_calima_adult"
  | "endurance_women";

export interface Category {
  id: CategoryId;
  day: EventDay;
  label: string;
  shortLabel: string;
  description: string;
  slots: number;
  price: number; // NIS, charged ~2 weeks before event
  priceNote?: string;
}

export const COMPETITION = {
  name: "Calima Battles 3",
  tagline: "תחרות הקליסטניקס הגדולה של השנה",
  startDate: "2026-07-30",
  endDate: "2026-07-31",
  displayDates: "30-31.7",
  venue: {
    name: "מתחם קלימה",
    address: "הכשרת הישוב 10, ראשון לציון",
    mapsUrl: "https://maps.google.com/?q=הכשרת+הישוב+10+ראשון+לציון",
  },
  chargeNote:
    "התשלום ייגבה בפועל רק לאחר שתאושר ההשתתפות בתחרות — כשבועיים לפני האירוע. עד אז אנו שומרים את פרטי הכרטיס בטוקן מאובטח דרך שער הסליקה.",
} as const;

export const CATEGORIES: Category[] = [
  {
    id: "freestyle_pro_national",
    day: "freestyle",
    label: "מקצה פרו ארצי — פריסטייל",
    shortLabel: "פרו ארצי",
    description: "המקצועיים בארץ. קומבואים מטורפים, כוח ושליטה ברמה הגבוהה ביותר.",
    slots: 12,
    price: 100,
  },
  {
    id: "freestyle_national",
    day: "freestyle",
    label: "מקצה ארצי — פריסטייל",
    shortLabel: "ארצי",
    description: "מתחרים מהשורה הראשונה ברמה הארצית.",
    slots: 12,
    price: 100,
  },
  {
    id: "freestyle_calima",
    day: "freestyle",
    label: "מתאמני קלימה — פריסטייל",
    shortLabel: "מתאמני קלימה",
    description: "במה למתאמני הבית של קלימה. הכיף, הקהילה והתחרות.",
    slots: 12,
    price: 70,
  },
  {
    id: "freestyle_women",
    day: "freestyle",
    label: "מקצה בנות — פריסטייל",
    shortLabel: "בנות",
    description: "מקצה הבנות. יצירתיות, כוח וביצועים מרשימים.",
    slots: 6,
    price: 100,
  },
  {
    id: "endurance_national",
    day: "endurance",
    label: "מקצה ארצי — סיבולת",
    shortLabel: "ארצי",
    description: "מי יישאר אחרון על המתח? סיבולת ארצית ברמה הגבוהה.",
    slots: 10,
    price: 100,
  },
  {
    id: "endurance_calima_youth",
    day: "endurance",
    label: "מתאמנים נוער — סיבולת",
    shortLabel: "מתאמנים נוער",
    description: "מקצה הסיבולת של מתאמני הבית — נוער (עד גיל 18).",
    slots: 8,
    price: 0,
    priceNote: "ללא עלות למתאמני קלימה",
  },
  {
    id: "endurance_calima_adult",
    day: "endurance",
    label: "מתאמנים בוגרים — סיבולת",
    shortLabel: "מתאמנים בוגרים",
    description: "מקצה הסיבולת של מתאמני הבית — בוגרים (18+).",
    slots: 8,
    price: 0,
    priceNote: "ללא עלות למתאמני קלימה",
  },
  {
    id: "endurance_women",
    day: "endurance",
    label: "מקצה בנות — סיבולת",
    shortLabel: "בנות",
    description: "מקצה הסיבולת של הבנות.",
    slots: 6,
    price: 100,
  },
];

export const FREESTYLE_CATEGORIES = CATEGORIES.filter((c) => c.day === "freestyle");
export const ENDURANCE_CATEGORIES = CATEGORIES.filter((c) => c.day === "endurance");

export function categoryById(id: CategoryId): Category | undefined {
  return CATEGORIES.find((c) => c.id === id);
}

export function totalPrice(ids: CategoryId[]): number {
  return ids.reduce((sum, id) => sum + (categoryById(id)?.price ?? 0), 0);
}
