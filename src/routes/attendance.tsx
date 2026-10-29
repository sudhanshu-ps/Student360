import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Empty, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { store, useData } from "@/lib/store";
import { attendanceStats, attLevel, attMessage } from "@/lib/calc";
import { fmtDate } from "@/lib/dates";
import type { AttStatus } from "@/lib/types";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/attendance")({
  head: () => seo("Attendance", "See how safe your attendance is in every subject."),
  component: Attendance,
});

function Attendance() {
  const d = useData();
  const T = d.settings.target;
  const [open, setOpen] = useState<string | null>(null);

  if (!d.subjects.length) return <><PageHeader title="Attendance" /><Empty title="No subjects yet" hint="Add subjects in the timetable." action={<Link to="/timetable"><Button>Add subjects</Button></Link>} /></>;

  return (
    <>
      <PageHeader title="Attendance" subtitle={`Target ${T}% · change it in Settings`} />
      <div className="grid gap-3 md:grid-cols-2">
        {d.subjects.map((s) => {
          const st = attendanceStats(s, d.records);
          const lvl = attLevel(st.attended, st.held, T);
          const recs = d.records.filter((r) => r.subjectId === s.id).sort((a, b) => b.date.localeCompare(a.date));
          return (
            <Card key={s.id}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-display text-lg font-semibold">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{st.attended}/{st.held} classes · opening {s.openAttended}/{s.openHeld}</div>
                </div>
                <div className="text-right">
                  <div className={`font-display text-2xl font-bold ${lvl === "safe" ? "text-success" : lvl === "close" ? "text-warning" : "text-danger"}`}>{st.pct.toFixed(1)}%</div>
                  <span className={`pill pill-${lvl}`}>{lvl}</span>
                </div>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <div className={`h-full ${lvl === "safe" ? "bg-success" : lvl === "close" ? "bg-warning" : "bg-danger"}`} style={{ width: `${Math.min(100, st.pct)}%` }} />
              </div>
              <p className="mt-3 text-sm font-medium">{attMessage(st.attended, st.held, T)}</p>
              <button className="mt-2 text-sm text-primary" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? "Hide" : "Show"} history ({recs.length})</button>
              {open === s.id && (
                <ul className="mt-2 max-h-64 space-y-1 overflow-y-auto">
                  {recs.map((r) => (
                    <li key={r.id} className="flex items-center justify-between text-sm">
                      <span>{fmtDate(r.date)}</span>
                      <select className="field h-8 w-32" value={r.status} onChange={(e) => store.upsert("records", { ...r, status: e.target.value as AttStatus })}>
                        <option value="present">present</option><option value="absent">absent</option><option value="cancelled">cancelled</option>
                      </select>
                    </li>
                  ))}
                  {!recs.length && <li className="text-sm text-muted-foreground">No records yet. Mark classes on the Today page.</li>}
                </ul>
              )}
            </Card>
          );
        })}
      </div>
    </>
  );
}
