import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from "react";
import "../lib/i18n";
import { useAuthStore } from "../lib/store";

// Evitamos que la pantalla de carga (Splash Screen) desaparezca automáticamente
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const token = useAuthStore((state) => state.token);
  
  const [isReady, setIsReady] = useState(false);

  // 1. Cargamos las fuentes
  const [fontsLoaded, fontError] = useFonts({
    'SquadraStencil': require('../assets/fonts/SquadraFont.ttf'), 
  });

  // 2. Controlamos cuándo quitar la pantalla de carga
  useEffect(() => {
    // Si la fuente ha terminado de cargar (o si hubo un error y no pudo)
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync(); // Ocultamos el Splash Screen
      setIsReady(true);         // Marcamos la app como lista
    }
  }, [fontsLoaded, fontError]);

  // 3. Controlamos la redirección (Auth Guard)
  useEffect(() => {
    // Si la app aún no está lista, no hacemos nada
    if (!isReady) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!token && !inAuthGroup) {
      // Sin sesión y fuera de auth -> Al inicio
      router.replace("/(auth)");
    } else if (token && inAuthGroup) {
      // Con sesión y dentro de auth -> Al selector de club
      router.replace("/(selector)");
    }
  }, [token, isReady, segments]);

  // Si las fuentes no han cargado, no renderizamos la interfaz
  if (!isReady) return null;

  // 4. Renderizamos la estructura de navegación principal
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(selector)" /> 
      <Stack.Screen name="(club)" />
    </Stack>
  );
}