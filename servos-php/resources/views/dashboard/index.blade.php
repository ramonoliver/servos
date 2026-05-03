@extends('layouts.app')

@section('title', 'Dashboard | Servos PHP')

@section('content')
    <section class="hero-panel">
        <div>
            <div class="eyebrow">Visão geral</div>
            <h1>{{ str_contains($todayLabel, 'feira') ? ucfirst($todayLabel) : ucfirst($todayLabel) }}</h1>
            <p>{{ $user->isMember() ? 'Confira as proximas escalas e o ritmo da sua participacao.' : 'Acompanhe ministerios, membros e pendencias a partir de um painel unico.' }}</p>
        </div>

        <div class="verse-panel">
            <span>{{ $verse['text'] }}</span>
            <strong>{{ $verse['ref'] }}</strong>
        </div>
    </section>

    <section class="stats-grid">
        @foreach ($stats as $stat)
            <article class="metric-card">
                <span>{{ $stat['label'] }}</span>
                <strong>{{ $stat['value'] }}</strong>
            </article>
        @endforeach
    </section>

    <section class="panel">
        <div class="panel-headline">
            <div>
                <div class="eyebrow">Agenda</div>
                <h2>Próximas escalas</h2>
            </div>
            <a href="{{ route('schedules.index') }}" class="button button-muted">Ver todas</a>
        </div>

        <div class="schedule-list">
            @forelse ($upcoming as $schedule)
                <article class="schedule-row">
                    <div class="date-pill">
                        <span>{{ $schedule->date->format('d') }}</span>
                        <small>{{ strtoupper($schedule->date->translatedFormat('M')) }}</small>
                    </div>

                    <div class="schedule-copy">
                        <strong>{{ $schedule->event?->name ?? 'Escala' }}</strong>
                        <span>{{ $schedule->department?->name }} • {{ $schedule->time }} • chegada {{ $schedule->arrival_time ?? '--:--' }}</span>
                    </div>

                    <div class="schedule-meta">
                        <span class="tag {{ $schedule->published ? 'tag-success' : 'tag-muted' }}">
                            {{ $schedule->published ? 'Publicada' : 'Rascunho' }}
                        </span>
                        <small>{{ $schedule->members->where('status', 'confirmed')->count() }}/{{ $schedule->members->count() }} confirmados</small>
                    </div>
                </article>
            @empty
                <p class="empty-state">Nenhuma escala ativa encontrada no momento.</p>
            @endforelse
        </div>
    </section>
@endsection
