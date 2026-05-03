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
<body class="auth-page">
    <main class="auth-shell">
        <section class="auth-hero">
            <div class="eyebrow">Servos PHP</div>
            <h1>Organize. Sirva. Viva o propósito.</h1>
            <p>Uma releitura em Laravel para rodar com mais conforto na Hostgator, sem perder o foco em ministérios, membros e escalas.</p>
            <div class="quote-card">
                <span>“Cada um exerça o dom que recebeu para servir os outros.”</span>
                <strong>1 Pedro 4:10</strong>
            </div>
        </section>

        <section class="auth-panel">
            @yield('content')
        </section>
    </main>
</body>
</html>
