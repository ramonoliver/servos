import { redirect } from "next/navigation";

export default function EscalaDetailPage({ params }: { params: { id: string } }) {
  redirect(`/escalas?id=${params.id}`);
}
