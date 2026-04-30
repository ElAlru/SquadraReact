import { useAuthStore } from './store';

const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'https://squadraapi.onrender.com';

export async function apiFetch(endpoint: string, options: any = {}) {
  try {
    const token = useAuthStore.getState().token;

    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${cleanEndpoint}`;

    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Auto-logout when the server invalidates the session (e.g. login from another device)
    if (response.status === 401 && token) {
      useAuthStore.getState().logout();
    }

    return response;

  } catch (error) {
    console.error('💥 [apiFetch] Error:', error);
    throw error;
  }
}