import { getDeviceId } from "./device";

// In dev, "/api" is proxied to the Spring backend (see vite.config.ts).
// Override with VITE_API_URL for other environments.
export const API_BASE = (import.meta.env.VITE_API_URL ?? "/api").replace(/\/$/, "");

function deviceHeaders(extra?: Record<string, string>): Record<string, string> {
  return { "X-Device-Id": getDeviceId(), ...(extra ?? {}) };
}

async function unwrap<T>(res: Response, what: string): Promise<T> {
  if (!res.ok) {
    throw new Error(`${what} failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { headers: deviceHeaders() });
  return unwrap<T>(res, `GET ${path}`);
}

export async function apiJson<T>(method: "POST" | "PUT", path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: deviceHeaders({ "Content-Type": "application/json" }),
    body: JSON.stringify(body),
  });
  return unwrap<T>(res, `${method} ${path}`);
}

export async function apiSend<T>(method: "PUT" | "DELETE", path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { method, headers: deviceHeaders() });
  return unwrap<T>(res, `${method} ${path}`);
}

export async function apiDelete(path: string): Promise<void> {
  const res = await fetch(`${API_BASE}${path}`, { method: "DELETE", headers: deviceHeaders() });
  if (!res.ok) {
    throw new Error(`DELETE ${path} failed: ${res.status}`);
  }
}

export async function apiUpload<T>(path: string, form: FormData): Promise<T> {
  // No Content-Type header: the browser sets the multipart boundary itself.
  const res = await fetch(`${API_BASE}${path}`, { method: "POST", headers: deviceHeaders(), body: form });
  return unwrap<T>(res, `POST ${path}`);
}

// Fetch a protected binary (attachment image) and return an object URL.
export async function apiObjectUrl(path: string): Promise<string> {
  const res = await fetch(`${API_BASE}${path}`, { headers: deviceHeaders() });
  if (!res.ok) {
    throw new Error(`GET ${path} failed: ${res.status}`);
  }
  return URL.createObjectURL(await res.blob());
}
