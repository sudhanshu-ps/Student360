import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, Empty, PageHeader, SubjectSelect } from "@/components/ui-kit";
import { Slider } from "@/components/ui/slider";
import { useData } from "@/lib/store";
import { allRisks, attendanceStats, attLevel, attMessage, cgpa, gradeFor, pointsFor } from "@/lib/calc";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/insights")({
  head: () => seo("Insights", "Risk predictor and what-if simulator for attendance and marks."),
  component: Insights,
});

function Insights() {
  const d = useData();
  const T = d.settings.target;
  const risks = allRisks(d);
  const [sub, setSub] = useState("");
  const [skip, setSkip] = useState(0);
  const [attend, setAttend] = useState(0);
  const [mSub, setMSub] = useState("");
  const [score, setScore] = useState(70);

  const s = d.subjects.find((x) => x.id === (sub || d.subjects[0]?.id));
  const st = s ? attendanceStats(s, d.records) : null;
  const after = st ? { attended: st.attended + attend, held: st.held + attend + skip } : null;

  // Marks what-if: estimated grade from tests + new score, replacing that subject's grade in the latest semester.
  const ms = d.subjects.find((x) => x.id === (mSub || d.subjects[0]?.id));
  const tests = ms ? d.tests.filter((t) => t.subjectId === ms.id) : [];
  const curPct = tests.length ? tests.reduce((a, t) => a + (t.score / t.max) * 100, 0) / tests.length : 0;
  const newPct = (curPct * tests.length + score) / (tests.length + 1);
  const scale = d.settings.gradeScale;
  const curGrade = gradeFor(curPct, scale), newGrade = gradeFor(newPct, scale);
  const cur = cgpa(d.marks, scale);
  const credits = 4;
  const cgWith = (g: string) => (cur.cgpa * cur.credits + credits * pointsFor(g, scale)) / (cur.credits + credits);

  if (!d.subjects.length) return <><PageHeader title="Insights" /><Empty title="Add subjects to see insights" /></>;

  const Side = ({ label, pct, level, msg }: { label: string; pct: number; level: string; msg: string }) => (
    <div className="rounded-xl border p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className={`font-display text-3xl font-bold ${level === "safe" ? "text-success" : level === "close" ? "text-warning" : "text-danger"}`}>{pct.toFixed(1)}%</div>
      <span className={`pill pill-${level}`}>{level}</span>
      <p className="mt-2 text-sm">{msg}</p>
    </div>
  );

  return (
    <>
      <PageHeader title="Insights" subtitle="Simple trend maths on your own data. Simulations are never saved." />
      <Card title="Risk predictor">
        <ul className="space-y-2">
          {risks.map((r, i) => (
            <li key={i} className="flex items-start gap-3 rounded-xl border p-3 text-sm">
              <span className={`pill ${r.level === "high" ? "pill-short" : r.level === "medium" ? "pill-close" : "pill-safe"}`}>{r.level}</span>
              <div><div className="font-medium">{r.reason}</div><div className="text-muted-foreground">{r.action} · {r.kind}</div></div>
            </li>
          ))}
        </ul>
      </Card>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="What if: attendance">
          <SubjectSelect value={sub || d.subjects[0].id} onChange={(v) => { setSub(v); setSkip(0); setAttend(0); }} />
          <div className="mt-4 space-y-4 text-sm">
            <div><div className="mb-2 flex justify-between"><span>I skip</span><b>{skip} classes</b></div><Slider min={0} max={20} step={1} value={[skip]} onValueChange={(v) => setSkip(v[0])} /></div>
            <div><div className="mb-2 flex justify-between"><span>I attend the next</span><b>{attend} classes</b></div><Slider min={0} max={30} step={1} value={[attend]} onValueChange={(v) => setAttend(v[0])} /></div>
          </div>
          {st && after && (
            <div className="mt-4 grid grid-cols-2 gap-3">
              <Side label="Now" pct={st.pct} level={attLevel(st.attended, st.held, T)} msg={attMessage(st.attended, st.held, T)} />
              <Side label="After" pct={after.held ? (after.attended * 100) / after.held : 100} level={attLevel(after.attended, after.held, T)} msg={attMessage(after.attended, after.held, T)} />
            </div>
          )}
        </Card>
        <Card title="What if: marks">
          <SubjectSelect value={mSub || d.subjects[0].id} onChange={setMSub} />
          <div className="mt-4 text-sm"><div className="mb-2 flex justify-between"><span>I score in the next test</span><b>{score}%</b></div><Slider min={0} max={100} step={1} value={[score]} onValueChange={(v) => setScore(v[0])} /></div>
          <div className="mt-4 grid grid-cols-2 gap-3">
            {[{ l: "Now", p: curPct, g: curGrade }, { l: "After", p: newPct, g: newGrade }].map((x) => (
              <div key={x.l} className="rounded-xl border p-4">
                <div className="text-xs uppercase text-muted-foreground">{x.l}</div>
                <div className="font-display text-3xl font-bold">{x.g.grade}</div>
                <div className="text-sm text-muted-foreground">avg {x.p.toFixed(1)}% · {x.g.points} pts</div>
                <div className="mt-2 text-sm">Est. SGPA impact: {x.g.points.toFixed(1)} · CGPA ≈ <b>{cur.credits ? cgWith(x.g.grade).toFixed(2) : "—"}</b></div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Estimate assumes a {credits}-credit subject added to your current CGPA.</p>
        </Card>
      </div>
    </>
  );
}
