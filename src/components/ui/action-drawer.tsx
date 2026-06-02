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
        className={`!mt-0 fixed z-50 flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out
          inset-x-0 bottom-0 rounded-t-3xl max-h-[90dvh]
          sm:inset-y-0 sm:right-0 sm:left-auto sm:bottom-auto sm:h-full sm:max-h-full sm:rounded-none
          ${open ? "translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"}
        `}
        style={{ width: "100%", maxWidth: width }}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <div className="flex flex-col sticky top-0 bg-white z-[1] rounded-t-3xl sm:rounded-none border-b border-border-soft">
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-12 h-1.5 rounded-full bg-border-soft" />
          </div>
          <div className="flex items-center justify-between px-5 pb-4 pt-1 sm:pt-4">
            <h2 className="font-display text-lg font-bold text-ink">{title}</h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-alt flex items-center justify-center text-ink-muted hover:bg-border transition-colors"
              aria-label="Fechar"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
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
