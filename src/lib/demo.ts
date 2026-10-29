// Realistic sample data so the dashboard looks alive in a demo.
import type { AppData, AttRecord, ClassSlot, Settings, Subject } from "./types";
import { addDays, parseISO, todayISO } from "./dates";

let n = 0;
const id = () => `d${(n++).toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export function makeDemoData(settings: Settings): AppData {
  const today = todayISO();
  const subjects: Subject[] = [
    { id: "s-dsa", name: "Data Structures", code: "CS301", openAttended: 10, openHeld: 12 },
    { id: "s-dbms", name: "DLCD", code: "CS302", openAttended: 9, openHeld: 12 },
    { id: "s-os", name: "Linear Algebra", code: "CS303", openAttended: 8, openHeld: 11 },
    { id: "s-math", name: "Discrete Maths", code: "MA301", openAttended: 11, openHeld: 12 },
    { id: "s-phy", name: "Computational Methods", code: "PH201", openAttended: 7, openHeld: 10 },
  ];
  const slot = (subjectId: string, day: number, start: string, end: string, room: string, type: ClassSlot["type"] = "lecture"): ClassSlot =>
    ({ id: id(), subjectId, day, start, end, room, type });
  const slots: ClassSlot[] = [
    slot("s-dsa", 1, "09:00", "10:00", "LH-101"), slot("s-dbms", 1, "10:00", "11:00", "LH-102"), slot("s-phy", 1, "14:00", "16:00", "Lab-3", "lab"),
    slot("s-os", 2, "09:00", "10:00", "LH-103"), slot("s-math", 2, "11:00", "12:00", "LH-101"), slot("s-dsa", 2, "14:00", "16:00", "Lab-1", "lab"),
    slot("s-dbms", 3, "09:00", "10:00", "LH-102"), slot("s-phy", 3, "10:00", "11:00", "LH-201"), slot("s-math", 3, "12:00", "13:00", "LH-101", "tutorial"),
    slot("s-dsa", 4, "09:00", "10:00", "LH-101"), slot("s-os", 4, "10:00", "11:00", "LH-103"), slot("s-dbms", 4, "14:00", "16:00", "Lab-2", "lab"),
    slot("s-math", 5, "09:00", "10:00", "LH-101"), slot("s-os", 5, "11:00", "12:00", "LH-103"), slot("s-phy", 5, "12:00", "13:00", "LH-201"),
  ];
  // 5 weeks of attendance history, with Physics and OS trending worse.
  const absentRate: Record<string, number> = { "s-dsa": 0.1, "s-dbms": 0.2, "s-os": 0.3, "s-math": 0.05, "s-phy": 0.38 };
  const records: AttRecord[] = [];
  let seed = 7;
  const rnd = () => ((seed = (seed * 9301 + 49297) % 233280) / 233280);
  for (let i = 35; i >= 1; i--) {
    const date = addDays(today, -i);
    const day = parseISO(date).getDay();
    for (const sl of slots.filter((s) => s.day === day)) {
      const r = rnd();
      const status = r < 0.04 ? "cancelled" : r < 0.04 + absentRate[sl.subjectId] ? "absent" : "present";
      records.push({ id: id(), subjectId: sl.subjectId, slotId: sl.id, date, status });
    }
  }
  const sem = settings.semesters;
  const m = (subject: string, semester: string, credits: number, grade: string) => ({ id: id(), subject, semester, credits, grade });
  const marks = [
    m("Programming in C", sem[0], 4, "A+"), m("Calculus", sem[0], 4, "A"), m("Physics I", sem[0], 3, "B+"), m("English", sem[0], 2, "O"), m("Workshop", sem[0], 2, "A"),
    m("OOP in Java", sem[1], 4, "O"), m("Linear Algebra", sem[1], 4, "A"), m("Chemistry", sem[1], 3, "B+"), m("Digital Logic", sem[1], 3, "A+"), m("EVS", sem[1], 2, "A"),
    m("Computer Org.", sem[2], 4, "A+"), m("Probability", sem[2], 4, "A"), m("Economics", sem[2], 3, "A+"), m("Web Tech", sem[2], 3, "O"),
  ];
  const t = (subjectId: string, name: string, dd: number, score: number, max: number) => ({ id: id(), subjectId, name, date: addDays(today, dd), score, max });
  const tests = [
    t("s-dsa", "Quiz 1", -28, 18, 20), t("s-dsa", "Quiz 2", -10, 17, 20),
    t("s-dbms", "Quiz 1", -26, 15, 20), t("s-dbms", "Quiz 2", -8, 16, 20),
    t("s-os", "Quiz 1", -25, 16, 20), t("s-os", "Quiz 2", -7, 11, 20),
    t("s-math", "Quiz 1", -24, 19, 20), t("s-math", "Quiz 2", -6, 18, 20),
    t("s-phy", "Quiz 1", -22, 12, 20), t("s-phy", "Quiz 2", -5, 9, 20),
  ];
  const ex = (subjectId: string, type: "internal" | "mid-sem" | "end-sem", dd: number, time: string, room: string) => ({ id: id(), subjectId, type, date: addDays(today, dd), time, room });
  const exams = [
    ex("s-os", "internal", 6, "10:00", "LH-103"), ex("s-dsa", "mid-sem", 12, "09:30", "Exam Hall A"), ex("s-dbms", "mid-sem", 14, "09:30", "Exam Hall A"),
    ex("s-phy", "mid-sem", 16, "14:00", "Exam Hall B"), ex("s-math", "end-sem", 40, "09:30", "Exam Hall A"), ex("s-dsa", "internal", -9, "11:00", "LH-101"),
  ];
  const a = (title: string, subjectId: string, dd: number, priority: "low" | "medium" | "high", status: "todo" | "in-progress" | "done", notes = "") =>
    ({ id: id(), title, subjectId, due: addDays(today, dd), priority, status, notes });
  const assignments = [
    a("Linked list lab record", "s-dsa", 1, "high", "in-progress", "Submit on portal"), a("ER diagram for library DB", "s-dbms", 3, "medium", "todo"),
    a("Scheduling algorithms report", "s-os", 5, "medium", "todo"), a("Problem set 4", "s-math", -1, "high", "todo"),
    a("Optics lab writeup", "s-phy", 9, "low", "todo"), a("Graph theory notes", "s-math", -4, "low", "done"),
  ];
  const study = [] as AppData["study"];
  const subs = ["s-dsa", "s-dbms", "s-os", "s-math", "s-phy"];
  for (let i = 0; i < 10; i++) {
    for (let k = 0; k < 2; k++) {
      if (rnd() < 0.3) continue;
      study.push({ id: id(), subjectId: subs[Math.floor(rnd() * 5)], date: addDays(today, -i), minutes: 25 * (1 + Math.floor(rnd() * 3)), source: rnd() < 0.6 ? "timer" : "manual" });
    }
  }
  const cats = ["food", "travel", "study", "fun", "other"] as const;
  const expenses = [] as AppData["expenses"];
  const dom = parseISO(today).getDate();
  for (let i = 0; i < Math.min(dom, 25); i++) {
    const c = cats[Math.floor(rnd() * cats.length)];
    const base = { food: 120, travel: 80, study: 250, fun: 300, other: 150 }[c];
    expenses.push({ id: id(), amount: Math.round(base * (0.5 + rnd())), category: c, date: addDays(today, -i), note: { food: "Canteen", travel: "Auto", study: "Photocopies", fun: "Movie", other: "Misc" }[c] });
  }
  expenses.push({ id: id(), amount: 1500, category: "hostel", date: addDays(today, -Math.min(dom - 1, 20)), note: "Mess advance" });
  const e = (title: string, category: AppData["events"][number]["category"], organiser: string, dd: number, time: string, venue: string, reg: number, status: AppData["events"][number]["status"], team = "") =>
    ({ id: id(), title, category, organiser, date: addDays(today, dd), time, venue, regDeadline: reg ? addDays(today, reg) : "", status, team, notes: "" });
  const events = [
    e("HackIndia Regional", "hackathon", "HackIndia", 9, "09:00", "Main Auditorium", 3, "registered", "Aman, Riya, Kabir"),
    e("Intro to Rust workshop", "workshop", "Coding Club", 4, "16:00", "Lab-1", 2, "interested"),
    e("Robotics Society meetup", "society", "Robotics Society", 7, "17:30", "Seminar Hall", 0, "interested"),
    e("Techfest 2026", "fest", "Student Council", 21, "10:00", "Campus", 14, "interested"),
    e("Open Source Saturday", "club", "Coding Club", 11, "11:00", "https://meet.example.org", 0, "registered"),
    e("Design sprint", "club", "Design Club", -6, "15:00", "Room 204", 0, "attended"),
  ];
  return { subjects, slots, records, marks, tests, exams, assignments, study, expenses, events, settings };
}
