import { PageIntro, SoftCard } from "@/components/pastoral/pastoral-ui";

export default function EnquetesPage() {
  return (
    <div>
      <PageIntro
        eyebrow="Comunicação"
        title="Enquetes"
        description="Perguntas simples para ouvir pessoas, líderes e equipes sem burocracia."
        action={<button className="btn btn-primary btn-sm">+ Nova enquete</button>}
      />
      <div className="grid gap-4 lg:grid-cols-2">
        <SoftCard className="p-5">
          <h2 className="card-title">Como foi a última reunião?</h2>
          <p className="mt-2 text-sm text-ink-muted">Modelo para líderes de célula compartilharem percepções rápidas.</p>
          <div className="mt-4 grid grid-cols-2 gap-2">
            {["Muito boa", "Boa", "Normal", "Difícil"].map((item) => (
              <button key={item} className="rounded-[12px] bg-surface-alt px-3 py-3 text-sm font-semibold text-ink-muted">{item}</button>
            ))}
          </div>
        </SoftCard>
        <SoftCard className="p-5">
          <h2 className="card-title">Precisa de acompanhamento?</h2>
          <p className="mt-2 text-sm text-ink-muted">Modelo para identificar necessidades pastorais sem exposição.</p>
          <textarea className="input-field mt-4 min-h-[140px]" placeholder="Compartilhe como podemos cuidar melhor..." />
        </SoftCard>
      </div>
    </div>
  );
}
