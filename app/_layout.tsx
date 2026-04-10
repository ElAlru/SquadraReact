import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect } from "react";
import { apiFetch } from "../lib/api";
import "../lib/i18n";
import { useAuthStore } from "../lib/store";
import { supabase } from "../lib/supabase";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { setAuth, clearAuth, isInitialized, user } = useAuthStore();

  useEffect(() => {
    // Recupera sesión persistida en SecureStore al abrir la app
    supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        setAuth(session.user, session);

        // Carga el perfil completo desde tu API
        try {
          const res = await apiFetch("/profiles/me");
          const profile = await res.json();
          useAuthStore.getState().setProfile(profile);
        } catch (e) {
          console.error("Error cargando perfil:", e);
        }
      } else {
        clearAuth();
      }
    });

    // Escucha cambios: login, logout, token renovado
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      session ? setAuth(session.user, session) : clearAuth();
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isInitialized) return;
    const inAuth = segments[0] === "(auth)";

    if (!user && !inAuth) router.replace("/(auth)/login");
    else if (user && inAuth) router.replace("/(selector)");
  }, [isInitialized, user, segments]);

  if (!isInitialized) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
