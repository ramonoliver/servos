import { AlertCard, CareCaseCard, PageIntro, SoftCard, TimelineList } from "@/components/pastoral/pastoral-ui";
import { careCases, pastoralAlerts, timelineEvents } from "@/lib/pastoral/mock-data";
import { getPerson } from "@/lib/pastoral/selectors";

export default function CrmPastoralPage() {
  const activeCare = careCases.filter((care) => care.status !== "finished");
  return (
    <div>
      <PageIntro
        eyebrow="Gestão Pastoral"
        title="CRM Pastoral"
        description="Uma mesa de cuidado para acompanhar pessoas, historico pastoral e proximas acoes."
        action={<button className="btn btn-primary btn-sm">+ Registrar cuidado</button>}
      />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          {activeCare.map((care) => <CareCaseCard key={care.id} care={care} />)}
        </div>
        <div className="space-y-4">
          <SoftCard className="p-5">
            <h3 className="card-title mb-4">Pessoas em foco</h3>
            <div className="space-y-3">
              {activeCare.map((care) => {
                const person = getPerson(care.personId);
                return person ? (
                  <div key={care.id} className="rounded-[12px] bg-surface-alt px-3 py-2">
                    <div className="text-[13px] font-semibold text-ink">{person.fullName}</div>
                    <div className="text-[11px] text-ink-muted">{care.nextStep}</div>
                  </div>
                ) : null;
              })}
            </div>
          </SoftCard>
          {pastoralAlerts.slice(0, 2).map((alert) => <AlertCard key={alert.id} alert={alert} />)}
        </div>
      </div>
      <div className="mt-5">
        <TimelineList events={timelineEvents.slice(0, 4)} />
      </div>
    </div>
  );
}
