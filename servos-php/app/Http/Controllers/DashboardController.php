<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\DepartmentMember;
use App\Models\Schedule;
use App\Models\ScheduleMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\View\View;

class DashboardController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();
        $visibleDepartmentIds = $this->visibleDepartmentIds($user);

        $scheduleQuery = Schedule::query()
            ->with(['event', 'department', 'members.user'])
            ->where('church_id', $user->church_id)
            ->where('status', '!=', 'cancelled');

        if ($user->isMember()) {
            $scheduleQuery->whereHas('members', fn ($query) => $query->where('user_id', $user->id));
        } elseif (! $user->isAdmin()) {
            $scheduleQuery->whereIn('department_id', $visibleDepartmentIds);
        }

        $schedules = $scheduleQuery
            ->orderBy('date')
            ->orderBy('time')
            ->get();

        $upcoming = $schedules
            ->filter(fn (Schedule $schedule) => $schedule->status === 'active')
            ->take(5);

        $pendingAssignments = ScheduleMember::query()
            ->whereIn('schedule_id', $schedules->pluck('id'))
            ->where('status', 'pending')
            ->count();

        $memberIds = $user->isAdmin()
            ? User::where('church_id', $user->church_id)->where('active', true)->pluck('id')
            : DepartmentMember::whereIn('department_id', $visibleDepartmentIds)->pluck('user_id')->push($user->id)->unique();

        $verse = collect([
            ['text' => 'Cada um exerca o dom que recebeu para servir os outros.', 'ref' => '1 Pedro 4:10'],
            ['text' => 'O maior entre voces sera aquele que serve.', 'ref' => 'Mateus 23:11'],
            ['text' => 'Tudo o que fizerem, facam de todo o coracao, como para o Senhor.', 'ref' => 'Colossenses 3:23'],
        ])->get(now()->dayOfYear % 3);

        return view('dashboard.index', [
            'user' => $user,
            'verse' => $verse,
            'todayLabel' => now()->locale('pt_BR')->translatedFormat('l, d \d\e F'),
            'upcoming' => $upcoming,
            'stats' => [
                ['label' => $user->isMember() ? 'Minhas escalas' : 'Escalas ativas', 'value' => $upcoming->count()],
                ['label' => 'Membros', 'value' => $memberIds->count()],
                ['label' => $user->isMember() ? 'Minha confirmacao' : 'Pendencias', 'value' => $user->isMember() ? $user->confirm_rate.'%' : $pendingAssignments],
                ['label' => 'Ministerios', 'value' => $user->isMember() ? $visibleDepartmentIds->count() : Department::whereIn('id', $visibleDepartmentIds)->count()],
            ],
        ]);
    }

    private function visibleDepartmentIds(User $user): Collection
    {
        $departments = Department::where('church_id', $user->church_id)->get();

        if ($user->isAdmin()) {
            return $departments->pluck('id');
        }

        $managedIds = $departments
            ->filter(fn (Department $department) => in_array($user->id, $department->leader_ids ?? [], true) || in_array($user->id, $department->co_leader_ids ?? [], true))
            ->pluck('id');

        $memberIds = DepartmentMember::where('user_id', $user->id)->pluck('department_id');

        return $managedIds->merge($memberIds)->unique()->values();
    }
}
