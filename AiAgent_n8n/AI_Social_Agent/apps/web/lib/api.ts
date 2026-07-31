const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000/api";

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {})
    },
    cache: "no-store"
  });

  if (!res.ok) {
    throw new Error(`API request failed: ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type ContentEntry = {
  id: string;
  date: string;
  category: string;
  topic: string;
  linkedinPost?: string | null;
  imagePath?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};
