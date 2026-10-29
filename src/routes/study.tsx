import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Field, PageHeader, SubjectSelect, useSubjectName } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { store, uid, useData } from "@/lib/store";
import { addDays, DAY_NAMES, parseISO, todayISO } from "@/lib/dates";
import { toast } from "sonner";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/study")({
  head: () => seo("Study", "Pomodoro timer, study log and weekly goal."),
  component: Study,
});

const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" } };

function Study() {
  const d = useData();
  const name = useSubjectName();
  const { focusMin, breakMin, weeklyGoal } = d.settings;
  const [subject, setSubject] = useState("");
  const [mode, setMode] = useState<"focus" | "break">("focus");
  const [left, setLeft] = useState(focusMin * 60);
  const [running, setRunning] = useState(false);
  const [manual, setManual] = useState({ subjectId: "", minutes: 30, date: "" });
  const tick = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => { if (!running) setLeft((mode === "focus" ? focusMin : breakMin) * 60); }, [focusMin, breakMin, mode]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setManual((m) => ({ ...m, date: todayISO() })); }, []);

  useEffect(() => {
    if (!running) return;
    tick.current = setInterval(() => setLeft((l) => l - 1), 1000);
    return () => { if (tick.current) clearInterval(tick.current); };
  }, [running]);

  useEffect(() => {
    if (left > 0 || !running) return;
    setRunning(false);
    if (mode === "focus") {
      store.upsert("study", { id: uid(), subjectId: subject, date: todayISO(), minutes: focusMin, source: "timer" });
      toast.success(`Saved ${focusMin} min of ${name(subject)}. Take a break!`);
      setMode("break"); setLeft(breakMin * 60);
    } else {
      toast("Break over — ready for another round?");
      setMode("focus"); setLeft(focusMin * 60);
    }
  }, [left]); // eslint-disable-line react-hooks/exhaustive-deps

  const start = () => { if (mode === "focus" && !subject) return toast.error("Choose a subject first"); setRunning(true); };
  const reset = () => { setRunning(false); setLeft((mode === "focus" ? focusMin : breakMin) * 60); };

  const today = todayISO();
  const days = Array.from({ length: 7 }, (_, i) => addDays(today, i - 6));
  const week = d.study.filter((s) => s.date >= days[0]);
  const weekHrs = week.reduce((a, s) => a + s.minutes, 0) / 60;
  const perDay = days.map((day) => ({ name: DAY_NAMES[parseISO(day).getDay()], hrs: +(d.study.filter((s) => s.date === day).reduce((a, s) => a + s.minutes, 0) / 60).toFixed(1) }));
  const perSub = d.subjects.map((s) => ({ name: s.code || s.name, hrs: +(week.filter((x) => x.subjectId === s.id).reduce((a, x) => a + x.minutes, 0) / 60).toFixed(1) }));
  const total = (mode === "focus" ? focusMin : breakMin) * 60;
  const mm = String(Math.floor(Math.max(0, left) / 60)).padStart(2, "0"), ss = String(Math.max(0, left) % 60).padStart(2, "0");

  return (
    <>
      <PageHeader title="Study" subtitle={`Focus ${focusMin} min · break ${breakMin} min (change in Settings)`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <div className="flex flex-col items-center gap-5 py-4">
            <div className="flex gap-2">
              {(["focus", "break"] as const).map((m) => (
                <button key={m} disabled={running} onClick={() => setMode(m)} className={`rounded-full px-4 py-1 text-sm capitalize ${mode === m ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m}</button>
              ))}
            </div>
            <div className="relative grid h-56 w-56 place-items-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${(1 - left / total) * 360}deg, var(--muted) 0)` }}>
              <div className="grid h-48 w-48 place-items-center rounded-full bg-card font-display text-5xl font-bold tabular-nums">{mm}:{ss}</div>
            </div>
            <div className="w-64"><SubjectSelect value={subject} onChange={setSubject} /></div>
            <div className="flex gap-2">
              {running ? <Button variant="outline" onClick={() => setRunning(false)}>Pause</Button> : <Button onClick={start}>Start</Button>}
              <Button variant="ghost" onClick={reset}>Reset</Button>
            </div>
          </div>
        </Card>
        <div className="space-y-4">
          <Card title="Weekly goal">
            <div className="mb-2 flex justify-between text-sm"><span>{weekHrs.toFixed(1)} h</span><span className="text-muted-foreground">of {weeklyGoal} h</span></div>
            <Progress value={Math.min(100, (weekHrs / Math.max(1, weeklyGoal)) * 100)} />
          </Card>
          <Card title="Log offline study">
            <div className="grid gap-3">
              <SubjectSelect value={manual.subjectId} onChange={(v) => setManual({ ...manual, subjectId: v })} />
              <div className="grid grid-cols-2 gap-2">
                <Field label="Minutes"><input type="number" min={1} className="field" value={manual.minutes} onChange={(e) => setManual({ ...manual, minutes: +e.target.value })} /></Field>
                <Field label="Date"><input type="date" className="field" value={manual.date} onChange={(e) => setManual({ ...manual, date: e.target.value })} /></Field>
              </div>
              <Button variant="outline" onClick={() => {
                if (!manual.subjectId || manual.minutes <= 0) return toast.error("Choose subject and minutes");
                store.upsert("study", { id: uid(), ...manual, source: "manual" }); toast.success("Logged");
              }}>Add</Button>
            </div>
          </Card>
        </div>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Hours per subject (7 days)"><div className="h-56"><ResponsiveContainer><BarChart data={perSub}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} /><Tooltip {...tip} /><Bar dataKey="hrs" fill="var(--chart-1)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
        <Card title="Hours per day"><div className="h-56"><ResponsiveContainer><BarChart data={perDay}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} /><Tooltip {...tip} /><Bar dataKey="hrs" fill="var(--chart-2)" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      </div>
      <Card title="Recent sessions" className="mt-4">
        <ul className="divide-y text-sm">
          {[...d.study].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 10).map((s) => (
            <li key={s.id} className="flex justify-between py-2"><span>{name(s.subjectId)} <span className="text-muted-foreground">· {s.source}</span></span><span className="flex gap-3 text-muted-foreground">{s.minutes} min · {s.date}<button onClick={() => store.remove("study", s.id)} className="hover:text-danger">✕</button></span></li>
          ))}
          {!d.study.length && <li className="py-2 text-muted-foreground">No sessions yet — start the timer!</li>}
        </ul>
      </Card>
    </>
  );
}
