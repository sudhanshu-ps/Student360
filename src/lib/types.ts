// All data shapes used by Student360. Everything lives in one AppData object.
export type ID = string;

export interface Subject { id: ID; name: string; code: string; openAttended: number; openHeld: number }
export type ClassType = "lecture" | "lab" | "tutorial";
export interface ClassSlot { id: ID; subjectId: ID; day: number; start: string; end: string; room: string; type: ClassType }
export type AttStatus = "present" | "absent" | "cancelled";
export interface AttRecord { id: ID; subjectId: ID; slotId?: ID; date: string; status: AttStatus }
export interface Mark { id: ID; subject: string; semester: string; credits: number; grade: string }
export interface Test { id: ID; subjectId: ID; name: string; date: string; score: number; max: number }
export type ExamType = "internal" | "mid-sem" | "end-sem";
export interface Exam { id: ID; subjectId: ID; type: ExamType; date: string; time: string; room: string }
export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in-progress" | "done";
export interface Assignment { id: ID; title: string; subjectId: ID; due: string; priority: Priority; status: TaskStatus; notes: string }
export interface StudySession { id: ID; subjectId: ID; date: string; minutes: number; source: "timer" | "manual" }
export type ExpenseCat = "food" | "travel" | "study" | "fun" | "hostel" | "other";
export interface Expense { id: ID; amount: number; category: ExpenseCat; date: string; note: string }
export type EventCat = "hackathon" | "club" | "society" | "fest" | "workshop" | "other";
export type RegStatus = "interested" | "registered" | "attended" | "missed";
export interface CampusEvent {
  id: ID; title: string; category: EventCat; organiser: string; date: string; time: string;
  venue: string; regDeadline: string; status: RegStatus; team: string; notes: string;
}
export interface GradeRow { grade: string; min: number; points: number }
export interface Settings {
  target: number; gradeScale: GradeRow[]; internalWeight: number; endWeight: number;
  semesters: string[]; budget: number; focusMin: number; breakMin: number; weeklyGoal: number;
  theme: "light" | "dark";
}
export interface AppData {
  subjects: Subject[]; slots: ClassSlot[]; records: AttRecord[]; marks: Mark[]; tests: Test[];
  exams: Exam[]; assignments: Assignment[]; study: StudySession[]; expenses: Expense[];
  events: CampusEvent[]; settings: Settings;
}
export type Collection = Exclude<keyof AppData, "settings">;
