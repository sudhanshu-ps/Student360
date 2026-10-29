import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, Empty, Field, Modal, PageHeader, SubjectSelect, useSubjectName } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { store, uid, useData } from "@/lib/store";
import { endSemNeeded } from "@/lib/calc";
import { daysBetween, fmtDate, todayISO } from "@/lib/dates";
import type { Exam } from "@/lib/types";
import { toast } from "sonner";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/exams")({
  head: () => seo("Exams", "Exam countdowns and an end-sem marks calculator."),
  component: Exams,
});

function Exams() {
  const d = useData();
  const name = useSubjectName();
  const today = todayISO();
  const [ex, setEx] = useState<Exam | null>(null);
  const [calc, setCalc] = useState({ intObt: 28, intMax: 40, endMax: 100, wInt: d.settings.internalWeight, wEnd: d.settings.endWeight });
  const sorted = [...d.exams].sort((a, b) => {
    const pa = a.date < today, pb = b.date < today;
    return pa === pb ? a.date.localeCompare(b.date) : pa ? 1 : -1;
  });
  const scale = [...d.settings.gradeScale].sort((a, b) => b.min - a.min);
  const pass = scale.find((g) => g.points > 0 && scale.indexOf(g) === scale.filter((x) => x.points > 0).length - 1);

  const save = () => {
    if (!ex) return;
    if (!ex.subjectId || !ex.date) return toast.error("Subject and date are required");
    store.upsert("exams", ex); setEx(null);
  };

  return (
    <>
      <PageHeader title="Exams" action={<Button disabled={!d.subjects.length} onClick={() => setEx({ id: uid(), subjectId: "", type: "mid-sem", date: today, time: "09:30", room: "" })}><Plus className="h-4 w-4" />Exam</Button>} />
      {sorted.length === 0 ? <Empty title="No exams added" hint="Add an exam to start the countdown." /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((e) => {
            const left = daysBetween(today, e.date);
            const past = left < 0;
            return (
              <button key={e.id} onClick={() => setEx(e)} className={`card-s text-left transition hover:ring-2 hover:ring-primary ${past ? "opacity-50" : ""}`}>
                <div className="flex items-center justify-between"><span className="pill pill-muted">{e.type}</span><span className="text-xs text-muted-foreground">{fmtDate(e.date)} · {e.time}</span></div>
                <div className="mt-3 font-display text-lg font-semibold">{name(e.subjectId)}</div>
                <div className={`mt-1 font-display text-3xl font-bold ${past ? "text-muted-foreground" : left <= 3 ? "text-danger" : left <= 7 ? "text-warning" : "text-primary"}`}>
                  {past ? "Done" : left === 0 ? "Today" : `${left} day${left === 1 ? "" : "s"} left`}
                </div>
                <div className="text-xs text-muted-foreground">{e.room}</div>
              </button>
            );
          })}
        </div>
      )}

      <Card title="End-sem calculator" className="mt-6">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          <Field label="Internal obtained"><input type="number" className="field" value={calc.intObt} onChange={(e) => setCalc({ ...calc, intObt: +e.target.value })} /></Field>
          <Field label="Internal max"><input type="number" className="field" value={calc.intMax} onChange={(e) => setCalc({ ...calc, intMax: +e.target.value })} /></Field>
          <Field label="End-sem max"><input type="number" className="field" value={calc.endMax} onChange={(e) => setCalc({ ...calc, endMax: +e.target.value })} /></Field>
          <Field label="Internal weight %"><input type="number" className="field" value={calc.wInt} onChange={(e) => setCalc({ ...calc, wInt: +e.target.value, wEnd: 100 - +e.target.value })} /></Field>
          <Field label="End-sem weight %"><input type="number" className="field" value={calc.wEnd} onChange={(e) => setCalc({ ...calc, wEnd: +e.target.value, wInt: 100 - +e.target.value })} /></Field>
        </div>
        {calc.intObt > calc.intMax && <p className="mt-2 text-sm text-danger">Internal obtained can't be more than max.</p>}
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {scale.filter((g) => g.points > 0).map((g) => {
            const need = endSemNeeded(calc.intObt, calc.intMax, calc.endMax, calc.wInt, calc.wEnd, g.min);
            const ok = need <= calc.endMax;
            return (
              <div key={g.grade} className={`rounded-xl border p-3 ${ok ? "" : "opacity-50"}`}>
                <div className="flex justify-between text-sm"><b>{g.grade}{g === pass ? " (pass)" : ""}</b><span className="text-muted-foreground">≥ {g.min}%</span></div>
                <div className="mt-1 font-display text-xl font-bold">{ok ? `${Math.ceil(need)} / ${calc.endMax}` : "Not reachable"}</div>
              </div>
            );
          })}
        </div>
      </Card>

      <Modal open={!!ex} onClose={() => setEx(null)} title="Exam">
        {ex && (
          <div className="grid gap-3">
            <Field label="Subject"><SubjectSelect value={ex.subjectId} onChange={(v) => setEx({ ...ex, subjectId: v })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Type"><select className="field" value={ex.type} onChange={(e) => setEx({ ...ex, type: e.target.value as Exam["type"] })}><option>internal</option><option>mid-sem</option><option>end-sem</option></select></Field>
              <Field label="Room"><input className="field" value={ex.room} onChange={(e) => setEx({ ...ex, room: e.target.value })} /></Field>
              <Field label="Date"><input type="date" className="field" value={ex.date} onChange={(e) => setEx({ ...ex, date: e.target.value })} /></Field>
              <Field label="Time"><input type="time" className="field" value={ex.time} onChange={(e) => setEx({ ...ex, time: e.target.value })} /></Field>
            </div>
            <div className="flex justify-between">
              {d.exams.some((m) => m.id === ex.id) ? <Button variant="ghost" onClick={() => { store.remove("exams", ex.id); setEx(null); }}><Trash2 className="h-4 w-4" />Delete</Button> : <span />}
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
