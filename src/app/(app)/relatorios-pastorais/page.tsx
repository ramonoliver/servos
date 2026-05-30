import { PageIntro, SoftCard } from "@/components/pastoral/pastoral-ui";
import { pastoralCells } from "@/lib/pastoral/mock-data";
import { getHealthAverage, getHealthLabel, getPastoralDashboardSummary } from "@/lib/pastoral/selectors";

export default function RelatoriosPastoraisPage() {
  const summary = getPastoralDashboardSummary();
  return (
    <div>
      <PageIntro
        eyebrow="Gestão Pastoral"
        title="Relatórios Pastorais"
        description="Leituras simples para apoiar decisões de cuidado, sem transformar pessoas em planilhas."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <SoftCard className="p-5">
          <h2 className="card-title mb-4">Resumo da semana</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Metric label="Pessoas sem célula" value={summary.peopleWithoutCell} />
            <Metric label="Pedidos de oração" value={summary.openPrayerRequests} />
            <Metric label="Pessoas afastando" value={summary.peopleDrifting} />
            <Metric label="Frequência geral" value={`${summary.generalFrequency}%`} />
          </div>
        </SoftCard>
        <SoftCard className="p-5">
          <h2 className="card-title mb-4">Saúde das células</h2>
          <div className="space-y-3">
            {pastoralCells.map((cell) => {
              const average = getHealthAverage(cell.health);
              return (
                <div key={cell.id} className="flex items-center justify-between rounded-[12px] bg-surface-alt px-3 py-2">
                  <div>
                    <div className="text-[13px] font-semibold text-ink">{cell.name}</div>
                    <div className="text-[11px] text-ink-muted">{getHealthLabel(average)}</div>
                  </div>
                  <span className="text-sm font-bold text-brand">{average}%</span>
                </div>
              );
            })}
          </div>
        </SoftCard>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[12px] bg-surface-alt px-4 py-3">
      <div className="font-display text-2xl font-bold text-brand">{value}</div>
      <div className="text-xs font-medium text-ink-muted">{label}</div>
    </div>
  );
}
