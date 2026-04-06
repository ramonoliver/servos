"use client";

import { useState } from "react";
import { useApp } from "@/hooks/use-app";

export default function ConfiguraçõesPage() {
  const { toast, church, refresh, user } = useApp();
  const [churchName, setChurchName] = useState(church.name);
  const [churchCity, setChurchCity] = useState(church.city || "");
  const [saving, setSaving] = useState(false);

  async function saveChurch() {
    if (!churchName.trim()) {
      toast("Informe o nome da igreja.");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/church/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: churchName.trim(),
          city: churchCity.trim(),
        }),
      });

      const data = await response.json().catch(() => null);
      if (!response.ok) {
        console.error("Erro ao salvar igreja:", data);
        toast(data?.error || "Erro ao salvar.");
        setSaving(false);
        return;
      }

      await refresh();
      toast("Salvo!");
      setSaving(false);
    } catch (error) {
      console.error("Erro ao salvar igreja:", error);
      toast("Erro ao salvar.");
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[720px]">
      <div className="mb-6">
        <h1 className="page-title">Configurações</h1>
        <p className="page-subtitle">Ajustes gerais da igreja e orientações de uso</p>
      </div>

      <div className="card p-6 mb-5">
        <h3 className="font-display text-lg mb-4">Igreja</h3>
        <div className="space-y-3">
          <div>
            <label className="input-label">Nome</label>
            <input
              className="input-field"
              value={churchName}
              onChange={(e) => setChurchName(e.target.value)}
            />
          </div>

          <div>
            <label className="input-label">Cidade</label>
            <input
              className="input-field"
              value={churchCity}
              onChange={(e) => setChurchCity(e.target.value)}
            />
          </div>

          <button onClick={saveChurch} disabled={saving} className="btn btn-primary btn-sm w-full sm:w-auto">
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      </div>

      <div className="card p-6 mb-5">
        <h3 className="font-display text-lg mb-3">Permissões</h3>
        <div className="text-[13px] text-ink-muted leading-relaxed space-y-2">
          <p>
            <strong className="text-ink">Admin:</strong> acesso total - ministérios, membros, escalas, eventos, configurações.
          </p>
          <p>
            <strong className="text-ink">Líder:</strong> gerencia seu ministério - cria escalas, convida membros, envia mensagens.
          </p>
          <p>
            <strong className="text-ink">Membro:</strong> visualiza escalas, confirma presença, edita perfil.
          </p>
        </div>
      </div>

      <div className="card p-6">
        <h3 className="font-display text-lg mb-3">Dados</h3>
        <p className="text-sm text-ink-muted">
          O reset local de demonstração foi descontinuado, porque os dados agora ficam persistidos no Supabase.
        </p>
      </div>
    </div>
  );
}
