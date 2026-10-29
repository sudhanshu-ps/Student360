import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, PageHeader, Stat, useSubjectName } from "@/components/ui-kit";
import { useData } from "@/lib/store";
import { allRisks, attendanceStats, attLevel, cgpa, sgpaBySemester } from "@/lib/calc";
import { addDays, daysBetween, fmtShort, inr, monthKey, parseISO, todayISO } from "@/lib/dates";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/")({
  head: () => seo("Dashboard", "Your attendance, CGPA, deadlines, exams and spending at a glance."),
  component: Dashboard,
});

const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" } };

function Dashboard() {
  const d = useData();
  const name = useSubjectName();
  const today = todayISO();
  const T = d.settings.target;

  const att = d.subjects.map((s) => ({ s, ...attendanceStats(s, d.records) }));
  const totA = att.reduce((a, x) => a + x.attended, 0), totH = att.reduce((a, x) => a + x.held, 0);
  const overall = totH ? (totA * 100) / totH : 0;
  const below = att.filter((x) => x.pct < T).length;
  const { cgpa: cg } = cgpa(d.marks, d.settings.gradeScale);
  const sg = sgpaBySemester(d.marks, d.settings.gradeScale, d.settings.semesters);
  const week = addDays(today, 7);
  const dueWeek = d.assignments.filter((a) => a.status !== "done" && a.due >= today && a.due <= week);
  const nextExam = [...d.exams].filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const spent = d.expenses.filter((e) => monthKey(e.date) === monthKey(today)).reduce((a, e) => a + e.amount, 0);
  const todayClasses = d.slots.filter((s) => s.day === parseISO(today).getDay()).sort((a, b) => a.start.localeCompare(b.start));
  const deadlines = d.assignments.filter((a) => a.status !== "done").sort((a, b) => a.due.localeCompare(b.due)).slice(0, 5);
  const events = d.events.filter((e) => e.date >= today).sort((a, b) => a.date.localeCompare(b.date)).slice(0, 4);
  const risks = allRisks(d).filter((r) => r.level !== "low").slice(0, 3);
  const hour = new Date().getHours();

  return (
    <>
      <PageHeader title={hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening"}
        subtitle={parseISO(today).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <Stat label="Attendance" value={`${overall.toFixed(0)}%`} tone={overall < T ? "short" : "safe"} hint={`Target ${T}%`} />
        <Stat label="Below target" value={below} tone={below ? "short" : "safe"} hint="subjects" />
        <Stat label="CGPA" value={cg ? cg.toFixed(2) : "—"} hint="10-point scale" />
        <Stat label="Due this week" value={dueWeek.length} tone={dueWeek.length ? "close" : undefined} hint="assignments" />
        <Stat label="Next exam" value={nextExam ? `${daysBetween(today, nextExam.date)}d` : "—"} hint={nextExam ? name(nextExam.subjectId) : "None scheduled"} />
        <Stat label="Spent" value={inr(spent)} tone={spent >= d.settings.budget ? "short" : spent >= 0.8 * d.settings.budget ? "close" : undefined} hint={`of ${inr(d.settings.budget)}`} />
      </div>

      {risks.length > 0 && (
        <div className="mt-5 space-y-2">
          {risks.map((r, i) => (
            <Link key={i} to="/insights" className={`flex items-start gap-3 rounded-xl border p-3 text-sm ${r.level === "high" ? "bg-danger-soft" : "bg-warning-soft"}`}>
              <span className={`pill ${r.level === "high" ? "pill-short" : "pill-close"} bg-card`}>{r.level}</span>
              <span><b>{r.reason}.</b> <span className="text-muted-foreground">{r.action}.</span></span>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <Card title="Today's classes" action={<Link to="/today" className="text-sm text-primary">Mark</Link>}>
          {todayClasses.length ? (
            <ul className="space-y-2">{todayClasses.map((c) => (
              <li key={c.id} className="flex justify-between text-sm"><span className="font-medium">{name(c.subjectId)}</span><span className="text-muted-foreground">{c.start} · {c.room}</span></li>
            ))}</ul>
          ) : <p className="text-sm text-muted-foreground">No classes today. Enjoy!</p>}
        </Card>
        <Card title="Nearest deadlines" action={<Link to="/assignments" className="text-sm text-primary">All</Link>}>
          {deadlines.length ? (
            <ul className="space-y-2">{deadlines.map((a) => {
              const dd = daysBetween(today, a.due);
              return (
                <li key={a.id} className="flex justify-between gap-2 text-sm"><span className="truncate font-medium">{a.title}</span>
                  <span className={`pill ${dd < 0 ? "pill-short" : dd <= 2 ? "pill-close" : "pill-muted"}`}>{dd < 0 ? "overdue" : dd === 0 ? "today" : `${dd}d`}</span></li>
              );
            })}</ul>
          ) : <p className="text-sm text-muted-foreground">Nothing pending.</p>}
        </Card>
        <Card title="Upcoming events" action={<Link to="/events" className="text-sm text-primary">All</Link>}>
          {events.length ? (
            <ul className="space-y-2">{events.map((e) => (
              <li key={e.id} className="text-sm"><div className="flex justify-between"><span className="font-medium">{e.title}</span><span className="text-muted-foreground">{fmtShort(e.date)}</span></div>
                {e.regDeadline && e.regDeadline >= today && e.status === "interested" && <div className="text-xs text-warning">Register by {fmtShort(e.regDeadline)}</div>}</li>
            ))}</ul>
          ) : <p className="text-sm text-muted-foreground">No events coming up.</p>}
        </Card>
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="Attendance by subject">
          <div className="h-64">
            <ResponsiveContainer>
              <BarChart data={att.map((x) => ({ name: x.s.code || x.s.name, pct: +x.pct.toFixed(1), level: attLevel(x.attended, x.held, T) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis domain={[0, 100]} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip {...tip} />
                <ReferenceLine y={T} stroke="var(--danger)" strokeDasharray="4 4" label={{ value: `${T}%`, fill: "var(--danger)", fontSize: 11, position: "right" }} />
                <Bar dataKey="pct" fill="var(--chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="SGPA per semester">
          <div className="h-64">
            <ResponsiveContainer>
              <LineChart data={sg.map((x) => ({ name: x.semester, sgpa: +x.sgpa.toFixed(2) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} />
                <YAxis domain={[0, 10]} stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip {...tip} />
                <Line dataKey="sgpa" stroke="var(--chart-2)" strokeWidth={3} dot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>
    </>
  );
}
