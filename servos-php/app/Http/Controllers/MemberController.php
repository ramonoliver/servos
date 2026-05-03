<?php

namespace App\Http\Controllers;

use App\Models\Department;
use App\Models\DepartmentMember;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\View\View;

class MemberController extends Controller
{
    public function index(Request $request): View
    {
        $user = $request->user();
        $visibleDepartmentIds = $this->visibleDepartmentIds($user);

        $memberships = DepartmentMember::query()
            ->with('department')
            ->whereIn('department_id', $visibleDepartmentIds)
            ->get();

        $visibleUserIds = $user->isAdmin()
            ? $user->church->users()->pluck('id')
            : $memberships->pluck('user_id')->push($user->id)->unique();

        $members = $user->church->users()
            ->whereIn('id', $visibleUserIds)
            ->orderBy('active', 'desc')
            ->orderBy('name')
            ->get();

        return view('members.index', [
            'members' => $members,
            'memberships' => $memberships->groupBy('user_id'),
            'departmentNames' => Department::whereIn('id', $visibleDepartmentIds)->pluck('name', 'id'),
        ]);
    }

    private function visibleDepartmentIds($user): Collection
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
