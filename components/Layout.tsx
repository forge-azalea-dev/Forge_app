import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  FileText,
  GitBranch,
  BookMarked,
  Clock,
  MessageSquare,
  CreditCard,
  Settings,
  CheckSquare,
} from "lucide-react";
import Image from "next/image";

type LayoutProps = {
  children: React.ReactNode;
};

type NavItem = {
  label: string;
  href: string;
  icon: React.ReactNode;
  key: PageKey;
};

type PageKey =
  | "dashboard"
  | "prd"
  | "progress"
  | "prompts"
  | "sessions"
  | "todos"
  | "chat"
  | "billing"
  | "settings";

const PAGE_TITLES: Record<PageKey, string> = {
  dashboard: "Dashboard",
  prd: "PRD Manager",
  progress: "Progress Tracker",
  prompts: "Prompt Vault",
  sessions: "Session Log",
  todos: "Todo List",
  chat: "AI Chat",
  billing: "Billing Tracker",
  settings: "Settings",
};

function getPageKey(pathname: string): PageKey {
  if (pathname.startsWith("/prd")) return "prd";
  if (pathname.startsWith("/progress")) return "progress";
  if (pathname.startsWith("/prompts")) return "prompts";
  if (pathname.startsWith("/sessions")) return "sessions";
  if (pathname.startsWith("/todos")) return "todos";
  if (pathname.startsWith("/chat")) return "chat";
  if (pathname.startsWith("/billing")) return "billing";
  if (pathname.startsWith("/settings")) return "settings";
  return "dashboard";
}

function formatDateTime(now: Date): string {
  const locale = "en-US";
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  });
  const timeFormatter = new Intl.DateTimeFormat(locale, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  return `${dateFormatter.format(now)} • ${timeFormatter.format(now)}`;
}

export default function Layout({ children }: LayoutProps) {
  const router = useRouter();
  const [now, setNow] = useState<Date>(() => new Date(0));
  const [isClient, setIsClient] = useState<boolean>(false);

  useEffect(() => {
    setIsClient(true);
    const intervalId = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  const activeKey = getPageKey(router.pathname);
  const pageTitle = PAGE_TITLES[activeKey];

  const navItems: NavItem[] = [
    {
      label: "Dashboard",
      href: "/",
      icon: <LayoutDashboard className="h-4 w-4" />,
      key: "dashboard",
    },
    {
      label: "PRD Manager",
      href: "/prd",
      icon: <FileText className="h-4 w-4" />,
      key: "prd",
    },
    {
      label: "Progress",
      href: "/progress",
      icon: <GitBranch className="h-4 w-4" />,
      key: "progress",
    },
    {
      label: "Prompt Vault",
      href: "/prompts",
      icon: <BookMarked className="h-4 w-4" />,
      key: "prompts",
    },
    {
      label: "Session Log",
      href: "/sessions",
      icon: <Clock className="h-4 w-4" />,
      key: "sessions",
    },
    {
      label: "Todo List",
      href: "/todos",
      icon: <CheckSquare className="h-4 w-4" />,
      key: "todos",
    },
    {
      label: "AI Chat",
      href: "/chat",
      icon: <MessageSquare className="h-4 w-4" />,
      key: "chat",
    },
    {
      label: "Billing",
      href: "/billing",
      icon: <CreditCard className="h-4 w-4" />,
      key: "billing",
    },
    {
      label: "Settings",
      href: "/settings",
      icon: <Settings className="h-4 w-4" />,
      key: "settings",
    },
  ];

  return (
    <div className="flex min-h-screen bg-[color:var(--color-bg)] text-[color:var(--color-text)]">
      <aside className="flex h-screen w-[220px] flex-col border-r border-[color:var(--color-border)] bg-[color:var(--color-surface)]">
        <div className="flex items-center gap-2 px-4 py-4">
          <div className="relative h-12 w-12 overflow-hidden rounded-[6px] bg-[color:var(--color-bg)] shadow-[0_0_8px_rgba(139,0,0,0.3)]">
            <Image
              src="/forge-logo.png"
              alt="Forge logo"
              fill
              sizes="48px"
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col">
            <span className="font-mono text-lg font-semibold tracking-[0.15em] text-[color:var(--color-accent)]">
              FORGE
            </span>
            <span className="font-mono text-[15px] text-[color:var(--color-muted)]">
              Azalea_Dev WorkFlow
            </span>
          </div>
        </div>
        <div className="px-3 pb-2">
          <div className="h-px bg-[color:var(--color-border)]" />
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-2">
          {navItems.map((item) => {
            const isActive = item.key === activeKey;
            return (
              <Link
                key={item.key}
                href={item.href}
                className={[
                  "group flex items-center gap-2 rounded-[4px] px-4 py-2 text-sm transition-colors",
                  "relative",
                  isActive
                    ? "bg-[rgba(139,0,0,0.15)] text-[color:var(--color-text)]"
                    : "text-[color:var(--color-muted)] hover:bg-[rgba(255,255,255,0.04)]",
                ].join(" ")}
              >
                {isActive && (
                  <span className="absolute inset-y-1 left-0 w-[2px] rounded-full bg-[color:var(--color-accent)]" />
                )}
                <span className="relative flex items-center gap-2">
                  <span className="text-[color:var(--color-muted)] group-hover:text-[color:var(--color-text)]">
                    {item.icon}
                  </span>
                  <span className="font-medium">{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <div className="px-4 pb-4 pt-2">
          <div className="h-px bg-[color:var(--color-border)]" />
          <div className="mt-2 flex items-center justify-between text-[11px] text-[#444444]">
            <span className="font-mono uppercase tracking-[0.12em]">
              build
            </span>
            <span className="font-mono">v0.1.2</span>
          </div>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col">
        <header className="flex h-12 items-center justify-between border-b border-[rgba(139,0,0,0.15)] bg-[color:var(--color-bg)] px-6">
          <div className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--color-text)]">
            {pageTitle}
          </div>
          <div
            className="font-mono text-[11px] text-[color:var(--color-muted)]"
            suppressHydrationWarning
          >
            {isClient ? formatDateTime(now) : ""}
          </div>
        </header>
        <main className="flex-1 overflow-auto bg-[color:var(--color-bg)] px-6 py-4">
          <div className="mx-auto max-w-6xl">{children}</div>
        </main>
      </div>
    </div>
  );
}

