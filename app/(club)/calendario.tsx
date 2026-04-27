import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import ScreenContainer from "../../components/ScreenContainer";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useTheme } from "../../lib/useTheme";

interface CalendarEvent {
  id: number;
  type: "TRAINING" | "MATCH";
  startTime: string;
  endTime?: string;
  title: string;
  teamId: number;
  teamName: string;
  location?: string;
}

interface Team {
  id: number;
  category: string;
  suffix: string;
}
interface Field {
  id: number;
  name: string;
}

const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];
const DIAS_SEMANA = ["L", "M", "X", "J", "V", "S", "D"];

const MATCH_TYPES = [
  { value: "LEAGUE", label: "Liga" },
  { value: "FRIENDLY", label: "Amistoso" },
  { value: "CUP", label: "Copa" },
  { value: "TOURNAMENT", label: "Torneo" },
  { value: "OTHER", label: "Otro" },
];

export default function Calendario() {
  const c = useTheme();

  const {
    activeClubId: clubId,
    activeRole: role,
    activeTeamId: myTeamId,
  } = useAuthStore();

  const isPresident = role === "PRESIDENT";
  const isCoach = role === "COACH";
  const isRelative = role === "RELATIVE";
  const canCreate = isCoach || isPresident;

  // Puede borrar si es presidente (cualquier evento) o coach (solo su equipo — se valida también en back)
  const canDeleteEvent = (event: CalendarEvent): boolean => {
    if (isPresident) return true;
    if (isCoach && event.teamId === myTeamId) return true;
    return false;
  };

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [clubFields, setClubFields] = useState<Field[]>([]);

  // RELATIVE: filtra por el equipo de su hijo. Resto (PRESIDENT, COACH, PLAYER): ve todo el club.
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(
    isRelative ? (myTeamId ?? null) : null,
  );
  const [loading, setLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  // Clave del evento que se está borrando actualmente, formato "TRAINING-42" | "MATCH-7"
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [createModal, setCreateModal] = useState(false);
  const [createType, setCreateType] = useState<"TRAINING" | "MATCH">(
    "TRAINING",
  );
  const [form, setForm] = useState<any>({
    isHome: "true",
    matchType: "LEAGUE",
    location: "",
    fieldId: null as number | null,
    endTime: "",
    recurring: false,
    recurringDays: [] as number[],
    recurringEndDate: "",
  });

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  // 🟢 CÁLCULO DINÁMICO DE TEMPORADA SEGÚN EL CALENDARIO
  const getSeasonLabel = (y: number, m: number) => {
    // Si el mes es Agosto (7) o posterior, es la temporada actual-siguiente
    return m >= 7 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
  };

  const currentSeasonLabel = getSeasonLabel(year, month);

  // ─── PETICIONES A LA API ─────────────────────────────────────────────────
  const fetchEvents = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(year, month, 1).toISOString();
      const to = new Date(year, month + 1, 0, 23, 59, 59).toISOString();
      const teamParam = selectedTeamId ? `&teamId=${selectedTeamId}` : "";

      // 🟢 USAMOS currentSeasonLabel EN LUGAR DEL VALOR FIJO DEL STORE
      const res = await apiFetch(
        `/api/calendar?clubId=${clubId}&seasonLabel=${currentSeasonLabel}${teamParam}&from=${from}&to=${to}`,
      );
      const data: CalendarEvent[] = await res.json();
      setEvents(data);
    } catch {
      Alert.alert("Error", "No se pudieron cargar los eventos.");
    } finally {
      setLoading(false);
    }
  }, [clubId, currentSeasonLabel, selectedTeamId, year, month]);

  const fetchTeams = useCallback(async () => {
    if (!isPresident) return;
    try {
      const res = await apiFetch(`/api/club/equipos/${clubId}`);
      const data = await res.json();
      setTeams(data);
    } catch {}
  }, [clubId, isPresident]);

  const fetchFields = useCallback(async () => {
    if (!canCreate) return;
    try {
      const res = await apiFetch(`/api/fields/club/${clubId}`);
      const data = await res.json();
      setClubFields(data);
    } catch {
      console.log("No se pudieron cargar los campos del club.");
    }
  }, [clubId, canCreate]);

  useEffect(() => {
    fetchTeams();
    fetchFields();
  }, [fetchTeams, fetchFields]);
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ─── CREAR EVENTO ────────────────────────────────────────────────────────
  const handleCreateEvent = async () => {
    if (isSubmitting) return; // 🟢 EVITA DOBLE CLIC

    const finalTeamId = isPresident ? form.teamId : myTeamId;

    if (!finalTeamId || !form.date || !form.time) {
      Alert.alert(
        "Atención",
        "La fecha, la hora y el equipo son obligatorios.",
      );
      return;
    }
    if (
      createType === "TRAINING" &&
      form.recurring &&
      (!form.recurringDays?.length || !form.recurringEndDate)
    ) {
      Alert.alert(
        "Atención",
        "Selecciona al menos un día y una fecha de fin para la recurrencia.",
      );
      return;
    }

    setIsSubmitting(true); // 🟢 BLOQUEAMOS EL BOTÓN

    try {
      const fieldIdValue = form.fieldId ? Number(form.fieldId) : null;
      const locationValue = form.fieldId ? null : form.location || null;

      if (createType === "TRAINING" && form.recurring) {
        const recurringBody = {
          teamId: Number(finalTeamId),
          startTime: `${form.time}:00`,
          endTime: form.endTime ? `${form.endTime}:00` : `${form.time}:00`,
          startDate: form.date,
          endDate: form.recurringEndDate,
          daysOfWeek: form.recurringDays,
          fieldId: fieldIdValue,
          location: locationValue,
          notes: form.notes,
        };
        await apiFetch(`/api/calendar/training/recurring?clubId=${clubId}`, {
          method: "POST",
          body: JSON.stringify(recurringBody),
        });
      } else {
        const formattedDate = `${form.date}T${form.time}:00Z`;
        const endpoint =
          createType === "TRAINING"
            ? "/api/calendar/training"
            : "/api/calendar/match";
        const body =
          createType === "TRAINING"
            ? {
                teamId: Number(finalTeamId),
                startTime: formattedDate,
                endTime: form.endTime
                  ? `${form.date}T${form.endTime}:00Z`
                  : formattedDate,
                fieldId: fieldIdValue,
                location: locationValue,
                notes: form.notes,
              }
            : {
                teamId: Number(finalTeamId),
                opponentName: form.opponentName,
                matchDate: formattedDate,
                fieldId: fieldIdValue,
                location: locationValue,
                isHome: form.isHome === "true",
                matchType: form.matchType,
              };
        await apiFetch(`${endpoint}?clubId=${clubId}`, {
          method: "POST",
          body: JSON.stringify(body),
        });
      }

      setCreateModal(false);
      setForm({
        isHome: "true",
        matchType: "LEAGUE",
        location: "",
        fieldId: null,
        endTime: "",
        recurring: false,
        recurringDays: [],
        recurringEndDate: "",
      });
      fetchEvents();
      Alert.alert("Éxito", "Evento programado correctamente.");
    } catch {
      Alert.alert("Error", "No se pudo crear el evento.");
    } finally {
      setIsSubmitting(false); // 🟢 DESBLOQUEAMOS EL BOTÓN
    }
  };

  // ─── BORRAR EVENTO ────────────────────────────────────────────────────────
  const handleDeleteEvent = (
    eventId: number,
    eventType: "TRAINING" | "MATCH",
  ) => {
    const eventKey = `${eventType}-${eventId}`;
    Alert.alert(
      "Eliminar Evento",
      "¿Estás seguro de que quieres borrar este evento? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            setDeletingId(eventKey);
            try {
              await apiFetch(
                `/api/calendar/${eventId}?clubId=${clubId}&type=${eventType}`,
                {
                  method: "DELETE",
                },
              );
              fetchEvents();
              Alert.alert("Éxito", "Evento eliminado.");
            } catch (error) {
              Alert.alert(
                "Error",
                "No se pudo eliminar el evento. Verifica permisos.",
              );
            } finally {
              setDeletingId(null);
            }
          },
        },
      ],
    );
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
          daysRow.push(
            <View key={`empty-start-${col}`} style={styles.dayCellEmpty} />,
          );
        } else if (dayCount <= daysInMonth) {
          const currentDate = dayCount;
          const dayEvents = events.filter((e) => {
            const eventDate = new Date(e.startTime);
            return (
              eventDate.getDate() === currentDate &&
              eventDate.getMonth() === month &&
              eventDate.getFullYear() === year
            );
          });

          const hasMatch = dayEvents.some((e) => e.type === "MATCH");
          const hasTraining = dayEvents.some((e) => e.type === "TRAINING");

          daysRow.push(
            <View
              key={`day-${currentDate}`}
              style={[styles.dayCell, { backgroundColor: c.input }]}
            >
              <Text style={[styles.dayText, { color: c.texto }]}>
                {currentDate}
              </Text>
              <View style={styles.dotsContainer}>
                {hasMatch && (
                  <View style={[styles.dot, { backgroundColor: c.boton }]} />
                )}
                {hasTraining && (
                  <View style={[styles.dot, { backgroundColor: "#3b82f6" }]} />
                )}
              </View>
            </View>,
          );
          dayCount++;
        } else {
          daysRow.push(
            <View
              key={`empty-end-${row}-${col}`}
              style={styles.dayCellEmpty}
            />,
          );
        }
      }
      grid.push(
        <View key={`row-${row}`} style={styles.weekRow}>
          {daysRow}
        </View>,
      );
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
            {/* 🟢 MOSTRAMOS LA TEMPORADA DINÁMICA */}
            <Text style={[styles.headerSub, { color: c.subtexto }]}>
              Temporada {currentSeasonLabel}
            </Text>
            <Text style={[styles.headerTitle, { color: c.texto }]}>
              Calendario
            </Text>
          </View>
        </View>

        {/* FILTROS (Solo Presidente) */}
        {isPresident && (
          <View style={{ paddingHorizontal: 24, marginBottom: 15 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <TouchableOpacity
                style={[
                  styles.chip,
                  !selectedTeamId
                    ? { backgroundColor: `${c.boton}20` }
                    : { backgroundColor: c.input },
                ]}
                onPress={() => setSelectedTeamId(null)}
              >
                <Text
                  style={[
                    styles.chipText,
                    !selectedTeamId
                      ? { color: c.boton }
                      : { color: c.subtexto },
                  ]}
                >
                  Todos
                </Text>
              </TouchableOpacity>
              {teams.map((t) => (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.chip,
                    selectedTeamId === t.id
                      ? { backgroundColor: `${c.boton}20` }
                      : { backgroundColor: c.input },
                  ]}
                  onPress={() => setSelectedTeamId(t.id)}
                >
                  <Text
                    style={[
                      styles.chipText,
                      selectedTeamId === t.id
                        ? { color: c.boton }
                        : { color: c.subtexto },
                    ]}
                  >
                    {t.category} {t.suffix}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        <ScrollView
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
        >
          {/* NAVEGADOR DEL MES */}
          <View style={styles.monthNav}>
            <TouchableOpacity
              onPress={() => {
                if (month === 0) {
                  setMonth(11);
                  setYear((y) => y - 1);
                } else setMonth((m) => m - 1);
              }}
            >
              <Text style={[styles.navBtnText, { color: c.boton }]}>
                ‹ Anterior
              </Text>
            </TouchableOpacity>
            <Text style={[styles.monthText, { color: c.texto }]}>
              {MESES[month]} {year}
            </Text>
            <TouchableOpacity
              onPress={() => {
                if (month === 11) {
                  setMonth(0);
                  setYear((y) => y + 1);
                } else setMonth((m) => m + 1);
              }}
            >
              <Text style={[styles.navBtnText, { color: c.boton }]}>
                Siguiente ›
              </Text>
            </TouchableOpacity>
          </View>

          {/* CUADRÍCULA */}
          <View style={[styles.calendarWrapper, { borderColor: c.bordeInput }]}>
            <View style={styles.weekRow}>
              {DIAS_SEMANA.map((d) => (
                <Text
                  key={d}
                  style={[styles.weekDayText, { color: c.subtexto }]}
                >
                  {d}
                </Text>
              ))}
            </View>
            {loading ? (
              <ActivityIndicator
                size="large"
                color={c.boton}
                style={{ marginVertical: 30 }}
              />
            ) : (
              renderCalendarGrid()
            )}
          </View>

          {/* LISTA DE EVENTOS */}
          <Text
            style={[
              styles.sectionTitle,
              { color: c.texto, marginTop: 30, marginBottom: 15 },
            ]}
          >
            Lista de Eventos
          </Text>

          {events.length === 0 && !loading && (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: c.input, borderColor: c.bordeInput },
              ]}
            >
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📭</Text>
              <Text
                style={[
                  styles.metaText,
                  { color: c.subtexto, textAlign: "center" },
                ]}
              >
                No hay eventos este mes.
              </Text>
            </View>
          )}

          {events.map((item) => {
            const eventKey = `${item.type}-${item.id}`;
            const isDeleting = deletingId === eventKey;
            const showDelete = canDeleteEvent(item);

            return (
              <View
                key={eventKey}
                style={[
                  styles.card,
                  {
                    backgroundColor: c.input,
                    borderColor: c.bordeInput,
                    borderLeftWidth: 4,
                    borderLeftColor:
                      item.type === "MATCH" ? c.boton : "#3b82f6",
                  },
                ]}
              >
                <View style={styles.cardRow}>
                  {/* Contenido principal */}
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.eventoTitulo, { color: c.texto }]}>
                      {item.type === "MATCH" ? "⚽" : "🏃"} {item.title}
                    </Text>
                    <Text style={[styles.metaText, { color: c.subtexto }]}>
                      📅 {new Date(item.startTime).toLocaleDateString("es-ES")}{" "}
                      · 🕒{" "}
                      {new Date(item.startTime).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                    {item.location && (
                      <Text
                        style={[
                          styles.metaText,
                          { color: c.subtexto, marginTop: 2 },
                        ]}
                      >
                        📍 {item.location}
                      </Text>
                    )}
                    {item.teamName && (
                      <Text
                        style={[
                          styles.metaText,
                          { color: c.subtexto, marginTop: 2 },
                        ]}
                      >
                        👥 {item.teamName}
                      </Text>
                    )}
                  </View>

                  {/* Botón papelera (solo si tiene permiso) */}
                  {showDelete &&
                    (isDeleting ? (
                      <ActivityIndicator
                        size="small"
                        color="#ef4444"
                        style={{ padding: 10 }}
                      />
                    ) : (
                      <TouchableOpacity
                        style={styles.deleteBtn}
                        onPress={() => handleDeleteEvent(item.id, item.type)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        activeOpacity={0.7}
                      >
                        <Text style={{ fontSize: 17 }}>🗑️</Text>
                      </TouchableOpacity>
                    ))}
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* BOTÓN FLOTANTE */}
        {canCreate && (
          <TouchableOpacity
            style={[styles.fab, { backgroundColor: c.boton }]}
            onPress={() => setCreateModal(true)}
          >
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}

        {/* MODAL CREAR EVENTO */}
        <Modal visible={createModal} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <ScrollView
              contentContainerStyle={{
                flexGrow: 1,
                justifyContent: "flex-end",
              }}
              keyboardShouldPersistTaps="handled"
            >
              <View style={[styles.modalBox, { backgroundColor: c.fondo }]}>
                <Text style={[styles.modalTitle, { color: c.texto }]}>
                  Nuevo Evento
                </Text>

                <View style={styles.chipsRowModal}>
                  <TouchableOpacity
                    onPress={() => setCreateType("TRAINING")}
                    style={[
                      styles.chipModal,
                      createType === "TRAINING"
                        ? {
                            backgroundColor: `${c.boton}20`,
                            borderColor: c.boton,
                          }
                        : {
                            backgroundColor: c.input,
                            borderColor: c.bordeInput,
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        createType === "TRAINING"
                          ? { color: c.boton }
                          : { color: c.subtexto },
                      ]}
                    >
                      🏃 Entreno
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => setCreateType("MATCH")}
                    style={[
                      styles.chipModal,
                      createType === "MATCH"
                        ? {
                            backgroundColor: `${c.boton}20`,
                            borderColor: c.boton,
                          }
                        : {
                            backgroundColor: c.input,
                            borderColor: c.bordeInput,
                          },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        createType === "MATCH"
                          ? { color: c.boton }
                          : { color: c.subtexto },
                      ]}
                    >
                      ⚽ Partido
                    </Text>
                  </TouchableOpacity>
                </View>

                {isPresident && (
                  <>
                    <Text style={[styles.inputLabel, { color: c.texto }]}>
                      Seleccionar Equipo *
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 15 }}
                    >
                      {teams.map((t) => (
                        <TouchableOpacity
                          key={t.id}
                          style={[
                            styles.chip,
                            form.teamId === String(t.id)
                              ? { backgroundColor: `${c.boton}20` }
                              : { backgroundColor: c.input },
                          ]}
                          onPress={() =>
                            setForm((f: any) => ({
                              ...f,
                              teamId: String(t.id),
                            }))
                          }
                        >
                          <Text
                            style={[
                              styles.chipText,
                              form.teamId === String(t.id)
                                ? { color: c.boton }
                                : { color: c.subtexto },
                            ]}
                          >
                            {t.category} {t.suffix}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: c.texto }]}>
                      Fecha *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: c.input,
                          color: c.texto,
                          borderColor: c.bordeInput,
                        },
                      ]}
                      placeholder="2024-10-25"
                      placeholderTextColor={c.subtexto}
                      onChangeText={(v) =>
                        setForm((f: any) => ({ ...f, date: v }))
                      }
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.inputLabel, { color: c.texto }]}>
                      Hora *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: c.input,
                          color: c.texto,
                          borderColor: c.bordeInput,
                        },
                      ]}
                      placeholder="18:30"
                      placeholderTextColor={c.subtexto}
                      onChangeText={(v) =>
                        setForm((f: any) => ({ ...f, time: v }))
                      }
                    />
                  </View>
                </View>

                {createType === "TRAINING" && (
                  <View>
                    <Text style={[styles.inputLabel, { color: c.texto }]}>
                      Hora fin
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: c.input,
                          color: c.texto,
                          borderColor: c.bordeInput,
                        },
                      ]}
                      placeholder="20:00"
                      placeholderTextColor={c.subtexto}
                      value={form.endTime || ""}
                      onChangeText={(v) =>
                        setForm((f: any) => ({ ...f, endTime: v }))
                      }
                    />
                  </View>
                )}

                <Text style={[styles.inputLabel, { color: c.texto }]}>
                  Ubicación / Campo
                </Text>

                {clubFields.length > 0 && (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 8 }}
                  >
                    {clubFields.map((campo) => (
                      <TouchableOpacity
                        key={campo.id}
                        style={[
                          styles.chip,
                          form.fieldId === campo.id
                            ? { backgroundColor: `${c.boton}20` }
                            : { backgroundColor: c.input },
                        ]}
                        onPress={() =>
                          setForm((f: any) => ({
                            ...f,
                            fieldId: campo.id,
                            location: campo.name,
                          }))
                        }
                      >
                        <Text
                          style={[
                            styles.chipText,
                            form.fieldId === campo.id
                              ? { color: c.boton }
                              : { color: c.subtexto },
                          ]}
                        >
                          📍 {campo.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}

                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: c.input,
                      color: c.texto,
                      borderColor: c.bordeInput,
                      marginBottom: 15,
                    },
                  ]}
                  placeholder="Escribe o selecciona arriba..."
                  placeholderTextColor={c.subtexto}
                  value={form.location || ""}
                  onChangeText={(v) =>
                    setForm((f: any) => ({ ...f, location: v, fieldId: null }))
                  }
                />

                {createType === "MATCH" && (
                  <>
                    <Text style={[styles.inputLabel, { color: c.texto }]}>
                      Rival *
                    </Text>
                    <TextInput
                      style={[
                        styles.textInput,
                        {
                          backgroundColor: c.input,
                          color: c.texto,
                          borderColor: c.bordeInput,
                        },
                      ]}
                      placeholder="Nombre del Rival"
                      placeholderTextColor={c.subtexto}
                      onChangeText={(v) =>
                        setForm((f: any) => ({ ...f, opponentName: v }))
                      }
                    />

                    <Text style={[styles.inputLabel, { color: c.texto }]}>
                      Competición
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 15 }}
                    >
                      {MATCH_TYPES.map((mt) => (
                        <TouchableOpacity
                          key={mt.value}
                          style={[
                            styles.chip,
                            form.matchType === mt.value
                              ? { backgroundColor: `${c.boton}20` }
                              : { backgroundColor: c.input },
                          ]}
                          onPress={() =>
                            setForm((f: any) => ({ ...f, matchType: mt.value }))
                          }
                        >
                          <Text
                            style={[
                              styles.chipText,
                              form.matchType === mt.value
                                ? { color: c.boton }
                                : { color: c.subtexto },
                            ]}
                          >
                            {mt.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>

                    <View style={styles.chipsRowModal}>
                      <TouchableOpacity
                        onPress={() =>
                          setForm((f: any) => ({ ...f, isHome: "true" }))
                        }
                        style={[
                          styles.chipModal,
                          form.isHome === "true"
                            ? {
                                backgroundColor: `${c.boton}20`,
                                borderColor: c.boton,
                              }
                            : {
                                backgroundColor: c.input,
                                borderColor: c.bordeInput,
                              },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            form.isHome === "true"
                              ? { color: c.boton }
                              : { color: c.subtexto },
                          ]}
                        >
                          🏠 Local
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() =>
                          setForm((f: any) => ({ ...f, isHome: "false" }))
                        }
                        style={[
                          styles.chipModal,
                          form.isHome === "false"
                            ? {
                                backgroundColor: `${c.boton}20`,
                                borderColor: c.boton,
                              }
                            : {
                                backgroundColor: c.input,
                                borderColor: c.bordeInput,
                              },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            form.isHome === "false"
                              ? { color: c.boton }
                              : { color: c.subtexto },
                          ]}
                        >
                          ✈️ Visitante
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}

                {createType === "TRAINING" && (
                  <>
                    <TouchableOpacity
                      onPress={() =>
                        setForm((f: any) => ({ ...f, recurring: !f.recurring }))
                      }
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginTop: 14,
                        marginBottom: 6,
                      }}
                    >
                      <View
                        style={{
                          width: 20,
                          height: 20,
                          borderRadius: 4,
                          borderWidth: 1.5,
                          borderColor: c.boton,
                          backgroundColor: form.recurring
                            ? c.boton
                            : "transparent",
                          marginRight: 8,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        {form.recurring && (
                          <Text
                            style={{
                              color: "#fff",
                              fontSize: 12,
                              fontWeight: "bold",
                            }}
                          >
                            ✓
                          </Text>
                        )}
                      </View>
                      <Text
                        style={[
                          styles.inputLabel,
                          { color: c.texto, marginTop: 0, marginBottom: 0 },
                        ]}
                      >
                        Repetir semanalmente
                      </Text>
                    </TouchableOpacity>

                    {form.recurring && (
                      <>
                        <View
                          style={{
                            flexDirection: "row",
                            justifyContent: "space-between",
                            marginTop: 8,
                            marginBottom: 12,
                          }}
                        >
                          {[
                            { label: "L", value: 1 },
                            { label: "M", value: 2 },
                            { label: "X", value: 3 },
                            { label: "J", value: 4 },
                            { label: "V", value: 5 },
                            { label: "S", value: 6 },
                            { label: "D", value: 7 },
                          ].map((day) => {
                            const sel = form.recurringDays?.includes(day.value);
                            return (
                              <TouchableOpacity
                                key={day.value}
                                onPress={() =>
                                  setForm((f: any) => ({
                                    ...f,
                                    recurringDays: sel
                                      ? f.recurringDays.filter(
                                          (d: number) => d !== day.value,
                                        )
                                      : [...(f.recurringDays || []), day.value],
                                  }))
                                }
                                style={{
                                  width: 36,
                                  height: 36,
                                  borderRadius: 18,
                                  borderWidth: 1.5,
                                  borderColor: sel ? c.boton : c.bordeInput,
                                  backgroundColor: sel
                                    ? `${c.boton}20`
                                    : c.input,
                                  alignItems: "center",
                                  justifyContent: "center",
                                }}
                              >
                                <Text
                                  style={{
                                    color: sel ? c.boton : c.subtexto,
                                    fontSize: 13,
                                    fontWeight: "bold",
                                  }}
                                >
                                  {day.label}
                                </Text>
                              </TouchableOpacity>
                            );
                          })}
                        </View>
                        <Text style={[styles.inputLabel, { color: c.texto }]}>
                          Repetir hasta
                        </Text>
                        <TextInput
                          style={[
                            styles.textInput,
                            {
                              backgroundColor: c.input,
                              color: c.texto,
                              borderColor: c.bordeInput,
                              marginBottom: 5,
                            },
                          ]}
                          placeholder="2025-06-30"
                          placeholderTextColor={c.subtexto}
                          value={form.recurringEndDate || ""}
                          onChangeText={(v) =>
                            setForm((f: any) => ({ ...f, recurringEndDate: v }))
                          }
                        />
                      </>
                    )}
                  </>
                )}

                <View style={{ flexDirection: "row", gap: 10, marginTop: 15 }}>
                  <TouchableOpacity
                    style={[
                      styles.btnCrear,
                      {
                        backgroundColor: c.input,
                        flex: 1,
                        borderWidth: 1,
                        borderColor: c.bordeInput,
                      },
                    ]}
                    onPress={() => setCreateModal(false)}
                  >
                    <Text style={[styles.btnCrearText, { color: c.texto }]}>
                      Cancelar
                    </Text>
                  </TouchableOpacity>
                  {/* 🟢 EL BOTÓN DE CONFIRMAR AHORA ESTÁ BLOQUEADO MIENTRAS CARGA */}
                  <TouchableOpacity
                    style={[
                      styles.btnCrear,
                      {
                        backgroundColor: isSubmitting ? c.bordeInput : c.boton,
                        flex: 1,
                      },
                    ]}
                    onPress={handleCreateEvent}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#fff" />
                    ) : (
                      <Text style={styles.btnCrearText}>Confirmar</Text>
                    )}
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
  headerRow: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 10 },
  headerTitle: { fontSize: 24, fontWeight: "bold" },
  headerSub: { fontSize: 14, fontWeight: "500", marginBottom: 5 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: { fontSize: 13, fontWeight: "bold" },
  monthNav: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  navBtnText: { fontSize: 16, fontWeight: "bold" },
  monthText: { fontSize: 18, fontWeight: "bold" },
  calendarWrapper: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    paddingBottom: 15,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 2,
    borderRadius: 8,
  },
  dayCellEmpty: { flex: 1, aspectRatio: 1, margin: 2 },
  dayText: { fontSize: 14, fontWeight: "600" },
  dotsContainer: { flexDirection: "row", gap: 3, marginTop: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  sectionTitle: { fontSize: 18, fontWeight: "bold" },
  // Tarjeta de evento
  card: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  cardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  eventoTitulo: { fontSize: 15, fontWeight: "bold", marginBottom: 5 },
  metaText: { fontSize: 13, fontWeight: "500" },
  deleteBtn: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#ef444418",
    alignItems: "center",
    justifyContent: "center",
  },
  emptyCard: {
    padding: 30,
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    marginTop: 10,
  },
  fab: {
    position: "absolute",
    bottom: 25,
    right: 25,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  fabText: { fontSize: 30, color: "#fff", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  inputLabel: {
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 10,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    marginBottom: 5,
  },
  chipsRowModal: { flexDirection: "row", gap: 10, marginBottom: 10 },
  chipModal: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
  },
  btnCrear: { paddingVertical: 15, borderRadius: 12, alignItems: "center" },
  btnCrearText: { color: "white", fontWeight: "bold", fontSize: 16 },
});
