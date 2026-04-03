import type { Role } from "@/types";

export type Action =
  | "schedule.create" | "schedule.edit" | "schedule.delete" | "schedule.view"
  | "member.invite" | "member.edit" | "member.remove" | "member.view"
  | "department.create" | "department.edit" | "department.delete" | "department.view"
  | "event.create" | "event.edit" | "event.delete" | "event.view"
  | "message.send" | "report.view" | "settings.edit"
  | "confirm.own" | "profile.edit";

interface PermContext {
  departmentId?: string;
  userDepartmentIds?: string[];
}

const ADMIN_ALL = true;

const LEADER_ACTIONS: Action[] = [
  "schedule.create", "schedule.edit", "schedule.view",
  "member.invite", "member.edit", "member.view",
  "department.view",
  "event.create", "event.edit", "event.view",
  "message.send",
  "confirm.own", "profile.edit",
];

const MEMBER_ACTIONS: Action[] = [
  "schedule.view", "member.view",
  "department.view", "event.view",
  "confirm.own", "profile.edit",
];

export function can(role: Role, action: Action, ctx?: PermContext): boolean {
  if (role === "admin") return ADMIN_ALL;

  if (role === "leader") {
    if (!LEADER_ACTIONS.includes(action)) return false;
    // Check department isolation for write actions
    if (ctx?.departmentId && ctx?.userDepartmentIds) {
      const writeActions: Action[] = ["schedule.create", "schedule.edit", "member.invite", "member.edit"];
      if (writeActions.includes(action)) {
        return ctx.userDepartmentIds.includes(ctx.departmentId);
      }
    }
    return true;
  }

  if (role === "member") {
    return MEMBER_ACTIONS.includes(action);
  }

  return false;
}
