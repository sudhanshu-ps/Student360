import { createFileRoute } from "@tanstack/react-router";
import { useRef } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, Field, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { store, useData } from "@/lib/store";
import { toast } from "sonner";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/settings")({
  head: () => seo("Settings", "Attendance target, grading scale, budget, timer and backups."),
  component: SettingsPage,
});

function SettingsPage() {
  const d = useData();
  const s = d.settings;
  const file = useRef<HTMLInputElement>(null);
  const num = (k: keyof typeof s, min: number, max: number) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = +e.target.value;
    if (Number.isNaN(v) || v < min || v > max) return toast.error(`Enter a number from ${min} to ${max}`);
    store.setSettings({ [k]: v });
  };

  const exportAll = () => {
    const blob = new Blob([JSON.stringify(store.get(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `student360-backup-${new Date().toISOString().slice(0, 10)}.json`; a.click();
  };
  const importAll = async (f: File) => {
    try {
      const data = JSON.parse(await f.text());
      if (!data || !Array.isArray(data.subjects) || typeof data.settings !== "object") throw new Error();
      store.importAll(data); toast.success("Backup restored");
    } catch { toast.error("That file isn't a valid Student360 backup"); }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Saved on this device and used by every page." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="General">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Attendance target %"><input type="number" className="field" defaultValue={s.target} onBlur={num("target", 1, 100)} /></Field>
            <Field label="Monthly budget (₹)"><input type="number" className="field" defaultValue={s.budget} onBlur={num("budget", 0, 10000000)} /></Field>
            <Field label="Focus minutes"><input type="number" className="field" defaultValue={s.focusMin} onBlur={num("focusMin", 1, 180)} /></Field>
            <Field label="Break minutes"><input type="number" className="field" defaultValue={s.breakMin} onBlur={num("breakMin", 1, 60)} /></Field>
            <Field label="Weekly study goal (h)"><input type="number" className="field" defaultValue={s.weeklyGoal} onBlur={num("weeklyGoal", 0, 100)} /></Field>
            <Field label="Theme"><select className="field" value={s.theme} onChange={(e) => store.setSettings({ theme: e.target.value as "light" | "dark" })}><option value="light">Light</option><option value="dark">Dark</option></select></Field>
            <Field label="Internal weight %"><input type="number" className="field" value={s.internalWeight} onChange={(e) => { const v = Math.min(100, Math.max(0, +e.target.value)); store.setSettings({ internalWeight: v, endWeight: 100 - v }); }} /></Field>
            <Field label="End-sem weight %"><input type="number" className="field" value={s.endWeight} readOnly /></Field>
          </div>
          <div className="mt-3"><Field label="Semester names (comma separated)"><input className="field" defaultValue={s.semesters.join(", ")} onBlur={(e) => { const list = e.target.value.split(",").map((x) => x.trim()).filter(Boolean); if (list.length) store.setSettings({ semesters: list }); }} /></Field></div>
        </Card>
        <Card title="Grading scale" action={<Button size="sm" variant="outline" onClick={() => store.setSettings({ gradeScale: [...s.gradeScale, { grade: "?", min: 0, points: 0 }] })}><Plus className="h-4 w-4" /></Button>}>
          <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-2 text-xs text-muted-foreground"><span>Grade</span><span>Min %</span><span>Points</span><span /></div>
          {s.gradeScale.map((g, i) => {
            const upd = (p: Partial<typeof g>) => store.setSettings({ gradeScale: s.gradeScale.map((x, j) => (j === i ? { ...x, ...p } : x)) });
            return (
              <div key={i} className="mt-2 grid grid-cols-[1fr_1fr_1fr_auto] gap-2">
                <input className="field" value={g.grade} onChange={(e) => upd({ grade: e.target.value })} />
                <input type="number" className="field" value={g.min} onChange={(e) => upd({ min: +e.target.value })} />
                <input type="number" className="field" value={g.points} onChange={(e) => upd({ points: +e.target.value })} />
                <Button variant="ghost" size="icon" onClick={() => store.setSettings({ gradeScale: s.gradeScale.filter((_, j) => j !== i) })}><Trash2 className="h-4 w-4" /></Button>
              </div>
            );
          })}
        </Card>
        <Card title="Backup & data">
          <div className="flex flex-wrap gap-2">
            <Button onClick={exportAll}>Export JSON</Button>
            <Button variant="outline" onClick={() => file.current?.click()}>Import JSON</Button>
            <input ref={file} type="file" accept="application/json" className="hidden" onChange={(e) => e.target.files?.[0] && importAll(e.target.files[0])} />
            <Button variant="outline" onClick={() => { if (confirm("Replace everything with demo data?")) { store.loadDemo(); toast.success("Demo data loaded"); } }}>Load demo data</Button>
            <Button variant="destructive" onClick={() => { if (confirm("Delete all your data? Settings are kept.")) { store.reset(); toast.success("All data cleared"); } }}>Clear all data</Button>
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Your data stays in this browser. Export regularly to keep a backup.</p>
        </Card>
      </div>
    </>
  );
}
