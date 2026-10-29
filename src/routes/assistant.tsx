import { createFileRoute } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { Send } from "lucide-react";
import { Card, PageHeader } from "@/components/ui-kit";
import { Button } from "@/components/ui/button";
import { store } from "@/lib/store";
import { ruleBasedAnswer, type Answerer } from "@/lib/assistant";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/assistant")({
  head: () => seo("Assistant", "Ask questions about your own attendance, deadlines, exams and money."),
  component: Assistant,
});

const answer: Answerer = ruleBasedAnswer; // swap for a local-model answerer later
const SUGGEST = ["Can I skip tomorrow's class?", "What is due this week?", "When is my next exam?", "Which subject is most at risk?", "What is my CGPA?", "How much have I spent this month?", "What events are coming?"];

function Assistant() {
  const [msgs, setMsgs] = useState<{ from: "me" | "bot"; text: string }[]>([{ from: "bot", text: "Hi! Ask me anything about your college day." }]);
  const [q, setQ] = useState("");
  const end = useRef<HTMLDivElement>(null);
  const ask = async (text: string) => {
    if (!text.trim()) return;
    setQ("");
    const reply = await answer(text, store.get());
    setMsgs((m) => [...m, { from: "me", text }, { from: "bot", text: reply }]);
    setTimeout(() => end.current?.scrollIntoView({ behavior: "smooth" }), 50);
  };
  return (
    <>
      <PageHeader title="Assistant" subtitle="Answers come only from your own data, right on this device." />
      <Card>
        <div className="h-[50vh] space-y-3 overflow-y-auto pr-1">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.from === "me" ? "justify-end" : ""}`}>
              <div className={`max-w-[80%] whitespace-pre-line rounded-2xl px-4 py-2 text-sm ${m.from === "me" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m.text}</div>
            </div>
          ))}
          <div ref={end} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">{SUGGEST.map((s) => <button key={s} onClick={() => ask(s)} className="rounded-full border px-3 py-1 text-xs hover:bg-muted">{s}</button>)}</div>
        <form className="mt-3 flex gap-2" onSubmit={(e) => { e.preventDefault(); ask(q); }}>
          <input className="field" placeholder="Type a question…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" aria-label="Send"><Send className="h-4 w-4" /></Button>
        </form>
      </Card>
    </>
  );
}
