import * as Clipboard from "expo-clipboard";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useTheme } from "../../lib/useTheme";
import ScreenContainer from "../../components/ScreenContainer";

const POSICION_LABEL: Record<string, string> = {
  GOALKEEPER: "Portero",
  DEFENDER: "Defensa",
  MIDFIELDER: "Centrocampista",
  FORWARD: "Delantero",
};

const POSICION_COLOR: Record<string, string> = {
  GOALKEEPER: "#f59e0b",
  DEFENDER: "#3b82f6",
  MIDFIELDER: "#8b5cf6",
  FORWARD: "#16a34a",
};

export default function MiClub() {
  const c = useTheme();

  const activeTeamId = useAuthStore((s: any) => s.activeTeamId);
  const activeRole = useAuthStore((s: any) => s.activeRole);
  const clubId = useAuthStore((s: any) => s.activeClubId);
  const seasonLabel = useAuthStore((s: any) => s.activeSeasonName);

  // ── STATE ─────────────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [teams, setTeams] = useState<any[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);

  // Modal estadísticas
  const [statsModal, setStatsModal] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  // ── CARGAR LISTA DE EQUIPOS ───────────────────────────────────────────────
  useEffect(() => {
    async function loadTeams() {
      if (!clubId) {
        setLoading(false);
        return;
      }

      try {
        const res = await apiFetch(`/api/club/equipos/${clubId}`);
        if (res.ok) {
          const json = await res.json();
          setTeams(json);
          // Por defecto mostrar el equipo activo del usuario (si existe en la lista)
          const defaultId = activeTeamId
            ? (json.find((t: any) => t.id === activeTeamId)?.id ?? json[0]?.id)
            : json[0]?.id;
          if (defaultId) setSelectedTeamId(defaultId);
          else setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (e) {
        console.error("Error cargando equipos:", e);
        setLoading(false);
      }
    }
    loadTeams();
  }, [clubId, activeTeamId]);

  // ── CARGAR DETALLE DEL EQUIPO SELECCIONADO ────────────────────────────────
  useEffect(() => {
    if (!selectedTeamId || !seasonLabel) return;
    setLoading(true);
    apiFetch(`/api/club/detalle/${selectedTeamId}?clubId=${clubId}&seasonLabel=${seasonLabel}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => setData(json))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [selectedTeamId, seasonLabel]);

  // ── ABRIR MODAL ESTADÍSTICAS ──────────────────────────────────────────────
  const openStats = async (jugador: any) => {
    setSelectedPlayer(jugador);
    setPlayerStats(null);
    setStatsModal(true);
    setLoadingStats(true);
    try {
      const res = await apiFetch(
        `/api/club/jugador/${jugador.id}/stats?clubId=${clubId}&teamId=${selectedTeamId}&seasonLabel=${seasonLabel}`,
      );
      if (res.ok) setPlayerStats(await res.json());
    } catch {
      Alert.alert("Error", "No se pudieron cargar las estadísticas.");
    } finally {
      setLoadingStats(false);
    }
  };

  const copyCode = async (code: string) => {
    if (!code) return;
    await Clipboard.setStringAsync(code);
    Alert.alert(
      "¡Copiado!",
      "El código de invitación se ha copiado al portapapeles.",
    );
  };

  // ── GUARDS ────────────────────────────────────────────────────────────────
  if (loading && !data)
    return <ActivityIndicator style={{ flex: 1 }} color={c.boton} />;

  if (!data && teams.length === 0) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor: c.fondo }]}>
        <Text style={{ fontSize: 40 }}>🏟️</Text>
        <Text style={[styles.emptyTitle, { color: c.texto }]}>
          Tu club está vacío
        </Text>
        <Text style={[styles.emptySub, { color: c.subtexto }]}>
          Ve a Gestión para crear tu primer equipo y empezar a añadir jugadores.
        </Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={[styles.emptyWrap, { backgroundColor: c.fondo }]}>
        <Text style={[styles.emptySub, { color: c.subtexto }]}>
          No se pudo cargar la información
        </Text>
      </View>
    );
  }

  return (
    <ScreenContainer>
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      {/* ─── SELECTOR DE EQUIPO (TABS HORIZONTALES) ──────────────────────── */}
      {teams.length > 0 && (
        <View
          style={[styles.selectorWrap, { borderBottomColor: c.bordeInput }]}
        >
          <Text style={[styles.selectorLabel, { color: c.subtexto }]}>
            Equipo
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            {teams.map((t: any) => {
              const selected = selectedTeamId === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.teamChip,
                    {
                      backgroundColor: selected ? c.boton : c.input,
                      borderColor: selected ? c.boton : c.bordeInput,
                    },
                  ]}
                  onPress={() => setSelectedTeamId(t.id)}
                >
                  <Text
                    style={{
                      color: selected ? "#fff" : c.texto,
                      fontWeight: selected ? "bold" : "500",
                      fontSize: 13,
                    }}
                  >
                    {t.category} {t.suffix}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── HEADER DEL CLUB ─────────────────────────────────────────────── */}
        <View style={styles.header}>
          {data.logoUrl ? (
            <Image source={{ uri: data.logoUrl }} style={styles.clubAvatar} />
          ) : (
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
                {data.nombre?.charAt(0) || "C"}
              </Text>
            </View>
          )}
          <View style={styles.clubInfo}>
            <Text style={[styles.clubNombre, { color: c.texto }]}>
              {data.nombre}
            </Text>
            <Text style={[styles.clubMeta, { color: c.subtexto }]}>
              {data.equipo} · {data.temporada}
            </Text>
          </View>
        </View>

        {/* Código de invitación */}
        <View
          style={[
            styles.codigoCard,
            { backgroundColor: c.input, borderColor: c.bordeInput },
          ]}
        >
          <View>
            <Text style={[styles.codigoLabel, { color: c.subtexto }]}>
              CÓDIGO DE INVITACIÓN
            </Text>
            <Text style={[styles.codigoValue, { color: c.boton }]}>
              {data.codigoInvitacion || "---"}
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => copyCode(data.codigoInvitacion)}
            style={[
              styles.copiarButton,
              { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` },
            ]}
          >
            <Text style={[styles.copiarText, { color: c.boton }]}>
              📋 Copiar
            </Text>
          </TouchableOpacity>
        </View>

        {/* Chips */}
        <View style={styles.chipsRow}>
          {[
            `🏷 ${data.categoria}`,
            data.genero === "MALE"
              ? "👦 Masculino"
              : data.genero === "FEMALE"
                ? "👧 Femenino"
                : "👥 Mixto",
            `👥 ${data.plantilla?.length || 0} jugadores`,
          ].map((label) => (
            <View
              key={label}
              style={[
                styles.chip,
                { backgroundColor: c.input, borderColor: c.bordeInput },
              ]}
            >
              <Text style={[styles.chipText, { color: c.subtexto }]}>
                {label}
              </Text>
            </View>
          ))}
        </View>

        {/* ─── STAFF ──────────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.texto }]}>
          🎽 Staff técnico
        </Text>
        {data.staff?.length > 0 ? (
          <View style={styles.staffList}>
            {data.staff.map((m: any) => (
              <View
                key={m.id}
                style={[
                  styles.staffCard,
                  { backgroundColor: c.input, borderColor: c.bordeInput },
                ]}
              >
                <View
                  style={[
                    styles.staffAvatar,
                    {
                      backgroundColor: `${c.boton}18`,
                      borderColor: `${c.boton}35`,
                    },
                  ]}
                >
                  <Text style={[styles.staffAvatarText, { color: c.boton }]}>
                    {m.firstName?.charAt(0)}
                  </Text>
                </View>
                <View style={styles.staffInfo}>
                  <Text style={[styles.staffNombre, { color: c.texto }]}>
                    {m.firstName} {m.lastName}
                  </Text>
                  {m.phone && (
                    <Text style={[styles.staffPhone, { color: c.subtexto }]}>
                      📞 {m.phone}
                    </Text>
                  )}
                  {m.staffRole && (
                    <Text style={[styles.staffPhone, { color: c.subtexto }]}>
                      {m.staffRole}
                    </Text>
                  )}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: c.subtexto }]}>
            Sin staff registrado
          </Text>
        )}

        {/* ─── PLANTILLA ──────────────────────────────────────────────────── */}
        <Text style={[styles.sectionTitle, { color: c.texto, marginTop: 24 }]}>
          ⚽ Plantilla
        </Text>
        {data.plantilla?.length > 0 ? (
          <View style={styles.jugadoresList}>
            {data.plantilla.map((j: any) => {
              const posColor = POSICION_COLOR[j.position] || c.boton;
              return (
                <TouchableOpacity
                  key={j.id}
                  style={[
                    styles.jugadorCard,
                    { backgroundColor: c.input, borderColor: c.bordeInput },
                  ]}
                  onPress={() => openStats(j)}
                  activeOpacity={0.8}
                >
                  <View
                    style={[
                      styles.jugadorAvatar,
                      {
                        backgroundColor: `${posColor}18`,
                        borderColor: `${posColor}35`,
                      },
                    ]}
                  >
                    <Text
                      style={[styles.jugadorAvatarText, { color: posColor }]}
                    >
                      {j.firstName?.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.jugadorInfo}>
                    <Text style={[styles.jugadorNombre, { color: c.texto }]}>
                      {j.firstName} {j.lastName}
                    </Text>
                    <View style={styles.jugadorMeta}>
                      {j.birthDate && (
                        <Text
                          style={[
                            styles.jugadorMetaText,
                            { color: c.subtexto },
                          ]}
                        >
                          🎂 {j.birthDate}
                        </Text>
                      )}
                      {j.kitSize && (
                        <Text
                          style={[
                            styles.jugadorMetaText,
                            { color: c.subtexto },
                          ]}
                        >
                          👕 {j.kitSize}
                        </Text>
                      )}
                    </View>
                    {j.docNumber && (
                      <Text
                        style={[
                          styles.jugadorMetaText,
                          { color: c.subtexto, marginTop: 2 },
                        ]}
                      >
                        🪪 {j.docType || "DOC"}: {j.docNumber}
                      </Text>
                    )}
                  </View>
                  <View style={styles.jugadorDerecha}>
                    <View
                      style={[
                        styles.dorsalBadge,
                        {
                          backgroundColor: `${posColor}18`,
                          borderColor: `${posColor}35`,
                        },
                      ]}
                    >
                      <Text style={[styles.dorsalText, { color: posColor }]}>
                        #{j.jerseyNumber || "?"}
                      </Text>
                    </View>
                    <Text style={[styles.posicionText, { color: c.subtexto }]}>
                      {POSICION_LABEL[j.position] || "Jugador"}
                    </Text>
                    <Text style={[styles.statsHint, { color: c.boton }]}>
                      📊 Stats
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: c.subtexto }]}>
            Sin jugadores registrados
          </Text>
        )}
      </ScrollView>

      {/* ─── MODAL ESTADÍSTICAS DEL JUGADOR ──────────────────────────────── */}
      <Modal
        visible={statsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setStatsModal(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setStatsModal(false)}>
          <Pressable
            style={[
              styles.statsCard,
              { backgroundColor: c.fondo, borderColor: c.bordeInput },
            ]}
            onPress={() => {}}
          >
            {/* Header */}
            <View style={styles.statsHeader}>
              <View>
                <Text style={[styles.statsNombre, { color: c.texto }]}>
                  {selectedPlayer?.firstName} {selectedPlayer?.lastName}
                </Text>
                <Text style={[styles.statsPos, { color: c.subtexto }]}>
                  {POSICION_LABEL[selectedPlayer?.position] || "Jugador"} · #
                  {selectedPlayer?.jerseyNumber || "?"}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setStatsModal(false)}>
                <Text style={{ color: c.subtexto, fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            {loadingStats ? (
              <ActivityIndicator
                color={c.boton}
                style={{ marginTop: 30, marginBottom: 30 }}
              />
            ) : playerStats ? (
              <>
                <Text style={[styles.statsTemporada, { color: c.subtexto }]}>
                  Temporada {seasonLabel}
                </Text>

                {/* Grid de estadísticas — SOLO MÉTRICAS POSITIVAS / DE PARTIDO */}
                {/* PROHIBIDO: titularidades y suplencias */}
                <View style={styles.statsGrid}>
                  {[
                    { label: "⚽ Goles", value: playerStats.totalGoles },
                    {
                      label: "🅰️ Asistencias",
                      value: playerStats.totalAsistencias,
                    },
                    {
                      label: "🏆 Partidos gan.",
                      value: playerStats.partidosGanados,
                    },
                    { label: "🎮 Partidos", value: playerStats.totalPartidos },
                    {
                      label: "🟨 T. Amarillas",
                      value: playerStats.totalTarjetasAmarillas,
                    },
                    {
                      label: "🟥 T. Rojas",
                      value: playerStats.totalTarjetasRojas,
                    },
                  ].map((stat) => (
                    <View
                      key={stat.label}
                      style={[styles.statBox, { backgroundColor: c.input }]}
                    >
                      <Text style={[styles.statValue, { color: c.texto }]}>
                        {stat.value ?? 0}
                      </Text>
                      <Text style={[styles.statLabel, { color: c.subtexto }]}>
                        {stat.label}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text
                style={[
                  styles.emptySub,
                  { color: c.subtexto, textAlign: "center", marginTop: 20 },
                ]}
              >
                No hay estadísticas disponibles para esta temporada.
              </Text>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  selectorWrap: {
    paddingTop: 60,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  selectorLabel: {
    fontSize: 11,
    textTransform: "uppercase",
    fontWeight: "bold",
    marginBottom: 10,
    letterSpacing: 1,
  },
  teamChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },

  container: { flexGrow: 1, padding: 24, paddingTop: 24, paddingBottom: 40 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 16,
  },
  clubAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  clubAvatarText: { fontSize: 24, fontWeight: "bold" },
  clubInfo: { flex: 1 },
  clubNombre: { fontSize: 22, fontWeight: "bold", marginBottom: 2 },
  clubMeta: { fontSize: 13 },

  codigoCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  codigoLabel: {
    fontSize: 11,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  codigoValue: { fontSize: 22, fontWeight: "bold", letterSpacing: 4 },
  copiarButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copiarText: { fontSize: 13, fontWeight: "600" },

  chipsRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 28,
    flexWrap: "wrap",
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: { fontSize: 12, fontWeight: "500" },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 12 },
  emptyText: { fontStyle: "italic", marginBottom: 20 },

  staffList: { gap: 10, marginBottom: 8 },
  staffCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  staffAvatarText: { fontSize: 16, fontWeight: "bold" },
  staffInfo: { flex: 1, gap: 3 },
  staffNombre: { fontSize: 14, fontWeight: "600" },
  staffPhone: { fontSize: 12, opacity: 0.8 },

  jugadoresList: { gap: 10 },
  jugadorCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  jugadorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  jugadorAvatarText: { fontSize: 18, fontWeight: "bold" },
  jugadorInfo: { flex: 1, gap: 2 },
  jugadorNombre: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  jugadorMeta: { flexDirection: "row", gap: 10 },
  jugadorMetaText: { fontSize: 11 },
  jugadorDerecha: { alignItems: "center", gap: 4 },
  dorsalBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dorsalText: { fontSize: 13, fontWeight: "bold" },
  posicionText: { fontSize: 10, fontWeight: "500", textAlign: "center" },
  statsHint: { fontSize: 10, fontWeight: "600" },

  emptyWrap: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginTop: 10,
    marginBottom: 8,
  },
  emptySub: { fontSize: 14, textAlign: "center", lineHeight: 20 },

  // Stats modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  statsCard: {
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  statsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  statsNombre: { fontSize: 20, fontWeight: "bold" },
  statsPos: { fontSize: 13, marginTop: 2 },
  statsTemporada: {
    fontSize: 12,
    marginBottom: 20,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 20,
  },
  statBox: {
    width: "30%",
    flex: 1,
    minWidth: "28%",
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  statValue: { fontSize: 28, fontWeight: "bold", marginBottom: 4 },
  statLabel: { fontSize: 11, fontWeight: "600", textAlign: "center" },
});
