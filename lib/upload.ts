import { useAuthStore } from "./store";

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://squadraapi.onrender.com';

export async function uploadProfilePhoto(uri: string): Promise<string> {
  const token = useAuthStore.getState().token;
  if (!token) throw new Error('No hay sesión activa');

  const formData = new FormData();
  formData.append('file', {
    uri,
    name: 'avatar.jpg',
    type: 'image/jpeg',
  } as any);

  const res = await fetch(`${API_URL}/api/profile/photo`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      // NO pongas Content-Type manualmente — fetch lo pone con boundary para FormData
    },
    body: formData,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || 'Error subiendo foto');
  }

  const data = await res.json();
  return data.photoUrl as string;
}