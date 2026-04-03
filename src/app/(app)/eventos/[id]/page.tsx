"use client";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";
import { getIconEmoji } from "@/lib/utils/helpers";
import Link from "next/link";
import type { Event } from "@/types";

export default function EventoDetailPage({ params }: { params: { id: string } }) {
  const { departments } = useApp();
  const db = getDB();
  const ev = db.getById<Event>("events", params.id);
  if (!ev) return <div className="py-20 text-center text-ink-faint">Evento nao encontrado.</div>;
  return (
    <div>
      <Link href="/eventos" className="inline-flex items-center gap-1.5 text-[13px] text-brand font-medium mb-5 hover:underline">&larr; Eventos</Link>
      <div className="flex items-center gap-4 mb-6">
        <div className="w-14 h-14 rounded-[14px] bg-brand-light flex items-center justify-center text-2xl">{getIconEmoji(ev.icon)}</div>
        <div><h1 className="page-title">{ev.name}</h1><p className="page-subtitle">{ev.type === "recurring" ? "Recorrente" : "Especial"}{ev.location ? " - " + ev.location : ""}</p></div>
      </div>
      {ev.description && <div className="card p-5 mb-5"><p className="text-sm text-ink-muted">{ev.description}</p></div>}
      {ev.instructions && <div className="bg-surface-alt rounded-[14px] p-5"><div className="text-xs font-bold text-ink-faint uppercase mb-1">Instrucoes</div><p className="text-sm text-ink-soft">{ev.instructions}</p></div>}
    </div>
  );
}
