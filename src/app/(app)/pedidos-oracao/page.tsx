import { PageIntro, PrayerCard } from "@/components/pastoral/pastoral-ui";
import { prayerRequests } from "@/lib/pastoral/mock-data";

export default function PedidosOracaoPage() {
  return (
    <div>
      <PageIntro
        eyebrow="Pessoas & Cuidado"
        title="Pedidos de Oração"
        description="Pedidos vinculados a pessoas para que a igreja ore e acompanhe com cuidado."
        action={<button className="btn btn-primary btn-sm">+ Novo pedido</button>}
      />
      <div className="grid gap-3 lg:grid-cols-2">
        {prayerRequests.map((request) => <PrayerCard key={request.id} request={request} />)}
      </div>
    </div>
  );
}
