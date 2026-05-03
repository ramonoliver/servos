@extends('layouts.app')

@section('title', 'Ministérios | Servos PHP')

@section('content')
    <section class="panel-header">
        <div>
            <div class="eyebrow">Estrutura</div>
            <h1>Ministérios</h1>
            <p>Departamentos, lideranças e funções principais em uma leitura rápida.</p>
        </div>
    </section>

    <section class="card-grid">
        @foreach ($departments as $department)
            @php
                $leaders = collect(array_merge($department->leader_ids ?? [], $department->co_leader_ids ?? []))
                    ->unique()
                    ->map(fn ($id) => $people[$id]->name ?? null)
                    ->filter()
                    ->values();
                $iconMap = ['music' => '♪', 'camera' => '◉', 'church' => '✛', 'star' => '✦'];
            @endphp
            <article class="department-card">
                <div class="department-icon" style="background: {{ $department->color }}20; color: {{ $department->color }}">
                    {{ $iconMap[$department->icon] ?? '✦' }}
                </div>
                <h2>{{ $department->name }}</h2>
                <p>{{ $department->description }}</p>
                <div class="tag-row">
                    <span class="tag tag-brand">{{ $department->members_count }} membros</span>
                    @foreach (($department->function_names ?? []) as $function)
                        <span class="tag tag-muted">{{ $function }}</span>
                    @endforeach
                </div>
                <small>{{ $leaders->isNotEmpty() ? 'Liderança: '.$leaders->join(', ') : 'Sem liderança definida.' }}</small>
            </article>
        @endforeach
    </section>

    <section class="panel">
        <div class="panel-headline">
            <div>
                <div class="eyebrow">Movimentação</div>
                <h2>Vínculos recentes</h2>
            </div>
        </div>

        <div class="list-stack">
            @forelse ($recentMemberships as $membership)
                <article class="list-row">
                    <strong>{{ $membership->user?->name }}</strong>
                    <span>{{ $membership->department?->name }} • {{ $membership->function_name ?: 'Sem função' }}</span>
                    <small>{{ optional($membership->joined_at)->format('d/m/Y') }}</small>
                </article>
            @empty
                <p class="empty-state">Nenhum vínculo recente encontrado.</p>
            @endforelse
        </div>
    </section>
@endsection
