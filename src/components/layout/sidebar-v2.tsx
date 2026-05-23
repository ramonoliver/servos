"use client";
import Link from "next/link";
import { Avatar } from "@/components/ui";
import { getIconEmoji } from "@/lib/utils/helpers";
import type { User, Department } from "@/types";

function SvgIcon({ name, size = 18 }: { name: string; size?: number }) {
  const s = {
    width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: 1.8,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
  };
  const icons: Record<string, React.ReactNode> = {
    home: <><path d="M3 9.5L12 3l9 6.5V20a2 2 0 01-2 2H5a2 2 0 01-2-2V9.5z" /><polyline points="9 22 9 12 15 12 15 22" /></>,
    calendar: <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></>,
    "check-square": <><polyline points="9 11 12 14 22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></>,
    users: <><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87" /><path d="M16 3.13a4 4 0 010 7.75" /></>,
    user: <><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></>,
    star: <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26" />,
    "calendar-days": <><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /><rect x="7" y="14" width="3" height="3" rx="0.5" /><rect x="14" y="14" width="3" height="3" rx="0.5" /></>,
    bell: <><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></>,
    "message-circle": <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />,
    "bar-chart": <><line x1="12" y1="20" x2="12" y2="10" /><line x1="18" y1="20" x2="18" y2="4" /><line x1="6" y1="20" x2="6" y2="16" /></>,
    settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" /></>,
    "log-out": <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></>,
    chevrons: <><polyline points="11 17 6 12 11 7" /><polyline points="18 17 13 12 18 7" /></>,
  };
  return <svg {...s}>{icons[name] ?? icons.home}</svg>;
}

function ServosLogo() {
  return (
    <div className="w-7 h-7 rounded-lg bg-brand flex items-center justify-center shadow-sm flex-shrink-0">
      <svg viewBox="0 0 180 201" fill="none" width="15" height="17">
        <path d="M74.97 48.53c9.53.03 32.73 17.37 41.45 23.66 26.31 18.98 55.86 31.69 59.08 67.85 1.16 14.63-3.07 27.67-11.64 37.82-13.36 17.09-37.81 24.46-57.27 16.06-18.41-8.6-14.96-12.85-33.77-2.56C57.86 200.4 36.23 197.68 22.15 185.8c-5.7-5.86-9.68-10.73-11.54-19.78a38.26 38.26 0 014.23-30.06c2.34-3.74 6.94-6.88 11.24-7.8 10.76-2.07 20.59 8.98 28.06 14.38 7.74 5.69 15.62 10.67 22.83 15.45 9.06 5.87 20.07 10.68 31.87 8.05 12.34-3.03 23.13-13.74 25.18-27.28 4.01-25.93-21.95-35.26-38.77-47.17-10.62-7.58-39.16-21.78-27.39-37.97 3.2-3.97 5.9-5.24 10.65-6.09z" fill="rgba(255,255,255,.85)" />
        <path d="M49.85.99c7.01-1.42 16.82.42 23.6 2.83 7.04 2.51 16.36 9.86 23.94 8.67 7.83-1.17 14.56-8.2 22.63-9.87 12.3-3.2 25.7-2.72 36.94 3.52 9.52 5.29 16.59 14.09 19.69 23.53 4.97 17.27-2.97 47.83-27.4 40.58-3.61-1.07-8.72-5.67-12.07-7.84-13.39-8.72-26.22-18.36-39.88-26.65-9.6-5.83-22.83-8.68-33.79-5.86-8.82 2.43-15.46 8.38-19.78 15.64-4.73 8.67-4.78 16.61-2.16 24.83 5.67 15.16 24.97 23.2 37.52 31.06 10.28 7.14 40.88 21.48 28.6 37.38-2.57 3.29-6.34 5.42-10.49 5.94-9.79 1.19-24.89-12.07-32.24-17.01-13.06-8.86-25.9-18.72-38.67-28.05C-17.03 75.29-2.73 7.24 49.85.99z" fill="rgba(255,255,255,.85)" />
      </svg>
    </div>
  );
}

export interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

interface SidebarV2Props {
  user: User;
  churchName: string;
  departments: Department[];
  navItems: NavItem[];
  pathname: string;
  collapsed: boolean;
  onToggleCollapse: () => void;
  onLogout: () => void;
}

export function SidebarV2({
  user, churchName, departments, navItems, pathname, collapsed, onToggleCollapse, onLogout,
}: SidebarV2Props) {
  const compact = collapsed;

  return (
    <aside
      className={`${compact ? "w-[60px]" : "w-[240px]"} bg-sidebar-bg border-r border-sidebar-border flex flex-col flex-shrink-0 transition-all duration-300 overflow-hidden`}
    >
      {/* Header */}
      <div className={`flex items-center gap-2.5 px-3 py-3.5 border-b border-sidebar-border ${compact ? "justify-center" : ""}`}>
        <ServosLogo />
        {!compact && (
          <>
            <span className="font-display text-[16px] font-bold tracking-tight text-ink flex-1 truncate">Servos</span>
            <span className="text-[9px] font-semibold text-ink-faint bg-white px-1.5 py-0.5 rounded-full border border-sidebar-border">
              {churchName.split(" ").map((w) => w[0]).join("").slice(0, 3).toUpperCase()}
            </span>
          </>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5">
        {navItems.map((item) => {
          const active = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              title={compact ? item.label : undefined}
              className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] font-medium transition-colors ${compact ? "justify-center" : ""} ${
                active ? "bg-black/[.06] text-ink" : "text-ink-muted hover:bg-black/[.04] hover:text-ink"
              }`}
            >
              <SvgIcon name={item.icon} size={17} />
              {!compact && <span className="flex-1">{item.label}</span>}
              {!compact && item.badge ? (
                <span className="text-[10px] font-bold bg-brand text-white px-1.5 py-px rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}

        {departments.length > 0 && (
          <>
            {!compact && (
              <div className="text-[9px] font-bold tracking-widest uppercase text-ink-faint px-2.5 pt-4 pb-1">
                Ministérios
              </div>
            )}
            {departments.map((d) => (
              <Link
                key={d.id}
                href={`/ministerios/${d.id}`}
                title={compact ? d.name : undefined}
                className={`flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors ${compact ? "justify-center" : "pl-5"} ${
                  pathname === `/ministerios/${d.id}` ? "bg-black/[.06] text-ink" : "text-ink-muted hover:bg-black/[.04] hover:text-ink"
                }`}
              >
                <span className="text-sm">{getIconEmoji(d.icon)}</span>
                {!compact && <span className="truncate">{d.name}</span>}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-2 py-3 border-t border-sidebar-border">
        <div className={`flex items-center gap-2 ${compact ? "justify-center" : ""}`}>
          <Avatar name={user.name} color={user.avatar_color} photoUrl={user.photo_url} size={30} />
          {!compact && (
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold truncate text-ink">{user.name}</div>
              <div className="text-[10px] text-ink-faint capitalize">{user.role === "admin" ? "Admin" : user.role === "leader" ? "Líder" : "Membro"}</div>
            </div>
          )}
          <button onClick={onLogout} className="text-ink-faint hover:text-danger transition-colors p-1 ml-auto" title="Sair">
            <SvgIcon name="log-out" size={15} />
          </button>
        </div>
        {!compact && (
          <button
            onClick={onToggleCollapse}
            className="mt-2 w-full flex items-center justify-center gap-1.5 text-[10px] text-ink-faint hover:text-ink-muted transition-colors py-1"
          >
            <SvgIcon name="chevrons" size={13} />
            Recolher
          </button>
        )}
      </div>
    </aside>
  );
}
