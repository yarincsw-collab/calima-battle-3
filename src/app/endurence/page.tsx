"use client";

import { FormEvent, useState } from "react";

const CATEGORY_OPTIONS = [
  {
    id: "endurance_calima_youth",
    label: "מקצה סיבולת מתאמנים נוער",
    hint: "מקצה קלימה למתאמנים נוער (עד גיל 18) — ללא עלות",
  },
  {
    id: "endurance_calima_adult",
    label: "מקצה סיבולת מתאמנים בוגרים",
    hint: "מקצה קלימה למתאמנים בוגרים (18+) — ללא עלות",
  },
] as const;

type CategoryOption = (typeof CATEGORY_OPTIONS)[number];

export default function EnduranceRegistrationPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [category, setCategory] = useState<CategoryOption["id"]>(CATEGORY_OPTIONS[0].id);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !phone.trim()) {
      setMessage("יש למלא שם וטלפון");
      return;
    }

    setSubmitting(true);
    setMessage("");

    try {
      const res = await fetch("/api/endurence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fullName: name.trim(), phone: phone.trim(), categoryId: category }),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error || "שגיאה בשליחת ההרשמה");
      }

      setMessage("ההרשמה התקבלה, תודה! מנהל יראה את המקצה בלוח הניהול.");
      setName("");
      setPhone("");
      setCategory(CATEGORY_OPTIONS[0].id);
    } catch (error) {
      setMessage(`שגיאה: ${(error as Error).message}`);
    } finally {
      setSubmitting(false);
    }
  };

  const selectedCategory = CATEGORY_OPTIONS.find((option) => option.id === category);

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(70,188,255,0.2),_transparent_45%),linear-gradient(135deg,_#05070A_0%,_#0f172a_100%)] px-4 py-10 text-white">
      <div className="mx-auto flex max-w-md flex-col rounded-3xl border border-white/10 bg-black/45 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Calima Battles 3</p>
        <h1 className="text-3xl font-bold text-white">הרשמה למקצה סיבולת</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          בחרו מקצה והזינו שם + טלפון.
          <br />
          הרשמה נרשמת ישירות ללוח הניהול.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-slate-200">
            מקצה
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value as CategoryOption["id"])}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-right text-white outline-none ring-0 placeholder:text-slate-400"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.id} value={option.id} className="bg-slate-950 text-white">
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {selectedCategory ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              {selectedCategory.hint}
            </div>
          ) : null}

          <label className="block text-sm font-medium text-slate-200">
            שם
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-right text-white outline-none ring-0 placeholder:text-slate-400"
              placeholder="הקלידו שם"
            />
          </label>

          <label className="block text-sm font-medium text-slate-200">
            טלפון
            <input
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              className="mt-2 w-full rounded-2xl border border-white/15 bg-white/10 px-4 py-3 text-right text-white outline-none ring-0 placeholder:text-slate-400"
              placeholder="הקלידו טלפון"
            />
          </label>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "שולח..." : "שליחה"}
          </button>
        </form>

        {message ? <p className="mt-5 text-center text-sm font-semibold text-cyan-300">{message}</p> : null}
      </div>
    </main>
  );
}
