<?php

namespace Database\Seeders;

use App\Models\Church;
use App\Models\Department;
use App\Models\DepartmentMember;
use App\Models\Event;
use App\Models\Schedule;
use App\Models\ScheduleMember;
use App\Models\User;
use Illuminate\Database\Seeder;

class ServosDemoSeeder extends Seeder
{
    public function run(): void
    {
        if (Church::query()->exists()) {
            return;
        }

        $church = Church::create([
            'name' => 'Comunidade da Esperanca',
            'city' => 'Sao Paulo',
            'state' => 'SP',
            'vision' => 'Uma operacao pastoral simples, clara e responsiva para servir melhor.',
        ]);

        $admin = User::create([
            'church_id' => $church->id,
            'name' => 'Ramon Oliveira',
            'email' => 'ramon@servosapp.com',
            'phone' => '(11) 99999-1000',
            'password' => 'servos2026',
            'role' => 'admin',
            'status' => 'active',
            'avatar_color' => '#F4532A',
            'availability' => [true, false, true, false, false, true, true],
            'total_schedules' => 14,
            'confirm_rate' => 96,
            'joined_at' => now()->subMonths(10),
        ]);

        $leader = User::create([
            'church_id' => $church->id,
            'name' => 'Ana Ribeiro',
            'email' => 'ana@servosapp.com',
            'phone' => '(11) 99999-2000',
            'password' => 'servos2026',
            'role' => 'leader',
            'status' => 'active',
            'avatar_color' => '#D94420',
            'availability' => [true, false, true, false, false, true, true],
            'total_schedules' => 18,
            'confirm_rate' => 92,
            'joined_at' => now()->subMonths(8),
        ]);

        $member = User::create([
            'church_id' => $church->id,
            'name' => 'Lucas Martins',
            'email' => 'lucas@servosapp.com',
            'phone' => '(11) 99999-3000',
            'password' => 'servos2026',
            'role' => 'member',
            'status' => 'active',
            'avatar_color' => '#BD955A',
            'availability' => [false, false, false, true, false, true, true],
            'total_schedules' => 7,
            'confirm_rate' => 88,
            'joined_at' => now()->subMonths(5),
        ]);

        $worship = Department::create([
            'church_id' => $church->id,
            'name' => 'Louvor',
            'description' => 'Equipe musical, vocais e apoio de palco.',
            'icon' => 'music',
            'color' => '#F4532A',
            'function_names' => ['Voz', 'Violao', 'Teclado'],
            'leader_ids' => [$leader->id],
            'co_leader_ids' => [$admin->id],
            'active' => true,
        ]);

        $media = Department::create([
            'church_id' => $church->id,
            'name' => 'Midia',
            'description' => 'Captacao, exibicao e operacao da experiencia visual.',
            'icon' => 'camera',
            'color' => '#BD955A',
            'function_names' => ['Camera', 'Projecao', 'Transmissao'],
            'leader_ids' => [$admin->id],
            'co_leader_ids' => [],
            'active' => true,
        ]);

        DepartmentMember::create([
            'department_id' => $worship->id,
            'user_id' => $leader->id,
            'function_name' => 'Voz',
            'function_names' => ['Voz', 'Lideranca'],
            'joined_at' => now()->subMonths(8)->toDateString(),
        ]);

        DepartmentMember::create([
            'department_id' => $worship->id,
            'user_id' => $member->id,
            'function_name' => 'Violao',
            'function_names' => ['Violao', 'Back vocal'],
            'joined_at' => now()->subMonths(5)->toDateString(),
        ]);

        DepartmentMember::create([
            'department_id' => $media->id,
            'user_id' => $admin->id,
            'function_name' => 'Transmissao',
            'function_names' => ['Transmissao', 'Projecao'],
            'joined_at' => now()->subMonths(10)->toDateString(),
        ]);

        $sundayService = Event::create([
            'church_id' => $church->id,
            'name' => 'Culto de Domingo',
            'description' => 'Encontro principal da igreja com equipes integradas.',
            'type' => 'recurring',
            'icon' => 'church',
            'location' => 'Auditorio principal',
            'base_time' => '19:00',
            'instructions' => 'Reuniao curta 45 minutos antes do inicio.',
            'recurrence' => 'weekly',
            'active' => true,
        ]);

        $conference = Event::create([
            'church_id' => $church->id,
            'name' => 'Noite de Adoracao',
            'description' => 'Evento especial com repertorio expandido.',
            'type' => 'special',
            'icon' => 'star',
            'location' => 'Templo sede',
            'base_time' => '20:00',
            'instructions' => 'Check de som completo e recepcao reforcada.',
            'recurrence' => 'once',
            'active' => true,
        ]);

        $scheduleA = Schedule::create([
            'church_id' => $church->id,
            'event_id' => $sundayService->id,
            'department_id' => $worship->id,
            'date' => now()->addDays(4)->toDateString(),
            'time' => '19:00',
            'arrival_time' => '18:15',
            'status' => 'active',
            'instructions' => 'Passagem completa e alinhamento com comunicacao.',
            'notes' => 'Abrir com repertorio celebrativo.',
            'published' => true,
            'created_by' => $admin->id,
        ]);

        $scheduleB = Schedule::create([
            'church_id' => $church->id,
            'event_id' => $conference->id,
            'department_id' => $media->id,
            'date' => now()->addDays(9)->toDateString(),
            'time' => '20:00',
            'arrival_time' => '19:00',
            'status' => 'draft',
            'instructions' => 'Validar cameras, lower thirds e captacao.',
            'notes' => 'Rascunho aguardando confirmacao final.',
            'published' => false,
            'created_by' => $admin->id,
        ]);

        ScheduleMember::create([
            'schedule_id' => $scheduleA->id,
            'user_id' => $leader->id,
            'function_name' => 'Voz',
            'status' => 'confirmed',
            'responded_at' => now()->subDay(),
        ]);

        ScheduleMember::create([
            'schedule_id' => $scheduleA->id,
            'user_id' => $member->id,
            'function_name' => 'Violao',
            'status' => 'pending',
        ]);

        ScheduleMember::create([
            'schedule_id' => $scheduleB->id,
            'user_id' => $admin->id,
            'function_name' => 'Transmissao',
            'status' => 'pending',
        ]);
    }
}
