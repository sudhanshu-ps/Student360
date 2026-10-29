import { createFileRoute, Link } from "@tanstack/react-router";
import { PageHeader } from "@/components/ui-kit";
import { NAV } from "@/components/AppShell";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/more")({
  head: () => seo("More", "All Student360 sections."),
  component: More,
});

function More() {
  return (
    <>
      <PageHeader title="More" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className="card-s flex flex-col items-start gap-3 hover:ring-2 hover:ring-primary">
            <n.icon className="h-6 w-6 text-primary" /><span className="font-medium">{n.label}</span>
          </Link>
        ))}
      </div>
    </>
  );
}
