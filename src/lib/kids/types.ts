import type { User } from "@/types";

export type KidsRoomStatus = "active" | "inactive";
export type KidsCheckInStatus = "in_room" | "called" | "checked_out" | "waiting_guardian";
export type GuardianRelationship = "Pai" | "Mae" | "Responsavel" | "Avo/Avo" | "Tio/Tia" | "Outro";

export interface KidsRoom {
  id: string;
  church_id: string;
  name: string;
  min_age: number;
  max_age: number;
  capacity: number;
  description: string;
  status: KidsRoomStatus;
  volunteer_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface KidsGuardianLink {
  id: string;
  church_id: string;
  child_id: string;
  guardian_id: string;
  relationship: GuardianRelationship;
  is_primary: boolean;
  created_at: string;
}

export interface KidsCheckIn {
  id: string;
  church_id: string;
  event_id: string;
  event_date: string;
  child_id: string;
  room_id: string;
  guardian_id: string;
  code: string;
  status: KidsCheckInStatus;
  checked_in_at: string;
  checked_out_at: string | null;
  called_at: string | null;
  checked_in_by: string;
  checked_out_by: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface KidsChild extends User {
  age: number | null;
  guardians: Array<{
    link_id: string;
    guardian: Pick<User, "id" | "name" | "phone" | "email" | "avatar_color" | "photo_url">;
    relationship: GuardianRelationship;
    is_primary: boolean;
  }>;
  primary_phone: string;
  frequent_room_name?: string;
}

export interface KidsCheckInView extends KidsCheckIn {
  child?: KidsChild;
  room?: KidsRoom;
  guardian?: Pick<User, "id" | "name" | "phone" | "email" | "avatar_color" | "photo_url">;
}
