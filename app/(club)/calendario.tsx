import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Modal, TextInput,
  StyleSheet, Alert, ActivityIndicator, FlatList
} from "react-native";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useTheme } from "../../lib/useTheme";
import ScreenContainer from "../../components/ScreenContainer";

interface CalendarEvent {
  id: number;
  type: "TRAINING" | "MATCH";
  startTime: string;
  endTime?: string;
  title: string;
  teamName: string;
  location?: string;
}

interface Team { id: number; category: string; suffix: string; }
interface Field { id: number; name: string; } // 🟢 Interfaz para los campos

const MESES = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

const MATCH_TYPES = [
  { value: "LEAGUE", label: "Liga" },
  { value: "FRIENDLY", label: "Amistoso" },
  { value: "CUP", label: "Copa" },
  { value: "TOURNAMENT", label: "Torneo" },
  { value: "OTHER", label: "Otro" }
];

export default function Calendario() {
  const c = useTheme();
  
  const { 
    activeClubId: clubId, 
    activeRole: role, 
    activeTeamId: myTeamId, 
    activeSeasonName
  } = useAuthStore();
  
  const seasonLabel = activeSeasonName || "24-25";
  const isPresident = role === "PRESIDENT";
  const canCreate = role === "COACH" || isPresident;

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [clubFields, setClubFields] = useState<Field[]>([]); // 🟢 Estado para los campos
  
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(isPresident ? null : myTeamId ?? null);
  const [loading, setLoading] = useState(false);
  
  const [createModal, setCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"TRAINING" | "MATCH">("TRAINING");
  const [form, setForm] = useState<any>({ isHome: "true", matchType: "LEAGUE", location: "" });

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // ─── PETICIONES A LA API ─────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(year, month, 1).toISOString();
      const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const teamParam = selectedTeamId ? `&teamId=${selectedTeamId}` : "";
      const res = await apiFetch(`/api/calendar?clubId=${clubId}&seasonLabel=${seasonLabel}${teamParam}&from=${from}&to=${to}`);
      const data: CalendarEvent[] = await res.json();
      setEvents(data);
    } catch { 
      Alert.alert("Error", "No se pudieron cargar los eventos.");
    } finally { setLoading(false); }
  }, [clubId, seasonLabel, selectedTeamId, year, month]);

  const fetchTeams = useCallback(async () => {
    if (!isPresident) return;
    try { 
      const res = await apiFetch(`/api/teams?clubId=${clubId}`); 
      const data = await res.json();
      setTeams(data);
    } catch {}
  }, [clubId, isPresident]);

  // 🟢 Nueva petición para traer los campos activos del club
  const fetchFields = useCallback(async () => {
    if (!canCreate) return;
    try { 
      // ⚠️ Ajusta "/api/fields" si en tu backend se llama "/api/campos" o similar
      const res = await apiFetch(`/api/fields?clubId=${clubId}`); 
      const data = await res.json();
      setClubFields(data);
    } catch {
      console.log("No se pudieron cargar los campos del club.");
    }
  }, [clubId, canCreate]);

  useEffect(() => { fetchTeams(); fetchFields(); }, [fetchTeams, fetchFields]);
  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ─── CREAR EVENTO ────────────────────────────────────────────────────────
  const handleCreateEvent = async () => {
    const finalTeamId = isPresident ? form.teamId : myTeamId;

    if (!finalTeamId || !form.date || !form.time) {
      Alert.alert("Atención", "La fecha, la hora y el equipo son obligatorios.");
      return;
    }

    try {
      // 🛠️ Combinamos Fecha + Hora para el Backend
      const formattedDate = `${form.date}T${form.time}:00Z`;
      
      const endpoint = createType === "TRAINING" ? "/api/calendar/training" : "/api/calendar/match";
      const body = createType === "TRAINING" 
        ? { 
            teamId: Number(finalTeamId), 
            startTime: formattedDate, 
            notes: form.notes 
          }
        : { 
            teamId: Number(finalTeamId), 
            opponentName: form.opponentName, 
            matchDate: formattedDate, 
            location: form.location, 
            isHome: form.isHome === "true", 
            matchType: form.matchType 
          };

      await apiFetch(`${endpoint}?clubId=${clubId}`, { method: "POST", body: JSON.stringify(body) });
      setCreateModal(false);
      setForm({ isHome: "true", matchType: "LEAGUE", location: "" });
      fetchEvents();
      Alert.alert("Éxito", "Evento programado correctamente.");
    } catch { 
      Alert.alert("Error", "No se pudo crear el evento."); 
    }
  };

  // ─── GENERAR CUADRÍCULA ──────────────────────────────────────────────────
  const renderCalendarGrid = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    const startOffset = firstDay === 0 ? 6 : firstDay - 1; 
    
    const grid: any[] = [];
    let dayCount = 1;

    for (let row = 0; row < 6; row++) {
      const daysRow: any[] = [];
      for (let col = 0; col < 7; col++) {
        if (row === 0 && col < startOffset) {
          daysRow.push(<View key={`empty-start-${col}`} style={styles.dayCellEmpty} />);
        } else if (dayCount <= daysInMonth) {
          const currentDate = dayCount;
          const dayEvents = events.filter(e => {
            const eventDate = new Date(e.startTime);
            return eventDate.getDate() === currentDate && eventDate.getMonth() === month && eventDate.getFullYear() === year;
          });

          const hasMatch = dayEvents.some(e => e.type === "MATCH");
          const hasTraining = dayEvents.some(e => e.type === "TRAINING");

          daysRow.push(
            <View key={`day-${currentDate}`} style={[styles.dayCell, { backgroundColor: c.input }]}>
              <Text style={[styles.dayText, { color: c.texto }]}>{currentDate}</Text>
              <View style={styles.dotsContainer}>
                {hasMatch && <View style={[styles.dot, { backgroundColor: c.boton }]} />}
                {hasTraining && <View style={[styles.dot, { backgroundColor: "#3b82f6" }]} />}
              </View>
            </View>
          );
          dayCount++;
        } else {
          daysRow.push(<View key={`empty-end-${row}-${col}`} style={styles.dayCellEmpty} />);
        }
      }
      grid.push(<View key={`row-${row}`} style={styles.weekRow}>{daysRow}</View>);
      if (dayCount > daysInMonth) break;
    }
    return grid;
  };

  return (
    <ScreenContainer>
    <View style={[styles.wrapper, { backgroundColor: c.fondo }]}>

      {/* CABECERA */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.headerSub, { color: c.subtexto }]}>Temporada {seasonLabel}</Text>
          <Text style={[styles.headerTitle, { color: c.texto }]}>Calendario</Text>
        </View>
      </View>

      {/* FILTROS (Solo Presidente) */}
      {isPresident && (
        <View style={{ paddingHorizontal: 24, marginBottom: 15 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <TouchableOpacity 
              style={[styles.chip, !selectedTeamId ? { backgroundColor: `${c.boton}20` } : { backgroundColor: c.input }]}
              onPress={() => setSelectedTeamId(null)}
            >
              <Text style={[styles.chipText, !selectedTeamId ? { color: c.boton } : { color: c.subtexto }]}>Todos</Text>
            </TouchableOpacity>
            {teams.map(t => (
              <TouchableOpacity 
                key={t.id} 
                style={[styles.chip, selectedTeamId === t.id ? { backgroundColor: `${c.boton}20` } : { backgroundColor: c.input }]}
                onPress={() => setSelectedTeamId(t.id)}
              >
                <Text style={[styles.chipText, selectedTeamId === t.id ? { color: c.boton } : { color: c.subtexto }]}>{t.category} {t.suffix}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* NAVEGADOR DEL MES */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={() => { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1) }}>
            <Text style={[styles.navBtnText, { color: c.boton }]}>‹ Anterior</Text>
          </TouchableOpacity>
          <Text style={[styles.monthText, { color: c.texto }]}>{MESES[month]} {year}</Text>
          <TouchableOpacity onPress={() => { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1) }}>
            <Text style={[styles.navBtnText, { color: c.boton }]}>Siguiente ›</Text>
          </TouchableOpacity>
        </View>

        {/* CUADRÍCULA */}
        <View style={[styles.calendarWrapper, { borderColor: c.bordeInput }]}>
          <View style={styles.weekRow}>
            {DIAS_SEMANA.map(d => <Text key={d} style={[styles.weekDayText, { color: c.subtexto }]}>{d}</Text>)}
          </View>
          {loading ? <ActivityIndicator size="large" color={c.boton} style={{ marginVertical: 30 }} /> : renderCalendarGrid()}
        </View>

        {/* LISTA DE EVENTOS */}
        <Text style={[styles.sectionTitle, { color: c.texto, marginTop: 30, marginBottom: 15 }]}>Lista de Eventos</Text>
        
        {events.map(item => (
          <View key={`${item.type}-${item.id}`} style={[styles.card, { backgroundColor: c.input, borderColor: c.bordeInput, borderLeftWidth: 4, borderLeftColor: item.type === "MATCH" ? c.boton : "#3b82f6" }]}>
            <Text style={[styles.eventoTitulo, { color: c.texto }]}>
              {item.type === "MATCH" ? "⚽" : "🏃"} {item.title}
            </Text>
            <Text style={[styles.metaText, { color: c.subtexto }]}>
              📅 {new Date(item.startTime).toLocaleDateString("es-ES")} · 🕒 {new Date(item.startTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
            </Text>
            {item.location && <Text style={[styles.metaText, { color: c.subtexto, marginTop: 2 }]}>📍 {item.location}</Text>}
          </View>
        ))}
      </ScrollView>

      {/* BOTÓN FLOTANTE */}
      {canCreate && (
        <TouchableOpacity style={[styles.fab, { backgroundColor: c.boton }]} onPress={() => setCreateModal(true)}>
          <Text style={styles.fabText}>+</Text>
        </TouchableOpacity>
      )}

      {/* MODAL CREAR EVENTO */}
      <Modal visible={createModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalBox, { backgroundColor: c.fondo }]}>
              <Text style={[styles.modalTitle, { color: c.texto }]}>Nuevo Evento</Text>
              
              <View style={styles.chipsRowModal}>
                <TouchableOpacity onPress={() => setCreateType("TRAINING")} style={[styles.chipModal, createType === "TRAINING" ? { backgroundColor: `${c.boton}20`, borderColor: c.boton } : { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                  <Text style={[styles.chipText, createType === "TRAINING" ? { color: c.boton } : { color: c.subtexto }]}>🏃 Entreno</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setCreateType("MATCH")} style={[styles.chipModal, createType === "MATCH" ? { backgroundColor: `${c.boton}20`, borderColor: c.boton } : { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                  <Text style={[styles.chipText, createType === "MATCH" ? { color: c.boton } : { color: c.subtexto }]}>⚽ Partido</Text>
                </TouchableOpacity>
              </View>

              {isPresident && (
                <>
                  <Text style={[styles.inputLabel, { color: c.texto }]}>Seleccionar Equipo *</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                    {teams.map(t => (
                      <TouchableOpacity 
                        key={t.id} 
                        style={[styles.chip, form.teamId === String(t.id) ? { backgroundColor: `${c.boton}20` } : { backgroundColor: c.input }]}
                        onPress={() => setForm((f: any) => ({ ...f, teamId: String(t.id) }))}
                      >
                        <Text style={[styles.chipText, form.teamId === String(t.id) ? { color: c.boton } : { color: c.subtexto }]}>{t.category} {t.suffix}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: c.texto }]}>Fecha *</Text>
                  <TextInput style={[styles.textInput, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput }]} 
                    placeholder="2024-10-25" placeholderTextColor={c.subtexto} 
                    onChangeText={v => setForm((f: any) => ({...f, date: v}))} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: c.texto }]}>Hora *</Text>
                  <TextInput style={[styles.textInput, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput }]} 
                    placeholder="18:30" placeholderTextColor={c.subtexto} 
                    onChangeText={v => setForm((f: any) => ({...f, time: v}))} />
                </View>
              </View>

              {/* 🟢 SECTOR UBICACIÓN INTEGRADO */}
              <Text style={[styles.inputLabel, { color: c.texto }]}>Ubicación / Campo</Text>
              
              {/* Chips Rápidos de Campos del Club */}
              {clubFields.length > 0 && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
                  {clubFields.map(campo => (
                    <TouchableOpacity 
                      key={campo.id} 
                      style={[styles.chip, form.location === campo.name ? { backgroundColor: `${c.boton}20` } : { backgroundColor: c.input }]}
                      onPress={() => setForm((f: any) => ({ ...f, location: campo.name }))}
                    >
                      <Text style={[styles.chipText, form.location === campo.name ? { color: c.boton } : { color: c.subtexto }]}>
                        📍 {campo.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Input manual enlazado */}
              <TextInput style={[styles.textInput, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput, marginBottom: 15 }]} 
                placeholder="Escribe o selecciona arriba..." placeholderTextColor={c.subtexto} 
                value={form.location || ""} 
                onChangeText={v => setForm((f: any) => ({...f, location: v}))} />

              {createType === "MATCH" && (
                <>
                  <Text style={[styles.inputLabel, { color: c.texto }]}>Rival *</Text>
                  <TextInput style={[styles.textInput, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput }]} 
                    placeholder="Nombre del Rival" placeholderTextColor={c.subtexto} 
                    onChangeText={v => setForm((f: any) => ({...f, opponentName: v}))} />

                  <Text style={[styles.inputLabel, { color: c.texto }]}>Competición</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 15 }}>
                    {MATCH_TYPES.map(mt => (
                      <TouchableOpacity key={mt.value} style={[styles.chip, form.matchType === mt.value ? { backgroundColor: `${c.boton}20` } : { backgroundColor: c.input }]}
                        onPress={() => setForm((f: any) => ({ ...f, matchType: mt.value }))}>
                        <Text style={[styles.chipText, form.matchType === mt.value ? { color: c.boton } : { color: c.subtexto }]}>{mt.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  <View style={styles.chipsRowModal}>
                    <TouchableOpacity onPress={() => setForm((f:any) => ({...f, isHome: "true"}))} style={[styles.chipModal, form.isHome === "true" ? { backgroundColor: `${c.boton}20`, borderColor: c.boton } : { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                      <Text style={[styles.chipText, form.isHome === "true" ? { color: c.boton } : { color: c.subtexto }]}>🏠 Local</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setForm((f:any) => ({...f, isHome: "false"}))} style={[styles.chipModal, form.isHome === "false" ? { backgroundColor: `${c.boton}20`, borderColor: c.boton } : { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                      <Text style={[styles.chipText, form.isHome === "false" ? { color: c.boton } : { color: c.subtexto }]}>✈️ Visitante</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                <TouchableOpacity style={[styles.btnCrear, { backgroundColor: c.input, flex: 1, borderWidth: 1, borderColor: c.bordeInput }]} onPress={() => setCreateModal(false)}>
                  <Text style={[styles.btnCrearText, { color: c.texto }]}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnCrear, { backgroundColor: c.boton, flex: 1 }]} onPress={handleCreateEvent}>
                  <Text style={styles.btnCrearText}>Confirmar</Text>
                </TouchableOpacity>
              </View>

            </View>
          </ScrollView>
        </View>
      </Modal>

    </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { paddingHorizontal: 24, paddingBottom: 100 },
  headerRow: { padding: 24, paddingTop: 60, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: 'bold' },
  headerSub: { fontSize: 14, fontWeight: '500', marginBottom: 5 },
  chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 16, marginRight: 8 },
  chipText: { fontSize: 13, fontWeight: 'bold' },
  monthNav: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 15, marginTop: 10 },
  navBtnText: { fontSize: 16, fontWeight: "bold" },
  monthText: { fontSize: 18, fontWeight: "bold" },
  calendarWrapper: { borderRadius: 12, borderWidth: 1, padding: 10, paddingBottom: 15 },
  weekRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 8 },
  weekDayText: { flex: 1, textAlign: "center", fontSize: 13, fontWeight: "600" },
  dayCell: { flex: 1, aspectRatio: 1, alignItems: "center", justifyContent: "center", margin: 2, borderRadius: 8 },
  dayCellEmpty: { flex: 1, aspectRatio: 1, margin: 2 },
  dayText: { fontSize: 14, fontWeight: "600" },
  dotsContainer: { flexDirection: "row", gap: 3, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  eventoTitulo: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  metaText: { fontSize: 13, fontWeight: '500' },
  fab: { position: "absolute", bottom: 25, right: 25, width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center", elevation: 5 },
  fabText: { fontSize: 30, color: "#fff", fontWeight: 'bold' },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  inputLabel: { fontSize: 14, fontWeight: "bold", marginBottom: 8, marginTop: 10 },
  textInput: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 15, marginBottom: 5 },
  chipsRowModal: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  chipModal: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center', borderWidth: 1 },
  btnCrear: { paddingVertical: 15, borderRadius: 12, alignItems: 'center' },
  btnCrearText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});