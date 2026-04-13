import { router, useFocusEffect } from "expo-router";
import { useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
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

// --- LIBRERÍAS PROPIAS ---
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useTheme } from "../../lib/useTheme";

const ROL_LABEL: Record<string, string> = {
  PRESIDENT: "👑 Presidente",
  COACH: "🎽 Entrenador",
  PLAYER: "⚽ Jugador",
  RELATIVE: "👨‍👧 Familiar",
  OTHER: "👤 Otro",
};

type ClubMembership = {
  clubId: number;
  clubName: string;
  role: "PRESIDENT" | "COACH" | "PLAYER" | "RELATIVE" | "OTHER";
  teamId: number | null;
  teamName: string | null;
};

type PendingRequest = {
  id: number;
  clubName: string;
  status: string;
  requestedAt: string;
};

export default function SelectorIndex() {
  const c = useTheme();
  const { t } = useTranslation();
  const { setActiveClub } = useAuthStore();

  const [clubes, setClubes] = useState<ClubMembership[]>([]);
  const [requests, setRequests] = useState<PendingRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // 🟢 FUNCIÓN DE CARGA COMPLETA
  const loadAllData = useCallback(async (isPullToRefresh = false) => {
    if (isPullToRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    try {
      console.log("♻️ Cargando datos del selector...");
      
      // Lanzamos ambas peticiones en paralelo
      const [resClubs, resReqs] = await Promise.all([
        apiFetch("/api/selector/mis-clubes"),
        apiFetch("/api/clubs/my-requests")
      ]);

      // 1. Procesar Clubes (con tu lógica de texto plano)
      if (resClubs.ok) {
        const textClubs = await resClubs.text();
        if (textClubs && textClubs.trim() !== "") {
          setClubes(JSON.parse(textClubs));
        } else {
          setClubes([]);
        }
      }

      // 2. Procesar Solicitudes Pendientes
      if (resReqs.ok) {
        const dataReqs = await resReqs.json();
        setRequests(dataReqs);
      }

    } catch (e) {
      console.error("💥 Error de red cargando selector:", e);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // 🟢 REFRESCAR AL GANAR EL FOCO (Back navigation)
  useFocusEffect(
    useCallback(() => {
      loadAllData();
    }, [loadAllData])
  );

  const handleSelectClub = (club: ClubMembership) => {
    setActiveClub(club.clubId, club.clubName, club.role, club.teamId);
    router.replace("/(club)/inicio");
  };

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]} 
      keyboardShouldPersistTaps="handled"
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={() => loadAllData(true)} tintColor={c.boton} />
      }
    >
      <Text style={styles.brand}>SQUADRA</Text>

      <Text style={[styles.title, { color: c.texto }]}>
        {!isLoading && (clubes.length > 0 || requests.length > 0) ? "Tus clubes" : "¿Listo para jugar?"}
      </Text>
      <Text style={[styles.subtitle, { color: c.subtexto }]}>
        {!isLoading && (clubes.length > 0 || requests.length > 0)
          ? "Selecciona un club o revisa tus solicitudes"
          : "Crea tu club o únete al de tu equipo"}
      </Text>

      {/* --- CARGANDO --- */}
      {isLoading && !isRefreshing ? (
        <ActivityIndicator color={c.boton} size="large" style={{ marginVertical: 32 }} />
      ) : (
        <View style={styles.content}>
          
          {/* --- LISTA DE CLUBES ACTIVOS --- */}
          {clubes.length > 0 && (
            <View style={styles.clubList}>
              {clubes.map((club, index) => (
                <TouchableOpacity
                  key={`club-${club.clubId}-${index}`}
                  style={[styles.clubCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}
                  onPress={() => handleSelectClub(club)}
                >
                  <View style={[styles.clubAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                    <Text style={[styles.clubAvatarText, { color: c.boton }]}>{club.clubName.charAt(0)}</Text>
                  </View>
                  <View style={styles.clubInfo}>
                    <Text style={[styles.clubName, { color: c.texto }]}>{club.clubName}</Text>
                    <Text style={[styles.clubRol, { color: c.subtexto }]}>
                      {ROL_LABEL[club.role] || ROL_LABEL["OTHER"]}
                      {club.teamName ? ` (${club.teamName})` : ''}
                    </Text>
                  </View>
                  <Text style={[styles.clubArrow, { color: c.boton }]}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* --- SOLICITUDES PENDIENTES --- */}
          {requests.length > 0 && (
            <View style={styles.requestSection}>
              <Text style={[styles.sectionTitle, { color: c.subtexto }]}>Pendientes de aprobación</Text>
              {requests.map((req) => (
                <View 
                  key={`req-${req.id}`} 
                  style={[styles.requestCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}
                >
                  <View style={styles.requestIcon}>
                    <Text style={{ fontSize: 20 }}>⏳</Text>
                  </View>
                  <View style={styles.clubInfo}>
                    <Text style={[styles.clubName, { color: c.texto, fontSize: 15 }]}>{req.clubName}</Text>
                    <Text style={[styles.clubRol, { color: '#C9A84C' }]}>Esperando al presidente...</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Divisor si hay contenido */}
          {(clubes.length > 0 || requests.length > 0) && (
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: c.bordeInput }]} />
              <Text style={[styles.dividerText, { color: c.subtexto }]}>o</Text>
              <View style={[styles.dividerLine, { backgroundColor: c.bordeInput }]} />
            </View>
          )}

          {/* --- ACCIONES --- */}
          <View style={styles.actions}>
            <TouchableOpacity 
                style={[styles.actionCard, { backgroundColor: c.boton }]} 
                onPress={() => router.push("/(selector)/crear-club")}
            >
              <Text style={styles.actionIcon}>🏆</Text>
              <View style={styles.actionText}>
                <Text style={styles.actionTitle}>{clubes.length > 0 ? "Crear otro club" : "Crear mi club"}</Text>
                {clubes.length === 0 && <Text style={styles.actionSubtitle}>Soy el presidente del club</Text>}
              </View>
              <Text style={styles.actionArrow}>›</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionCard, { backgroundColor: c.input, borderWidth: 1.5, borderColor: c.bordeInput }]}
              onPress={() => router.push("/(selector)/unirse")}
            >
              <Text style={styles.actionIcon}>🔗</Text>
              <View style={styles.actionText}>
                <Text style={[styles.actionTitle, { color: c.texto }]}>{clubes.length > 0 ? "Unirme a otro club" : "Unirme a un club"}</Text>
                {clubes.length === 0 && <Text style={[styles.actionSubtitle, { color: c.subtexto }]}>Tengo un código de invitación</Text>}
              </View>
              <Text style={[styles.actionArrow, { color: c.subtexto }]}>›</Text>
            </TouchableOpacity>
          </View>

        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 80, paddingBottom: 40 },
  brand: { fontSize: 13, fontWeight: "bold", color: "#C9A84C", letterSpacing: 4, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 28, lineHeight: 20 },
  content: { gap: 20 },
  clubList: { gap: 12 },
  clubCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, gap: 14 },
  clubAvatar: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  clubAvatarText: { fontSize: 20, fontWeight: "bold" },
  clubInfo: { flex: 1, gap: 3 },
  clubName: { fontSize: 16, fontWeight: "600" },
  clubRol: { fontSize: 13, fontWeight: "500" },
  clubArrow: { fontSize: 24, fontWeight: "bold" },
  
  requestSection: { gap: 10, marginTop: 8 },
  sectionTitle: { fontSize: 12, fontWeight: "bold", textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 },
  requestCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 12, gap: 12, opacity: 0.8 },
  requestIcon: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },

  dividerContainer: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 10 },
  dividerLine: { flex: 1, height: 1, opacity: 0.3 },
  dividerText: { fontSize: 13, fontWeight: "bold" },
  
  actions: { gap: 14 },
  actionCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 18, gap: 16 },
  actionIcon: { fontSize: 30 },
  actionText: { flex: 1, gap: 2 },
  actionTitle: { fontSize: 16, fontWeight: "bold", color: "#ffffff" },
  actionSubtitle: { fontSize: 12, color: "rgba(255,255,255,0.75)", lineHeight: 16 },
  actionArrow: { fontSize: 24, fontWeight: "bold", color: "rgba(255,255,255,0.8)" },
});