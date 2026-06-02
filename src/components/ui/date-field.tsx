"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ReactDOM from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils/helpers";

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function parseISO(value?: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function toISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function formatBR(d: Date): string {
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

// Monday-first index (0 = Mon ... 6 = Sun)
function mondayIndex(day: number) {
  return (day + 6) % 7;
}

export function DateField({
  value,
  onChange,
  placeholder = "Selecionar data",
  className,
  min,
}: {
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  /** ISO date (YYYY-MM-DD); earlier days are disabled */
  min?: string;
}) {
  const [open, setOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
  const lastPosRef = useRef<{ top: number; left: number; width: number }>({ top: 0, left: 0, width: 0 });
  const ref = useRef<HTMLDivElement | null>(null);
  const btnRef = useRef<HTMLButtonElement | null>(null);
  const selected = parseISO(value);
  const today = new Date();

  const [view, setView] = useState<Date>(() => {
    const base = selected || today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  useEffect(() => {
    if (open && selected) setView(new Date(selected.getFullYear(), selected.getMonth(), 1));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      // close if click is outside the trigger button (portal content is in body, not in ref)
      if (!btnRef.current?.contains(e.target as Node)) {
        setOpen(false);
        setDropdownPos(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") { setOpen(false); setDropdownPos(null); }
    }
    if (open) {
      document.addEventListener("mousedown", onDocClick);
      document.addEventListener("keydown", onKey);
    }
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const cells = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const firstDay = mondayIndex(new Date(year, month, 1).getDay());
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const list: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) list.push(new Date(year, month, d));
    return list;
  }, [view]);

  function sameDay(a: Date | null, b: Date | null) {
    return !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  return (
    <div className={cn("relative", className)} ref={ref}>
      <button
        ref={btnRef}
        type="button"
        onClick={() => {
          if (open) { setOpen(false); setDropdownPos(null); return; }
          if (btnRef.current) {
            const rect = btnRef.current.getBoundingClientRect();
            // flip upward if not enough space below
            const spaceBelow = window.innerHeight - rect.bottom;
            const dropH = 340;
            const top = spaceBelow < dropH + 8 ? rect.top - dropH - 4 : rect.bottom + 4;
            const pos = { top, left: rect.left, width: rect.width };
            lastPosRef.current = pos;
            setDropdownPos(pos);
          }
          setOpen(true);
        }}
        className={cn(
          "input-field flex items-center justify-between text-left",
          open && "border-brand ring-[3px] ring-brand/10"
        )}
      >
        <span className={selected ? "text-ink" : "text-ink-ghost"}>{selected ? formatBR(selected) : placeholder}</span>
        <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} className="text-ink-faint">
          <rect x="3" y="4" width="18" height="18" rx="3" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      </button>

      {typeof document !== "undefined" && ReactDOM.createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="datepicker-calendar"
              initial={{ opacity: 0, y: -6, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.98 }}
              transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
              style={{ position: "fixed", top: lastPosRef.current.top, left: lastPosRef.current.left, width: 286, zIndex: 9999 }}
              className="rounded-[18px] border border-border-soft bg-white p-3.5 shadow-[0_24px_60px_-22px_rgba(70,45,110,0.35),0_6px_18px_rgba(27,23,38,0.06)]"
          >
            {/* header */}
            <div className="mb-3 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() - 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-alt hover:text-ink"
                aria-label="Mês anterior"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <div className="font-display text-[14px] font-bold text-ink">
                {MONTHS[view.getMonth()]} {view.getFullYear()}
              </div>
              <button
                type="button"
                onClick={() => setView((v) => new Date(v.getFullYear(), v.getMonth() + 1, 1))}
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-muted transition hover:bg-surface-alt hover:text-ink"
                aria-label="Próximo mês"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2}><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>

            {/* weekday labels */}
            <div className="mb-1 grid grid-cols-7">
              {WEEKDAYS.map((w) => (
                <div key={w} className="py-1 text-center text-[10px] font-bold uppercase tracking-wide text-ink-ghost">{w}</div>
              ))}
            </div>

            {/* day grid */}
            <div className="grid grid-cols-7 gap-0.5">
              {cells.map((d, i) => {
                if (!d) return <div key={`e${i}`} />;
                const iso = toISO(d);
                const isSelected = sameDay(d, selected);
                const isToday = sameDay(d, today);
                const disabled = !!min && iso < min;
                return (
                  <button
                    key={iso}
                    type="button"
                    disabled={disabled}
                    onClick={() => { onChange(iso); setOpen(false); setDropdownPos(null); }}
                    className={cn(
                      "mx-auto flex h-9 w-9 items-center justify-center rounded-full text-[13px] font-semibold transition",
                      disabled && "cursor-not-allowed text-ink-ghost opacity-40",
                      !disabled && isSelected
                        ? "bg-gradient-to-br from-brand to-brand-deep text-white shadow-[0_8px_18px_-8px_rgba(255,107,87,0.7)]"
                        : !disabled && isToday
                        ? "bg-brand-light text-brand-deep"
                        : !disabled && "text-ink-soft hover:bg-surface-alt"
                    )}
                  >
                    {d.getDate()}
                  </button>
                );
              })}
            </div>

            {/* footer */}
            <div className="mt-3 flex items-center justify-between border-t border-border-soft pt-2.5">
              <button
                type="button"
                onClick={() => { onChange(toISO(today)); setOpen(false); setDropdownPos(null); }}
                className="text-[12px] font-bold text-brand-deep transition hover:text-brand"
              >
                Hoje
              </button>
              {selected && (
                <button
                  type="button"
                  onClick={() => { onChange(""); setOpen(false); setDropdownPos(null); }}
                  className="text-[12px] font-semibold text-ink-faint transition hover:text-ink"
                >
                  Limpar
                </button>
              )}
            </div>
          </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}
