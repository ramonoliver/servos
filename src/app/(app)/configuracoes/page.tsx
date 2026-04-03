"use client";
import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";

export default function ConfiguracoesPage() {
  const { user, toast, church } = useApp();
  const db = getDB();
  const [churchName, setChurchName] = useState(church.name);
  const [churchCity, setChurchCity] = useState(church.city || "");
  function saveChurch() { db.update("churches", church.id, { name: churchName, city: churchCity }); toast("Salvo!"); location.href = "/configuracoes"; }
  function resetData() { db.reset(); toast("Dados resetados!"); setTimeout(() => location.href = "/login", 500); }
  return (
    <div className="max-w-[600px]">
      <div className="mb-6"><h1 className="page-title">Configuracoes</h1></div>
      <div className="card p-6 mb-5">
        <h3 className="font-display text-lg mb-4">Igreja</h3>
        <div className="space-y-3">
          <div><label className="input-label">Nome</label><input className="input-field" value={churchName} onChange={e => setChurchName(e.target.value)} /></div>
          <div><label className="input-label">Cidade</label><input className="input-field" value={churchCity} onChange={e => setChurchCity(e.target.value)} /></div>
          <button onClick={saveChurch} className="btn btn-primary btn-sm">Salvar</button>
        </div>
      </div>
      <div className="card p-6 mb-5">
        <h3 className="font-display text-lg mb-3">Permissoes</h3>
        <div className="text-[13px] text-ink-muted leading-relaxed space-y-2">
          <p><strong className="text-ink">Admin:</strong> acesso total - ministerios, membros, escalas, eventos, configuracoes.</p>
          <p><strong className="text-ink">Lider:</strong> gerencia seu ministerio - cria escalas, convida membros, envia mensagens.</p>
          <p><strong className="text-ink">Membro:</strong> visualiza escalas, confirma presenca, edita perfil.</p>
        </div>
      </div>
      <div className="card p-6">
        <h3 className="font-display text-lg mb-3">Dados</h3>
        <p className="text-sm text-ink-muted mb-3">Restaurar dados de demonstracao.</p>
        <button onClick={resetData} className="btn btn-danger btn-sm">Resetar dados</button>
      </div>
    </div>
  );
}
