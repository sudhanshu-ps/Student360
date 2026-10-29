import { Link, useLocation } from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import {
  LayoutDashboard, CalendarClock, CalendarDays, CheckCircle2, GraduationCap, FileText, ListTodo,
  Timer, Wallet, PartyPopper, Activity, MessageCircle, Settings, Sparkles, Moon, Sun, Menu,
} from "lucide-react";
import { store, useData } from "@/lib/store";

export const NAV = [
  { to: "/today", label: "Today", icon: CalendarClock },
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/timetable", label: "Timetable", icon: CalendarDays },
  { to: "/attendance", label: "Attendance", icon: CheckCircle2 },
  { to: "/academics", label: "Academics", icon: GraduationCap },
  { to: "/exams", label: "Exams", icon: FileText },
  { to: "/assignments", label: "Assignments", icon: ListTodo },
  { to: "/study", label: "Study", icon: Timer },
  { to: "/expenses", label: "Expenses", icon: Wallet },
  { to: "/events", label: "Events", icon: PartyPopper },
  { to: "/insights", label: "Insights", icon: Activity },
  { to: "/assistant", label: "Assistant", icon: MessageCircle },
  { to: "/settings", label: "Settings", icon: Settings },
  { to: "/updates", label: "Updates", icon: Sparkles },
] as const;

const MOBILE = [
  { to: "/today", label: "Today", icon: CalendarClock },
  { to: "/", label: "Home", icon: LayoutDashboard },
  { to: "/attendance", label: "Attendance", icon: CheckCircle2 },
  { to: "/study", label: "Study", icon: Timer },
  { to: "/more", label: "More", icon: Menu },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { settings } = useData();
  const path = useLocation({ select: (l) => l.pathname });
  const dark = settings.theme === "dark";

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const toggle = () => store.setSettings({ theme: dark ? "light" : "dark" });

  return (
    <div className="min-h-screen bg-background">
      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r bg-sidebar px-3 py-5 lg:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-3">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary font-display text-lg font-bold text-primary-foreground">S</span>
          <span className="font-display text-xl font-bold">Student360</span>
        </Link>
        <nav className="flex-1 space-y-0.5 overflow-y-auto">
          {NAV.map((n) => {
            const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
            return (
              <Link key={n.to} to={n.to}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}>
                <n.icon className="h-4 w-4" />{n.label}
              </Link>
            );
          })}
        </nav>
        <button onClick={toggle} className="mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-muted">
          {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}{dark ? "Light mode" : "Dark mode"}
        </button>
      </aside>

      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
        <Link to="/" className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-primary font-display font-bold text-primary-foreground">S</span>
          <span className="font-display text-lg font-bold">Student360</span>
        </Link>
        <button onClick={toggle} aria-label="Toggle theme" className="rounded-lg p-2 hover:bg-muted">
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
      </header>

      <main className="px-4 pb-28 pt-5 lg:ml-60 lg:px-10 lg:pb-12 lg:pt-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-card lg:hidden">
        {MOBILE.map((n) => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} className={`flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${active ? "text-primary" : "text-muted-foreground"}`}>
              <n.icon className="h-5 w-5" />{n.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
