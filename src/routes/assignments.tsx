import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Empty, Field, Modal, PageHeader, SubjectSelect, useSubjectName } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { store, uid, useData } from "@/lib/store";
import { daysBetween, fmtDate, todayISO } from "@/lib/dates";
import type { Assignment } from "@/lib/types";
import { toast } from "sonner";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/assignments")({
  head: () => seo("Assignments", "Deadlines sorted by due date, with overdue and due-soon alerts."),
  component: Assignments,
});

type Filter = "all" | "soon" | "overdue" | "done";

function Assignments() {
  const d = useData();
  const name = useSubjectName();
  const today = todayISO();
  const [f, setF] = useState<Filter>("all");
  const [a, setA] = useState<Assignment | null>(null);
  const [showDone, setShowDone] = useState(false);

  const left = (x: Assignment) => daysBetween(today, x.due);
  const sorted = [...d.assignments].sort((x, y) => x.due.localeCompare(y.due));
  const list = sorted.filter((x) =>
    f === "all" ? x.status !== "done" : f === "done" ? x.status === "done" : f === "overdue" ? x.status !== "done" && left(x) < 0 : x.status !== "done" && left(x) >= 0 && left(x) <= 2);
  const done = sorted.filter((x) => x.status === "done");

  const save = () => {
    if (!a) return;
    if (!a.title.trim() || !a.due) return toast.error("Title and due date are required");
    store.upsert("assignments", a); setA(null);
  };

  const Row = ({ x }: { x: Assignment }) => {
    const dd = left(x);
    const tone = x.status === "done" ? "" : dd < 0 ? "border-l-danger bg-danger-soft" : dd <= 2 ? "border-l-warning bg-warning-soft" : "border-l-primary";
    return (
      <div className={`card-s flex items-center gap-3 border-l-4 p-4 ${tone}`}>
        <input type="checkbox" className="h-5 w-5 accent-[var(--primary)]" checked={x.status === "done"} onChange={(e) => store.upsert("assignments", { ...x, status: e.target.checked ? "done" : "todo" })} />
        <button className="min-w-0 flex-1 text-left" onClick={() => setA(x)}>
          <div className={`font-medium ${x.status === "done" ? "line-through text-muted-foreground" : ""}`}>{x.title}</div>
          <div className="text-xs text-muted-foreground">{name(x.subjectId)} · due {fmtDate(x.due)} · {x.priority} · {x.status}</div>
        </button>
        {x.status !== "done" && <span className={`pill ${dd < 0 ? "pill-short" : dd <= 2 ? "pill-close" : "pill-muted"}`}>{dd < 0 ? `${-dd}d overdue` : dd === 0 ? "today" : `${dd}d`}</span>}
      </div>
    );
  };

  return (
    <>
      <PageHeader title="Assignments" action={<Button onClick={() => setA({ id: uid(), title: "", subjectId: d.subjects[0]?.id ?? "", due: today, priority: "medium", status: "todo", notes: "" })}><Plus className="h-4 w-4" />Assignment</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        {(["all", "soon", "overdue", "done"] as Filter[]).map((x) => (
          <button key={x} onClick={() => setF(x)} className={`rounded-full border px-3 py-1 text-sm ${f === x ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
            {x === "soon" ? "Due soon" : x[0].toUpperCase() + x.slice(1)}
          </button>
        ))}
      </div>
      {list.length === 0 ? <Empty title="Nothing here" hint="You're all caught up." /> : <div className="space-y-2">{list.map((x) => <Row key={x.id} x={x} />)}</div>}
      {f === "all" && done.length > 0 && (
        <div className="mt-6">
          <button className="text-sm text-muted-foreground" onClick={() => setShowDone(!showDone)}>{showDone ? "▾" : "▸"} Done ({done.length})</button>
          {showDone && <div className="mt-2 space-y-2">{done.map((x) => <Row key={x.id} x={x} />)}</div>}
        </div>
      )}

      <Modal open={!!a} onClose={() => setA(null)} title="Assignment">
        {a && (
          <div className="grid gap-3">
            <Field label="Title"><input className="field" value={a.title} onChange={(e) => setA({ ...a, title: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Subject"><SubjectSelect value={a.subjectId} onChange={(v) => setA({ ...a, subjectId: v })} /></Field>
              <Field label="Due date"><input type="date" className="field" value={a.due} onChange={(e) => setA({ ...a, due: e.target.value })} /></Field>
              <Field label="Priority"><select className="field" value={a.priority} onChange={(e) => setA({ ...a, priority: e.target.value as Assignment["priority"] })}><option>low</option><option>medium</option><option>high</option></select></Field>
              <Field label="Status"><select className="field" value={a.status} onChange={(e) => setA({ ...a, status: e.target.value as Assignment["status"] })}><option value="todo">to do</option><option value="in-progress">in progress</option><option value="done">done</option></select></Field>
            </div>
            <Field label="Notes"><textarea rows={3} className="field" value={a.notes} onChange={(e) => setA({ ...a, notes: e.target.value })} /></Field>
            <div className="flex justify-between">
              {d.assignments.some((m) => m.id === a.id) ? <Button variant="ghost" onClick={() => { store.remove("assignments", a.id); setA(null); }}><Trash2 className="h-4 w-4" />Delete</Button> : <span />}
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
