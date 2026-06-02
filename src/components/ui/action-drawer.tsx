"use client";
import { useEffect } from "react";

interface ActionDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  width?: number;
  footer?: React.ReactNode;
}

export function ActionDrawer({ open, onClose, title, children, width = 380, footer }: ActionDrawerProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`!mt-0 fixed inset-0 bg-ink/30 backdrop-blur-[2px] z-40 transition-opacity duration-200 ${
          open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />
      <div
        className={`!mt-0 fixed inset-y-0 right-0 z-50 bg-white shadow-2xl flex flex-col transition-transform duration-300 ease-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        style={{ width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-border-soft sticky top-0 bg-white z-[1]">
          <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center text-ink-muted hover:bg-border transition-colors"
            aria-label="Fechar"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && (
          <div className="border-t border-border-soft px-5 py-4 bg-surface sticky bottom-0 flex justify-end gap-2 z-[1]">
            {footer}
          </div>
        )}
      </div>
    </>
  );
}
