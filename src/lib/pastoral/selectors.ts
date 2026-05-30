import {
  careCases,
  cellMeetings,
  pastoralAlerts,
  pastoralCells,
  pastoralMinistries,
  pastoralPeople,
  pastoralRelationships,
  pastoralTags,
  prayerRequests,
  timelineEvents,
} from "./mock-data";
import type { CellHealth, PastoralCell, PastoralPerson, PersonKind, TimelineEvent } from "./types";

export function getPerson(id: string) {
  return pastoralPeople.find((person) => person.id === id) || null;
}

export function getCell(id: string) {
  return pastoralCells.find((cell) => cell.id === id) || null;
}

export function getMinistry(id: string) {
  return pastoralMinistries.find((ministry) => ministry.id === id) || null;
}

export function getTag(id: string) {
  return pastoralTags.find((tag) => tag.id === id) || null;
}

export function getPersonTags(person: PastoralPerson) {
  return person.tagIds.map(getTag).filter(Boolean);
}

export function getPersonMinistries(person: PastoralPerson) {
  return person.ministryIds.map(getMinistry).filter(Boolean);
}

export function getCellMembers(cell: PastoralCell) {
  return cell.members
    .map((member) => ({ ...member, person: getPerson(member.personId) }))
    .filter((member) => member.person);
}

export function getCellMeetings(cellId: string) {
  return cellMeetings.filter((meeting) => meeting.cellId === cellId);
}

export function getPersonTimeline(personId: string) {
  return timelineEvents
    .filter((event) => event.personId === personId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getCellTimeline(cellId: string) {
  return timelineEvents
    .filter((event) => event.cellId === cellId)
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getPersonCareCases(personId: string) {
  return careCases.filter((care) => care.personId === personId);
}

export function getPersonPrayerRequests(personId: string) {
  return prayerRequests.filter((request) => request.personId === personId);
}

export function getPersonRelationships(personId: string) {
  return pastoralRelationships
    .filter((relationship) => relationship.personId === personId)
    .map((relationship) => ({ ...relationship, person: getPerson(relationship.relatedPersonId) }))
    .filter((relationship) => relationship.person);
}

export function filterPeople(params: {
  search?: string;
  kind?: PersonKind | "all";
  tagId?: string;
  withoutCell?: boolean;
  inCare?: boolean;
}) {
  const search = params.search?.trim().toLowerCase();

  return pastoralPeople.filter((person) => {
    const matchesSearch =
      !search ||
      person.fullName.toLowerCase().includes(search) ||
      person.email.toLowerCase().includes(search) ||
      person.phone.toLowerCase().includes(search);

    const matchesKind = !params.kind || params.kind === "all" || person.kinds.includes(params.kind);
    const matchesTag = !params.tagId || params.tagId === "all" || person.tagIds.includes(params.tagId);
    const matchesWithoutCell = !params.withoutCell || !person.cellId;
    const matchesCare = !params.inCare || careCases.some((care) => care.personId === person.id && care.status !== "finished");

    return matchesSearch && matchesKind && matchesTag && matchesWithoutCell && matchesCare;
  });
}

export function getHealthAverage(health: CellHealth) {
  const values = Object.values(health);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

export function getHealthLabel(score: number) {
  if (score >= 80) return "Saudavel";
  if (score >= 65) return "Em crescimento";
  if (score >= 50) return "Precisa cuidado";
  return "Pedir ajuda";
}

export function getTimelineByDate(events: TimelineEvent[]) {
  return events.reduce<Record<string, TimelineEvent[]>>((groups, event) => {
    const day = event.date.slice(0, 10);
    groups[day] = groups[day] || [];
    groups[day].push(event);
    return groups;
  }, {});
}

export function getPastoralDashboardSummary() {
  const activeCare = careCases.filter((care) => care.status !== "finished");
  const visitors = pastoralPeople.filter((person) => person.kinds.includes("visitor"));
  const peopleWithoutCell = pastoralPeople.filter((person) => !person.cellId);
  const openPrayerRequests = prayerRequests.filter((request) => request.status === "open");
  const activeLeaders = pastoralPeople.filter((person) => person.kinds.includes("leader") || person.kinds.includes("pastor"));

  return {
    visitorsRecent: visitors.length,
    activeCare: activeCare.length,
    peopleDrifting: pastoralAlerts.filter((alert) => alert.severity !== "gentle").length,
    cellsGrowth: pastoralCells.reduce((sum, cell) => sum + Math.max(0, cell.members.length - 1), 0),
    openPrayerRequests: openPrayerRequests.length,
    generalFrequency: Math.round(
      pastoralCells.reduce((sum, cell) => sum + cell.health.frequency, 0) / Math.max(1, pastoralCells.length)
    ),
    activeLeaders: activeLeaders.length,
    peopleWithoutCell: peopleWithoutCell.length,
  };
}

export function getPastoralSearchBundle() {
  return {
    people: pastoralPeople,
    cells: pastoralCells,
    ministries: pastoralMinistries,
    tags: pastoralTags,
    meetings: cellMeetings,
    timeline: timelineEvents,
    careCases,
    alerts: pastoralAlerts,
    prayerRequests,
  };
}
