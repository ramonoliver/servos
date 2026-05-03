<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Servos PHP')</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600;9..144,700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="{{ asset('css/app.css') }}">
</head>
<body>
@php
    $user = auth()->user();
    $church = $user?->church;
    $nav = [
        ['label' => 'Dashboard', 'route' => 'dashboard', 'href' => route('dashboard'), 'show' => true],
        ['label' => $user?->isMember() ? 'Minhas escalas' : 'Escalas', 'route' => 'schedules.index', 'href' => route('schedules.index'), 'show' => true],
        ['label' => 'Ministérios', 'route' => 'departments.index', 'href' => route('departments.index'), 'show' => $user?->isAdmin() || $user?->isLeader()],
        ['label' => 'Membros', 'route' => 'members.index', 'href' => route('members.index'), 'show' => true],
    ];
@endphp
<div class="shell">
    <aside class="sidebar">
        <div class="brand-mark">
            <div class="brand-mark__seal">S</div>
            <div>
                <div class="eyebrow">Servos</div>
                <strong>{{ $church?->name ?? 'Servos PHP' }}</strong>
            </div>
        </div>

        <nav class="nav-stack">
            @foreach ($nav as $item)
                @if ($item['show'])
                    <a href="{{ $item['href'] }}" class="nav-link {{ request()->routeIs($item['route']) ? 'is-active' : '' }}">
                        <span>{{ $item['label'] }}</span>
                    </a>
                @endif
            @endforeach
        </nav>

        <div class="sidebar-card">
            <div class="eyebrow">Hospedagem</div>
            <strong>Shared-hosting ready</strong>
            <p>Blade, sessao nativa e CSS estatico para publicar sem depender de Node em producao.</p>
        </div>

        <div class="profile-chip">
            <div class="avatar-dot" style="background: {{ $user?->avatar_color ?? '#F4532A' }}"></div>
            <div>
                <strong>{{ $user?->name }}</strong>
                <span>{{ strtoupper($user?->role ?? '') }}</span>
            </div>
        </div>

        <form method="POST" action="{{ route('logout') }}">
            @csrf
            <button type="submit" class="button button-muted button-block">Sair</button>
        </form>
    </aside>

    <main class="content">
        @yield('content')
    </main>
</div>
</body>
</html>
