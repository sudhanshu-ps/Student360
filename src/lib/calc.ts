// Pure maths used across the app. No React here, so it's easy to test.
import type { AppData, AttRecord, GradeRow, Mark, Subject } from "./types";
import { addDays, parseISO, todayISO } from "./dates";

export interface AttStats { attended: number; held: number; pct: number }

/** (opening attended + present) / (opening held + present + absent). Cancelled is ignored. */
export function attendanceStats(s: Subject, records: AttRecord[]): AttStats {
  const mine = records.filter((r) => r.subjectId === s.id && r.status !== "cancelled");
  const attended = s.openAttended + mine.filter((r) => r.status === "present").length;
  const held = s.openHeld + mine.length;
  return { attended, held, pct: held ? (attended * 100) / held : 100 };
}

/** Positive = classes you can skip; negative = classes needed in a row. */
export function skipOrNeed(A: number, H: number, T: number): { skip: number; need: number } {
  if (A * 100 >= T * H) return { skip: Math.floor((A * 100) / T) - H, need: 0 };
  if (T >= 100) return { skip: 0, need: Infinity };
  return { skip: 0, need: Math.ceil((T * H - 100 * A) / (100 - T)) };
}

export type AttLevel = "safe" | "close" | "short";
export function attLevel(A: number, H: number, T: number): AttLevel {
  const { skip } = skipOrNeed(A, H, T);
  if (A * 100 < T * H) return "short";
  return skip <= 1 ? "close" : "safe";
}

export function attMessage(A: number, H: number, T: number) {
  const { skip, need } = skipOrNeed(A, H, T);
  if (H === 0) return "No classes recorded yet";
  if (need > 0) return `Attend the next ${need} class${need === 1 ? "" : "es"} in a row to reach ${T}%`;
  if (skip === 0) return "On the edge — don't skip the next class";
  return `You can skip ${skip} more class${skip === 1 ? "" : "es"}`;
}

/** Grade letter for a percentage, using the scale (sorted high→low by min). */
export function gradeFor(pct: number, scale: GradeRow[]): GradeRow {
  const sorted = [...scale].sort((a, b) => b.min - a.min);
  return sorted.find((g) => pct >= g.min) ?? sorted[sorted.length - 1];
}
export const pointsFor = (grade: string, scale: GradeRow[]) =>
  scale.find((g) => g.grade.toLowerCase() === grade.toLowerCase())?.points ?? 0;

export function sgpaBySemester(marks: Mark[], scale: GradeRow[], semesters: string[]) {
  const order = [...semesters, ...marks.map((m) => m.semester).filter((s) => !semesters.includes(s))];
  const uniq = Array.from(new Set(order));
  return uniq
    .map((sem) => {
      const list = marks.filter((m) => m.semester === sem);
      const credits = list.reduce((a, m) => a + m.credits, 0);
      const pts = list.reduce((a, m) => a + m.credits * pointsFor(m.grade, scale), 0);
      return { semester: sem, credits, sgpa: credits ? pts / credits : 0 };
    })
    .filter((x) => x.credits > 0);
}
export function cgpa(marks: Mark[], scale: GradeRow[]) {
  const credits = marks.reduce((a, m) => a + m.credits, 0);
  const pts = marks.reduce((a, m) => a + m.credits * pointsFor(m.grade, scale), 0);
  return { credits, cgpa: credits ? pts / credits : 0 };
}
/** SGPA needed next semester (with `nextCredits`) to reach `target` CGPA. */
export function sgpaNeeded(curCgpa: number, curCredits: number, target: number, nextCredits: number) {
  if (nextCredits <= 0) return NaN;
  return (target * (curCredits + nextCredits) - curCgpa * curCredits) / nextCredits;
}

/** End-sem marks needed so that the weighted total reaches `targetPct`. */
export function endSemNeeded(intObt: number, intMax: number, endMax: number, wInt: number, wEnd: number, targetPct: number) {
  const fromInternal = intMax ? (intObt / intMax) * wInt : 0;
  const need = ((targetPct - fromInternal) / wEnd) * endMax;
  return Math.max(0, need);
}

/** Classes per week per subject from the timetable. */
export const weeklyCount = (d: AppData, subjectId: string) => d.slots.filter((s) => s.subjectId === subjectId).length;

export interface RiskItem { subjectId: string; level: "low" | "medium" | "high"; kind: "attendance" | "marks"; reason: string; action: string }

/** Project when attendance falls below target, using the recent attendance rate. */
export function attendanceRisk(d: AppData, from = todayISO()): RiskItem[] {
  const T = d.settings.target;
  return d.subjects.map((s) => {
    const st = attendanceStats(s, d.records);
    const recent = d.records
      .filter((r) => r.subjectId === s.id && r.status !== "cancelled")
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-12);
    const rate = recent.length ? recent.filter((r) => r.status === "present").length / recent.length : st.pct / 100;
    const perWeek = Math.max(1, weeklyCount(d, s.id));
    if (st.pct < T) {
      const need = skipOrNeed(st.attended, st.held, T).need;
      return { subjectId: s.id, kind: "attendance", level: "high", reason: `${s.name} is at ${st.pct.toFixed(1)}%, below ${T}%`, action: `Attend the next ${need} classes in a row` } as RiskItem;
    }
    if (rate * 100 >= T) {
      return { subjectId: s.id, kind: "attendance", level: "low", reason: `${s.name} is safe long-term at your current pace (${Math.round(rate * 100)}% recently)`, action: "Keep it up" } as RiskItem;
    }
    // Simulate future classes week by week, up to 26 weeks.
    let A = st.attended, H = st.held;
    for (let w = 1; w <= 26; w++) {
      A += rate * perWeek; H += perWeek;
      if (A * 100 < T * H) {
        const date = parseISO(addDays(from, w * 7)).toLocaleDateString("en-IN", { day: "numeric", month: "long" });
        return { subjectId: s.id, kind: "attendance", level: w <= 3 ? "high" : "medium", reason: `At this pace you will fall below ${T}% in ${s.name} by ${date}`, action: `Your recent rate is ${Math.round(rate * 100)}% — attend more ${s.name} classes` } as RiskItem;
      }
    }
    return { subjectId: s.id, kind: "attendance", level: "low", reason: `${s.name} stays above ${T}% this semester`, action: "Keep it up" } as RiskItem;
  });
}

/** Flag subjects whose recent tests are falling or well below the student's average. */
export function marksRisk(d: AppData): RiskItem[] {
  const all = d.tests.map((t) => (t.score / t.max) * 100);
  const avg = all.length ? all.reduce((a, b) => a + b, 0) / all.length : 0;
  const out: RiskItem[] = [];
  for (const s of d.subjects) {
    const ts = d.tests.filter((t) => t.subjectId === s.id).sort((a, b) => a.date.localeCompare(b.date));
    if (!ts.length) continue;
    const pcts = ts.map((t) => (t.score / t.max) * 100);
    const last = pcts[pcts.length - 1];
    const falling = pcts.length >= 2 && last < pcts[pcts.length - 2] - 8;
    const below = last < avg - 12;
    if (falling || below) {
      out.push({
        subjectId: s.id, kind: "marks", level: falling && below ? "high" : "medium",
        reason: falling ? `${s.name} test scores are dropping (latest ${Math.round(last)}%)` : `${s.name} is well below your average (${Math.round(last)}% vs ${Math.round(avg)}%)`,
        action: `Plan extra study hours for ${s.name}`,
      });
    }
  }
  return out;
}

const RANK = { high: 0, medium: 1, low: 2 };
export const allRisks = (d: AppData) =>
  [...attendanceRisk(d), ...marksRisk(d)].sort((a, b) => RANK[a.level] - RANK[b.level]);
