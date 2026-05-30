import { AlertCard, CareCaseCard, PageIntro, SoftCard } from "@/components/pastoral/pastoral-ui";
import { careCases, pastoralAlerts, prayerRequests } from "@/lib/pastoral/mock-data";
import { getPastoralDashboardSummary } from "@/lib/pastoral/selectors";

export default function DashboardPastoralPage() {
  const summary = getPastoralDashboardSummary();
  return (
    <div>
      <PageIntro
        eyebrow="Gestão Pastoral"
        title="Dashboard Pastoral"
        description="Uma leitura humana do que precisa de atencao nesta semana."
      />
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard value={summary.visitorsRecent} label="Visitantes recentes" />
        <SummaryCard value={summary.activeCare} label="Em acompanhamento" />
        <SummaryCard value={`${summary.generalFrequency}%`} label="Frequencia geral" />
        <SummaryCard value={summary.activeLeaders} label="Lideres ativos" />
      </div>
      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-ink">Prioridades de cuidado</h2>
          {careCases.filter((care) => care.status !== "finished").map((care) => <CareCaseCard key={care.id} care={care} />)}
        </div>
        <div className="space-y-3">
          <h2 className="font-display text-lg font-semibold text-ink">Sinais recentes</h2>
          {pastoralAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
          <SoftCard className="p-4">
            <div className="text-[10px] font-bold uppercase tracking-[.12em] text-ink-faint">Pedidos de oracao</div>
            <div className="mt-2 font-display text-2xl font-bold text-ink">{prayerRequests.length}</div>
            <p className="mt-1 text-sm text-ink-muted">pedidos abertos para acompanhamento em oração.</p>
          </SoftCard>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ value, label }: { value: string | number; label: string }) {
  return (
    <SoftCard className="p-5">
      <div className="font-display text-[28px] font-bold text-brand">{value}</div>
      <div className="mt-1 text-sm font-medium text-ink-muted">{label}</div>
    </SoftCard>
  );
}
