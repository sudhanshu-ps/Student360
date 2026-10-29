import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Cell, Line, LineChart, CartesianGrid, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Card, Empty, Field, Modal, PageHeader, Stat } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { store, uid, useData } from "@/lib/store";
import { fmtDate, inr, monthKey, todayISO } from "@/lib/dates";
import type { Expense, ExpenseCat } from "@/lib/types";
import { toast } from "sonner";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/expenses")({
  head: () => seo("Expenses", "Track spending in rupees against your monthly budget."),
  component: Expenses,
});

const CATS: ExpenseCat[] = ["food", "travel", "study", "fun", "hostel", "other"];
const COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--muted-foreground)"];
const tip = { contentStyle: { background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--foreground)" } };

function Expenses() {
  const d = useData();
  const [x, setX] = useState<Expense | null>(null);
  const [month, setMonth] = useState(() => monthKey(todayISO()));
  const budget = d.settings.budget;
  const list = d.expenses.filter((e) => monthKey(e.date) === month).sort((a, b) => b.date.localeCompare(a.date));
  const spent = list.reduce((a, e) => a + e.amount, 0);
  const pct = budget ? (spent / budget) * 100 : 0;
  const pie = CATS.map((c) => ({ name: c, value: list.filter((e) => e.category === c).reduce((a, e) => a + e.amount, 0) })).filter((p) => p.value);
  const byDay = Array.from(new Set(list.map((e) => e.date))).sort().map((day) => ({ name: day.slice(8), amt: list.filter((e) => e.date === day).reduce((a, e) => a + e.amount, 0) }));

  const save = () => {
    if (!x) return;
    if (!(x.amount > 0) || !x.date) return toast.error("Amount must be above 0");
    store.upsert("expenses", x); setX(null);
  };

  return (
    <>
      <PageHeader title="Expenses" action={<div className="flex gap-2"><input type="month" className="field w-40" value={month} onChange={(e) => setMonth(e.target.value)} /><Button onClick={() => setX({ id: uid(), amount: 0, category: "food", date: todayISO(), note: "" })}><Plus className="h-4 w-4" />Expense</Button></div>} />
      {pct >= 100 ? <div className="mb-4 rounded-xl bg-danger-soft p-3 text-sm font-medium text-danger">You've used your whole budget for this month.</div>
        : pct >= 80 ? <div className="mb-4 rounded-xl bg-warning-soft p-3 text-sm font-medium text-warning">Heads up: {pct.toFixed(0)}% of your budget is spent.</div> : null}
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Spent" value={inr(spent)} tone={pct >= 100 ? "short" : pct >= 80 ? "close" : undefined} />
        <Stat label="Budget" value={inr(budget)} hint="Set in Settings" />
        <Stat label="Remaining" value={inr(budget - spent)} tone={budget - spent < 0 ? "short" : "safe"} />
      </div>
      <div className="mt-3"><Progress value={Math.min(100, pct)} /></div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card title="By category">
          {pie.length ? <div className="h-60"><ResponsiveContainer><PieChart><Pie data={pie} dataKey="value" nameKey="name" innerRadius={50} outerRadius={90} paddingAngle={2}>{pie.map((p) => <Cell key={p.name} fill={COLORS[CATS.indexOf(p.name as ExpenseCat)]} />)}</Pie><Tooltip {...tip} formatter={(v: number) => inr(v)} /></PieChart></ResponsiveContainer></div> : <p className="text-sm text-muted-foreground">No spending this month.</p>}
          <div className="flex flex-wrap gap-3 text-xs">{pie.map((p) => <span key={p.name} className="flex items-center gap-1"><span className="h-2 w-2 rounded-full" style={{ background: COLORS[CATS.indexOf(p.name as ExpenseCat)] }} />{p.name} {inr(p.value)}</span>)}</div>
        </Card>
        <Card title="Daily spending"><div className="h-60"><ResponsiveContainer><LineChart data={byDay}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} /><Tooltip {...tip} formatter={(v: number) => inr(v)} /><Line dataKey="amt" stroke="var(--chart-1)" strokeWidth={2.5} dot={false} /></LineChart></ResponsiveContainer></div></Card>
      </div>
      <Card title="Transactions" className="mt-4">
        {list.length ? <ul className="divide-y">{list.map((e) => (
          <li key={e.id}><button onClick={() => setX(e)} className="flex w-full items-center justify-between py-2 text-left text-sm hover:text-primary">
            <span><span className="pill pill-muted mr-2">{e.category}</span>{e.note || "—"}</span><span className="flex gap-3"><span className="text-muted-foreground">{fmtDate(e.date)}</span><b>{inr(e.amount)}</b></span></button></li>
        ))}</ul> : <Empty title="No expenses this month" />}
      </Card>
      <Modal open={!!x} onClose={() => setX(null)} title="Expense">
        {x && (
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Amount (₹)"><input type="number" min={0} className="field" value={x.amount || ""} onChange={(e) => setX({ ...x, amount: +e.target.value })} /></Field>
              <Field label="Category"><select className="field" value={x.category} onChange={(e) => setX({ ...x, category: e.target.value as ExpenseCat })}>{CATS.map((c) => <option key={c} value={c}>{c === "hostel" ? "hostel/rent" : c}</option>)}</select></Field>
              <Field label="Date"><input type="date" className="field" value={x.date} onChange={(e) => setX({ ...x, date: e.target.value })} /></Field>
              <Field label="Note"><input className="field" value={x.note} onChange={(e) => setX({ ...x, note: e.target.value })} /></Field>
            </div>
            <div className="flex justify-between">
              {d.expenses.some((m) => m.id === x.id) ? <Button variant="ghost" onClick={() => { store.remove("expenses", x.id); setX(null); }}><Trash2 className="h-4 w-4" />Delete</Button> : <span />}
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
