"use client";

import { useMemo, useState } from "react";
import { ActionDrawer } from "@/components/ui/action-drawer";
import { PageIntro, PersonCard, SoftCard } from "@/components/pastoral/pastoral-ui";
import { pastoralCells, pastoralMinistries, pastoralPeople, pastoralTags } from "@/lib/pastoral/mock-data";
import type { PastoralPerson, PersonKind } from "@/lib/pastoral/types";

const kindOptions: { value: PersonKind | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "member", label: "Membros" },
  { value: "visitor", label: "Visitantes" },
  { value: "leader", label: "Lideres" },
  { value: "volunteer", label: "Voluntarios" },
  { value: "pastor", label: "Pastores" },
];

export default function PessoasPage() {
  const [peopleData, setPeopleData] = useState<PastoralPerson[]>(pastoralPeople);
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState<PersonKind | "all">("all");
  const [tagId, setTagId] = useState("all");
  const [special, setSpecial] = useState<"all" | "without-cell" | "in-care" | "new-converts">("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [newPerson, setNewPerson] = useState({
    fullName: "",
    phone: "",
    email: "",
    roleTitle: "",
    kind: "visitor" as PersonKind,
    cellId: "",
    ministryId: "",
    tagId: "visitante",
  });

  const people = useMemo(() => {
    const term = search.trim().toLowerCase();
    const effectiveTag = special === "new-converts" ? "novo-convertido" : tagId;

    return peopleData.filter((person) => {
      const matchesSearch =
        !term ||
        person.fullName.toLowerCase().includes(term) ||
        person.email.toLowerCase().includes(term) ||
        person.phone.toLowerCase().includes(term);
      const matchesKind = kind === "all" || person.kinds.includes(kind);
      const matchesTag = effectiveTag === "all" || person.tagIds.includes(effectiveTag);
      const matchesSpecial =
        special === "all" ||
        special === "new-converts" ||
        (special === "without-cell" && !person.cellId) ||
        (special === "in-care" && person.tagIds.includes("em-acompanhamento"));

      return matchesSearch && matchesKind && matchesTag && matchesSpecial;
    });
  }, [peopleData, search, kind, tagId, special]);

  function createPerson() {
    const name = newPerson.fullName.trim();
    if (!name) return;

    const created: PastoralPerson = {
      id: `local-${Date.now()}`,
      fullName: name,
      avatarColor: "#F4532A",
      photoUrl: null,
      phone: newPerson.phone,
      email: newPerson.email,
      birthDate: "",
      gender: "nao_informado",
      maritalStatus: "nao_informado",
      address: "",
      instagram: "",
      arrivalDate: new Date().toISOString().slice(0, 10),
      kinds: [newPerson.kind],
      baptized: false,
      inDiscipleship: false,
      participatesInCell: Boolean(newPerson.cellId),
      cellId: newPerson.cellId || null,
      ministryIds: newPerson.ministryId ? [newPerson.ministryId] : [],
      roleTitle: newPerson.roleTitle || (newPerson.kind === "visitor" ? "Visitante" : "Pessoa cadastrada"),
      tagIds: [newPerson.tagId],
      notes: "Cadastro local para validacao da experiencia. Ainda nao foi salvo no Supabase.",
      lastContactAt: null,
    };

    setPeopleData((current) => [created, ...current]);
    setDrawerOpen(false);
    setNewPerson({ fullName: "", phone: "", email: "", roleTitle: "", kind: "visitor", cellId: "", ministryId: "", tagId: "visitante" });
  }

  return (
    <div>
      <PageIntro
        eyebrow="Pessoas & Cuidado"
        title="Pessoas"
        description="Uma visao unica para membros, visitantes, voluntarios, lideres e pessoas em acompanhamento."
        action={<button className="btn btn-primary btn-sm" onClick={() => setDrawerOpen(true)}>+ Nova pessoa</button>}
      />

      <SoftCard className="mb-4 p-3">
        <div className="grid gap-2 md:grid-cols-[1fr_160px_180px_190px]">
          <input
            className="input-field"
            placeholder="Buscar por nome, email ou telefone..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="input-field" value={kind} onChange={(event) => setKind(event.target.value as PersonKind | "all")}>
            {kindOptions.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <select className="input-field" value={tagId} onChange={(event) => setTagId(event.target.value)}>
            <option value="all">Todas as tags</option>
            {pastoralTags.map((tag) => (
              <option key={tag.id} value={tag.id}>{tag.label}</option>
            ))}
          </select>
          <select className="input-field" value={special} onChange={(event) => setSpecial(event.target.value as typeof special)}>
            <option value="all">Todos os filtros</option>
            <option value="without-cell">Pessoas sem celula</option>
            <option value="in-care">Em acompanhamento</option>
            <option value="new-converts">Novos convertidos</option>
          </select>
        </div>
      </SoftCard>

      <div className="mb-3 flex items-center justify-between">
        <span className="text-[12px] font-semibold text-ink-faint">{people.length} pessoas encontradas</span>
        {(search || kind !== "all" || tagId !== "all" || special !== "all") && (
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearch("");
              setKind("all");
              setTagId("all");
              setSpecial("all");
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {people.map((person) => (
          <PersonCard key={person.id} person={person} />
        ))}
      </div>

      <ActionDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} title="Nova pessoa" width={420}>
        <div className="space-y-4">
          <div>
            <label className="input-label">Nome completo</label>
            <input className="input-field" value={newPerson.fullName} onChange={(event) => setNewPerson((current) => ({ ...current, fullName: event.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="input-label">Telefone</label>
              <input className="input-field" value={newPerson.phone} onChange={(event) => setNewPerson((current) => ({ ...current, phone: event.target.value }))} />
            </div>
            <div>
              <label className="input-label">Email</label>
              <input className="input-field" value={newPerson.email} onChange={(event) => setNewPerson((current) => ({ ...current, email: event.target.value }))} />
            </div>
          </div>
          <div>
            <label className="input-label">Cargo/função</label>
            <input className="input-field" value={newPerson.roleTitle} onChange={(event) => setNewPerson((current) => ({ ...current, roleTitle: event.target.value }))} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <label className="input-label">Tipo</label>
              <select className="input-field" value={newPerson.kind} onChange={(event) => setNewPerson((current) => ({ ...current, kind: event.target.value as PersonKind }))}>
                {kindOptions.filter((option) => option.value !== "all").map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="input-label">Tag inicial</label>
              <select className="input-field" value={newPerson.tagId} onChange={(event) => setNewPerson((current) => ({ ...current, tagId: event.target.value }))}>
                {pastoralTags.map((tag) => <option key={tag.id} value={tag.id}>{tag.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="input-label">Célula</label>
            <select className="input-field" value={newPerson.cellId} onChange={(event) => setNewPerson((current) => ({ ...current, cellId: event.target.value }))}>
              <option value="">Sem célula por enquanto</option>
              {pastoralCells.map((cell) => <option key={cell.id} value={cell.id}>{cell.name}</option>)}
            </select>
          </div>
          <div>
            <label className="input-label">Ministério</label>
            <select className="input-field" value={newPerson.ministryId} onChange={(event) => setNewPerson((current) => ({ ...current, ministryId: event.target.value }))}>
              <option value="">Sem ministério por enquanto</option>
              {pastoralMinistries.map((ministry) => <option key={ministry.id} value={ministry.id}>{ministry.name}</option>)}
            </select>
          </div>
          <div className="rounded-[12px] bg-brand-light px-3 py-2 text-[12px] text-brand">
            Cadastro local para validacao. Nada sera salvo no Supabase nesta etapa.
          </div>
          <button className="btn btn-primary w-full" onClick={createPerson}>Criar pessoa</button>
        </div>
      </ActionDrawer>
    </div>
  );
}
