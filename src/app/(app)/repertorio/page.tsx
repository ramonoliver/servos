"use client";
import { useState } from "react";
import { useApp } from "@/hooks/use-app";
import { getDB } from "@/lib/db/local-db";
import Link from "next/link";

// ────────────────────────────────────────────────────────────────
// Repertório — músicas do ministério com links de cifra/letra/vídeo
// ────────────────────────────────────────────────────────────────

export type Song = {
  id: string;
  church_id: string;
  department_id: string | null;
  title: string;
  artist: string;
  key: string;        // Tom: "C", "G#", etc.
  bpm: number | null;
  theme: string;      // "louvor" | "adoração" | "santa ceia" | etc.
  lyrics_url: string;
  chords_url: string;
  video_url: string;
  audio_url: string;
  notes: string;
  last_used: string | null;
  times_used: number;
  created_by: string;
  created_at: string;
};

const THEMES = ["Louvor", "Adoração", "Santa Ceia", "Ofertório", "Abertura", "Encerramento", "Outro"];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B",
              "Cm", "C#m", "Dm", "D#m", "Em", "Fm", "F#m", "Gm", "G#m", "Am", "A#m", "Bm"];

export default function RepertorioPage() {
  const { user, toast, canDo, departments } = useApp();
  const db = getDB();

  const [search, setSearch] = useState("");
  const [themeFilter, setThemeFilter] = useState("all");
  const [deptFilter, setDeptFilter] = useState("all");
  const [showForm, setShowForm] = useState(false);

  // Form state
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [key, setKey] = useState("G");
  const [bpm, setBpm] = useState("");
  const [theme, setTheme] = useState("Louvor");
  const [lyricsUrl, setLyricsUrl] = useState("");
  const [chordsUrl, setChordsUrl] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [notes, setNotes] = useState("");
  const [deptId, setDeptId] = useState(departments[0]?.id || "");

  const songs: Song[] = db.getAll<Song>("songs").filter(s => s.church_id === user.church_id);

  let filtered = songs;
  if (search) filtered = filtered.filter(s =>
    s.title.toLowerCase().includes(search.toLowerCase()) ||
    s.artist.toLowerCase().includes(search.toLowerCase())
  );
  if (themeFilter !== "all") filtered = filtered.filter(s => s.theme === themeFilter);
  if (deptFilter !== "all") filtered = filtered.filter(s => s.department_id === deptFilter);
  filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));

  function resetForm() {
    setTitle(""); setArtist(""); setKey("G"); setBpm(""); setTheme("Louvor");
    setLyricsUrl(""); setChordsUrl(""); setVideoUrl(""); setNotes("");
    setDeptId(departments[0]?.id || "");
  }

  function save() {
    if (!title.trim()) { toast("Informe o título da música."); return; }
    db.insert<Song>("songs", {
      church_id: user.church_id,
      department_id: deptId || null,
      title: title.trim(),
      artist: artist.trim(),
      key,
      bpm: bpm ? parseInt(bpm) : null,
      theme,
      lyrics_url: lyricsUrl.trim(),
      chords_url: chordsUrl.trim(),
      video_url: videoUrl.trim(),
      audio_url: "",
      notes: notes.trim(),
      last_used: null,
      times_used: 0,
      created_by: user.id,
    });
    toast(`"${title}" adicionada ao repertório!`);
    resetForm();
    setShowForm(false);
    location.reload();
  }

  function removeSong(id: string, songTitle: string) {
    if (!confirm(`Remover "${songTitle}" do repertório?`)) return;
    db.delete("songs", id);
    toast("Música removida.");
    location.reload();
  }

  const themes = ["all", ...THEMES];

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="page-title">Repertório</h1>
          <p className="page-subtitle">{songs.length} músicas cadastradas</p>
        </div>
        {canDo("schedule.create") && (
          <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm self-start sm:self-auto">
            + Adicionar música
          </button>
        )}
      </div>

      {/* Formulário */}
      {showForm && (
        <div className="card mb-6">
          <div className="px-5 pt-4 pb-3 border-b border-border-soft">
            <span className="font-display text-[17px]">Nova música</span>
          </div>
          <div className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="input-label">Título *</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Nome da música" className="input-field" />
              </div>
              <div>
                <label className="input-label">Artista / Banda</label>
                <input value={artist} onChange={e => setArtist(e.target.value)} placeholder="ex: Hillsong, Elevation..." className="input-field" />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <label className="input-label">Tom</label>
                <select value={key} onChange={e => setKey(e.target.value)} className="input-field">
                  {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">BPM</label>
                <input type="number" value={bpm} onChange={e => setBpm(e.target.value)} placeholder="120" min="40" max="240" className="input-field" />
              </div>
              <div>
                <label className="input-label">Tema</label>
                <select value={theme} onChange={e => setTheme(e.target.value)} className="input-field">
                  {THEMES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="input-label">Ministério</label>
                <select value={deptId} onChange={e => setDeptId(e.target.value)} className="input-field">
                  <option value="">Todos</option>
                  {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="input-label">Link da Cifra</label>
                <input value={chordsUrl} onChange={e => setChordsUrl(e.target.value)} placeholder="https://cifraclub.com.br/..." className="input-field" />
              </div>
              <div>
                <label className="input-label">Link da Letra</label>
                <input value={lyricsUrl} onChange={e => setLyricsUrl(e.target.value)} placeholder="https://letras.mus.br/..." className="input-field" />
              </div>
              <div>
                <label className="input-label">Link do Vídeo</label>
                <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className="input-field" />
              </div>
            </div>

            <div>
              <label className="input-label">Observações internas</label>
              <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="Instruções especiais, tonalidade diferente por voz, etc." className="input-field resize-none" />
            </div>

            <div className="flex gap-2 justify-end">
              <button onClick={() => { setShowForm(false); resetForm(); }} className="btn btn-ghost">Cancelar</button>
              <button onClick={save} className="btn btn-primary">Salvar</button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar música ou artista..."
          className="input-field flex-1"
        />
        <select value={themeFilter} onChange={e => setThemeFilter(e.target.value)} className="input-field sm:w-40">
          {themes.map(t => <option key={t} value={t}>{t === "all" ? "Todos os temas" : t}</option>)}
        </select>
        {departments.length > 1 && (
          <select value={deptFilter} onChange={e => setDeptFilter(e.target.value)} className="input-field sm:w-44">
            <option value="all">Todos os ministérios</option>
            {departments.map((d: any) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </select>
        )}
      </div>

      {/* Lista */}
      {filtered.length === 0 ? (
        <div className="card">
          <div className="py-16 text-center">
            <div className="text-4xl mb-3 opacity-40">🎵</div>
            <p className="font-display text-lg mb-1">Nenhuma música encontrada</p>
            <p className="text-sm text-ink-muted mb-4">
              {songs.length === 0 ? "Adicione a primeira música ao repertório." : "Tente outros filtros."}
            </p>
            {songs.length === 0 && canDo("schedule.create") && (
              <button onClick={() => setShowForm(true)} className="btn btn-primary">+ Adicionar música</button>
            )}
          </div>
        </div>
      ) : (
        <div className="card">
          {filtered.map((song, i) => (
            <div
              key={song.id}
              className={`flex items-center gap-4 px-5 py-3.5 hover:bg-brand-glow transition-colors ${i > 0 ? "border-t border-border-soft" : ""}`}
            >
              {/* Tom badge */}
              <div className="w-10 h-10 rounded-[10px] bg-surface-alt flex items-center justify-center flex-shrink-0">
                <span className="text-[11px] font-bold text-brand">{song.key}</span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{song.title}</div>
                <div className="text-[11px] text-ink-faint">
                  {song.artist || "—"}
                  {song.bpm ? ` · ${song.bpm} BPM` : ""}
                  {song.times_used > 0 ? ` · Usada ${song.times_used}×` : ""}
                </div>
              </div>

              {/* Tema */}
              <span className="badge badge-brand hidden sm:inline-flex">{song.theme}</span>

              {/* Links de acesso rápido */}
              <div className="flex items-center gap-1.5">
                {song.chords_url && (
                  <a href={song.chords_url} target="_blank" rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-surface-alt hover:bg-brand-light flex items-center justify-center transition-colors" title="Cifra">
                    <span className="text-[10px] font-bold text-ink-muted">Do</span>
                  </a>
                )}
                {song.lyrics_url && (
                  <a href={song.lyrics_url} target="_blank" rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-surface-alt hover:bg-brand-light flex items-center justify-center transition-colors" title="Letra">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                  </a>
                )}
                {song.video_url && (
                  <a href={song.video_url} target="_blank" rel="noopener noreferrer"
                    className="w-7 h-7 rounded-lg bg-surface-alt hover:bg-brand-light flex items-center justify-center transition-colors" title="Vídeo">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                  </a>
                )}
              </div>

              {/* Remove */}
              {canDo("schedule.create") && (
                <button onClick={() => removeSong(song.id, song.title)}
                  className="text-ink-ghost hover:text-danger transition-colors p-1 ml-1" title="Remover">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/>
                  </svg>
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
