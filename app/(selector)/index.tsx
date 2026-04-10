import { router } from "expo-router";
import { useEffect, useState } from "react";
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

// Estructura que devolverá tu API cuando la implementes:
// GET /miembros/mis-clubes
// [{ id: 1, nombre: 'FC Ejemplo', rol: 'COACH' }, ...]
type ClubMembership = {
  id: number;
  nombre: string;
  rol: keyof typeof ROL_LABEL;
};

export default function SelectorIndex() {
  const c = useTheme();
  const { t } = useTranslation();
  const { setActiveClub } = useAuthStore();

  const [clubes, setClubes] = useState<ClubMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadClubs();
  }, []);

  const loadClubs = async () => {
    setIsLoading(true);
    try {
      const res = await apiFetch("/user-roles/mis-clubes");
      const data = await res.json();
      setClubes(
        data.map((item: any) => ({
          id: item.id,
          nombre: item.nombre,
          logoUrl: item.logoUrl,
          rol: item.rol as keyof typeof ROL_LABEL, // ← cast explícito
        })),
      );
    } catch (e) {
      console.error("Error cargando clubes:", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectClub = (club: ClubMembership) => {
    setActiveClub(club.id, club.rol);
    router.replace("/(club)/inicio");
  };

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Brand */}
      <Text style={styles.brand}>SQUADRA</Text>

      {/* Cabecera */}
      <Text style={[styles.title, { color: c.texto }]}>
        {clubes.length > 0 ? t("selector.title") : t("selector.titleEmpty")}
      </Text>
      <Text style={[styles.subtitle, { color: c.subtexto }]}>
        {clubes.length > 0
          ? t("selector.subtitle")
          : t("selector.subtitleEmpty")}
      </Text>

      {/* Lista de clubes */}
      {isLoading ? (
        <ActivityIndicator color={c.boton} style={{ marginVertical: 32 }} />
      ) : clubes.length > 0 ? (
        <View style={styles.clubList}>
          {clubes.map((club) => (
            <TouchableOpacity
              key={club.id}
              style={[
                styles.clubCard,
                { backgroundColor: c.input, borderColor: c.bordeInput },
              ]}
              onPress={() => handleSelectClub(club)}
            >
              <View
                style={[
                  styles.clubAvatar,
                  {
                    backgroundColor: `${c.boton}18`,
                    borderColor: `${c.boton}35`,
                  },
                ]}
              >
                <Text style={[styles.clubAvatarText, { color: c.boton }]}>
                  {club.nombre.charAt(0)}
                </Text>
              </View>
              <View style={styles.clubInfo}>
                <Text style={[styles.clubName, { color: c.texto }]}>
                  {club.nombre}
                </Text>
                <Text style={[styles.clubRol, { color: c.subtexto }]}>
                  {ROL_LABEL[club.rol]}
                </Text>
              </View>
              <Text style={[styles.clubArrow, { color: c.boton }]}>›</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}

      {/* Divisor — solo si hay clubes */}
      {!isLoading && clubes.length > 0 && (
        <View style={styles.dividerContainer}>
          <View
            style={[styles.dividerLine, { backgroundColor: c.bordeInput }]}
          />
          <Text style={[styles.dividerText, { color: c.subtexto }]}>
            {t("selector.or")}
          </Text>
          <View
            style={[styles.dividerLine, { backgroundColor: c.bordeInput }]}
          />
        </View>
      )}

      {/* Acciones — siempre visibles */}
      {!isLoading && (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.actionCard, { backgroundColor: c.boton }]}
            onPress={() => router.push("/(selector)/crear-club")}
          >
            <Text style={styles.actionIcon}>🏆</Text>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>{t("selector.createClub")}</Text>
              <Text style={styles.actionSubtitle}>
                {t("selector.createClubSub")}
              </Text>
            </View>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionCard,
              {
                backgroundColor: c.input,
                borderWidth: 1.5,
                borderColor: c.bordeInput,
              },
            ]}
            onPress={() => router.push("/(selector)/unirse")}
          >
            <Text style={styles.actionIcon}>🔗</Text>
            <View style={styles.actionText}>
              <Text style={[styles.actionTitle, { color: c.texto }]}>
                {t("selector.joinClub")}
              </Text>
              <Text style={[styles.actionSubtitle, { color: c.subtexto }]}>
                {t("selector.joinClubSub")}
              </Text>
            </View>
            <Text style={[styles.actionArrow, { color: c.subtexto }]}>›</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  brand: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#C9A84C",
    letterSpacing: 4,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 28,
    lineHeight: 20,
  },
  clubList: {
    gap: 12,
    marginBottom: 8,
  },
  clubCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  clubAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  clubAvatarText: {
    fontSize: 20,
    fontWeight: "bold",
  },
  clubInfo: {
    flex: 1,
    gap: 3,
  },
  clubName: {
    fontSize: 16,
    fontWeight: "600",
  },
  clubRol: {
    fontSize: 13,
  },
  clubArrow: {
    fontSize: 24,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },
  actions: {
    gap: 14,
  },
  actionCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 20,
    gap: 16,
  },
  actionIcon: {
    fontSize: 32,
  },
  actionText: {
    flex: 1,
    gap: 4,
  },
  actionTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#ffffff",
  },
  actionSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 18,
  },
  actionArrow: {
    fontSize: 26,
    fontWeight: "bold",
    color: "rgba(255,255,255,0.8)",
  },
});
