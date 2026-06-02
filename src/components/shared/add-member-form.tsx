"use client";

import { useState } from "react";
import { ActionDrawer } from "@/components/ui";
import type { User } from "@/types";

export function AddMemberForm({
  availableToAdd,
  functionOptions,
  onClose,
  onSave,
}: {
  availableToAdd: User[];
  functionOptions: string[];
  onClose: () => void;
  onSave: (members: { userId: string; functionName: string; functionNames: string[] }[]) => void;
}) {
  const [selectedUsers, setSelectedUsers] = useState<Record<string, string[]>>({});

  function toggleUser(userId: string) {
    setSelectedUsers((current) => {
      const next = { ...current };
      if (next[userId] !== undefined) {
        delete next[userId];
      } else {
        next[userId] = [];
      }
      return next;
    });
  }

  function toggleFunction(userId: string, functionName: string) {
    setSelectedUsers((current) => ({
      ...current,
      [userId]: current[userId]?.includes(functionName)
        ? current[userId].filter((item) => item !== functionName)
        : [...(current[userId] || []), functionName],
    }));
  }

  function updateCustomFunctions(userId: string, rawValue: string) {
    setSelectedUsers((current) => ({
      ...current,
      [userId]: rawValue
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    }));
  }

  const selectedIds = Object.keys(selectedUsers);

  return (
    <ActionDrawer
      open={true}
      title="Adicionar membros"
      onClose={onClose}
      width={480}
      footer={
        <>
          <button onClick={onClose} className="btn btn-secondary">
            Cancelar
          </button>
          <button
            onClick={() =>
              onSave(
                selectedIds.map((userId) => ({
                  userId,
                  functionName: selectedUsers[userId]?.[0] || "",
                  functionNames: selectedUsers[userId] || [],
                }))
              )
            }
            disabled={selectedIds.length === 0}
            className="btn btn-primary"
          >
            Adicionar selecionados
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div className="rounded-2xl border border-border-soft bg-surface-alt px-4 py-3 text-sm text-ink-muted">
          Selecione vários membros de uma vez e ajuste a função individual de cada um, se quiser.
        </div>

        <div className="space-y-3 max-h-[52vh] overflow-y-auto pr-1">
          {availableToAdd.length === 0 ? (
            <div className="text-sm text-ink-faint text-center py-8">
              Todos os membros ativos já estão neste ministério.
            </div>
          ) : (
            availableToAdd.map((member) => {
              const selected = selectedUsers[member.id] !== undefined;

              return (
                <div
                  key={member.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    selected
                      ? "border-brand bg-brand-glow shadow-sm"
                      : "border-border-soft bg-white"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      type="button"
                      onClick={() => toggleUser(member.id)}
                      className={`mt-1 w-5 h-5 rounded-md border-2 flex items-center justify-center text-[11px] font-bold transition-all ${
                        selected
                          ? "bg-brand border-brand text-white"
                          : "border-border bg-white text-transparent"
                      }`}
                    >
                      ✓
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-semibold truncate">{member.name}</div>
                      <div className="text-[12px] text-ink-faint truncate">{member.email}</div>

                      {selected && (
                        <div className="mt-3">
                          <label className="input-label">Funções no ministério</label>
                          {functionOptions.length > 0 ? (
                            <div className="flex flex-wrap gap-2">
                              {functionOptions.map((functionName) => {
                                const active = selectedUsers[member.id]?.includes(functionName);
                                return (
                                  <button
                                    key={functionName}
                                    type="button"
                                    onClick={() => toggleFunction(member.id, functionName)}
                                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${
                                      active ? "bg-brand text-white" : "bg-surface-alt text-ink-muted"
                                    }`}
                                  >
                                    {functionName}
                                  </button>
                                );
                              })}
                            </div>
                          ) : null}

                          <input
                            className="input-field mt-2"
                            value={(selectedUsers[member.id] || []).join(", ")}
                            onChange={(e) => updateCustomFunctions(member.id, e.target.value)}
                            placeholder="Ex: Vocal, Câmera, Recepção"
                          />
                          <div className="text-[11px] text-ink-faint mt-1">
                            Você pode selecionar várias funções e também editar manualmente separando por vírgula.
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </ActionDrawer>
  );
}
