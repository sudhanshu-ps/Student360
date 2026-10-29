import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, Empty, Field, Modal, PageHeader, SubjectSelect, useSubjectName } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { store, uid, useData } from "@/lib/store";
import { DAY_NAMES, WEEK_ORDER } from "@/lib/dates";
import type { ClassSlot, Subject } from "@/lib/types";
import { toast } from "sonner";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/timetable")({
  head: () => seo("Timetable", "Your weekly class timetable and subjects."),
  component: Timetable,
});

const blank = (): ClassSlot => ({ id: uid(), subjectId: "", day: 1, start: "09:00", end: "10:00", room: "", type: "lecture" });

function Timetable() {
  const d = useData();
  const name = useSubjectName();
  const [slot, setSlot] = useState<ClassSlot | null>(null);
  const [subj, setSubj] = useState<Subject | null>(null);

  const saveSlot = () => {
    if (!slot) return;
    if (!slot.subjectId) return toast.error("Choose a subject");
    if (slot.end <= slot.start) return toast.error("End time must be after start time");
    store.upsert("slots", slot); setSlot(null); toast.success("Class saved");
  };
  const saveSubj = () => {
    if (!subj) return;
    if (!subj.name.trim()) return toast.error("Subject needs a name");
    if (subj.openAttended < 0 || subj.openHeld < subj.openAttended) return toast.error("Attended can't be more than held");
    store.upsert("subjects", { ...subj, name: subj.name.trim() }); setSubj(null);
  };

  return (
    <>
      <PageHeader title="Timetable" subtitle="Your week, class by class."
        action={<div className="flex gap-2"><Button variant="outline" onClick={() => setSubj({ id: uid(), name: "", code: "", openAttended: 0, openHeld: 0 })}><Plus className="h-4 w-4" />Subject</Button>
          <Button disabled={!d.subjects.length} onClick={() => setSlot(blank())}><Plus className="h-4 w-4" />Class</Button></div>} />

      <Card title="Subjects" className="mb-4">
        {d.subjects.length ? (
          <div className="flex flex-wrap gap-2">{d.subjects.map((s) => (
            <button key={s.id} onClick={() => setSubj(s)} className="rounded-full border px-3 py-1 text-sm hover:bg-muted">{s.name} <span className="text-muted-foreground">{s.code}</span></button>
          ))}</div>
        ) : <p className="text-sm text-muted-foreground">Add your subjects first, then add classes.</p>}
      </Card>

      {d.slots.length === 0 ? <Empty title="No classes yet" hint="Add your first class to build the week." /> : (
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          {WEEK_ORDER.slice(0, 6).map((day) => {
            const list = d.slots.filter((s) => s.day === day).sort((a, b) => a.start.localeCompare(b.start));
            return (
              <div key={day} className="card-s p-3">
                <div className="mb-2 font-display font-semibold">{DAY_NAMES[day]}</div>
                <div className="space-y-2">
                  {list.map((c) => (
                    <button key={c.id} onClick={() => setSlot(c)} className="w-full rounded-lg border-l-4 border-primary bg-primary-soft p-2 text-left text-sm">
                      <div className="font-medium">{name(c.subjectId)}</div>
                      <div className="text-xs text-muted-foreground">{c.start}–{c.end} · {c.room} · {c.type}</div>
                    </button>
                  ))}
                  {!list.length && <div className="text-xs text-muted-foreground">Free</div>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!slot} onClose={() => setSlot(null)} title="Class">
        {slot && (
          <div className="grid gap-3">
            <Field label="Subject"><SubjectSelect value={slot.subjectId} onChange={(v) => setSlot({ ...slot, subjectId: v })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Day"><select className="field" value={slot.day} onChange={(e) => setSlot({ ...slot, day: +e.target.value })}>{WEEK_ORDER.map((x) => <option key={x} value={x}>{DAY_NAMES[x]}</option>)}</select></Field>
              <Field label="Type"><select className="field" value={slot.type} onChange={(e) => setSlot({ ...slot, type: e.target.value as ClassSlot["type"] })}><option>lecture</option><option>lab</option><option>tutorial</option></select></Field>
              <Field label="Start"><input type="time" className="field" value={slot.start} onChange={(e) => setSlot({ ...slot, start: e.target.value })} /></Field>
              <Field label="End"><input type="time" className="field" value={slot.end} onChange={(e) => setSlot({ ...slot, end: e.target.value })} /></Field>
            </div>
            <Field label="Room"><input className="field" value={slot.room} onChange={(e) => setSlot({ ...slot, room: e.target.value })} /></Field>
            <div className="flex justify-between">
              {d.slots.some((s) => s.id === slot.id) ? <Button variant="ghost" onClick={() => { store.remove("slots", slot.id); setSlot(null); }}><Trash2 className="h-4 w-4" />Delete</Button> : <span />}
              <Button onClick={saveSlot}>Save</Button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!subj} onClose={() => setSubj(null)} title="Subject">
        {subj && (
          <div className="grid gap-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Field label="Name"><input className="field" value={subj.name} onChange={(e) => setSubj({ ...subj, name: e.target.value })} /></Field></div>
              <Field label="Code"><input className="field" value={subj.code} onChange={(e) => setSubj({ ...subj, code: e.target.value })} /></Field>
            </div>
            <p className="text-xs text-muted-foreground">Opening balance: classes before you started using Student360.</p>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Attended"><input type="number" min={0} className="field" value={subj.openAttended} onChange={(e) => setSubj({ ...subj, openAttended: +e.target.value })} /></Field>
              <Field label="Held"><input type="number" min={0} className="field" value={subj.openHeld} onChange={(e) => setSubj({ ...subj, openHeld: +e.target.value })} /></Field>
            </div>
            <div className="flex justify-between">
              {d.subjects.some((s) => s.id === subj.id) ? <Button variant="ghost" onClick={() => {
                if (!confirm("Delete this subject and its classes and attendance?")) return;
                store.replace("slots", d.slots.filter((s) => s.subjectId !== subj.id));
                store.replace("records", d.records.filter((s) => s.subjectId !== subj.id));
                store.remove("subjects", subj.id); setSubj(null);
              }}><Trash2 className="h-4 w-4" />Delete</Button> : <span />}
              <Button onClick={saveSubj}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
