# Calima Battles 3 — Landing & Registration

דף נחיתה + מערכת הרשמה לתחרות **Calima Battles 3** (30-31.7).

עיצוב מתחבר לפוסטר: רקע שחור גראנג׳, טיפוגרפיה גדולה בכחול חשמלי (#1BA4E0).
RTL מלא בעברית. נבנה ב-Next.js 14 (App Router) + TypeScript + Tailwind.

---

## מבנה

```
src/
  app/
    page.tsx              ← דף נחיתה
    register/page.tsx     ← טופס הרשמה רב-שלבי
    success/page.tsx      ← דף אישור
    api/
      register/route.ts   ← שמירה ל-Supabase + Google Sheets
      upload/route.ts     ← העלאת קבצים ל-Supabase Storage
  components/
    Logo.tsx              ← לוגו CALIMA BATTLES 3
    RegistrationForm.tsx  ← הטופס המלא (5 שלבים)
    FileDrop.tsx          ← drag-and-drop להעלאת קבצים
    SignaturePad.tsx      ← חתימה דיגיטלית (canvas)
    icons.tsx             ← אייקוני SVG inline
  lib/
    competition.ts        ← מקור האמת לכל המקצים, רמות, מחירים
    schema.ts             ← Zod validation לטופס
    supabase.ts           ← לקוחות Supabase (public + admin)
    googleSheets.ts       ← אינטגרציית Google Sheets (Service Account)
    isracard.ts           ← אינטגרציית ישראכרט עסקים (mock + live skeleton)
```

---

## הרצה מקומית

```bash
cd calima-battles-3
npm install
cp .env.example .env.local
# מלא את הערכים, ואז:
npm run dev   # http://localhost:3030
```

ברירת המחדל היא `PAYMENT_MODE=mock` — הטופס פועל מקצה לקצה עם טוקני דמה.
החלף ל-`live` רק לאחר חיבור ה-API של ישראכרט.

---

## הגדרה — Supabase

1. צור פרויקט ב-[supabase.com](https://supabase.com).
2. תחת **Storage** → צור bucket בשם `battles3-docs` (Public ON או private + signed urls).
3. תחת **SQL Editor** הרץ:

```sql
create table if not exists battles3_registrations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  full_name text not null,
  dob date not null,
  age int,
  email text not null,
  phone text not null,
  parent_name text,
  parent_phone text,
  categories text[] not null,
  total_price numeric not null,
  freestyle_video_url text,
  endurance_video_url text,
  health_doc_url text,
  parent_consent_url text,
  documents_via_whatsapp boolean default false,
  signature_url text,
  liability_accepted_at timestamptz,
  payment_token text,
  payment_last4 text,
  payment_expiry text,
  payment_status text default 'pending_admin_approval',
  charged_at timestamptz,
  charge_transaction_id text,
  notes text
);

create index if not exists battles3_registrations_email_idx
  on battles3_registrations (email);
```

4. העתק את `Project URL`, `anon key` ו-`service_role key` ל-`.env.local`.

---

## הגדרה — Google Sheets

1. ב-[Google Cloud Console](https://console.cloud.google.com): פתח פרויקט, הפעל את **Google Sheets API**.
2. צור **Service Account** → צור מפתח JSON.
3. פתח את הגיליון היעד ב-Google Sheets ושתף אותו עם כתובת המייל של ה-Service Account (`xxx@xxx.iam.gserviceaccount.com`) כ-**Editor**.
4. ב-`.env.local`:
   - `GOOGLE_SHEETS_ID` — מזהה הגיליון (החלק שבין `/d/` ל-`/edit` ב-URL)
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` — מהקובץ JSON
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` — `private_key` מהקובץ. **שמור את `\n` כטקסט**, לדוגמה:
     ```
     GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQ...\n-----END PRIVATE KEY-----\n"
     ```
5. הלשונית `Registrations` תיווצר אוטומטית עם כותרות בעת הרישום הראשון.

---

## הגדרה — ישראכרט עסקים (סליקה אמיתית)

המערכת מטוקנת — **לא** שומרת מספרי כרטיס. הקלידה מתבצעת ב-iframe מאובטח של שער הסליקה, ואנחנו שומרים רק "Token" שאפשר לחייב בו מאוחר יותר. ה-PCI scope שלך נשאר ב-SAQ-A (הקל ביותר).

### איך לפתוח חשבון

יש שלוש דרכים פרקטיות לקבל סליקה אונליין בארץ — כולן עובדות עם הקוד הזה:

1. **ישראכרט Business / שער 2.0** — `https://gateway20.icom.co.il`
   פתיחה: דרך נציג מכירות (`business@isracard.co.il` או 03-6364444). ביקור פיזי + הסכם סולק + טרמינל. בדרך כלל לוקח 1–2 שבועות.

2. **Tranzila** (חברה-בת של ישראכרט, מומלץ — הכי נוח לסטארטאפים) — `https://www.tranzila.com`
   הרשמה מקוונת תוך יום-יומיים. אותה API בדיוק.

3. **Cardcom** (אלטרנטיבה פופולרית) — `https://www.cardcom.solutions`
   ה-flow דומה אבל שמות השדות שונים — תצטרך להתאים את `src/lib/isracard.ts`.

### מה לבקש מהנציג

```
1. "טרמינל סליקה" (Supplier / Masof number)
2. שם משתמש + סיסמת API (Login credentials)
3. גישה ל-"שער 2.0" / Tranzila Token Service (TranzilaTK)
4. הפעלת J5 / "אימות בלבד" → חיוב מאוחר
5. הגדרת notify_url ו-success_url לכתובות הפרודקשן שלך
```

### חיווט הסביבה (.env.local)

```bash
# פיתוח: השאר mock — הטופס יעבוד מקצה-לקצה עם טוקן דמה
PAYMENT_MODE=mock

# לאחר קבלת הפרטים מהנציג:
PAYMENT_MODE=live
ISRACARD_BASE_URL=https://gateway20.icom.co.il   # או https://direct.tranzila.com
ISRACARD_TERMINAL_NUMBER=12345
ISRACARD_USER=
ISRACARD_PASSWORD=

# מפתח פנימי כדי להגן על /api/payment/charge — שים משהו רנדומלי וארוך:
ADMIN_API_KEY=$(openssl rand -hex 32)
```

### מה כבר עובד בקוד

הקובץ `src/lib/isracard.ts` כולל:

- `getHostedTokenUrl(regId, amount, returnUrl)` → URL ל-iframe שמטוקן את הכרטיס
- `verifyToken(token)` → סטאב לאימות (יש להשלים בקריאה אמיתית לפי ה-spec של המוצר שלך)
- `chargeToken(token, amount, regId)` → קריאת `tranzila71u.cgi` שמחייבת בפועל

ה-API routes כבר קיימים:

- `POST /api/payment/callback` — הגייטוויי מפנה לכאן לאחר טוקניזציה, ואנחנו מפנים את המשתמש בחזרה לטופס עם הטוקן
- `POST /api/payment/charge` — חיוב בפועל של רישום אחד (דורש header `x-admin-key`)
- `GET /api/payment/mock` — עמוד דמה לסליקה במצב פיתוח

### דברים שעדיין צריך להשלים אחרי החיבור החי

1. **מימוש מלא של `verifyToken`** — קריאה ל-`/getStatus` עם basic auth כדי לוודא שהטוקן באמת תקף לפני שאתה שומר אותו.
2. **חתימת callback** — ישראכרט שולחת חתימת HMAC על הקאלבק; צריך לאמת לפני שמתעדים את הטוקן. בקש מהנציג את ה-`signing key`.
3. **בדיקה ב-staging** — ישראכרט נותנת טרמינל "Masof 1000" עם כרטיס בדיקה 4580458045804580. לבדוק לפני production.

---

## חיוב לפני התחרות

יומיים-שבועיים לפני התחרות:

1. סקור את הגיליון/Supabase, סמן `payment_status='approved'` לכל מי שעבר
2. רוץ `curl` לכל אחד:

```bash
curl -X POST https://your-domain.com/api/payment/charge \
  -H "x-admin-key: $ADMIN_API_KEY" \
  -H "content-type: application/json" \
  -d '{"registrationId":"uuid-here"}'
```

או רוץ batch (bash):

```bash
psql $SUPABASE_DB_URL -t -c \
  "select id from battles3_registrations where payment_status='approved'" |
  while read id; do
    curl -sS -X POST https://your-domain.com/api/payment/charge \
      -H "x-admin-key: $ADMIN_API_KEY" \
      -H "content-type: application/json" \
      -d "{\"registrationId\":\"$id\"}"
    echo
  done
```

ניתן גם להוסיף Vercel Cron / Railway Scheduled Job שעובר על כולם אוטומטית.

---

## דפלוי

מומלץ Vercel (פשוט יותר מ-Railway לפרויקט סטטי-יחסית).
לחלופין Railway עם Dockerfile.

```bash
npm run build
npm run start
```

---

## איך לערוך מקצים / מחירים

עורכים קובץ אחד: `src/lib/competition.ts`. הכל מתעדכן אוטומטית בכל הדפים.
