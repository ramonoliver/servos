<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AuthFlowTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_is_redirected_to_login_from_dashboard(): void
    {
        $this->get('/dashboard')
            ->assertRedirect('/login');
    }

    public function test_demo_user_can_log_in_and_see_dashboard(): void
    {
        $this->seed();

        $this->post('/login', [
            'email' => 'ramon@servosapp.com',
            'password' => 'servos2026',
        ])->assertRedirect('/dashboard');

        $this->get('/dashboard')
            ->assertOk()
            ->assertSee('Culto de Domingo');
    }

    public function test_register_creates_a_new_church_and_admin_user(): void
    {
        $response = $this->post('/cadastro', [
            'name' => 'Nova Lideranca',
            'email' => 'nova@igreja.com',
            'church_name' => 'Igreja da Graca',
            'city' => 'Recife',
            'state' => 'PE',
            'password' => '123456',
            'password_confirmation' => '123456',
        ]);

        $response->assertRedirect('/dashboard');

        $this->assertDatabaseHas('churches', [
            'name' => 'Igreja da Graca',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'nova@igreja.com',
            'role' => 'admin',
        ]);
    }
}
