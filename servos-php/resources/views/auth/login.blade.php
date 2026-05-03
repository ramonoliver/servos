@extends('layouts.auth')

@section('title', 'Entrar | Servos PHP')

@section('content')
    <div class="panel-head">
        <div class="eyebrow">Acesso</div>
        <h2>Entrar</h2>
        <p>Use o demo inicial ou sua propria igreja criada nesta versao PHP.</p>
    </div>

    @if ($errors->any())
        <div class="alert">
            {{ $errors->first() }}
        </div>
    @endif

    <form method="POST" action="{{ route('login.attempt') }}" class="stack-form">
        @csrf
        <label class="field">
            <span>Email</span>
            <input type="email" name="email" value="{{ old('email') }}" required autofocus>
        </label>

        <label class="field">
            <span>Senha</span>
            <input type="password" name="password" required>
        </label>

        <button type="submit" class="button button-primary button-block">Entrar no painel</button>
    </form>

    <div class="helper-card">
        <div class="eyebrow">Demo</div>
        <strong>ramon@servosapp.com</strong>
        <span>Senha: servos2026</span>
    </div>

    <p class="form-footnote">
        Ainda nao tem conta?
        <a href="{{ route('register') }}">Crie uma nova igreja</a>
    </p>
@endsection
