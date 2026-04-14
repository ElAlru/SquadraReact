import { useAuthStore } from './store'; 

const API_URL = 'https://squadraapi.onrender.com';

export async function apiFetch(endpoint: string, options: any = {}) {
  try {
    // ✅ CORREGIDO: Ahora leemos 'token' directamente, que es como se llama en tu nuevo store.ts
    const token = useAuthStore.getState().token; 
    console.log("🔍 DEBUG TOKEN:", token ? `SÍ (longitud: ${token.length})` : "NO HAY TOKEN (es NULL)");
  if (token) console.log("🔍 CABECERA:", `Bearer ${token.substring(0, 15)}...`);
    
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${cleanEndpoint}`;

    const headers: any = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // 🔑 Si hay token, lo metemos en la mochila
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    console.log(`🚀 [apiFetch] ${options.method || 'GET'} -> ${url}`);
    if (!token) console.warn("⚠️ OJO: Enviando petición SIN TOKEN");

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