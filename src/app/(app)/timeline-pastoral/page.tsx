"use client";

import { useMemo, useState } from "react";
import { PageIntro, SoftCard, TimelineList } from "@/components/pastoral/pastoral-ui";
import { pastoralPeople, timelineEvents } from "@/lib/pastoral/mock-data";

export default function TimelinePastoralPage() {
  const [personId, setPersonId] = useState("all");
  const [type, setType] = useState("all");

  const events = useMemo(() => {
    return timelineEvents
      .filter((event) => personId === "all" || event.personId === personId)
      .filter((event) => type === "all" || event.type === type)
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [personId, type]);

  return (
    <div>
      <PageIntro eyebrow="Pessoas & Cuidado" title="Timeline Pastoral" description="Atividade cronologica do cuidado pastoral, celulas, ministerios e escalas." />
      <SoftCard className="mb-4 p-3">
        <div className="grid gap-2 sm:grid-cols-2">
          <select className="input-field" value={personId} onChange={(event) => setPersonId(event.target.value)}>
            <option value="all">Todas as pessoas</option>
            {pastoralPeople.map((person) => <option key={person.id} value={person.id}>{person.fullName}</option>)}
          </select>
          <select className="input-field" value={type} onChange={(event) => setType(event.target.value)}>
            <option value="all">Todos os eventos</option>
            <option value="visit">Visitas</option>
            <option value="discipleship_started">Discipulado</option>
            <option value="care_done">Acompanhamentos</option>
            <option value="absence">Ausencias</option>
            <option value="schedule_confirmed">Escalas</option>
          </select>
        </div>
      </SoftCard>
      <TimelineList events={events} />
    </div>
  );
}
