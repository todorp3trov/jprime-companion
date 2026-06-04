import { apiDelete, apiGet, apiJson, apiObjectUrl, apiSend, apiUpload } from "./client";

// Wire shapes — structurally compatible with the types used in App.tsx.
export type ApiSession = {
  id: string;
  day: number;
  time: string;
  end: string;
  title: string;
  speakers: string[];
  room: string;
  track: string;
  level: string;
  kind: "keynote" | "lecture" | "workshop" | "break";
  plenary: boolean;
  description: string;
  materials: string[];
  saved: boolean;
  status: "upcoming" | "live" | "done";
};

export type ApiDay = { id: number; weekday: string; wdShort: string; date: string; short: string };
export type ApiNotification = {
  id: string;
  kind: "reminder" | "alert" | "info";
  title: string;
  body: string;
  time: string;
  unread: boolean;
};
export type ApiMapSpot = { name: string; x: string; y: string; kind: string };
export type ApiCriterion = { id: number; name: string };
export type ApiSpeaker = {
  id: number;
  name: string;
  role: string;
  org: string;
  location: string;
  pronoun: string;
  bio: string;
  tags: string[];
  handle: string;
  sourceId: number | null;
  imageUrl: string;
};
export type ApiAttachment = { id: number; kind: "whiteboard" | "slide" | "badge"; label: string; url: string };
export type ApiNote = { sessionId: string; body: string; attachments: ApiAttachment[] };
export type ApiRating = {
  sessionId: string;
  submitted: boolean;
  feedback: string;
  scores: Record<string, number>;
};

// ── Conference reference data ───────────────────────────────────────

export const fetchDays = () => apiGet<ApiDay[]>("/days");
export const fetchSessions = () => apiGet<ApiSession[]>("/sessions");
export const fetchNotifications = () => apiGet<ApiNotification[]>("/notifications");
export const fetchMapSpots = () => apiGet<ApiMapSpot[]>("/map-spots");
export const fetchRatingCriteria = () => apiGet<ApiCriterion[]>("/rating-criteria");
export const fetchTracks = () => apiGet<string[]>("/tracks");

export async function fetchSpeakerProfiles(): Promise<Record<string, Omit<ApiSpeaker, "name">>> {
  const list = await apiGet<ApiSpeaker[]>("/speakers");
  const byName: Record<string, Omit<ApiSpeaker, "name">> = {};
  for (const { name, ...profile } of list) {
    byName[name] = profile;
  }
  return byName;
}

// ── Per-device user data ────────────────────────────────────────────

export const setSaved = (sessionId: string, saved: boolean) =>
  apiSend<{ sessionId: string; saved: boolean }>(saved ? "PUT" : "DELETE", `/sessions/${sessionId}/saved`);

export const getNote = (sessionId: string) => apiGet<ApiNote>(`/sessions/${sessionId}/note`);
export const putNote = (sessionId: string, body: string) =>
  apiJson<ApiNote>("PUT", `/sessions/${sessionId}/note`, { body });

export async function uploadAttachment(
  sessionId: string,
  file: File,
  kind: ApiAttachment["kind"],
  label: string,
): Promise<ApiAttachment> {
  const form = new FormData();
  form.append("file", file);
  form.append("kind", kind);
  form.append("label", label);
  return apiUpload<ApiAttachment>(`/sessions/${sessionId}/note/attachments`, form);
}

export const deleteAttachment = (attachmentId: number) => apiDelete(`/attachments/${attachmentId}`);
export const attachmentObjectUrl = (attachmentId: number) => apiObjectUrl(`/attachments/${attachmentId}`);

export const getRating = (sessionId: string) => apiGet<ApiRating>(`/sessions/${sessionId}/rating`);
export const putRating = (sessionId: string, feedback: string, scores: Record<number, number>) =>
  apiJson<ApiRating>("PUT", `/sessions/${sessionId}/rating`, { feedback, scores });
