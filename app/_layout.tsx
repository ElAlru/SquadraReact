import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import "../lib/i18n";
import { useAuthStore } from "../lib/store";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();

  // 🟢 1. En nuestro nuevo Store, lo que nos dice si estamos logueados es el 'token'
  const token = useAuthStore((state) => state.token);

  // Usamos un estado local para saber si la app ha terminado de cargar su primer pantallazo
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // 🟢 2. Aquí antes Supabase bloqueaba la app buscando sesiones.
    // De momento, simplemente le decimos a la app que ya puede arrancar.
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Comprobamos si el usuario está en la carpeta de login/registro
    const inAuthGroup = segments[0] === "(auth)";

    // 🟢 3. El semáforo de navegación
    if (!token && !inAuthGroup) {
      // Si NO tiene token y está intentando colarse en la app -> ¡Tarjeta roja y al login!
      router.replace("/(auth)/login");
    } else if (token && inAuthGroup) {
      // Si SÍ tiene token pero está en la pantalla de login -> ¡Directo al vestuario (selector)!
      // OJO: Asegúrate de que esta ruta '/(selector)' es correcta en tu proyecto.
      router.replace("/(selector)"); 
    }
  }, [token, isReady, segments]);

  // Mientras la app decide a dónde ir, no mostramos nada (evita parpadeos raros)
  if (!isReady) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}