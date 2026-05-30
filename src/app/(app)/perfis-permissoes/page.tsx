import { PageIntro, SoftCard } from "@/components/pastoral/pastoral-ui";
import { permissionPresets } from "@/lib/pastoral/mock-data";

export default function PerfisPermissoesPage() {
  return (
    <div>
      <PageIntro
        eyebrow="Gestão Pastoral"
        title="Perfis e Permissões"
        description="Presets simples para evitar granularidade excessiva e manter a configuração compreensível."
      />
      <div className="grid gap-4 lg:grid-cols-2">
        {permissionPresets.map((preset) => (
          <SoftCard key={preset.id} className="p-5">
            <h2 className="card-title">{preset.label}</h2>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{preset.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {preset.access.map((item) => (
                <span key={item} className="rounded-full bg-surface-alt px-3 py-1 text-[11px] font-semibold text-ink-muted">{item}</span>
              ))}
            </div>
          </SoftCard>
        ))}
      </div>
    </div>
  );
}
