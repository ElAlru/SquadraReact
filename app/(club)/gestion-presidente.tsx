import React, { useState, useEffect, useCallback } from "react";
import {
  View, Text, TouchableOpacity, ScrollView, Modal, TextInput,
  StyleSheet, Alert, ActivityIndicator, FlatList
} from "react-native";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useTheme } from "../../lib/useTheme";

type Tab = "SOLICITUDES" | "CUOTAS" | "EQUIPOS";

interface JoinRequest {
  id: number;
  userId: string;
  userFullName: string;
  userEmail: string;
  requestedRole: string;
  status: string;
  message: string | null;
  requestedAt: string;
}

interface FeeWithPayments {
  feeId: number;
  concept: string;
  amount: number;
  dueDate: string;
  payments: PaymentItem[];
}

interface PaymentItem {
  paymentId: number;
  playerId: number;
  playerName: string;
  status: "PENDING" | "PAID" | "OVERDUE";
  paidDate: string | null;
}

interface Team {
  id: number;
  category: string;
  gender: string;
  suffix: string;
  isActive: boolean;
  seasonLabel: string;
}

// ─── ENUMERADOS DEL BACKEND ───
const CATEGORIAS = ["U6", "U8", "U10", "U12", "U14", "U16", "U19", "SENIOR"];

const GENDER_OPTIONS = [
  { value: "MALE", label: "♂ Masc." },
  { value: "FEMALE", label: "♀ Fem." },
  { value: "MIXED", label: "⚥ Mixto" }
];

const STAFF_ROLES = [
  { value: "HEAD_COACH", label: "Primer Entrenador" },
  { value: "ASSISTANT", label: "Segundo Entrenador" },
  { value: "FITNESS_COACH", label: "Prep. Físico" },
  { value: "PHYSIOTHERAPIST", label: "Fisioterapeuta" },
  { value: "DELEGATE", label: "Delegado" },
  { value: "OTHER", label: "Otro" }
];

const KINSHIP_TYPES = [
  { value: "FATHER", label: "Padre" },
  { value: "MOTHER", label: "Madre" },
  { value: "LEGAL_GUARDIAN", label: "Tutor Legal" },
  { value: "OTHER", label: "Otro" }
];

const PLAYER_POSITIONS = [
  { value: "GOALKEEPER", label: "Portero/a" },
  { value: "DEFENDER", label: "Defensa" },
  { value: "MIDFIELDER", label: "Centrocampista" },
  { value: "FORWARD", label: "Delantero/a" }
];

export default function GestionPresidente() {
  const c = useTheme();
  const { activeClubId: clubId, activeSeasonName } = useAuthStore();
  const seasonLabel = activeSeasonName || "24-25";

  const [activeTab, setActiveTab] = useState<Tab>("SOLICITUDES");

  // ─── ESTADOS ───
  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqPage, setReqPage] = useState(0);
  const [reqHasMore, setReqHasMore] = useState(true);

  const [reviewModal, setReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");
  
  // Estados para asignaciones
  const [assignTeamId, setAssignTeamId] = useState<number | null>(null);
  const [assignStaffRole, setAssignStaffRole] = useState<string>("HEAD_COACH");
  const [assignKinship, setAssignKinship] = useState<string>("FATHER");
  const [assignPlayerPosition, setAssignPlayerPosition] = useState<string>("MIDFIELDER");
  const [assignLinkedPlayerId, setAssignLinkedPlayerId] = useState<number | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [clubPlayers, setClubPlayers] = useState<any[]>([]); // Jugadores para vincular familiares

  const [fees, setFees] = useState<FeeWithPayments[]>([]);
  const [feesLoading, setFeesLoading] = useState(false);
  const [feesPage, setFeesPage] = useState(0);
  const [feesHasMore, setFeesHasMore] = useState(true);
  const [expandedFee, setExpandedFee] = useState<number | null>(null);

  const [createFeeModal, setCreateFeeModal] = useState(false);
  const [feeForm, setFeeForm] = useState<any>({});

  const [createTeamModal, setCreateTeamModal] = useState(false);
  const [teamForm, setTeamForm] = useState<any>({ gender: "MALE" });

  // ─── PETICIONES A LA API ───
  const fetchTeams = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/teams?clubId=${clubId}`);
      const data: Team[] = await res.json();
      setTeams(data);
    } catch {}
  }, [clubId]);

  const fetchClubPlayers = useCallback(async () => {
    try {
      // ⚠️ Ajusta el endpoint si en tu backend es distinto para sacar la lista de jugadores
      const res = await apiFetch(`/api/players?clubId=${clubId}`);
      const data = await res.json();
      setClubPlayers(data);
    } catch {
      console.log("No se pudieron cargar los jugadores del club.");
    }
  }, [clubId]);

  const fetchRequests = useCallback(async (page: number) => {
    setReqLoading(true);
    try {
      const res = await apiFetch(`/api/president/requests?clubId=${clubId}&page=${page}&size=15`);
      const data = await res.json();
      const items: JoinRequest[] = data.content;
      setRequests(page === 0 ? items : prev => [...prev, ...items]);
      setReqHasMore(!data.last);
      setReqPage(page);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las solicitudes.");
    } finally {
      setReqLoading(false);
    }
  }, [clubId]);

  const fetchFees = useCallback(async (page: number) => {
    setFeesLoading(true);
    try {
      const res = await apiFetch(`/api/president/fees?clubId=${clubId}&seasonLabel=${seasonLabel}&page=${page}&size=15`);
      const data = await res.json();
      const items: FeeWithPayments[] = data.content;
      setFees(page === 0 ? items : prev => [...prev, ...items]);
      setFeesHasMore(!data.last);
      setFeesPage(page);
    } catch {
      Alert.alert("Error", "No se pudieron cargar las cuotas.");
    } finally {
      setFeesLoading(false);
    }
  }, [clubId, seasonLabel]);

  useEffect(() => { fetchTeams(); fetchClubPlayers(); }, [fetchTeams, fetchClubPlayers]);

  useEffect(() => {
    if (activeTab === "SOLICITUDES") fetchRequests(0);
    if (activeTab === "CUOTAS") fetchFees(0);
  }, [activeTab]);

  // ─── MANEJADORES DE ACCIÓN ───
  const handleReview = async () => {
    if (!selectedRequest) return;

    try {
      const payload: any = {
        decision: reviewDecision,
      };

      if (reviewDecision === "APPROVED") {
        if (selectedRequest.requestedRole === "PLAYER") {
          payload.teamId = assignTeamId;
          payload.playerPosition = assignPlayerPosition;
        } else if (selectedRequest.requestedRole === "COACH") {
          payload.teamId = assignTeamId;
          payload.staffRoleType = assignStaffRole;
        } else if (selectedRequest.requestedRole === "RELATIVE") {
          payload.linkedPlayerId = assignLinkedPlayerId;
          payload.kinshipType = assignKinship;
        }
      }

      await apiFetch(`/api/president/requests/${selectedRequest.id}?clubId=${clubId}`, {
        method: "PATCH",
        body: JSON.stringify(payload),
      });
      
      setReviewModal(false);
      setRequests(prev => prev.filter(r => r.id !== selectedRequest.id));
      Alert.alert("Éxito", "Solicitud procesada correctamente.");
    } catch {
      Alert.alert("Error", "No se pudo procesar la solicitud.");
    }
  };

  const handleCreateFee = async () => {
    if (!feeForm.teamId || !feeForm.concept || !feeForm.amount || !feeForm.dueDate) {
      Alert.alert("Atención", "Rellena todos los campos para crear la cuota (Equipo, Concepto, Importe y Fecha).");
      return;
    }
    try {
      const res = await apiFetch(`/api/president/fees?clubId=${clubId}`, {
        method: "POST",
        body: JSON.stringify({
          teamId: Number(feeForm.teamId),
          concept: feeForm.concept,
          amount: parseFloat(feeForm.amount),
          dueDate: feeForm.dueDate,
        }),
      });
      const data: FeeWithPayments = await res.json();
      setFees(prev => [data, ...prev]);
      setCreateFeeModal(false);
      setFeeForm({});
      Alert.alert("Cuota creada", "Cuota generada y asignada a los jugadores.");
    } catch {
      Alert.alert("Error", "Hubo un problema al crear la cuota. Verifica que el formato de fecha sea YYYY-MM-DD.");
    }
  };

  const handlePaymentStatus = async (paymentId: number, feeId: number, status: PaymentItem["status"]) => {
    try {
      await apiFetch(`/api/president/payments/${paymentId}?clubId=${clubId}`, {
        method: "PATCH", body: JSON.stringify({ status }) 
      });
      setFees(prev => prev.map(f =>
        f.feeId !== feeId ? f : {
          ...f,
          payments: f.payments.map(p => p.paymentId !== paymentId ? p : { ...p, status }),
        }
      ));
    } catch {
      Alert.alert("Error", "No se pudo actualizar el pago.");
    }
  };

  const handleCreateTeam = async () => {
    if (!teamForm.category || !teamForm.gender || !teamForm.suffix) {
      Alert.alert("Atención", "Selecciona categoría, género y escribe un sufijo.");
      return;
    }
    try {
      const res = await apiFetch(`/api/president/teams?clubId=${clubId}&seasonLabel=${seasonLabel}`, {
        method: "POST",
        body: JSON.stringify({
          category: teamForm.category,
          gender: teamForm.gender,
          suffix: teamForm.suffix,
        }),
      });
      const data: Team = await res.json();
      setTeams(prev => [...prev, data]);
      setCreateTeamModal(false);
      setTeamForm({ gender: "MALE" });
      Alert.alert("Equipo creado", "El equipo ha sido registrado exitosamente.");
    } catch {
      Alert.alert("Error", "No se pudo crear el equipo. Verifica los datos.");
    }
  };

  const handleDeleteTeam = (teamId: number) => {
    Alert.alert(
      "Eliminar Equipo", 
      "¿Estás seguro? El sistema bloqueará el borrado si este equipo tiene datos vinculados.", 
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: async () => {
            try {
              const res = await apiFetch(`/api/president/teams/${teamId}?clubId=${clubId}`, { method: "DELETE" });
              if (res.ok) {
                setTeams(prev => prev.filter(t => t.id !== teamId));
                Alert.alert("Eliminado", "El equipo ha sido eliminado correctamente.");
              }
            } catch {
              Alert.alert("No se pudo eliminar", "El equipo tiene datos vinculados (jugadores, eventos, cuotas).");
            }
          }
        }
      ]
    );
  };

  const formatRequestTitle = (req: JoinRequest) => {
    let roleStr = req.requestedRole;
    if (roleStr === "PLAYER") roleStr = "Jugador";
    else if (roleStr === "COACH") roleStr = "Entrenador";
    else if (roleStr === "RELATIVE") roleStr = "Familiar";

    return `${req.userFullName} - ${roleStr}`;
  };

  // ─── RENDERIZADOS DE TABS ───
  const renderSolicitudesTab = () => (
    <View>
      {reqLoading && requests.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.boton} />
      ) : (
        <FlatList
          data={requests}
          keyExtractor={r => String(r.id)}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={[styles.card, { backgroundColor: c.input, borderStyle: 'dashed', borderColor: c.bordeInput }]}>
              <Text style={{ textAlign: "center", color: c.subtexto }}>No hay solicitudes pendientes.</Text>
            </View>
          }
          onEndReached={() => { if (reqHasMore) fetchRequests(reqPage + 1); }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => (
            <View style={[styles.card, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.cardTitle, { color: c.texto }]}>
                  {formatRequestTitle(item)}
                </Text>
                <Text style={{ fontSize: 13, color: c.subtexto, marginTop: 4 }}>📧 {item.userEmail}</Text>
                {item.message && (
                  <Text style={{ fontSize: 13, color: c.subtexto, fontStyle: "italic", marginTop: 6, backgroundColor: c.fondo, padding: 8, borderRadius: 8 }}>
                    💬 "{item.message}"
                  </Text>
                )}
              </View>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <TouchableOpacity
                  style={[styles.btnAction, { backgroundColor: "#DCFCE7", borderColor: "#16A34A" }]}
                  onPress={() => {
                    setSelectedRequest(item);
                    setReviewDecision("APPROVED");
                    setAssignTeamId(null);
                    setReviewModal(true);
                  }}
                >
                  <Text style={{ color: "#16A34A", fontWeight: "bold" }}>Aprobar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.btnAction, { backgroundColor: "#FEE2E2", borderColor: "#DC2626" }]}
                  onPress={() => {
                    setSelectedRequest(item);
                    setReviewDecision("REJECTED");
                    setReviewModal(true);
                  }}
                >
                  <Text style={{ color: "#DC2626", fontWeight: "bold" }}>Rechazar</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}
    </View>
  );

  const renderCuotasTab = () => (
    <View>
      <TouchableOpacity style={[styles.btnMain, { backgroundColor: c.boton }]} onPress={() => setCreateFeeModal(true)}>
        <Text style={{ color: "white", fontWeight: "bold" }}>+ Nueva cuota</Text>
      </TouchableOpacity>

      {feesLoading && fees.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={c.boton} />
      ) : (
        <FlatList
          data={fees}
          keyExtractor={f => String(f.feeId)}
          scrollEnabled={false}
          ListEmptyComponent={
            <View style={[styles.card, { backgroundColor: c.input, borderStyle: 'dashed', borderColor: c.bordeInput }]}>
              <Text style={{ textAlign: "center", color: c.subtexto }}>No hay cuotas esta temporada.</Text>
            </View>
          }
          onEndReached={() => { if (feesHasMore) fetchFees(feesPage + 1); }}
          onEndReachedThreshold={0.4}
          renderItem={({ item }) => {
            const paidCount = item.payments.filter(p => p.status === "PAID").length;
            const isExpanded = expandedFee === item.feeId;
            return (
              <View style={[styles.card, { backgroundColor: c.input, borderColor: c.bordeInput, padding: 0, overflow: 'hidden' }]}>
                <TouchableOpacity onPress={() => setExpandedFee(isExpanded ? null : item.feeId)} style={{ padding: 16 }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: c.texto }]}>{item.concept}</Text>
                      <Text style={{ fontSize: 22, fontWeight: "800", color: c.boton, marginTop: 4 }}>€{item.amount.toFixed(2)}</Text>
                      <Text style={{ fontSize: 13, color: c.subtexto, marginTop: 4 }}>📅 Vence: {item.dueDate}</Text>
                    </View>
                    <View style={{ alignItems: "center", backgroundColor: c.fondo, padding: 10, borderRadius: 12 }}>
                      <Text style={{ fontSize: 18, fontWeight: "bold", color: c.texto }}>{paidCount}/{item.payments.length}</Text>
                      <Text style={{ fontSize: 10, color: c.subtexto, textTransform: 'uppercase' }}>Pagados</Text>
                    </View>
                  </View>
                </TouchableOpacity>

                {isExpanded && (
                  <View style={{ borderTopWidth: 1, borderTopColor: c.bordeInput, backgroundColor: c.fondo, padding: 16 }}>
                    {item.payments.map(p => (
                      <View key={p.paymentId} style={{ flexDirection: "row", alignItems: "center", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: c.input }}>
                        <Text style={{ flex: 1, fontSize: 14, color: c.texto, fontWeight: '500' }} numberOfLines={1}>👤 {p.playerName}</Text>
                        <View style={{ flexDirection: "row", gap: 6 }}>
                          {(["PENDING","PAID","OVERDUE"] as const).map(st => (
                            <TouchableOpacity
                              key={st}
                              style={[
                                styles.chipSmall, 
                                p.status === st 
                                  ? (st === "PAID" ? {backgroundColor: "#DCFCE7"} : st === "OVERDUE" ? {backgroundColor: "#FEE2E2"} : {backgroundColor: "#FEF3C7"}) 
                                  : { backgroundColor: c.input, borderWidth: 1, borderColor: c.bordeInput }
                              ]}
                              onPress={() => handlePaymentStatus(p.paymentId, item.feeId, st)}
                            >
                              <Text style={{ fontSize: 11, fontWeight: p.status === st ? "bold" : "600", color: p.status === st ? "black" : c.subtexto }}>
                                {st === "PENDING" ? "Pendiente" : st === "PAID" ? "Pagado" : "Vencido"}
                              </Text>
                            </TouchableOpacity>
                          ))}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );

  const renderEquiposTab = () => (
    <View>
      <TouchableOpacity style={[styles.btnMain, { backgroundColor: c.boton }]} onPress={() => setCreateTeamModal(true)}>
        <Text style={{ color: "white", fontWeight: "bold", fontSize: 16 }}>+ Crear nuevo equipo</Text>
      </TouchableOpacity>
      
      {teams.length === 0 && !reqLoading && (
        <View style={[styles.card, { backgroundColor: c.input, borderStyle: 'dashed', borderColor: c.bordeInput }]}>
          <Text style={{ textAlign: "center", color: c.subtexto }}>Aún no has creado ningún equipo.</Text>
        </View>
      )}

      {teams.map(t => (
        <View key={t.id} style={[styles.card, { backgroundColor: c.input, borderColor: c.bordeInput, flexDirection: "row", alignItems: "center", gap: 12 }]}>
          <View style={{ width: 50, height: 50, borderRadius: 14, backgroundColor: `${c.boton}20`, alignItems: "center", justifyContent: "center" }}>
            <Text style={{ fontSize: 24 }}>🏆</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.cardTitle, { color: c.texto }]}>{t.category} {t.gender} {t.suffix}</Text>
            <Text style={{ fontSize: 13, color: c.subtexto, marginTop: 4 }}>Temporada {t.seasonLabel}</Text>
          </View>
          <TouchableOpacity onPress={() => handleDeleteTeam(t.id)} style={{ padding: 10, backgroundColor: "#FEE2E2", borderRadius: 10 }}>
            <Text style={{ fontSize: 18, color: "#DC2626" }}>🗑️</Text>
          </TouchableOpacity>
        </View>
      ))}
    </View>
  );

  return (
    <View style={[{ flex: 1 }, { backgroundColor: c.fondo }]}>
      
      <View style={{ padding: 24, paddingTop: 60, paddingBottom: 10 }}>
        <Text style={{ fontSize: 14, fontWeight: "600", color: c.subtexto, marginBottom: 5 }}>Temporada {seasonLabel}</Text>
        <Text style={{ fontSize: 28, fontWeight: "bold", color: c.texto }}>Administración</Text>
      </View>

      <View style={{ flexDirection: "row", paddingHorizontal: 16, marginBottom: 15 }}>
        {(["SOLICITUDES","CUOTAS","EQUIPOS"] as Tab[]).map(tab => (
          <TouchableOpacity
            key={tab}
            style={[{ flex: 1, paddingVertical: 14, alignItems: "center", borderBottomWidth: 3 }, activeTab === tab ? { borderBottomColor: c.boton } : { borderBottomColor: "transparent" }]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[{ fontSize: 13, fontWeight: "bold" }, activeTab === tab ? { color: c.texto } : { color: c.subtexto }]}>
              {tab === "SOLICITUDES" ? "📩 Peticiones" : tab === "CUOTAS" ? "💳 Cuotas" : "🏆 Equipos"}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
        {activeTab === "SOLICITUDES" && renderSolicitudesTab()}
        {activeTab === "CUOTAS" && renderCuotasTab()}
        {activeTab === "EQUIPOS" && renderEquiposTab()}
      </ScrollView>

      {/* ─── MODAL REVISAR SOLICITUD ─── */}
      <Modal visible={reviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'flex-end' }} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalBox, { backgroundColor: c.fondo }]}>
              <Text style={[styles.modalTitle, { color: c.texto }]}>Revisar Solicitud</Text>
              
              {selectedRequest && (
                <Text style={{ fontSize: 15, color: c.texto, marginBottom: 20, fontWeight: '500' }}>
                  {formatRequestTitle(selectedRequest)}
                </Text>
              )}
              
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                <TouchableOpacity style={[styles.chipModal, reviewDecision === "APPROVED" ? { backgroundColor: "#DCFCE7", borderColor: "#16A34A" } : { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setReviewDecision("APPROVED")}>
                  <Text style={{ fontWeight: "bold", fontSize: 16, color: reviewDecision === "APPROVED" ? "#16A34A" : c.subtexto }}>✅ Aprobar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.chipModal, reviewDecision === "REJECTED" ? { backgroundColor: "#FEE2E2", borderColor: "#DC2626" } : { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setReviewDecision("REJECTED")}>
                  <Text style={{ fontWeight: "bold", fontSize: 16, color: reviewDecision === "REJECTED" ? "#DC2626" : c.subtexto }}>❌ Rechazar</Text>
                </TouchableOpacity>
              </View>

              {reviewDecision === "APPROVED" && (
                <>
                  {/* Selector de Equipo (Solo para Jugadores y Entrenadores) */}
                  {(selectedRequest?.requestedRole === "PLAYER" || selectedRequest?.requestedRole === "COACH") && (
                    <>
                      <Text style={[styles.inputLabel, { color: c.texto }]}>Asignar equipo *</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                        {teams.map(t => (
                          <TouchableOpacity key={t.id} style={[styles.chip, assignTeamId === t.id ? { backgroundColor: `${c.boton}20` } : { backgroundColor: c.input }]} onPress={() => setAssignTeamId(assignTeamId === t.id ? null : t.id)}>
                            <Text style={[styles.chipText, assignTeamId === t.id ? { color: c.boton } : { color: c.subtexto }]}>{t.category} {t.suffix}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  {/* Extras si es Jugador */}
                  {selectedRequest?.requestedRole === "PLAYER" && (
                    <>
                      <Text style={[styles.inputLabel, { color: c.texto }]}>Posición en el campo *</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                        {PLAYER_POSITIONS.map(pos => (
                          <TouchableOpacity key={pos.value} style={[styles.chip, assignPlayerPosition === pos.value ? { backgroundColor: `${c.boton}20` } : { backgroundColor: c.input }]} onPress={() => setAssignPlayerPosition(pos.value)}>
                            <Text style={[styles.chipText, assignPlayerPosition === pos.value ? { color: c.boton } : { color: c.subtexto }]}>{pos.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  {/* Extras si es Entrenador */}
                  {selectedRequest?.requestedRole === "COACH" && (
                    <>
                      <Text style={[styles.inputLabel, { color: c.texto }]}>Puesto Técnico *</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                        {STAFF_ROLES.map(sr => (
                          <TouchableOpacity key={sr.value} style={[styles.chip, assignStaffRole === sr.value ? { backgroundColor: `${c.boton}20` } : { backgroundColor: c.input }]} onPress={() => setAssignStaffRole(sr.value)}>
                            <Text style={[styles.chipText, assignStaffRole === sr.value ? { color: c.boton } : { color: c.subtexto }]}>{sr.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}

                  {/* Extras si es Familiar */}
                  {selectedRequest?.requestedRole === "RELATIVE" && (
                    <>
                      <Text style={[styles.inputLabel, { color: c.texto }]}>Jugador Vinculado (Hijo/a) *</Text>
                      {clubPlayers.length === 0 ? (
                        <Text style={{ color: c.subtexto, marginBottom: 20, fontStyle: 'italic' }}>No hay jugadores registrados en el club aún.</Text>
                      ) : (
                        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                          {clubPlayers.map(p => (
                            <TouchableOpacity key={p.id} style={[styles.chip, assignLinkedPlayerId === p.id ? { backgroundColor: `${c.boton}20` } : { backgroundColor: c.input }]} onPress={() => setAssignLinkedPlayerId(p.id)}>
                              <Text style={[styles.chipText, assignLinkedPlayerId === p.id ? { color: c.boton } : { color: c.subtexto }]}>{p.firstName} {p.lastName}</Text>
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      )}

                      <Text style={[styles.inputLabel, { color: c.texto }]}>Parentesco *</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                        {KINSHIP_TYPES.map(kt => (
                          <TouchableOpacity key={kt.value} style={[styles.chip, assignKinship === kt.value ? { backgroundColor: `${c.boton}20` } : { backgroundColor: c.input }]} onPress={() => setAssignKinship(kt.value)}>
                            <Text style={[styles.chipText, assignKinship === kt.value ? { color: c.boton } : { color: c.subtexto }]}>{kt.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </>
                  )}
                </>
              )}

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 10 }}>
                <TouchableOpacity style={[styles.btnMain, { backgroundColor: c.input, flex: 1, borderWidth: 1, borderColor: c.bordeInput }]} onPress={() => setReviewModal(false)}>
                  <Text style={{ color: c.texto, fontWeight: 'bold', fontSize: 16 }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnMain, { backgroundColor: reviewDecision === "APPROVED" ? c.boton : "#DC2626", flex: 1 }]} onPress={handleReview}>
                  <Text style={{ color: "white", fontWeight: 'bold', fontSize: 16 }}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── MODAL CREAR CUOTA ─── */}
      <Modal visible={createFeeModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalBox, { backgroundColor: c.fondo }]}>
              <Text style={[styles.modalTitle, { color: c.texto }]}>Nueva Cuota</Text>
              
              <Text style={[styles.inputLabel, { color: c.texto }]}>Seleccionar Equipo *</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
                {teams.map(t => (
                  <TouchableOpacity key={t.id} style={[styles.chip, feeForm.teamId === String(t.id) ? { backgroundColor: `${c.boton}20` } : { backgroundColor: c.input }]} onPress={() => setFeeForm((f:any) => ({ ...f, teamId: String(t.id) }))}>
                    <Text style={[styles.chipText, feeForm.teamId === String(t.id) ? { color: c.boton } : { color: c.subtexto }]}>{t.category} {t.suffix}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <Text style={[styles.inputLabel, { color: c.texto }]}>Concepto *</Text>
              <TextInput style={[styles.textInput, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput }]} value={feeForm.concept ?? ""} onChangeText={v => setFeeForm((f:any) => ({ ...f, concept: v }))} placeholder="Ej: Cuota Anual 2025" placeholderTextColor={c.subtexto} />

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: c.texto }]}>Importe (€) *</Text>
                  <TextInput style={[styles.textInput, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput }]} value={feeForm.amount ?? ""} onChangeText={v => setFeeForm((f:any) => ({ ...f, amount: v }))} keyboardType="decimal-pad" placeholder="250.00" placeholderTextColor={c.subtexto} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.inputLabel, { color: c.texto }]}>Vencimiento *</Text>
                  <TextInput style={[styles.textInput, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput }]} value={feeForm.dueDate ?? ""} onChangeText={v => setFeeForm((f:any) => ({ ...f, dueDate: v }))} placeholder="YYYY-MM-DD" placeholderTextColor={c.subtexto} />
                </View>
              </View>

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                <TouchableOpacity style={[styles.btnMain, { backgroundColor: c.input, flex: 1, borderWidth: 1, borderColor: c.bordeInput }]} onPress={() => setCreateFeeModal(false)}>
                  <Text style={{ color: c.texto, fontWeight: 'bold', fontSize: 16 }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnMain, { backgroundColor: c.boton, flex: 1 }]} onPress={handleCreateFee}>
                  <Text style={{ color: "white", fontWeight: 'bold', fontSize: 16 }}>Crear Cuota</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* ─── MODAL CREAR EQUIPO ─── */}
      <Modal visible={createTeamModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalBox, { backgroundColor: c.fondo }]}>
              <Text style={[styles.modalTitle, { color: c.texto }]}>Nuevo Equipo</Text>

              <Text style={[styles.inputLabel, { color: c.texto }]}>Categoría *</Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {CATEGORIAS.map(cat => (
                  <TouchableOpacity key={cat} style={[styles.chip, teamForm.category === cat ? { backgroundColor: `${c.boton}20` } : { backgroundColor: c.input }]} onPress={() => setTeamForm((f:any) => ({ ...f, category: cat }))}>
                    <Text style={[styles.chipText, teamForm.category === cat ? { color: c.boton } : { color: c.subtexto }]}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: c.texto }]}>Género *</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                {GENDER_OPTIONS.map(g => (
                  <TouchableOpacity key={g.value} style={[styles.chipModal, teamForm.gender === g.value ? { backgroundColor: `${c.boton}20`, borderColor: c.boton } : { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setTeamForm((f:any) => ({ ...f, gender: g.value }))}>
                    <Text style={{ fontWeight: "bold", fontSize: 15, color: teamForm.gender === g.value ? c.boton : c.subtexto }}>{g.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.inputLabel, { color: c.texto }]}>Sufijo / Letra *</Text>
              <TextInput style={[styles.textInput, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput }]} value={teamForm.suffix ?? ""} onChangeText={v => setTeamForm((f:any) => ({ ...f, suffix: v }))} placeholder="Ej: A, B, Promesas..." placeholderTextColor={c.subtexto} />

              <View style={{ flexDirection: 'row', gap: 10, marginTop: 15 }}>
                <TouchableOpacity style={[styles.btnMain, { backgroundColor: c.input, flex: 1, borderWidth: 1, borderColor: c.bordeInput }]} onPress={() => setCreateTeamModal(false)}>
                  <Text style={{ color: c.texto, fontWeight: 'bold', fontSize: 16 }}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnMain, { backgroundColor: c.boton, flex: 1 }]} onPress={handleCreateTeam}>
                  <Text style={{ color: "white", fontWeight: 'bold', fontSize: 16 }}>Crear Equipo</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

// ─── ESTILOS DINÁMICOS ───
const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 18, fontWeight: "bold" },
  btnMain: { paddingVertical: 16, borderRadius: 14, alignItems: "center", marginBottom: 16 },
  btnAction: { flex: 1, paddingVertical: 12, borderRadius: 10, borderWidth: 1, alignItems: "center" },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  chipText: { fontSize: 14, fontWeight: 'bold' },
  chipSmall: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  chipModal: { flex: 1, paddingVertical: 14, borderRadius: 14, alignItems: 'center', borderWidth: 1 },
  textInput: { borderWidth: 1, borderRadius: 14, padding: 16, fontSize: 16, marginBottom: 15 },
  inputLabel: { fontSize: 14, fontWeight: "bold", marginBottom: 8, marginTop: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 24, paddingBottom: 40, elevation: 10 },
  modalTitle: { fontSize: 22, fontWeight: "bold", marginBottom: 24 },
});