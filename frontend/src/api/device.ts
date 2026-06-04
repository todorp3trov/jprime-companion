// Anonymous, per-browser identity. The backend keys all user data (saved
// sessions, notes, photos, ratings) on this id sent as the X-Device-Id header.
const STORAGE_KEY = "jprime.deviceId";

export function getDeviceId(): string {
  let id = localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}
