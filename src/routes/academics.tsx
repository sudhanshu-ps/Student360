import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, Empty, Field, Modal, PageHeader, Stat, SubjectSelect, useSubjectName } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { store, uid, useData } from "@/lib/store";
import { cgpa, sgpaBySemester, sgpaNeeded } from "@/lib/calc";
import { fmtShort, todayISO } from "@/lib/dates";
import type { Mark, Test } from "@/lib/types";
import { toast } from "sonner";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/academics")({
  head: () => seo("Academics", "Grades, SGPA, CGPA and a target planner."),
  component: Academics,
});

function Academics() {
  const d = useData();
  const name = useSubjectName();
  const scale = d.settings.gradeScale;
  const [mark, setMark] = useState<Mark | null>(null);
  const [test, setTest] = useState<Test | null>(null);
  const [target, setTarget] = useState(8.5);
  const [nextCredits, setNextCredits] = useState(20);
  const sg = sgpaBySemester(d.marks, scale, d.settings.semesters);
  const cg = cgpa(d.marks, scale);
  const need = sgpaNeeded(cg.cgpa, cg.credits, target, nextCredits);

  const saveMark = () => {
    if (!mark) return;
    if (!mark.subject.trim() || mark.credits <= 0) return toast.error("Enter subject and credits above 0");
    store.upsert("marks", mark); setMark(null);
  };
  const saveTest = () => {
    if (!test) return;
    if (!test.subjectId || test.max <= 0 || test.score < 0 || test.score > test.max) return toast.error("Check subject and score (0 to max)");
    store.upsert("tests", test); setTest(null);
  };

  return (
    <>
      <PageHeader title="Academics" subtitle="Grades are converted using your grading table in Settings."
        action={<Button onClick={() => setMark({ id: uid(), subject: "", semester: d.settings.semesters[0], credits: 4, grade: scale[0]?.grade ?? "O" })}><Plus className="h-4 w-4" />Grade</Button>} />
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="CGPA" value={cg.cgpa ? cg.cgpa.toFixed(2) : "—"} hint={`${cg.credits} credits`} />
        <Stat label="Latest SGPA" value={sg.length ? sg[sg.length - 1].sgpa.toFixed(2) : "—"} hint={sg[sg.length - 1]?.semester} />
        <Stat label="Semesters" value={sg.length} />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {sg.length === 0 && <Empty title="No grades yet" hint="Add a subject grade to see SGPA and CGPA." />}
          {sg.map((s) => (
            <Card key={s.semester} title={s.semester} action={<span className="pill pill-safe">SGPA {s.sgpa.toFixed(2)}</span>}>
              <ul className="divide-y">
                {d.marks.filter((m) => m.semester === s.semester).map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                    <button className="text-left font-medium hover:text-primary" onClick={() => setMark(m)}>{m.subject}</button>
                    <span className="text-muted-foreground">{m.credits} cr · <b className="text-foreground">{m.grade}</b></span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
        </div>
        <div className="space-y-4">
          <Card title="Target planner">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Target CGPA"><input type="number" step="0.1" min={0} max={10} className="field" value={target} onChange={(e) => setTarget(+e.target.value)} /></Field>
              <Field label="Next sem credits"><input type="number" min={1} className="field" value={nextCredits} onChange={(e) => setNextCredits(+e.target.value)} /></Field>
            </div>
            <div className="mt-4 rounded-xl bg-primary-soft p-4 text-sm">
              {!cg.credits ? "Add grades first." : need > 10 ? <>You'd need <b>{need.toFixed(2)}</b> — above 10, so not reachable next semester alone.</> : need <= 0 ? "You're already above this target." : <>You need an SGPA of <b className="font-display text-xl">{need.toFixed(2)}</b> next semester.</>}
            </div>
          </Card>
          <Card title="Tests & quizzes" action={<Button size="sm" variant="outline" disabled={!d.subjects.length} onClick={() => setTest({ id: uid(), subjectId: "", name: "", date: todayISO(), score: 0, max: 20 })}><Plus className="h-4 w-4" /></Button>}>
            <p className="mb-2 text-xs text-muted-foreground">Used by the risk predictor.</p>
            <ul className="space-y-1 text-sm">
              {[...d.tests].sort((a, b) => b.date.localeCompare(a.date)).map((t) => (
                <li key={t.id}><button onClick={() => setTest(t)} className="flex w-full justify-between hover:text-primary"><span>{name(t.subjectId)} · {t.name}</span><span className="text-muted-foreground">{t.score}/{t.max} · {fmtShort(t.date)}</span></button></li>
              ))}
              {!d.tests.length && <li className="text-muted-foreground">No tests yet.</li>}
            </ul>
          </Card>
        </div>
      </div>

      <Modal open={!!mark} onClose={() => setMark(null)} title="Subject grade">
        {mark && (
          <div className="grid gap-3">
            <Field label="Subject"><input className="field" value={mark.subject} onChange={(e) => setMark({ ...mark, subject: e.target.value })} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Semester"><select className="field" value={mark.semester} onChange={(e) => setMark({ ...mark, semester: e.target.value })}>{d.settings.semesters.map((s) => <option key={s}>{s}</option>)}</select></Field>
              <Field label="Credits"><input type="number" min={0} className="field" value={mark.credits} onChange={(e) => setMark({ ...mark, credits: +e.target.value })} /></Field>
              <Field label="Grade"><select className="field" value={mark.grade} onChange={(e) => setMark({ ...mark, grade: e.target.value })}>{scale.map((g) => <option key={g.grade}>{g.grade}</option>)}</select></Field>
            </div>
            <div className="flex justify-between">
              {d.marks.some((m) => m.id === mark.id) ? <Button variant="ghost" onClick={() => { store.remove("marks", mark.id); setMark(null); }}><Trash2 className="h-4 w-4" />Delete</Button> : <span />}
              <Button onClick={saveMark}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
      <Modal open={!!test} onClose={() => setTest(null)} title="Test score">
        {test && (
          <div className="grid gap-3">
            <Field label="Subject"><SubjectSelect value={test.subjectId} onChange={(v) => setTest({ ...test, subjectId: v })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Name"><input className="field" value={test.name} onChange={(e) => setTest({ ...test, name: e.target.value })} /></Field>
              <Field label="Date"><input type="date" className="field" value={test.date} onChange={(e) => setTest({ ...test, date: e.target.value })} /></Field>
              <Field label="Score"><input type="number" min={0} className="field" value={test.score} onChange={(e) => setTest({ ...test, score: +e.target.value })} /></Field>
              <Field label="Out of"><input type="number" min={1} className="field" value={test.max} onChange={(e) => setTest({ ...test, max: +e.target.value })} /></Field>
            </div>
            <div className="flex justify-between">
              {d.tests.some((m) => m.id === test.id) ? <Button variant="ghost" onClick={() => { store.remove("tests", test.id); setTest(null); }}><Trash2 className="h-4 w-4" />Delete</Button> : <span />}
              <Button onClick={saveTest}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
