import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator, Alert, Modal, ScrollView,
  StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View, KeyboardAvoidingView, Platform,
} from "react-native";
import ScreenContainer from "../../../components/ScreenContainer";
import { apiFetch } from "../../../lib/api";
import { useAuthStore } from "../../../lib/store";
import { useTheme } from "../../../lib/useTheme";

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

const STAT_FIELDS: { label: string; field: keyof StatsEntry }[] = [
  { label: "Goles",     field: "goals" },
  { label: "Asist.",    field: "assists" },
  { label: "Amarillas", field: "yellowCards" },
  { label: "Rojas",     field: "redCards" },
  { label: "Minutos",   field: "minutesPlayed" },
];

export default function LiveMatchTracker() {
  const c = useTheme();
  const router = useRouter();
  const { matchId } = useLocalSearchParams<{ matchId: string }>();
  const { activeClubId: clubId } = useAuthStore();

  const [stats, setStats] = useState<StatsEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [closeModal, setCloseModal] = useState(false);
  const [goalsFor, setGoalsFor] = useState("");
  const [goalsAgainst, setGoalsAgainst] = useState("");

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiFetch(`/api/coach/match/${matchId}/stats?clubId=${clubId}`);
      const data: StatsEntry[] = await res.json();
      setStats(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las estadísticas.");
    } finally {
      setLoading(false);
    }
  }, [matchId, clubId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  const update = (idx: number, field: keyof StatsEntry, value: number | boolean) => {
    setStats(prev => {
      const next = [...prev];
      (next[idx] as any)[field] = value;
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await apiFetch(`/api/coach/match/${matchId}/stats/bulk?clubId=${clubId}`, {
        method: "PUT",
        body: JSON.stringify({ entries: stats }),
      });
      Alert.alert("Guardado", "Estadísticas actualizadas.");
    } catch {
      Alert.alert("Error", "No se pudo guardar.");
    } finally {
      setSaving(false);
    }
  };

  const handleClose = async () => {
    try {
      await apiFetch(`/api/coach/match/${matchId}/close?clubId=${clubId}`, {
        method: "PATCH",
        body: JSON.stringify({ goalsFor: Number(goalsFor), goalsAgainst: Number(goalsAgainst) }),
      });
      setCloseModal(false);
      Alert.alert("Partido cerrado", "El resultado ha sido registrado.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch {
      Alert.alert("Error", "No se pudo cerrar el partido.");
    }
  };

  return (
    <ScreenContainer>
      <View style={[s.container, { backgroundColor: c.fondo }]}>
        <View style={[s.header, { backgroundColor: c.fondo }]}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
            <Text style={{ fontSize: 22, color: c.boton }}>‹</Text>
          </TouchableOpacity>
          <View>
            <Text style={[s.title, { color: c.texto }]}>Partido en Vivo</Text>
            <View style={s.livePill}>
              <Text style={s.livePillText}>● EN VIVO</Text>
            </View>
          </View>
          <TouchableOpacity
            style={[s.closeMatchBtn, { backgroundColor: "#ef4444" }]}
            onPress={() => setCloseModal(true)}
          >
            <Text style={{ color: "#fff", fontWeight: "700", fontSize: 12 }}>Cerrar Partido</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={c.boton} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView contentContainerStyle={s.list}>
            {stats.map((item, idx) => (
              <View key={item.playerId} style={[s.playerCard, { backgroundColor: c.input }]}>
                <View style={s.playerHeader}>
                  <Text style={[s.playerName, { color: c.texto }]}>
                    {item.firstName} {item.lastName}
                  </Text>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Text style={{ fontSize: 12, color: c.subtexto }}>Titular</Text>
                    <Switch
                      value={item.wasStarter}
                      onValueChange={v => update(idx, "wasStarter", v)}
                    />
                  </View>
                </View>

                <View style={s.countersRow}>
                  {STAT_FIELDS.map(({ label, field }) => (
                    <View key={field} style={s.counter}>
                      <Text style={{ fontSize: 10, color: c.subtexto, marginBottom: 4 }}>{label}</Text>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                        <TouchableOpacity
                          style={[s.counterBtn, { borderColor: c.bordeInput, backgroundColor: c.fondo }]}
                          onPress={() => update(idx, field, Math.max(0, (item[field] as number) - 1))}
                        >
                          <Text style={{ color: c.texto, fontWeight: "700" }}>−</Text>
                        </TouchableOpacity>
                        <Text style={{ minWidth: 22, textAlign: "center", color: c.texto, fontWeight: "700" }}>
                          {item[field] as number}
                        </Text>
                        <TouchableOpacity
                          style={[s.counterBtn, { borderColor: c.bordeInput, backgroundColor: c.fondo }]}
                          onPress={() => update(idx, field, (item[field] as number) + 1)}
                        >
                          <Text style={{ color: c.texto, fontWeight: "700" }}>+</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={[s.saveBtn, { backgroundColor: c.boton, opacity: saving ? 0.6 : 1 }]}
              onPress={handleSave}
              disabled={saving}
            >
              <Text style={{ color: c.botonTexto, fontWeight: "700", fontSize: 15 }}>
                {saving ? "Guardando..." : "💾 Guardar estadísticas"}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        <Modal visible={closeModal} transparent animationType="slide">
          <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View style={s.modalOverlay}>
              <View style={[s.modalBox, { backgroundColor: c.fondo, borderColor: c.bordeInput }]}>
                <Text style={[s.modalTitle, { color: c.texto }]}>Cerrar partido</Text>
                <TextInput
                  style={[s.input, { borderColor: c.bordeInput, backgroundColor: c.input, color: c.texto }]}
                  placeholder="Goles a favor"
                  placeholderTextColor={c.subtexto}
                  keyboardType="numeric"
                  value={goalsFor}
                  onChangeText={setGoalsFor}
                />
                <TextInput
                  style={[s.input, { borderColor: c.bordeInput, backgroundColor: c.input, color: c.texto }]}
                  placeholder="Goles en contra"
                  placeholderTextColor={c.subtexto}
                  keyboardType="numeric"
                  value={goalsAgainst}
                  onChangeText={setGoalsAgainst}
                />
                <TouchableOpacity
                  style={[s.saveBtn, { backgroundColor: "#ef4444", marginTop: 4 }]}
                  onPress={handleClose}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>Confirmar resultado</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={() => setCloseModal(false)}>
                  <Text style={{ color: c.subtexto, fontWeight: "600" }}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    </ScreenContainer>
  );
}

const s = StyleSheet.create({
  container:    { flex: 1 },
  header:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingBottom: 16, paddingHorizontal: 20 },
  backBtn:      { padding: 4, marginRight: 8 },
  title:        { fontSize: 20, fontWeight: "800" },
  livePill:     { backgroundColor: "#16a34a", borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2, marginTop: 2, alignSelf: "flex-start" },
  livePillText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  closeMatchBtn:{ paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  list:         { padding: 16, paddingBottom: 40 },
  playerCard:   { borderRadius: 12, padding: 14, marginBottom: 10 },
  playerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  playerName:   { fontWeight: "700", fontSize: 15 },
  countersRow:  { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  counter:      { alignItems: "center", minWidth: 60 },
  counterBtn:   { width: 28, height: 28, borderRadius: 6, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  saveBtn:      { padding: 14, borderRadius: 12, alignItems: "center", marginTop: 16 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end" },
  modalBox:     { padding: 24, borderTopLeftRadius: 20, borderTopRightRadius: 20, borderWidth: 1, borderBottomWidth: 0 },
  modalTitle:   { fontSize: 18, fontWeight: "700", marginBottom: 14 },
  input:        { borderWidth: 1, borderRadius: 8, padding: 12, marginBottom: 10 },
  cancelBtn:    { padding: 14, alignItems: "center" },
});
