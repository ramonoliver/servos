"use client";

import { useMemo, useState } from "react";
import { CareCaseCard, PageIntro, SoftCard } from "@/components/pastoral/pastoral-ui";
import { careCases } from "@/lib/pastoral/mock-data";
import type { CarePriority, CareStatus } from "@/lib/pastoral/types";

export default function AcompanhamentosPage() {
  const [status, setStatus] = useState<CareStatus | "all">("all");
  const [priority, setPriority] = useState<CarePriority | "all">("all");

  const filtered = useMemo(() => {
    return careCases.filter((care) => {
      const matchesStatus = status === "all" || care.status === status;
      const matchesPriority = priority === "all" || care.priority === priority;
      return matchesStatus && matchesPriority;
    });
  }, [status, priority]);

  return (
    <div>
      <PageIntro
        eyebrow="Pessoas & Cuidado"
        title="Acompanhamentos"
        description="Casos pastorais com responsavel, prioridade e proximo passo claro."
        action={<button className="btn btn-primary btn-sm">+ Novo acompanhamento</button>}
      />
      <SoftCard className="mb-4 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <select className="input-field" value={status} onChange={(event) => setStatus(event.target.value as CareStatus | "all")}>
            <option value="all">Todos os status</option>
            <option value="open">Em aberto</option>
            <option value="in_progress">Em andamento</option>
            <option value="finished">Finalizado</option>
          </select>
          <select className="input-field" value={priority} onChange={(event) => setPriority(event.target.value as CarePriority | "all")}>
            <option value="all">Todas as prioridades</option>
            <option value="low">Baixa</option>
            <option value="medium">Media</option>
            <option value="high">Alta</option>
          </select>
        </div>
      </SoftCard>
      <div className="grid gap-3">
        {filtered.map((care) => <CareCaseCard key={care.id} care={care} />)}
      </div>
    </div>
  );
}
