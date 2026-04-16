import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Modal, TextInput,
  StyleSheet, Alert, ActivityIndicator, FlatList, Switch
} from "react-native";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/store";

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
  const { activeClubId: clubId, activeTeamId: teamId, activeSeasonName } = useAuthStore();
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

  const [saving, setSaving] = useState(false);

  const [fineModal, setFineModal] = useState(false);
  const [fineTarget, setFineTarget] = useState<{ id: number; name: string } | null>(null);
  const [fineReason, setFineReason] = useState("");
  const [fineAmount, setFineAmount] = useState("");

  const [closeMatchModal, setCloseMatchModal] = useState(false);
  const [goalsFor, setGoalsFor] = useState("");
  const [goalsAgainst, setGoalsAgainst] = useState("");

  const fetchEvents = useCallback(async () => {
    setLoadingEvents(true);
    try {
      const now = new Date();
      const from = now.toISOString();
      const to = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      const res = await apiFetch(`/api/calendar?clubId=${clubId}&teamId=${teamId}&seasonLabel=${seasonLabel}&from=${from}&to=${to}`);
      const data: CalendarEvent[] = await res.json(); // ✅ EXTRAEMOS EL JSON
      setEvents(data);
      if (!selectedEvent && data.length > 0) setSelectedEvent(data[0]);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los eventos.");
    } finally {
      setLoadingEvents(false);
    }
  }, [clubId, teamId, seasonLabel]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  useEffect(() => {
    if (!selectedEvent) return;
    if (activeTab === "ASISTENCIA" && selectedEvent.type === "TRAINING") fetchAttendance();
    if (activeTab === "CONVOCATORIAS" && selectedEvent.type === "MATCH") fetchCallups();
    if (activeTab === "STATS" && selectedEvent.type === "MATCH") fetchStats();
  }, [selectedEvent, activeTab]);

  useEffect(() => { if (activeTab === "MULTAS") fetchFines(0); }, [activeTab]);

  const fetchAttendance = async () => {
    if (!selectedEvent) return;
    try {
      const res = await apiFetch(`/api/coach/training/${selectedEvent.id}/attendance?clubId=${clubId}`);
      const data = await res.json(); // ✅ EXTRAEMOS EL JSON
      setAttendance(data.players);
    } catch {
      Alert.alert("Error", "No se pudo cargar la asistencia.");
    }
  };

  const fetchCallups = async () => {
    if (!selectedEvent) return;
    try {
      const res = await apiFetch(`/api/coach/match/callups/${selectedEvent.id}?clubId=${clubId}`);
      const data: CallupEntry[] = await res.json(); // ✅ EXTRAEMOS EL JSON
      setCallups(data.length > 0 ? data : []);
    } catch {}
  };

  const fetchStats = async () => {
    if (!selectedEvent) return;
    try {
      const res = await apiFetch(`/api/coach/match/${selectedEvent.id}/stats?clubId=${clubId}`);
      const data: StatsEntry[] = await res.json(); // ✅ EXTRAEMOS EL JSON
      setStats(data);
    } catch {}
  };

  const fetchFines = async (page: number) => {
    setFinesLoading(true);
    try {
      const res = await apiFetch(`/api/coach/fines?clubId=${clubId}&teamId=${teamId}&seasonLabel=${seasonLabel}&page=${page}&size=20`);
      const data = await res.json(); // ✅ EXTRAEMOS EL JSON
      const newFines: Fine[] = data.content;
      setFines(page === 0 ? newFines : prev => [...prev, ...newFines]);
      setFinesHasMore(!data.last);
      setFinesPage(page);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las multas.");
    } finally { setFinesLoading(false); }
  };

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
          entries: callups.map(c => ({
            playerId: c.playerId,
            status: c.status,
            absenceReason: c.absenceReason,
          })),
        }),
      });
      Alert.alert("Guardado", "Convocatoria guardada.");
    } catch { Alert.alert("Error", "No se pudo guardar.");
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
          teamId,
          reason: fineReason,
          amount: parseFloat(fineAmount),
        }),
      });
      setFineModal(false);
      fetchFines(0);
    } catch { Alert.alert("Error", "No se pudo crear."); }
  };

  const renderAttendanceTab = () => (
    <View style={s.tabContent}>
      {selectedEvent?.type === "TRAINING" ? (
        <>
          {attendance.map((item, idx) => (
            <View key={item.playerId} style={s.playerRow}>
              <Text style={s.playerName}>{item.firstName} {item.lastName}</Text>
              <Switch value={item.attended ?? false} onValueChange={(v) => {
                const next = [...attendance];
                next[idx].attended = v;
                setAttendance(next);
              }} />
            </View>
          ))}
          <TouchableOpacity style={s.btnPrimary} onPress={handleSaveBulkAttendance} disabled={saving}>
            <Text style={s.btnPrimaryText}>{saving ? "Guardando..." : "💾 Guardar asistencia"}</Text>
          </TouchableOpacity>
        </>
      ) : <Text style={s.hintText}>Selecciona un entrenamiento.</Text>}
    </View>
  );

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>Gestión Coach</Text>
        <Text style={s.headerSub}>Temporada {seasonLabel}</Text>
      </View>
      <ScrollView>
        <ScrollView horizontal style={s.eventPicker}>
          {events.map(e => (
            <TouchableOpacity key={`${e.type}-${e.id}`} style={[s.eventChip, selectedEvent?.id === e.id && s.eventChipActive]} onPress={() => setSelectedEvent(e)}>
              <Text>{e.type === "MATCH" ? "⚽" : "🏃"}</Text>
              <Text style={s.eventChipText}>{e.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={s.tabBar}>
          {(["ASISTENCIA","CONVOCATORIAS","STATS","MULTAS"] as Tab[]).map(tab => (
            <TouchableOpacity key={tab} style={[s.tabItem, activeTab === tab && s.tabItemActive]} onPress={() => setActiveTab(tab)}>
              <Text style={[s.tabText, activeTab === tab && s.tabTextActive]}>{tab}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {activeTab === "ASISTENCIA" && renderAttendanceTab()}
      </ScrollView>

      <Modal visible={closeMatchModal} transparent animationType="slide">
        <View style={s.modalOverlay}><View style={s.modalBox}>
          <Text style={s.modalTitle}>Cerrar partido</Text>
          <TextInput style={s.scoreInput} placeholder="Goles favor" onChangeText={setGoalsFor} keyboardType="numeric" />
          <TextInput style={s.scoreInput} placeholder="Goles contra" onChangeText={setGoalsAgainst} keyboardType="numeric" />
          <TouchableOpacity style={s.btnDanger} onPress={handleCloseMatch}><Text style={s.btnDangerText}>Cerrar</Text></TouchableOpacity>
          <TouchableOpacity style={s.btnSecondary} onPress={() => setCloseMatchModal(false)}><Text>Cancelar</Text></TouchableOpacity>
        </View></View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: { backgroundColor: "#1E3A5F", paddingTop: 56, paddingBottom: 20, paddingHorizontal: 20 },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#fff" },
  headerSub: { fontSize: 13, color: "#93C5FD", marginTop: 2 },
  eventPicker: { padding: 12 },
  eventChip: { alignItems: "center", marginRight: 10, padding: 10, borderRadius: 12, backgroundColor: "#E2E8F0" },
  eventChipActive: { backgroundColor: "#DBEAFE", borderWidth: 2, borderColor: "#2563EB" },
  eventChipText: { fontSize: 10, textAlign: "center" },
  tabBar: { flexDirection: "row", paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: "#E2E8F0" },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: "center" },
  tabItemActive: { borderBottomWidth: 2, borderBottomColor: "#2563EB" },
  tabText: { fontSize: 11, fontWeight: "600", color: "#64748B" },
  tabTextActive: { color: "#2563EB" },
  tabContent: { padding: 16 },
  hintText: { textAlign: "center", marginTop: 20, color: "#94A3B8" },
  playerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: 12, backgroundColor: "#fff", marginBottom: 8, borderRadius: 10 },
  playerName: { fontWeight: "600" },
  btnPrimary: { backgroundColor: "#2563EB", padding: 14, borderRadius: 10, alignItems: "center", marginTop: 10 },
  btnPrimaryText: { color: "#fff", fontWeight: "700" },
  scoreInput: { borderWidth: 1, borderColor: "#E2E8F0", borderRadius: 8, padding: 10, marginBottom: 10 },
  btnDanger: { backgroundColor: "#DC2626", padding: 14, borderRadius: 10, alignItems: "center" },
  btnDangerText: { color: "#fff", fontWeight: "700" },
  btnSecondary: { padding: 14, alignItems: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#fff", padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  // 👇 AQUÍ ESTÁ EL QUE FALTABA
  modalTitle: { fontSize: 20, fontWeight: "700", color: "#1E293B", marginBottom: 15 }
});