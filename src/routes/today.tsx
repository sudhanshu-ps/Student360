import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, Empty, PageHeader, useSubjectName } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { store, uid, useData } from "@/lib/store";
import { addDays, parseISO, todayISO } from "@/lib/dates";
import type { AttStatus } from "@/lib/types";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/today")({
  head: () => seo("Today", "Mark today's classes present, absent or cancelled with one tap."),
  component: Today,
});

function Today() {
  const d = useData();
  const name = useSubjectName();
  const [date, setDate] = useState("");
  const [now, setNow] = useState("");
  useEffect(() => {
    setDate(todayISO());
    const t = () => setNow(new Date().toTimeString().slice(0, 5));
    t(); const i = setInterval(t, 30000); return () => clearInterval(i);
  }, []);
  if (!date) return null;

  const classes = d.slots.filter((s) => s.day === parseISO(date).getDay()).sort((a, b) => a.start.localeCompare(b.start));
  const isToday = date === todayISO();
  const next = isToday ? classes.find((c) => c.end > now) : undefined;

  const mark = (slotId: string, subjectId: string, status: AttStatus) => {
    const ex = d.records.find((r) => r.slotId === slotId && r.date === date);
    if (ex && ex.status === status) store.remove("records", ex.id); // tap again to clear
    else store.upsert("records", { id: ex?.id ?? uid(), slotId, subjectId, date, status });
  };

  return (
    <>
      <PageHeader title={isToday ? "Today" : parseISO(date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short" })}
        subtitle="Tap to mark. Tap the same button again to clear."
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setDate(addDays(date, -1))}>←</Button>
            <input type="date" className="field w-40" value={date} max={todayISO()} onChange={(e) => e.target.value && setDate(e.target.value)} />
            <Button variant="outline" size="sm" disabled={isToday} onClick={() => setDate(addDays(date, 1))}>→</Button>
          </div>
        } />
      {classes.length === 0 ? (
        <Empty title="No classes on this day" hint="Add classes to your weekly timetable first." action={<Link to="/timetable"><Button>Open timetable</Button></Link>} />
      ) : (
        <div className="space-y-3">
          {classes.map((c) => {
            const rec = d.records.find((r) => r.slotId === c.id && r.date === date);
            const isNext = next?.id === c.id;
            return (
              <Card key={c.id} className={isNext ? "ring-2 ring-primary" : ""}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    {isNext && <div className="pill mb-1 bg-primary text-primary-foreground">Next class</div>}
                    <div className="font-display text-lg font-semibold">{name(c.subjectId)}</div>
                    <div className="text-sm text-muted-foreground">{c.start}–{c.end} · {c.room} · {c.type}</div>
                  </div>
                  <div className="flex gap-2">
                    {(["present", "absent", "cancelled"] as AttStatus[]).map((s) => {
                      const on = rec?.status === s;
                      const style = on ? (s === "present" ? "bg-success text-primary-foreground border-success" : s === "absent" ? "bg-danger text-primary-foreground border-danger" : "bg-muted-foreground text-background border-muted-foreground") : "bg-card hover:bg-muted";
                      return <button key={s} onClick={() => mark(c.id, c.subjectId, s)} className={`rounded-lg border px-3 py-2 text-sm font-medium capitalize transition ${style}`}>{s}</button>;
                    })}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </>
  );
}
