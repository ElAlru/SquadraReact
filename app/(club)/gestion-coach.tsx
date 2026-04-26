import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Modal, TextInput,
  StyleSheet, Alert, ActivityIndicator, Switch
} from "react-native";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useTheme } from "../../lib/useTheme";
import ScreenContainer from "../../components/ScreenContainer";

// Colores semánticos — no dependen del tema
const COLOR_PELIGRO  = "#ef4444"; // rojo  — eliminar, multa pendiente
const COLOR_EXITO    = "#16a34a"; // verde — multa pagada
const COLOR_NEUTRAL  = "#64748B"; // gris  — multa perdonada
const COLOR_AMARILLO = "#f59e0b"; // amarillo — advertencia

type Tab = "ASISTENCIA" | "CONVOCATORIAS" | "STATS" | "MULTAS";

interface PlayerAttendanceItem {
  playerId: number;
  firstName: string;
  lastName: string;
  attended: boolean | null;
  absenceReason: string | null;
}

interface CallupEntry {
  playerId: number;
  firstName: string;
  lastName: string;
  status: "CALLED_UP" | "ABSENT" | "INJURED";
  absenceReason: string | null;
}

interface StatsEntry {
  playerId: number;
  firstName: string;
  lastName: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
  wasStarter: boolean;
}

interface Fine {
  id: number;
  playerId: number;
  playerName: string;
  reason: string;
  amount: number;
  issuedDate: string;
  status: "PENDING" | "PAID" | "FORGIVEN";
  seasonLabel: string;
}

interface CalendarEvent {
  id: number;
  type: "TRAINING" | "MATCH";
  startTime: string;
  title: string;
  teamId: number;
  teamName: string;
}

export default function GestionCoach() {
  const c = useTheme();
  const { activeClubId: clubId, activeTeamId: storeTeamId, activeSeasonName, activeRole } = useAuthStore();
  const isPresident = activeRole === "PRESIDENT";
  const seasonLabel = activeSeasonName || "24-25";

  const [activeTab, setActiveTab] = useState<Tab>("ASISTENCIA");

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [loadingEvents, setLoadingEvents] = useState(false);

  const [attendance, setAttendance] = useState<PlayerAttendanceItem[]>([]);
  const [callups, setCallups] = useState<CallupEntry[]>([]);
  const [stats, setStats] = useState<StatsEntry[]>([]);
  const [fines, setFines] = useState<Fine[]>([]);
  const [finesLoading, setFinesLoading] = useState(false);
  const [finesPage, setFinesPage] = useState(0);
  const [finesHasMore, setFinesHasMore] = useState(true);

  const [localTeamId, setLocalTeamId] = useState<number | null>(storeTeamId ?? null);
  const [teams, setTeams] = useState<{ id: number; label: string }[]>([]);

  const [saving, setSaving] = useState(false);

  const [fineModal, setFineModal] = useState(false);
  const [fineTarget, setFineTarget] = useState<{ id: number; name: string } | null>(null);
  const [fineReason, setFineReason] = useState("");
  const [fineAmount, setFineAmount] = useState("");

  const [closeMatchModal, setCloseMatchModal] = useState(false);
  const [goalsFor, setGoalsFor] = useState("");
  const [goalsAgainst, setGoalsAgainst] = useState("");

  // ── FETCH ──────────────────────────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    if (!localTeamId) return;
    setLoadingEvents(true);
    try {
      const now = new Date();
      const from = now.toISOString();
      const to = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const res = await apiFetch(`/api/calendar?clubId=${clubId}&teamId=${localTeamId}&seasonLabel=${seasonLabel}&from=${from}&to=${to}`);
      const data: CalendarEvent[] = await res.json();
      setEvents(data);
      setSelectedEvent(data.length > 0 ? data[0] : null);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los eventos.");
    } finally {
      setLoadingEvents(false);
    }
  }, [clubId, localTeamId, seasonLabel]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (!selectedEvent) return;
    if (activeTab === "ASISTENCIA" && selectedEvent.type === "TRAINING") fetchAttendance();
    if (activeTab === "CONVOCATORIAS" && selectedEvent.type === "MATCH") fetchCallups();
    if (activeTab === "STATS" && selectedEvent.type === "MATCH") fetchStats();
  }, [selectedEvent, activeTab]);

  useEffect(() => { if (activeTab === "MULTAS") fetchFines(0); }, [activeTab]);

  // Carga la lista de equipos del club si el usuario es presidente
  useEffect(() => {
    if (!isPresident || !clubId) return;
    apiFetch(`/api/club/equipos/${clubId}`)
      .then(r => r.json())
      .then((data: any[]) => {
        const mapped = data
          .filter((t: any) => t.isActive)
          .map((t: any) => ({ id: t.id, label: `${t.category}${t.suffix ? " " + t.suffix : ""}` }));
        setTeams(mapped);
        if (!localTeamId && mapped.length > 0) setLocalTeamId(mapped[0].id);
      })
      .catch(() => {});
  }, [isPresident, clubId]);

  // Al cambiar de equipo, limpia los datos de la sesión anterior
  useEffect(() => {
    setSelectedEvent(null);
    setAttendance([]);
    setCallups([]);
    setStats([]);
  }, [localTeamId]);

  const fetchAttendance = async () => {
    if (!selectedEvent) return;
    try {
      const res = await apiFetch(`/api/coach/training/${selectedEvent.id}/attendance?clubId=${clubId}`);
      const data = await res.json();
      setAttendance(data.players);
    } catch {
      Alert.alert("Error", "No se pudo cargar la asistencia.");
    }
  };

  const fetchCallups = async () => {
    if (!selectedEvent) return;
    try {
      const res = await apiFetch(`/api/coach/match/callups/${selectedEvent.id}?clubId=${clubId}`);
      const data: CallupEntry[] = await res.json();
      setCallups(data.length > 0 ? data : []);
    } catch {}
  };

  const fetchStats = async () => {
    if (!selectedEvent) return;
    try {
      const res = await apiFetch(`/api/coach/match/${selectedEvent.id}/stats?clubId=${clubId}`);
      const data: StatsEntry[] = await res.json();
      setStats(data);
    } catch {}
  };

  const fetchFines = async (page: number) => {
    setFinesLoading(true);
    try {
      const res = await apiFetch(`/api/coach/fines?clubId=${clubId}&teamId=${localTeamId}&seasonLabel=${seasonLabel}&page=${page}&size=20`);
      const data = await res.json();
      const newFines: Fine[] = data.content;
      setFines(page === 0 ? newFines : prev => [...prev, ...newFines]);
      setFinesHasMore(!data.last);
      setFinesPage(page);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las multas.");
    } finally { setFinesLoading(false); }
  };

  // ── ACCIONES ───────────────────────────────────────────────────────────────

  const handleSaveBulkAttendance = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      await apiFetch(`/api/coach/training/attendance/bulk?clubId=${clubId}`, {
        method: "PUT",
        body: JSON.stringify({
          trainingId: selectedEvent.id,
          entries: attendance.map(p => ({
            playerId: p.playerId,
            attended: p.attended ?? false,
            absenceReason: p.absenceReason,
          })),
        }),
      });
      Alert.alert("Guardado", "Asistencia guardada.");
    } catch {
      Alert.alert("Error", "No se pudo guardar la asistencia.");
    } finally { setSaving(false); }
  };

  const handleSaveBulkCallups = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      await apiFetch(`/api/coach/match/callups/bulk?clubId=${clubId}`, {
        method: "PUT",
        body: JSON.stringify({
          matchId: selectedEvent.id,
          entries: callups.map(entry => ({
            playerId: entry.playerId,
            status: entry.status,
            absenceReason: entry.absenceReason,
          })),
        }),
      });
      Alert.alert("Guardado", "Convocatoria guardada.");
    } catch {
      Alert.alert("Error", "No se pudo guardar.");
    } finally { setSaving(false); }
  };

  const handleSaveBulkStats = async () => {
    if (!selectedEvent) return;
    setSaving(true);
    try {
      await apiFetch(`/api/coach/match/${selectedEvent.id}/stats/bulk?clubId=${clubId}`, {
        method: "PUT",
        body: JSON.stringify({ entries: stats }),
      });
      Alert.alert("Guardado", "Estadísticas guardadas.");
    } catch {
      Alert.alert("Error", "No se pudieron guardar las estadísticas.");
    } finally { setSaving(false); }
  };

  const handleCloseMatch = async () => {
    if (!selectedEvent) return;
    try {
      await apiFetch(`/api/coach/match/${selectedEvent.id}/close?clubId=${clubId}`, {
        method: "PATCH",
        body: JSON.stringify({
          goalsFor: Number(goalsFor),
          goalsAgainst: Number(goalsAgainst),
        }),
      });
      setCloseMatchModal(false);
      Alert.alert("Cerrado", "Partido cerrado correctamente.");
    } catch { Alert.alert("Error", "No se pudo cerrar."); }
  };

  const handleCreateFine = async () => {
    if (!fineTarget || !fineReason || !fineAmount) return;
    try {
      await apiFetch(`/api/coach/fines?clubId=${clubId}`, {
        method: "POST",
        body: JSON.stringify({
          playerId: fineTarget.id,
          teamId: localTeamId,
          reason: fineReason,
          amount: parseFloat(fineAmount),
        }),
      });
      setFineModal(false);
      setFineReason("");
      setFineAmount("");
      setFineTarget(null);
      fetchFines(0);
    } catch { Alert.alert("Error", "No se pudo crear."); }
  };

  // ── RENDERS DE TABS ────────────────────────────────────────────────────────

  const renderAttendanceTab = () => (
    <View style={s.tabContent}>
      {selectedEvent?.type === "TRAINING" ? (
        <>
          {attendance.length === 0 ? (
            <Text style={[s.hintText, { color: c.subtexto }]}>Sin jugadores registrados.</Text>
          ) : attendance.map((item, idx) => (
            <View key={item.playerId} style={[s.playerRow, { backgroundColor: c.input }]}>
              <Text style={[s.playerName, { color: c.texto }]}>{item.firstName} {item.lastName}</Text>
              <Switch value={item.attended ?? false} onValueChange={(v) => {
                const next = [...attendance];
                next[idx].attended = v;
                setAttendance(next);
              }} />
            </View>
          ))}
          <TouchableOpacity
            style={[s.btnPrimary, { backgroundColor: c.boton, opacity: saving ? 0.6 : 1 }]}
            onPress={handleSaveBulkAttendance}
            disabled={saving}
          >
            <Text style={[s.btnPrimaryText, { color: c.botonTexto }]}>
              {saving ? "Guardando..." : "💾 Guardar asistencia"}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={[s.hintText, { color: c.subtexto }]}>Selecciona un entrenamiento.</Text>
      )}
    </View>
  );

  const renderConvocatorias = () => (
    <View style={s.tabContent}>
      {selectedEvent?.type === "MATCH" ? (
        <>
          {callups.length === 0 ? (
            <Text style={[s.hintText, { color: c.subtexto }]}>Sin convocados aún.</Text>
          ) : callups.map((item, idx) => (
            <View key={item.playerId} style={[s.playerRow, { backgroundColor: c.input }]}>
              <Text style={[s.playerName, { color: c.texto }]}>{item.firstName} {item.lastName}</Text>
              <View style={{ flexDirection: "row", gap: 4 }}>
                {(["CALLED_UP", "ABSENT", "INJURED"] as const).map(st => (
                  <TouchableOpacity
                    key={st}
                    style={[
                      s.statusChip,
                      { backgroundColor: item.status === st ? c.boton : c.bordeInput },
                    ]}
                    onPress={() => {
                      const next = [...callups];
                      next[idx].status = st;
                      setCallups(next);
                    }}
                  >
                    <Text style={[s.statusChipText, { color: item.status === st ? c.botonTexto : c.subtexto }]}>
                      {st === "CALLED_UP" ? "✓" : st === "ABSENT" ? "A" : "🤕"}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={[s.btnPrimary, { backgroundColor: c.boton, opacity: saving ? 0.6 : 1 }]}
            onPress={handleSaveBulkCallups}
            disabled={saving}
          >
            <Text style={[s.btnPrimaryText, { color: c.botonTexto }]}>
              {saving ? "Guardando..." : "💾 Guardar convocatoria"}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={[s.hintText, { color: c.subtexto }]}>Selecciona un partido.</Text>
      )}
    </View>
  );

  const renderStats = () => (
    <View style={s.tabContent}>
      {selectedEvent?.type === "MATCH" ? (
        <>
          {stats.length === 0 ? (
            <Text style={[s.hintText, { color: c.subtexto }]}>Sin estadísticas aún.</Text>
          ) : stats.map((item, idx) => (
            <View
              key={item.playerId}
              style={[s.playerRow, { backgroundColor: c.input, flexDirection: "column", alignItems: "flex-start" }]}
            >
              <Text style={[s.playerName, { color: c.texto, marginBottom: 8 }]}>
                {item.firstName} {item.lastName}
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {([
                  { label: "Goles",     field: "goals"         as const },
                  { label: "Asist.",    field: "assists"       as const },
                  { label: "Amarillas", field: "yellowCards"   as const },
                  { label: "Rojas",     field: "redCards"      as const },
                  { label: "Minutos",   field: "minutesPlayed" as const },
                ]).map(({ label, field }) => (
                  <View key={field} style={{ alignItems: "center", minWidth: 60 }}>
                    <Text style={{ fontSize: 10, color: c.subtexto, marginBottom: 2 }}>{label}</Text>
                    <TextInput
                      style={[s.scoreInput, { borderColor: c.bordeInput, backgroundColor: c.fondo, color: c.texto }]}
                      value={String(item[field])}
                      keyboardType="numeric"
                      onChangeText={(v) => {
                        const next = [...stats];
                        (next[idx] as any)[field] = Number(v) || 0;
                        setStats(next);
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={[s.btnPrimary, { backgroundColor: c.boton, opacity: saving ? 0.6 : 1 }]}
            onPress={handleSaveBulkStats}
            disabled={saving}
          >
            <Text style={[s.btnPrimaryText, { color: c.botonTexto }]}>
              {saving ? "Guardando..." : "💾 Guardar estadísticas"}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <Text style={[s.hintText, { color: c.subtexto }]}>Selecciona un partido.</Text>
      )}
    </View>
  );

  const renderFines = () => (
    <View style={s.tabContent}>
      <TouchableOpacity
        style={[s.btnPrimary, { backgroundColor: c.boton, marginBottom: 16 }]}
        onPress={() => setFineModal(true)}
      >
        <Text style={[s.btnPrimaryText, { color: c.botonTexto }]}>+ Nueva multa</Text>
      </TouchableOpacity>

      {finesLoading && fines.length === 0 ? (
        <ActivityIndicator color={c.boton} style={{ marginTop: 20 }} />
      ) : fines.length === 0 ? (
        <Text style={[s.hintText, { color: c.subtexto }]}>Sin multas registradas.</Text>
      ) : fines.map(f => (
        <View
          key={f.id}
          style={[s.playerRow, { backgroundColor: c.input, flexDirection: "column", alignItems: "flex-start", gap: 4 }]}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", width: "100%" }}>
            <Text style={[s.playerName, { color: c.texto }]}>{f.playerName}</Text>
            <Text style={{
              fontWeight: "bold",
              color: f.status === "PAID" ? COLOR_EXITO : f.status === "FORGIVEN" ? COLOR_NEUTRAL : COLOR_PELIGRO,
            }}>
              {f.amount.toFixed(2)} €
            </Text>
          </View>
          <Text style={{ fontSize: 12, color: c.subtexto }}>{f.reason}</Text>
          <Text style={{ fontSize: 11, color: c.subtexto, opacity: 0.7 }}>{f.issuedDate} · {f.status}</Text>
        </View>
      ))}

      {finesHasMore && !finesLoading && (
        <TouchableOpacity style={s.btnSecondary} onPress={() => fetchFines(finesPage + 1)}>
          <Text style={{ color: c.boton, fontWeight: "600" }}>Cargar más</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // ── RENDER PRINCIPAL ───────────────────────────────────────────────────────

  return (
    <ScreenContainer>
    <View style={[s.container, { backgroundColor: c.fondo }]}>
      {/* Cabecera */}
      <View style={[s.header, { backgroundColor: c.boton }]}>
        <Text style={[s.headerTitle, { color: c.botonTexto }]}>Gestión Coach</Text>
        <Text style={[s.headerSub, { color: `${c.botonTexto}cc` }]}>Temporada {seasonLabel}</Text>
      </View>

      <ScrollView>
        {/* Selector de equipo — solo visible para el presidente */}
        {isPresident && teams.length > 0 && (
          <View style={s.teamPickerContainer}>
            <Text style={[s.teamPickerLabel, { color: c.subtexto }]}>EQUIPO</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {teams.map(team => {
                const active = localTeamId === team.id;
                return (
                  <TouchableOpacity
                    key={team.id}
                    style={[
                      s.teamChip,
                      {
                        backgroundColor: active ? `${c.boton}20` : c.input,
                        borderWidth: active ? 2 : 1,
                        borderColor: active ? c.boton : c.bordeInput,
                      },
                    ]}
                    onPress={() => setLocalTeamId(team.id)}
                  >
                    <Text style={[s.teamChipText, { color: active ? c.boton : c.texto }]}>
                      {team.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Selector de evento */}
        <ScrollView horizontal style={s.eventPicker} showsHorizontalScrollIndicator={false}>
          {loadingEvents ? (
            <ActivityIndicator color={c.boton} style={{ margin: 12 }} />
          ) : events.length === 0 ? (
            <Text style={[s.hintText, { color: c.subtexto, margin: 12 }]}>Sin eventos próximos.</Text>
          ) : events.map(e => {
            const active = selectedEvent?.id === e.id;
            return (
              <TouchableOpacity
                key={`${e.type}-${e.id}`}
                style={[
                  s.eventChip,
                  {
                    backgroundColor: active ? `${c.boton}20` : c.input,
                    borderWidth: active ? 2 : 0,
                    borderColor: active ? c.boton : "transparent",
                  },
                ]}
                onPress={() => setSelectedEvent(e)}
              >
                <Text>{e.type === "MATCH" ? "⚽" : "🏃"}</Text>
                <Text style={[s.eventChipText, { color: c.texto }]}>{e.title}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Tabs */}
        <View style={[s.tabBar, { borderBottomColor: c.bordeInput }]}>
          {(["ASISTENCIA", "CONVOCATORIAS", "STATS", "MULTAS"] as Tab[]).map(tab => (
            <TouchableOpacity
              key={tab}
              style={[s.tabItem, activeTab === tab && { borderBottomWidth: 2, borderBottomColor: c.boton }]}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={[s.tabText, { color: activeTab === tab ? c.boton : c.subtexto }]}>
                {tab}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {activeTab === "ASISTENCIA"    && renderAttendanceTab()}
        {activeTab === "CONVOCATORIAS" && renderConvocatorias()}
        {activeTab === "STATS"         && renderStats()}
        {activeTab === "MULTAS"        && renderFines()}
      </ScrollView>

      {/* ── Modal cerrar partido ── */}
      <Modal visible={closeMatchModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: c.fondo, borderColor: c.bordeInput }]}>
            <Text style={[s.modalTitle, { color: c.texto }]}>Cerrar partido</Text>
            <TextInput
              style={[s.scoreInput, { borderColor: c.bordeInput, backgroundColor: c.input, color: c.texto }]}
              placeholder="Goles a favor"
              placeholderTextColor={c.subtexto}
              onChangeText={setGoalsFor}
              keyboardType="numeric"
            />
            <TextInput
              style={[s.scoreInput, { borderColor: c.bordeInput, backgroundColor: c.input, color: c.texto }]}
              placeholder="Goles en contra"
              placeholderTextColor={c.subtexto}
              onChangeText={setGoalsAgainst}
              keyboardType="numeric"
            />
            <TouchableOpacity style={[s.btnDanger, { backgroundColor: COLOR_PELIGRO }]} onPress={handleCloseMatch}>
              <Text style={s.btnDangerText}>Cerrar partido</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={() => setCloseMatchModal(false)}>
              <Text style={{ color: c.subtexto, fontWeight: "600" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── Modal nueva multa ── */}
      <Modal visible={fineModal} transparent animationType="slide" onRequestClose={() => setFineModal(false)}>
        <View style={s.modalOverlay}>
          <View style={[s.modalBox, { backgroundColor: c.fondo, borderColor: c.bordeInput }]}>
            <Text style={[s.modalTitle, { color: c.texto }]}>Nueva multa</Text>

            <Text style={[s.modalLabel, { color: c.subtexto }]}>Jugador (ID)</Text>
            <TextInput
              style={[s.scoreInput, { borderColor: c.bordeInput, backgroundColor: c.input, color: c.texto }]}
              placeholder="ID del jugador"
              placeholderTextColor={c.subtexto}
              keyboardType="numeric"
              onChangeText={(v) => setFineTarget(v ? { id: Number(v), name: `Jugador ${v}` } : null)}
            />

            <Text style={[s.modalLabel, { color: c.subtexto }]}>Motivo</Text>
            <TextInput
              style={[s.scoreInput, { borderColor: c.bordeInput, backgroundColor: c.input, color: c.texto, height: 70, textAlignVertical: "top" }]}
              placeholder="Describe el motivo..."
              placeholderTextColor={c.subtexto}
              value={fineReason}
              onChangeText={setFineReason}
              multiline
            />

            <Text style={[s.modalLabel, { color: c.subtexto }]}>Importe (€)</Text>
            <TextInput
              style={[s.scoreInput, { borderColor: c.bordeInput, backgroundColor: c.input, color: c.texto }]}
              placeholder="0.00"
              placeholderTextColor={c.subtexto}
              keyboardType="numeric"
              value={fineAmount}
              onChangeText={setFineAmount}
            />

            <TouchableOpacity style={[s.btnPrimary, { backgroundColor: c.boton }]} onPress={handleCreateFine}>
              <Text style={[s.btnPrimaryText, { color: c.botonTexto }]}>Crear multa</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnSecondary} onPress={() => setFineModal(false)}>
              <Text style={{ color: c.subtexto, fontWeight: "600" }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
    </ScreenContainer>
  );
}

// Solo valores estructurales — sin colores
const s = StyleSheet.create({
  container:      { flex: 1 },
  header:         { paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle:    { fontSize: 22, fontWeight: "800" },
  headerSub:      { fontSize: 13, marginTop: 2 },

  teamPickerContainer: { paddingHorizontal: 12, paddingTop: 12, paddingBottom: 4 },
  teamPickerLabel:     { fontSize: 10, fontWeight: "700", letterSpacing: 1.5, marginBottom: 8 },
  teamChip:            { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, marginRight: 8 },
  teamChipText:        { fontSize: 13, fontWeight: "600" },

  eventPicker:    { padding: 12 },
  eventChip:      { alignItems: "center", marginRight: 10, padding: 10, borderRadius: 12 },
  eventChipText:  { fontSize: 10, textAlign: "center", marginTop: 2 },

  tabBar:         { flexDirection: "row", paddingHorizontal: 16, borderBottomWidth: 1 },
  tabItem:        { flex: 1, paddingVertical: 12, alignItems: "center", borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabText:        { fontSize: 11, fontWeight: "600" },

  tabContent:     { padding: 16 },
  hintText:       { textAlign: "center", marginTop: 20 },

  playerRow:      { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, marginBottom: 8, borderRadius: 10 },
  playerName:     { fontWeight: "600", flex: 1 },

  statusChip:     { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  statusChipText: { fontSize: 12, fontWeight: "700" },

  btnPrimary:     { padding: 14, borderRadius: 10, alignItems: "center", marginTop: 10 },
  btnPrimaryText: { fontWeight: "700" },
  btnDanger:      { padding: 14, borderRadius: 10, alignItems: "center", marginTop: 8 },
  btnDangerText:  { color: "#fff", fontWeight: "700" },
  btnSecondary:   { padding: 14, alignItems: "center" },

  scoreInput:     { borderWidth: 1, borderRadius: 8, padding: 10, marginBottom: 10 },

  modalOverlay:   { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalBox:       { padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderBottomWidth: 0 },
  modalTitle:     { fontSize: 20, fontWeight: "700", marginBottom: 15 },
  modalLabel:     { fontSize: 12, fontWeight: "600", marginBottom: 4 },
});
