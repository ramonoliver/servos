<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\DepartmentMember;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\View\View;

class DepartmentController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();
        $visibleIds = $this->visibleDepartmentIds($user);

        $departments = Department::query()
            ->withCount('members')
            ->whereIn('id', $visibleIds)
            ->orderBy('name')
            ->get();

        $people = User::where('church_id', $user->church_id)->get()->keyBy('id');
        $recentMemberships = DepartmentMember::query()
            ->with(['user', 'department'])
            ->whereIn('department_id', $visibleIds)
            ->latest()
            ->take(8)
            ->get();

        return view('departments.index', [
            'departments' => $departments,
            'people' => $people,
            'recentMemberships' => $recentMemberships,
        ]);
    }

    private function visibleDepartmentIds(User $user): Collection
    {
        $departments = Department::where('church_id', $user->church_id)->get();

        if ($user->isAdmin()) {
            return $departments->pluck('id');
        }

        return $departments
            ->filter(fn (Department $department) => in_array($user->id, $department->leader_ids ?? [], true) || in_array($user->id, $department->co_leader_ids ?? [], true))
            ->pluck('id')
            ->values();
    }
}
