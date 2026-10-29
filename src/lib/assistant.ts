// Rule-based assistant. To plug in a local model later (e.g. Ollama), implement
// another `Answerer` with the same signature and swap it in the Assistant page.
import type { AppData } from "./types";
import { allRisks, attendanceStats, attMessage, cgpa, skipOrNeed } from "./calc";
import { addDays, daysBetween, fmtDate, inr, monthKey, parseISO, todayISO } from "./dates";

export type Answerer = (question: string, data: AppData) => Promise<string>;

const HELP = `I can answer things like:
• Can I skip tomorrow's class?
• What is due this week?
• When is my next exam?
• Which subject is most at risk?
• What is my CGPA?
• How much have I spent this month?
• What events are coming?`;

export const ruleBasedAnswer: Answerer = async (q, d) => {
  const s = q.toLowerCase();
  const today = todayISO();
  const name = (id: string) => d.subjects.find((x) => x.id === id)?.name ?? "—";
  const T = d.settings.target;

  if (/skip|bunk|miss/.test(s)) {
    const day = s.includes("today") ? today : addDays(today, 1);
    const classes = d.slots.filter((c) => c.day === parseISO(day).getDay());
    if (!classes.length) return `No classes ${s.includes("today") ? "today" : "tomorrow"} — nothing to skip!`;
    return classes.map((c) => {
      const sub = d.subjects.find((x) => x.id === c.subjectId)!;
      const st = attendanceStats(sub, d.records);
      const ok = skipOrNeed(st.attended, st.held + 1, T).need === 0 && st.attended * 100 >= T * (st.held + 1);
      return `${ok ? "✅" : "❌"} ${sub.name} (${c.start}): ${st.pct.toFixed(1)}% now. ${ok ? "Safe to skip once." : attMessage(st.attended, st.held, T)}`;
    }).join("\n");
  }
  if (/due|assignment|deadline|homework/.test(s)) {
    const wk = addDays(today, 7);
    const list = d.assignments.filter((a) => a.status !== "done" && a.due <= wk).sort((a, b) => a.due.localeCompare(b.due));
    if (!list.length) return "Nothing due this week 🎉";
    return list.map((a) => `• ${a.title} (${name(a.subjectId)}) — ${a.due < today ? "OVERDUE" : fmtDate(a.due)}`).join("\n");
  }
  if (/exam|test/.test(s)) {
    const e = d.exams.filter((x) => x.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
    return e ? `Your next exam is ${name(e.subjectId)} (${e.type}) on ${fmtDate(e.date)} at ${e.time} — ${daysBetween(today, e.date)} days left.` : "No upcoming exams.";
  }
  if (/risk|danger|worst|weak/.test(s)) {
    const r = allRisks(d)[0];
    return r ? `${r.reason}. Suggested: ${r.action}.` : "Everything looks safe.";
  }
  if (/cgpa|sgpa|gpa|grade/.test(s)) {
    const c = cgpa(d.marks, d.settings.gradeScale);
    return c.credits ? `Your CGPA is ${c.cgpa.toFixed(2)} over ${c.credits} credits.` : "Add grades in Academics first.";
  }
  if (/spen|expense|money|budget/.test(s)) {
    const sp = d.expenses.filter((e) => monthKey(e.date) === monthKey(today)).reduce((a, e) => a + e.amount, 0);
    return `You've spent ${inr(sp)} this month out of ${inr(d.settings.budget)} (${inr(d.settings.budget - sp)} left).`;
  }
  if (/event|hackathon|fest|club|workshop/.test(s)) {
    const list = d.events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 5);
    return list.length ? list.map((e) => `• ${e.title} — ${fmtDate(e.date)}${e.regDeadline && e.status === "interested" ? ` (register by ${fmtDate(e.regDeadline)})` : ""}`).join("\n") : "No upcoming events.";
  }
  if (/attendance|percent/.test(s)) {
    return d.subjects.map((x) => { const st = attendanceStats(x, d.records); return `• ${x.name}: ${st.pct.toFixed(1)}% — ${attMessage(st.attended, st.held, T)}`; }).join("\n");
  }
  return `Sorry, I didn't get that.\n${HELP}`;
};
