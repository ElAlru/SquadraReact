import { router } from "expo-router";
import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
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
  role: "PRESIDENT" | "COACH" | "PLAYER" | "RELATIVE" | "OTHER"; // 👈 Ahora TypeScript sabe que es 100% seguro
  teamId: number | null;
  teamName: string | null;
};

export default function SelectorIndex() {
  const c = useTheme();
  const { t } = useTranslation();
  const { setActiveClub } = useAuthStore(); // Asume que tu store guarda el estado activo

  const [clubes, setClubes] = useState<ClubMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

const loadClubs = useCallback(async () => {
    setIsLoading(true);
    try {
      // 🟢 Llamada real al endpoint de producción
      const res = await apiFetch("/api/selector/mis-clubes");
      
      if (res.ok) {
        // 1. Leemos la respuesta como texto plano primero
        const textRes = await res.text();
        
        // 2. Si el texto está vacío (usuario nuevo sin clubes), lo atrapamos aquí
        if (!textRes || textRes.trim() === "") {
          console.log("Respuesta vacía del servidor. El usuario no tiene clubes.");
          setClubes([]); // Seteamos el estado a vacío y no pasa nada
          return;
        }

        // 3. Si hay texto, intentamos parsearlo a JSON
        try {
          const data = JSON.parse(textRes);
          setClubes(data);
        } catch (parseError) {
          console.error("Error parseando el JSON de los clubes:", parseError);
          setClubes([]);
        }
        
      } else {
        console.error("Fallo al cargar los clubes:", res.status);
      }
    } catch (e) {
      console.error("Error de red cargando clubes:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadClubs();
  }, [loadClubs]);

const handleSelectClub = (club: ClubMembership) => {
    // 🟢 Ahora le pasamos el nombre del club para que el Layout lo vea
    setActiveClub(club.clubId, club.clubName, club.role, club.teamId); 
    router.replace("/(club)/inicio");
  };

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]} keyboardShouldPersistTaps="handled">
      {/* Brand */}
      <Text style={styles.brand}>SQUADRA</Text>

      {/* Cabecera dinámica (Estado 1 vs Estados 2, 3, 4) */}
      <Text style={[styles.title, { color: c.texto }]}>
        {!isLoading && clubes.length > 0 ? "Tus clubes" : "¿Listo para jugar?"}
      </Text>
      <Text style={[styles.subtitle, { color: c.subtexto }]}>
        {!isLoading && clubes.length > 0
          ? "Selecciona un club para continuar"
          : "Crea tu club o únete al de tu equipo"}
      </Text>

      {/* Lista de clubes */}
      {isLoading ? (
        <ActivityIndicator color={c.boton} size="large" style={{ marginVertical: 32 }} />
      ) : clubes.length > 0 ? (
        <View style={styles.clubList}>
          {clubes.map((club, index) => (
            <TouchableOpacity
              key={`${club.clubId}-${club.teamId || 'null'}-${index}`}
              style={[styles.clubCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}
              onPress={() => handleSelectClub(club)}
            >
              <View style={[styles.clubAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                <Text style={[styles.clubAvatarText, { color: c.boton }]}>{club.clubName.charAt(0)}</Text>
              </View>
              <View style={styles.clubInfo}>
                <Text style={[styles.clubName, { color: c.texto }]}>{club.clubName}</Text>
                {/* Lógica para Estado 3: Mostrar rol y el equipo si lo tiene */}
                <Text style={[styles.clubRol, { color: c.subtexto }]}>
                  {ROL_LABEL[club.role] || ROL_LABEL["OTHER"]}
                  {club.teamName ? ` (${club.teamName})` : ''}
                </Text>
              </View>
              <Text style={[styles.clubArrow, { color: c.boton }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Divisor "o" */}
      {!isLoading && clubes.length > 0 && (
        <View style={styles.dividerContainer}>
          <View style={[styles.dividerLine, { backgroundColor: c.bordeInput }]} />
          <Text style={[styles.dividerText, { color: c.subtexto }]}>o</Text>
          <View style={[styles.dividerLine, { backgroundColor: c.bordeInput }]} />
        </View>
      )}

      {/* Acciones principales / secundarias */}
      {!isLoading && (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.actionCard, { backgroundColor: c.boton }]} onPress={() => router.push("/(selector)/crear-club")}>
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
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 80, paddingBottom: 40 },
  brand: { fontSize: 13, fontWeight: "bold", color: "#C9A84C", letterSpacing: 4, marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 28, lineHeight: 20 },
  clubList: { gap: 12, marginBottom: 8 },
  clubCard: { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 14, gap: 14 },
  clubAvatar: { width: 48, height: 48, borderRadius: 14, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
  clubAvatarText: { fontSize: 20, fontWeight: "bold" },
  clubInfo: { flex: 1, gap: 3 },
  clubName: { fontSize: 16, fontWeight: "600" },
  clubRol: { fontSize: 13, fontWeight: "500" },
  clubArrow: { fontSize: 24, fontWeight: "bold" },
  dividerContainer: { flexDirection: "row", alignItems: "center", gap: 10, marginVertical: 24 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13, fontWeight: "bold" },
  actions: { gap: 14 },
  actionCard: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 20, gap: 16 },
  actionIcon: { fontSize: 32 },
  actionText: { flex: 1, gap: 4 },
  actionTitle: { fontSize: 17, fontWeight: "bold", color: "#ffffff" },
  actionSubtitle: { fontSize: 13, color: "rgba(255,255,255,0.75)", lineHeight: 18 },
  actionArrow: { fontSize: 26, fontWeight: "bold", color: "rgba(255,255,255,0.8)" },
});