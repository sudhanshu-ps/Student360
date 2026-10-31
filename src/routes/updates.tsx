import { createFileRoute } from "@tanstack/react-router";
import { Card, PageHeader } from "@/components/ui-kit";
import { UPDATES } from "@/lib/updates";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/updates")({
  head: () => seo("Updates", "What's new in Student360 and what's coming next."),
  component: Updates,
});

function Updates() {
  return (
    <>
      <PageHeader title="Updates" subtitle="Released and upcoming versions. Open source under the MIT licence." />
      <div className="space-y-3">
        {UPDATES.map((u) => (
          <Card key={u.version} title={u.version} action={<span className={`pill ${u.status === "released" ? "pill-safe" : "pill-muted"}`}>{u.status}</span>}>
            <ul className="list-disc space-y-1 pl-5 text-sm">{u.items.map((i) => <li key={i}>{i}</li>)}</ul>
          </Card>
        ))}
      </div>
      <p className="mt-6 text-xs text-muted-foreground">Built with React, TanStack, Tailwind CSS, Recharts, Radix UI, lucide icons and date-fns — thanks to their open-source authors.</p>
      <div className="mt-8 border-t border-border pt-6">
  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
    Built by
  </p>
  <ul className="mt-3 grid gap-4 sm:grid-cols-3">
    <li>
      <p className="text-sm font-medium text-foreground">Sudhanshu</p>
      <p className="text-xs text-muted-foreground">Project Lead</p>
    </li>
    <li>
      <p className="text-sm font-medium text-foreground">Sunit Majhi</p>
      <p className="text-xs text-muted-foreground">Testing and Documentation</p>
    </li>
    <li>
      <p className="text-sm font-medium text-foreground">Arihant Jain</p>
      <p className="text-xs text-muted-foreground">Research and Development</p>
    </li>
     <li>
      <p className="text-sm font-medium text-foreground">Vinayak Bhardwaj</p>
      <p className="text-xs text-muted-foreground">Social Media and Promotion</p>
    </li>
  </ul>
  <p className="mt-6 text-xs text-muted-foreground">© 2026 Student360</p>
</div>
    </>
  );
}
