// Small shared building blocks for every page.
import type { ReactNode } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useData } from "@/lib/store";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`card-s ${className}`}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-base font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "safe" | "close" | "short" }) {
  const color = tone === "short" ? "text-danger" : tone === "close" ? "text-warning" : tone === "safe" ? "text-success" : "text-foreground";
  return (
    <div className="card-s">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</div>
      <div className={`mt-2 font-display text-3xl font-bold ${color}`}>{value}</div>
      {hint && <div className="mt-1 text-xs text-muted-foreground">{hint}</div>}
    </div>
  );
}

export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed p-8 text-center">
      <div className="font-display text-lg font-semibold">{title}</div>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return <label className="block"><span className="label-s">{label}</span>{children}</label>;
}

export function Modal({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        {children}
      </DialogContent>
    </Dialog>
  );
}

export function useSubjectName() {
  const { subjects } = useData();
  return (id: string) => subjects.find((s) => s.id === id)?.name ?? "—";
}

export function SubjectSelect({ value, onChange, allowAll }: { value: string; onChange: (v: string) => void; allowAll?: boolean }) {
  const { subjects } = useData();
  return (
    <select className="field" value={value} onChange={(e) => onChange(e.target.value)}>
      {allowAll && <option value="">All subjects</option>}
      {!allowAll && <option value="" disabled>Choose subject</option>}
      {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
    </select>
  );
}

/** Wait for the browser so data from localStorage and charts render cleanly. */
export function useReady() {
  const d = useData();
  return d !== undefined;
}
