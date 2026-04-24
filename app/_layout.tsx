import { Stack, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import "../lib/i18n";
import { useAuthStore } from "../lib/store";

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const token = useAuthStore((state) => state.token);

  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (!isReady) return;

    // Cubre TODAS las pantallas dentro de la carpeta (auth), incluido el index
    const inAuthGroup = segments[0] === "(auth)";

    if (!token && !inAuthGroup) {
      // Si no tiene token y sale de la zona (auth) -> Lo mandamos al inicio de (auth)
      // Como tu index está en (auth), al mandar a "/(auth)" abrirá automáticamente (auth)/index.tsx
      router.replace("/(auth)");
    } else if (token && inAuthGroup) {
      // Si tiene token pero está viendo cosas de (auth) -> ¡Directo al selector!
      router.replace("/(selector)");
    }
  }, [token, isReady, segments]);

  if (!isReady) return null;

  return <Stack screenOptions={{ headerShown: false }} />;
}
