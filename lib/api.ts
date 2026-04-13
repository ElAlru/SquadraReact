import { useAuthStore } from './store'; // 👈 Asegúrate de que la ruta sea correcta a tu store.ts

const API_URL = 'https://squadraapi.onrender.com';

export async function apiFetch(endpoint: string, options: any = {}) {
  try {
    // 🪄 JUGADA MAESTRA V2: Leer directo de Zustand en vez de Supabase
    // Es instantáneo y evita los bucles infinitos de AsyncStorage
    const token = useAuthStore.getState().session?.access_token;
    
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${cleanEndpoint}`;

    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Si esto se imprime, la petición HA SALIDO del móvil
    console.log(`🚀 [apiFetch] ${options.method || 'GET'} -> ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    console.log(`📥 [apiFetch] Status: ${response.status}`);
    return response;

  } catch (error) {
    console.error('💥 [apiFetch] Error:', error);
    throw error;
  }
}