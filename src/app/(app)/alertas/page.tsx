import { AlertCard, PageIntro, SoftCard } from "@/components/pastoral/pastoral-ui";
import { pastoralAlerts } from "@/lib/pastoral/mock-data";

export default function AlertasPage() {
  return (
    <div>
      <PageIntro
        eyebrow="Pessoas & Cuidado"
        title="Alertas"
        description="Sinais simples para ajudar a igreja a cuidar antes que alguem se perca no caminho."
      />
      <SoftCard className="mb-4 p-4">
        <p className="text-sm leading-relaxed text-ink-muted">
          Alertas aqui sao sugestoes de cuidado, nao cobrancas. Cada card aponta uma possivel proxima conversa.
        </p>
      </SoftCard>
      <div className="grid gap-3">
        {pastoralAlerts.map((alert) => <AlertCard key={alert.id} alert={alert} />)}
      </div>
    </div>
  );
}
