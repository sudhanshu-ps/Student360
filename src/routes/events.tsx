import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Card, Empty, Field, Modal, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { store, uid, useData } from "@/lib/store";
import { fmtDate, fmtShort, monthKey, parseISO, toISO, todayISO } from "@/lib/dates";
import type { CampusEvent, EventCat, RegStatus } from "@/lib/types";
import { toast } from "sonner";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/events")({
  head: () => seo("Events & hackathons", "Campus events, hackathons and club calendars with registration deadlines."),
  component: Events,
});

const CATS: EventCat[] = ["hackathon", "club", "society", "fest", "workshop", "other"];
const STAT: RegStatus[] = ["interested", "registered", "attended", "missed"];

function Events() {
  const d = useData();
  const today = todayISO();
  const [ev, setEv] = useState<CampusEvent | null>(null);
  const [view, setView] = useState<"list" | "calendar">("list");
  const [cat, setCat] = useState("");
  const [org, setOrg] = useState("");
  const [month, setMonth] = useState(() => monthKey(todayISO()));
  const orgs = Array.from(new Set(d.events.map((e) => e.organiser).filter(Boolean))).sort();
  const filtered = d.events.filter((e) => (!cat || e.category === cat) && (!org || e.organiser === org)).sort((a, b) => a.date.localeCompare(b.date));
  const upcoming = filtered.filter((e) => e.date >= today), past = filtered.filter((e) => e.date < today).reverse();

  const save = () => {
    if (!ev) return;
    if (!ev.title.trim() || !ev.date) return toast.error("Title and date are required");
    store.upsert("events", ev); setEv(null);
  };

  const first = parseISO(`${month}-01`);
  const startPad = (first.getDay() + 6) % 7;
  const daysIn = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: startPad + daysIn }, (_, i) => (i < startPad ? null : toISO(new Date(first.getFullYear(), first.getMonth(), i - startPad + 1))));

  const Item = ({ e }: { e: CampusEvent }) => (
    <button onClick={() => setEv(e)} className={`card-s w-full p-4 text-left hover:ring-2 hover:ring-primary ${e.date < today ? "opacity-60" : ""}`}>
      <div className="flex flex-wrap items-center gap-2"><span className="pill pill-muted">{e.category}</span><span className={`pill ${e.status === "registered" || e.status === "attended" ? "pill-safe" : e.status === "missed" ? "pill-short" : "pill-close"}`}>{e.status}</span><span className="ml-auto text-xs text-muted-foreground">{fmtDate(e.date)} · {e.time}</span></div>
      <div className="mt-2 font-display text-lg font-semibold">{e.title}</div>
      <div className="text-sm text-muted-foreground">{e.organiser}{e.venue && ` · ${e.venue}`}</div>
      {e.regDeadline && e.status === "interested" && e.regDeadline >= today && <div className="mt-1 text-xs font-medium text-warning">Register by {fmtShort(e.regDeadline)}</div>}
      {e.team && <div className="mt-1 text-xs text-muted-foreground">Team: {e.team}</div>}
    </button>
  );

  return (
    <>
      <PageHeader title="Events & hackathons" action={<Button onClick={() => setEv({ id: uid(), title: "", category: "hackathon", organiser: "", date: today, time: "10:00", venue: "", regDeadline: "", status: "interested", team: "", notes: "" })}><Plus className="h-4 w-4" />Event</Button>} />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="flex rounded-lg border p-0.5">{(["list", "calendar"] as const).map((v) => <button key={v} onClick={() => setView(v)} className={`rounded-md px-3 py-1 text-sm capitalize ${view === v ? "bg-primary text-primary-foreground" : ""}`}>{v}</button>)}</div>
        <select className="field w-40" value={cat} onChange={(e) => setCat(e.target.value)}><option value="">All categories</option>{CATS.map((c) => <option key={c}>{c}</option>)}</select>
        <select className="field w-48" value={org} onChange={(e) => setOrg(e.target.value)}><option value="">All clubs & organisers</option>{orgs.map((c) => <option key={c}>{c}</option>)}</select>
      </div>
      {view === "list" ? (
        filtered.length === 0 ? <Empty title="No events" hint="Add a hackathon or club event." /> : (
          <>
            <div className="grid gap-3 md:grid-cols-2">{upcoming.map((e) => <Item key={e.id} e={e} />)}</div>
            {past.length > 0 && <><h3 className="mb-2 mt-6 text-sm font-semibold text-muted-foreground">Past</h3><div className="grid gap-3 md:grid-cols-2">{past.map((e) => <Item key={e.id} e={e} />)}</div></>}
          </>
        )
      ) : (
        <Card action={<input type="month" className="field w-40" value={month} onChange={(e) => setMonth(e.target.value)} />} title={first.toLocaleDateString("en-IN", { month: "long", year: "numeric" })}>
          <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">{["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((x) => <div key={x}>{x}</div>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {cells.map((c, i) => (
              <div key={i} className={`min-h-20 rounded-lg border p-1 text-xs ${!c ? "border-transparent" : c === today ? "border-primary" : ""}`}>
                {c && <div className="mb-1 text-muted-foreground">{+c.slice(8)}</div>}
                {c && filtered.filter((e) => e.date === c).map((e) => <button key={e.id} onClick={() => setEv(e)} className="mb-0.5 block w-full truncate rounded bg-primary-soft px-1 text-left text-accent-foreground">{e.title}</button>)}
              </div>
            ))}
          </div>
        </Card>
      )}
      <Modal open={!!ev} onClose={() => setEv(null)} title="Event">
        {ev && (
          <div className="grid gap-3">
            <Field label="Title"><input className="field" value={ev.title} onChange={(e) => setEv({ ...ev, title: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Category"><select className="field" value={ev.category} onChange={(e) => setEv({ ...ev, category: e.target.value as EventCat })}>{CATS.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Organiser / club"><input className="field" value={ev.organiser} onChange={(e) => setEv({ ...ev, organiser: e.target.value })} /></Field>
              <Field label="Date"><input type="date" className="field" value={ev.date} onChange={(e) => setEv({ ...ev, date: e.target.value })} /></Field>
              <Field label="Time"><input type="time" className="field" value={ev.time} onChange={(e) => setEv({ ...ev, time: e.target.value })} /></Field>
              <Field label="Venue or link"><input className="field" value={ev.venue} onChange={(e) => setEv({ ...ev, venue: e.target.value })} /></Field>
              <Field label="Register by"><input type="date" className="field" value={ev.regDeadline} onChange={(e) => setEv({ ...ev, regDeadline: e.target.value })} /></Field>
              <Field label="Status"><select className="field" value={ev.status} onChange={(e) => setEv({ ...ev, status: e.target.value as RegStatus })}>{STAT.map((c) => <option key={c}>{c}</option>)}</select></Field>
              <Field label="Team members"><input className="field" value={ev.team} onChange={(e) => setEv({ ...ev, team: e.target.value })} /></Field>
            </div>
            <Field label="Notes"><textarea rows={2} className="field" value={ev.notes} onChange={(e) => setEv({ ...ev, notes: e.target.value })} /></Field>
            <div className="flex justify-between">
              {d.events.some((m) => m.id === ev.id) ? <Button variant="ghost" onClick={() => { store.remove("events", ev.id); setEv(null); }}><Trash2 className="h-4 w-4" />Delete</Button> : <span />}
              <Button onClick={save}>Save</Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
