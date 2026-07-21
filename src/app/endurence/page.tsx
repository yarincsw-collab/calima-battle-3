"use client";

import { FormEvent, useState } from "react";

export default function EnduranceRegistrationPage() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!name.trim() || !phone.trim()) {
      setMessage("יש למלא שם וטלפון");
      return;
    }

    const existing = JSON.parse(localStorage.getItem("endurenceRegistrations") || "[]");
    existing.push({
      name: name.trim(),
      phone: phone.trim(),
      createdAt: new Date().toLocaleString("he-IL"),
    });

    localStorage.setItem("endurenceRegistrations", JSON.stringify(existing));
    setMessage("ההרשמה התקבלה, תודה!");
    setName("");
    setPhone("");
  };

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(70,188,255,0.2),_transparent_45%),linear-gradient(135deg,_#05070A_0%,_#0f172a_100%)] px-4 py-10 text-white">
      <div className="mx-auto flex max-w-md flex-col rounded-3xl border border-white/10 bg-black/45 p-8 shadow-2xl shadow-cyan-950/30 backdrop-blur">
        <p className="mb-3 text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">Calima Battles 3</p>
        <h1 className="text-3xl font-bold text-white">הרשמה למקצה סיבולת</h1>
        <p className="mt-3 text-sm leading-6 text-slate-300">
          מתאמנים נוער ובוגרים
          <br />
          מלאו שם וטלפון בלבד.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
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
            className="w-full rounded-2xl bg-cyan-500 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-400"
          >
            שליחה
          </button>
        </form>

        {message ? <p className="mt-5 text-center text-sm font-semibold text-cyan-300">{message}</p> : null}
      </div>
    </main>
  );
}
