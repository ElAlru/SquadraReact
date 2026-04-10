import { supabase } from "./supabase";

const API_URL = process.env.EXPO_PUBLIC_API_URL!;

export async function apiFetch(path: string, options?: RequestInit) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session?.access_token}`,
      ...options?.headers,
    },
  });
}
