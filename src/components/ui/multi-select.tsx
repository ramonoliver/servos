"use client";

import { useState, useRef, useEffect } from "react";
import { getInitials } from "@/lib/utils/helpers";

export type MultiSelectOption = {
  id: string;
  label: string;
  sublabel?: string;
  avatarColor?: string;
};

type Props = {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder?: string;
};

export function MultiSelect({ options, selected, onChange, placeholder = "Selecionar..." }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const selectedOptions = options.filter((o) => selected.includes(o.id));
  const filtered = options.filter(
    (o) => !selected.includes(o.id) && o.label.toLowerCase().includes(search.toLowerCase())
  );

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  }

  function remove(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    onChange(selected.filter((x) => x !== id));
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <div
        onClick={() => setOpen((v) => !v)}
        className={`min-h-[44px] w-full px-3 py-2 border-[1.5px] rounded-[12px] bg-white cursor-pointer transition-all flex flex-wrap gap-1.5 items-center ${
          open ? "border-brand ring-[3px] ring-brand/10" : "border-border hover:border-ink-ghost"
        }`}
      >
        {selectedOptions.length === 0 && (
          <span className="text-sm text-ink-ghost">{placeholder}</span>
        )}
        {selectedOptions.map((o) => (
          <span
            key={o.id}
            className="inline-flex items-center gap-1 bg-surface-alt border border-border-soft rounded-full px-2 py-0.5 text-[11px] font-medium text-ink"
          >
            {o.avatarColor && (
              <span
                className="w-3.5 h-3.5 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[7px] font-bold"
                style={{ background: o.avatarColor }}
              >
                {getInitials(o.label)[0]}
              </span>
            )}
            {o.label.split(" ")[0]}
            <button
              type="button"
              onClick={(e) => remove(o.id, e)}
              className="text-ink-faint hover:text-danger ml-0.5"
            >
              ×
            </button>
          </span>
        ))}
        <span className="ml-auto text-ink-ghost text-xs select-none">▾</span>
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full bg-white border border-border-soft rounded-[14px] shadow-lg overflow-hidden">
          <div className="p-2 border-b border-border-soft">
            <input
              autoFocus
              className="w-full text-sm px-2 py-1.5 rounded-lg border-[1.5px] border-border outline-none focus:border-brand transition-all bg-white placeholder:text-ink-ghost"
              placeholder="Buscar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="max-h-48 overflow-y-auto">
            {filtered.length === 0 && (
              <div className="px-3 py-3 text-xs text-ink-faint text-center">Nenhum resultado</div>
            )}
            {filtered.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => { toggle(o.id); setSearch(""); }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-surface-alt transition-colors"
              >
                {o.avatarColor && (
                  <span
                    className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[8px] font-bold"
                    style={{ background: o.avatarColor }}
                  >
                    {getInitials(o.label)}
                  </span>
                )}
                <div className="min-w-0">
                  <div className="text-[13px] font-medium text-ink truncate">{o.label}</div>
                  {o.sublabel && <div className="text-[10px] text-ink-faint">{o.sublabel}</div>}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
