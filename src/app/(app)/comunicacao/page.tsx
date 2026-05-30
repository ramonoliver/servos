import { PageIntro, SoftCard } from "@/components/pastoral/pastoral-ui";

export default function ComunicacaoPage() {
  return (
    <div>
      <PageIntro
        eyebrow="Comunicação"
        title="Comunicação"
        description="Envios segmentados para grupos, células, ministérios e pessoas em acompanhamento."
        action={<button className="btn btn-primary btn-sm">+ Nova comunicação</button>}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        {[
          ["Células", "Enviar uma mensagem para líderes ou membros de uma célula."],
          ["Ministérios", "Comunicar voluntários por departamento sem sair do Servos."],
          ["Cuidado pastoral", "Enviar uma mensagem sensível para pessoas em acompanhamento."],
        ].map(([title, description]) => (
          <SoftCard key={title} className="p-5">
            <h2 className="card-title">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{description}</p>
            <button className="btn btn-secondary btn-sm mt-4">Preparar envio</button>
          </SoftCard>
        ))}
      </div>
    </div>
  );
}
