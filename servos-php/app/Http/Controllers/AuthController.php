<?php

namespace App\Http\Controllers;

use App\Models\Church;
use App\Models\Event;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\View\View;

class AuthController extends Controller
{
    public function showLogin(): View
    {
        return view('auth.login');
    }

    public function login(Request $request): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials, false)) {
            return back()
                ->withErrors(['email' => 'Email ou senha incorretos.'])
                ->onlyInput('email');
        }

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard'));
    }

    public function showRegister(): View
    {
        return view('auth.register');
    }

    public function register(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:120'],
            'email' => ['required', 'email', 'max:160', 'unique:users,email'],
            'password' => ['required', 'confirmed', 'min:6'],
            'church_name' => ['required', 'string', 'max:160'],
            'city' => ['nullable', 'string', 'max:120'],
            'state' => ['nullable', 'string', 'size:2'],
        ]);

        $user = DB::transaction(function () use ($data) {
            $church = Church::create([
                'name' => $data['church_name'],
                'city' => strtoupper($data['city'] ?? 'Cidade'),
                'state' => strtoupper($data['state'] ?? 'BR'),
                'vision' => 'Organize pessoas, cuide de escalas e fortaleça o servir.',
            ]);

            $user = User::create([
                'church_id' => $church->id,
                'name' => $data['name'],
                'email' => $data['email'],
                'password' => $data['password'],
                'role' => 'admin',
                'status' => 'active',
                'avatar_color' => '#F4532A',
                'availability' => [true, false, false, true, false, false, true],
                'confirm_rate' => 100,
                'joined_at' => now(),
            ]);

            Event::create([
                'church_id' => $church->id,
                'name' => 'Culto Principal',
                'description' => 'Evento inicial criado junto com a igreja.',
                'type' => 'recurring',
                'icon' => 'church',
                'location' => 'Templo sede',
                'base_time' => '19:00',
                'instructions' => 'Chegar com antecedencia e revisar a ordem do culto.',
                'recurrence' => 'weekly',
                'active' => true,
            ]);

            return $user;
        });

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }

    public function logout(Request $request): RedirectResponse
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect()->route('login');
    }
}
