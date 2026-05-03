@extends('layouts.auth')

@section('title', 'Criar conta | Servos PHP')

@section('content')
    <div class="panel-head">
        <div class="eyebrow">Nova igreja</div>
        <h2>Criar conta</h2>
        <p>Comece com um admin, um evento recorrente e a estrutura pronta para crescer.</p>
    </div>

    @if ($errors->any())
        <div class="alert">
            {{ $errors->first() }}
        </div>
    @endif

    <form method="POST" action="{{ route('register.store') }}" class="stack-form">
        @csrf
        <label class="field">
            <span>Seu nome</span>
            <input type="text" name="name" value="{{ old('name') }}" required>
        </label>

        <label class="field">
            <span>Email</span>
            <input type="email" name="email" value="{{ old('email') }}" required>
        </label>

        <label class="field">
            <span>Nome da igreja</span>
            <input type="text" name="church_name" value="{{ old('church_name') }}" required>
        </label>

        <div class="grid-2">
            <label class="field">
                <span>Cidade</span>
                <input type="text" name="city" value="{{ old('city') }}">
            </label>

            <label class="field">
                <span>UF</span>
                <input type="text" name="state" value="{{ old('state') }}" maxlength="2">
            </label>
        </div>

        <div class="grid-2">
            <label class="field">
                <span>Senha</span>
                <input type="password" name="password" required minlength="6">
            </label>

            <label class="field">
                <span>Confirmar senha</span>
                <input type="password" name="password_confirmation" required minlength="6">
            </label>
        </div>

        <button type="submit" class="button button-primary button-block">Criar igreja e entrar</button>
    </form>

    <p class="form-footnote">
        Ja tem acesso?
        <a href="{{ route('login') }}">Voltar para login</a>
    </p>
@endsection
