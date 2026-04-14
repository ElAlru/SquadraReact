import { router, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
  Alert,
} from "react-native";

import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useTheme } from "../../lib/useTheme";

const ROL_LABEL: Record<string, string> = {
  PRESIDENT: "👑 Presidente",
  COACH: "🎽 Entrenador",
  PLAYER: "⚽ Jugador",
  RELATIVE: "👨‍👧 Familiar",
  OTHER: "👤 Miembro",
};

export default function SelectorIndex() {
  const c = useTheme();
  const { setActiveClub, setSeason } = useAuthStore();

  const [clubes, setClubes] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadAllData = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      const [resClubs, resReqs] = await Promise.all([
        apiFetch("/api/clubs/my-memberships"),
        apiFetch("/api/clubs/my-requests")
      ]);

      if (resClubs.ok) setClubes(await resClubs.json());
      if (resReqs.ok) setRequests(await resReqs.json());
    } catch (e) {
      console.error("Error cargando selector:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { loadAllData(); }, [loadAllData]));

  const handleSelectClub = async (m: any) => {
    try {
      // 1. Seteamos el club activo
      setActiveClub(m.clubId, m.clubName, m.role, m.teamId, m.clubLogo);

      // 2. Obtenemos la temporada actual del Java
      const res = await apiFetch(`/api/clubs/${m.clubId}/current-season`);
      if (res.ok) {
        const label = await res.text();
        setSeason(label, label); 
      }
      // 3. Vamos a la pantalla de inicio (Ruta corregida)
      router.replace("/inicio"); 
    } catch (e) {
      Alert.alert("Error", "No se pudo conectar con el club");
    }
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]} 
      refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => loadAllData(true)} tintColor={c.boton} />}
    >
      <Text style={styles.brand}>SQUADRA</Text>
      <Text style={[styles.title, { color: c.texto }]}>Tus clubes</Text>

      {isLoading && !isRefreshing ? (
        <ActivityIndicator color={c.boton} size="large" style={{ marginVertical: 32 }} />
      ) : (
        <View style={styles.content}>
          {clubes.map((club, idx) => (
            <TouchableOpacity
              key={`${club.clubId}-${idx}`}
              style={[styles.clubCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}
              onPress={() => handleSelectClub(club)}
            >
              <View style={[styles.clubAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                <Text style={[styles.clubAvatarText, { color: c.boton }]}>{club.clubName.charAt(0)}</Text>
              </View>
              <View style={styles.clubInfo}>
                <Text style={[styles.clubName, { color: c.texto }]}>{club.clubName}</Text>
                <Text style={[styles.clubRol, { color: c.subtexto }]}>
                  {ROL_LABEL[club.role] || "Miembro"}
                </Text>
              </View>
              <Text style={[styles.clubArrow, { color: c.boton }]}>›</Text>
            </TouchableOpacity>
          ))}

          {requests.map((req) => (
            <TouchableOpacity 
              key={req.id} 
              style={[styles.requestCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}
              onPress={() => router.push("/(selector)/esperando")}
            >
              <Text style={{ fontSize: 20 }}>⏳</Text>
              <View style={styles.clubInfo}>
                <Text style={[styles.clubName, { color: c.texto, fontSize: 15 }]}>{req.clubName}</Text>
                <Text style={[styles.clubRol, { color: '#C9A84C' }]}>Pendiente de aprobación</Text>
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.actions}>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: c.boton }]} onPress={() => router.push("/(selector)/crear-club")}>
              <Text style={styles.actionTitle}>🏆 Crear mi club</Text>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionCard, { backgroundColor: c.input, borderWidth: 1, borderColor: c.bordeInput }]} onPress={() => router.push("/(selector)/unirse")}>
              <Text style={[styles.actionTitle, { color: c.texto }]}>🔗 Unirme a un club</Text>
              <Text style={[styles.actionArrow, { color: c.subtexto }]}>›</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 60 },
  brand: { fontSize: 14, fontWeight: "bold", color: "#C9A84C", letterSpacing: 5, marginBottom: 30 },
  title: { fontSize: 28, fontWeight: "800", marginBottom: 30 },
  content: { gap: 16 },
  clubCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 16, gap: 16 },
  clubAvatar: { width: 50, height: 50, borderRadius: 12, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  clubAvatarText: { fontSize: 22, fontWeight: "bold" },
  clubInfo: { flex: 1 },
  clubName: { fontSize: 17, fontWeight: "700" },
  clubRol: { fontSize: 13, marginTop: 2 },
  clubArrow: { fontSize: 24, fontWeight: "300" },
  requestCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, borderWidth: 1, padding: 14, gap: 14, borderStyle: 'dashed' },
  actions: { marginTop: 20, gap: 12 },
  actionCard: { flexDirection: "row", alignItems: "center", padding: 18, borderRadius: 16, gap: 16 },
  actionTitle: { color: "white", fontSize: 16, fontWeight: "700", flex: 1 },
  actionArrow: { color: "white", fontSize: 20, opacity: 0.8 }
});