@extends('layouts.app')

@section('title', 'Membros | Servos PHP')

@section('content')
    <section class="panel-header">
        <div>
            <div class="eyebrow">Pessoas</div>
            <h1>Membros</h1>
            <p>Lista filtrada pelo que o seu perfil pode acompanhar nesta igreja.</p>
        </div>
    </section>

    <section class="panel">
        <div class="member-grid">
            @foreach ($members as $member)
                <article class="member-card">
                    <div class="member-card__head">
                        <div class="avatar-dot avatar-dot--large" style="background: {{ $member->avatar_color }}"></div>
                        <div>
                            <h2>{{ $member->name }}</h2>
                            <span>{{ $member->email }}</span>
                        </div>
                    </div>

                    <div class="tag-row">
                        <span class="tag {{ $member->active ? 'tag-success' : 'tag-danger' }}">{{ $member->active ? 'Ativo' : 'Inativo' }}</span>
                        <span class="tag tag-muted">{{ strtoupper($member->role) }}</span>
                        <span class="tag tag-brand">{{ $member->confirm_rate }}% confirmação</span>
                    </div>

                    <p class="member-meta">{{ $member->phone ?: 'Sem telefone cadastrado' }}</p>

                    <div class="tag-row">
                        @forelse (($memberships[$member->id] ?? collect()) as $membership)
                            <span class="tag tag-soft">{{ $membership->department?->name }}</span>
                        @empty
                            <span class="tag tag-soft">Sem ministério vinculado</span>
                        @endforelse
                    </div>
                </article>
            @endforeach
        </div>
    </section>
@endsection
