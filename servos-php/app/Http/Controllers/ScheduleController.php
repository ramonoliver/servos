<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\DepartmentMember;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\View\View;

class ScheduleController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();
        $visibleDepartmentIds = $this->visibleDepartmentIds($user);

        $query = Schedule::query()
            ->with(['event', 'department', 'members.user'])
            ->where('church_id', $user->church_id)
            ->orderBy('date')
            ->orderBy('time');

        if ($user->isMember()) {
            $query->whereHas('members', fn ($memberQuery) => $memberQuery->where('user_id', $user->id));
        } elseif (! $user->isAdmin()) {
            $query->whereIn('department_id', $visibleDepartmentIds);
        }

        $schedules = $query->get();

        return view('schedules.index', [
            'pageTitle' => $user->isMember() ? 'Minhas escalas' : 'Escalas',
            'pageSubtitle' => $user->isMember()
                ? 'Acompanhe respostas, horarios de chegada e o contexto de cada escala.'
                : 'Veja publicacoes, ocupacao e confirmacoes dos ministerios visiveis para voce.',
            'schedules' => $schedules,
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
