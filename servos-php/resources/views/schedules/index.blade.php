@extends('layouts.app')

@section('title', $pageTitle.' | Servos PHP')

@section('content')
    <section class="panel-header">
        <div>
            <div class="eyebrow">Planejamento</div>
            <h1>{{ $pageTitle }}</h1>
            <p>{{ $pageSubtitle }}</p>
        </div>
    </section>

    <section class="panel">
        <div class="schedule-list">
            @forelse ($schedules as $schedule)
                <article class="schedule-card">
                    <div class="schedule-card__top">
                        <div>
                            <div class="eyebrow">{{ $schedule->department?->name }}</div>
                            <h2>{{ $schedule->event?->name ?? 'Escala' }}</h2>
                        </div>
                        <span class="tag {{ $schedule->status === 'active' ? 'tag-success' : ($schedule->status === 'draft' ? 'tag-muted' : 'tag-danger') }}">
                            {{ ucfirst($schedule->status) }}
                        </span>
                    </div>

                    <p>{{ $schedule->date->format('d/m/Y') }} • {{ $schedule->time }} • chegada {{ $schedule->arrival_time ?? '--:--' }}</p>
                    <p class="schedule-note">{{ $schedule->instructions ?: 'Sem instruções adicionais.' }}</p>

                    <div class="assignment-row">
                        @foreach ($schedule->members as $assignment)
                            <div class="assignment-pill">
                                <strong>{{ $assignment->user?->name }}</strong>
                                <span>{{ $assignment->function_name ?: 'Função aberta' }} • {{ $assignment->status }}</span>
                            </div>
                        @endforeach
                    </div>
                </article>
            @empty
                <p class="empty-state">Nenhuma escala encontrada para este perfil.</p>
            @endforelse
        </div>
    </section>
@endsection
