"use client";

import { useState } from "react";
import { Modal } from "@/components/ui";
import { useApp } from "@/hooks/use-app";

interface SupportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SupportModal({ isOpen, onClose }: SupportModalProps) {
  const { toast } = useApp();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject || !message) return;

    setLoading(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, message }),
      });

      if (response.ok) {
        toast("Mensagem enviada com sucesso!");
        setSubject("");
        setMessage("");
        onClose();
      } else {
        toast("Erro ao enviar mensagem. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro:", error);
      toast("Erro ao enviar mensagem. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal title="Suporte" close={onClose} width={500}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1">
              Assunto
            </label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20"
              required
            >
              <option value="">Selecione um assunto</option>
              <option value="Bug">Bug</option>
              <option value="Sugestão">Sugestão</option>
              <option value="Ajuda">Ajuda</option>
              <option value="Outro">Outro</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink-soft mb-1">
              Mensagem
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="w-full px-3 py-2 border border-border-soft rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
              placeholder="Descreva seu problema ou sugestão..."
              required
            />
          </div>
        </div>

        <div className="flex gap-3 justify-end mt-6">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-ink-muted hover:text-ink transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={loading || !subject || !message}
            className="px-4 py-2 bg-brand text-white rounded-lg hover:bg-brand-dark disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enviando..." : "Enviar"}
          </button>
        </div>
      </form>
    </Modal>
  );
}