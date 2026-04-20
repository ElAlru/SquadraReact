import React, { useCallback, useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ScrollView, Modal, StyleSheet, Alert, ActivityIndicator, FlatList } from "react-native";
import { apiFetch } from "../../lib/api";
import { useAuthStore } from "../../lib/store";
import { useTheme } from "../../lib/useTheme";

// Tipos
type AssignableRole = "PLAYER" | "COACH" | "RELATIVE";
type PlayerPosition = "GOALKEEPER" | "DEFENDER" | "MIDFIELDER" | "FORWARD";
type StaffRoleType = "HEAD_COACH" | "ASSISTANT" | "FITNESS_COACH" | "PHYSIOTHERAPIST" | "DELEGATE" | "OTHER";
type KinshipType = "FATHER" | "MOTHER" | "LEGAL_GUARDIAN" | "OTHER";

interface JoinRequest {
  id: number; userId: string; userFullName: string; userEmail: string;
  requestedRole: string; status: string; message: string | null; requestedAt: string;
}
interface Team { id: number; category: string; gender: string; suffix: string; seasonLabel: string; }
interface TeamPlayer { id: number; firstName: string; lastName?: string; }

// Constantes
const STAFF_ROLES: { value: StaffRoleType; label: string }[] = [
  { value: "HEAD_COACH", label: "1er Entrenador" }, { value: "ASSISTANT", label: "2º Entrenador" },
  { value: "FITNESS_COACH", label: "Prep. Físico" }, { value: "PHYSIOTHERAPIST", label: "Fisioterapeuta" },
  { value: "DELEGATE", label: "Delegado" }, { value: "OTHER", label: "Otro" },
];
const KINSHIP_TYPES: { value: KinshipType; label: string }[] = [
  { value: "FATHER", label: "Padre" }, { value: "MOTHER", label: "Madre" },
  { value: "LEGAL_GUARDIAN", label: "Tutor Legal" }, { value: "OTHER", label: "Otro" },
];
const PLAYER_POSITIONS: { value: PlayerPosition; label: string }[] = [
  { value: "GOALKEEPER", label: "Portero/a" }, { value: "DEFENDER", label: "Defensa" },
  { value: "MIDFIELDER", label: "Centrocampista" }, { value: "FORWARD", label: "Delantero/a" },
];
const ASSIGNABLE_ROLES: { value: AssignableRole; label: string }[] = [
  { value: "PLAYER", label: "Jugador/a" }, { value: "COACH", label: "Entrenador / Staff" }, { value: "RELATIVE", label: "Familiar" },
];
const ROLE_LABELS: Record<string, string> = { PLAYER: "Jugador/a", COACH: "Entrenador", RELATIVE: "Familiar", STAFF: "Staff", OTHER: "Otro" };
const labelForRole = (role: string): string => ROLE_LABELS[role] ?? role;

export default function TabSolicitudes() {
  const c = useTheme();
  const { activeClubId: clubId } = useAuthStore();

  const [requests, setRequests] = useState<JoinRequest[]>([]);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqPage, setReqPage] = useState(0);
  const [reqHasMore, setReqHasMore] = useState(true);

  const [reviewModal, setReviewModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<JoinRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<"APPROVED" | "REJECTED">("APPROVED");

  const [assignRole, setAssignRole] = useState<AssignableRole>("PLAYER");
  const [assignTeamId, setAssignTeamId] = useState<number | null>(null);
  const [assignStaffRole, setAssignStaffRole] = useState<StaffRoleType>("HEAD_COACH");
  const [assignKinship, setAssignKinship] = useState<KinshipType>("FATHER");
  const [assignPlayerPosition, setAssignPlayerPosition] = useState<PlayerPosition>("MIDFIELDER");
  const [assignLinkedPlayerId, setAssignLinkedPlayerId] = useState<number | null>(null);

  const [teams, setTeams] = useState<Team[]>([]);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayer[]>([]);

  // Fetches
  const fetchTeams = useCallback(async () => {
    try {
      const res = await apiFetch(`/api/president/club/${clubId}/teams`);
      setTeams(await res.json());
    } catch {}
  }, [clubId]);

  const fetchRequests = useCallback(async (page: number) => {
    setReqLoading(true);
    try {
      const res = await apiFetch(`/api/president/requests?clubId=${clubId}&page=${page}&size=15`);
      const data = await res.json();
      const items = data.content ?? [];
      setRequests((prev) => (page === 0 ? items : [...prev, ...items]));
      setReqHasMore(!data.last);
      setReqPage(page);
    } catch { Alert.alert("Error", "No se cargaron las solicitudes."); }
    finally { setReqLoading(false); }
  }, [clubId]);

  useEffect(() => { fetchTeams(); fetchRequests(0); }, [fetchTeams, fetchRequests]);

  useEffect(() => {
    if (assignRole === "RELATIVE" && assignTeamId) {
      apiFetch(`/api/players?clubId=${clubId}&teamId=${assignTeamId}`)
        .then((res) => res.json())
        .then((data) => {
          const arr = data.content ?? data;
          setTeamPlayers(Array.isArray(arr) ? arr : []);
        }).catch(() => setTeamPlayers([]));
    } else {
      setTeamPlayers([]);
      setAssignLinkedPlayerId(null);
    }
  }, [assignTeamId, assignRole, clubId]);

  // Handlers
  const openApproveModal = (item: JoinRequest) => {
    setSelectedRequest(item);
    setReviewDecision("APPROVED");
    const preRole = ["COACH", "PLAYER", "RELATIVE"].includes(item.requestedRole) ? (item.requestedRole as AssignableRole) : "PLAYER";
    setAssignRole(preRole);
    setAssignTeamId(null);
    setAssignLinkedPlayerId(null);
    setReviewModal(true);
  };

  const handleReview = async () => {
    if (!selectedRequest) return;
    try {
      const payload: Record<string, unknown> = { decision: reviewDecision, assignedRole: assignRole };
      if (reviewDecision === "APPROVED") {
        if (assignRole === "PLAYER") {
          if (!assignTeamId) return Alert.alert("Atención", "Debes seleccionar un equipo.");
          payload.teamId = assignTeamId; payload.playerPosition = assignPlayerPosition;
        } else if (assignRole === "COACH") {
          if (!assignTeamId) return Alert.alert("Atención", "Debes seleccionar un equipo.");
          payload.teamId = assignTeamId; payload.staffRoleType = assignStaffRole;
        } else if (assignRole === "RELATIVE") {
          if (!assignLinkedPlayerId) return Alert.alert("Atención", "Debes vincular un jugador/a.");
          payload.linkedPlayerId = assignLinkedPlayerId; payload.kinshipType = assignKinship;
        }
      }
      await apiFetch(`/api/president/requests/${selectedRequest.id}?clubId=${clubId}`, {
        method: "PATCH", body: JSON.stringify(payload),
      });
      setReviewModal(false);
      setRequests((prev) => prev.filter((r) => r.id !== selectedRequest.id));
      Alert.alert("Éxito", "Solicitud procesada correctamente.");
    } catch { Alert.alert("Error", "No se pudo procesar."); }
  };

  return (
    <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
      {reqLoading && requests.length === 0 && <ActivityIndicator color={c.boton} style={{ marginTop: 20 }} />}
      {!reqLoading && requests.length === 0 && (
        <View style={[styles.emptyBox, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
          <Text style={{ color: c.subtexto, textAlign: "center" }}>{"No hay solicitudes pendientes"}</Text>
        </View>
      )}
      
      {requests.map((item) => (
        <View key={item.id} style={[styles.card, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
          <Text style={[styles.cardTitle, { color: c.texto }]}>{item.userFullName}</Text>
          <Text style={{ color: c.subtexto, fontSize: 13, marginTop: 2 }}>{item.userEmail}</Text>
          <View style={[styles.roleBadge, { backgroundColor: c.fondo, borderColor: c.bordeInput }]}>
            <Text style={{ color: c.boton, fontSize: 12, fontWeight: "700" }}>{labelForRole(item.requestedRole)}</Text>
          </View>
          {!!item.message && <Text style={{ color: c.subtexto, fontSize: 12, fontStyle: "italic", marginTop: 6 }}>{`"${item.message}"`}</Text>}
          
          <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: "#DCFCE7", borderColor: "#16A34A" }]} onPress={() => openApproveModal(item)}>
              <Text style={{ color: "#16A34A", fontWeight: "bold", fontSize: 13 }}>{"✓ Aprobar"}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.btnAction, { backgroundColor: "#FEE2E2", borderColor: "#DC2626" }]} onPress={() => { setSelectedRequest(item); setReviewDecision("REJECTED"); setReviewModal(true); }}>
              <Text style={{ color: "#DC2626", fontWeight: "bold", fontSize: 13 }}>{"✕ Rechazar"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      {reqHasMore && !reqLoading && requests.length > 0 && (
        <TouchableOpacity style={[styles.btnMain, { backgroundColor: c.input, borderWidth: 1, borderColor: c.bordeInput }]} onPress={() => fetchRequests(reqPage + 1)}>
          <Text style={{ color: c.texto, fontWeight: "bold" }}>{"Cargar más"}</Text>
        </TouchableOpacity>
      )}

      {/* MODAL REVISIÓN */}
      <Modal visible={reviewModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "flex-end" }} keyboardShouldPersistTaps="handled">
            <View style={[styles.modalBox, { backgroundColor: c.fondo }]}>
              <Text style={[styles.modalTitle, { color: c.texto }]}>{"Revisar Solicitud"}</Text>

              {selectedRequest && (
                <View style={[styles.card, { backgroundColor: c.input, borderColor: c.bordeInput, marginBottom: 20, padding: 12 }]}>
                  <Text style={{ color: c.texto, fontWeight: "bold" }}>{selectedRequest.userFullName}</Text>
                  <Text style={{ color: c.subtexto, fontSize: 13 }}>{selectedRequest.userEmail}</Text>
                </View>
              )}

              <Text style={[styles.inputLabel, { color: c.texto }]}>{"Decisión"}</Text>
              <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                <TouchableOpacity onPress={() => setReviewDecision("APPROVED")} style={[styles.btnAction, reviewDecision === "APPROVED" ? { backgroundColor: "#DCFCE7", borderColor: "#16A34A" } : { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                  <Text style={{ color: reviewDecision === "APPROVED" ? "#16A34A" : c.subtexto, fontWeight: "bold" }}>{"✓ Aprobar"}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setReviewDecision("REJECTED")} style={[styles.btnAction, reviewDecision === "REJECTED" ? { backgroundColor: "#FEE2E2", borderColor: "#DC2626" } : { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                  <Text style={{ color: reviewDecision === "REJECTED" ? "#DC2626" : c.subtexto, fontWeight: "bold" }}>{"✕ Rechazar"}</Text>
                </TouchableOpacity>
              </View>

              {reviewDecision === "APPROVED" && (
                <View>
                  <Text style={[styles.inputLabel, { color: c.texto }]}>{"1. Rol a asignar"}</Text>
                  <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 18 }}>
                    {ASSIGNABLE_ROLES.map((r) => (
                      <TouchableOpacity key={r.value} onPress={() => { setAssignRole(r.value); setAssignTeamId(null); setAssignLinkedPlayerId(null); }} style={[styles.chip, assignRole === r.value ? { backgroundColor: c.boton } : { backgroundColor: c.input, borderWidth: 1, borderColor: c.bordeInput }]}>
                        <Text style={{ color: assignRole === r.value ? "#fff" : c.subtexto, fontSize: 12, fontWeight: "600" }}>{r.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {assignRole === "PLAYER" && (
                    <View>
                      <Text style={[styles.inputLabel, { color: c.texto }]}>{"2. Equipo"}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                        {teams.map((t) => (
                          <TouchableOpacity key={t.id} onPress={() => setAssignTeamId(t.id)} style={[styles.chip, assignTeamId === t.id ? { backgroundColor: c.boton } : { backgroundColor: c.input, borderWidth: 1, borderColor: c.bordeInput }]}>
                            <Text style={{ color: assignTeamId === t.id ? "#fff" : c.subtexto, fontSize: 12 }}>{`${t.category} ${t.suffix}`}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Text style={[styles.inputLabel, { color: c.texto }]}>{"3. Posición"}</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                        {PLAYER_POSITIONS.map((pos) => (
                          <TouchableOpacity key={pos.value} onPress={() => setAssignPlayerPosition(pos.value)} style={[styles.chip, assignPlayerPosition === pos.value ? { backgroundColor: c.boton } : { backgroundColor: c.input, borderWidth: 1, borderColor: c.bordeInput }]}>
                            <Text style={{ color: assignPlayerPosition === pos.value ? "#fff" : c.subtexto, fontSize: 12 }}>{pos.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {assignRole === "COACH" && (
                    <View>
                      <Text style={[styles.inputLabel, { color: c.texto }]}>{"2. Equipo"}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                        {teams.map((t) => (
                          <TouchableOpacity key={t.id} onPress={() => setAssignTeamId(t.id)} style={[styles.chip, assignTeamId === t.id ? { backgroundColor: c.boton } : { backgroundColor: c.input, borderWidth: 1, borderColor: c.bordeInput }]}>
                            <Text style={{ color: assignTeamId === t.id ? "#fff" : c.subtexto, fontSize: 12 }}>{`${t.category} ${t.suffix}`}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Text style={[styles.inputLabel, { color: c.texto }]}>{"3. Rol técnico"}</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                        {STAFF_ROLES.map((sr) => (
                          <TouchableOpacity key={sr.value} onPress={() => setAssignStaffRole(sr.value)} style={[styles.chip, assignStaffRole === sr.value ? { backgroundColor: c.boton } : { backgroundColor: c.input, borderWidth: 1, borderColor: c.bordeInput }]}>
                            <Text style={{ color: assignStaffRole === sr.value ? "#fff" : c.subtexto, fontSize: 12 }}>{sr.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}

                  {assignRole === "RELATIVE" && (
                    <View>
                      <Text style={[styles.inputLabel, { color: c.texto }]}>{"2. Equipo del jugador/a"}</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                        {teams.map((t) => (
                          <TouchableOpacity key={t.id} onPress={() => setAssignTeamId(t.id)} style={[styles.chip, assignTeamId === t.id ? { backgroundColor: c.boton } : { backgroundColor: c.input, borderWidth: 1, borderColor: c.bordeInput }]}>
                            <Text style={{ color: assignTeamId === t.id ? "#fff" : c.subtexto, fontSize: 12 }}>{`${t.category} ${t.suffix}`}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                      <Text style={[styles.inputLabel, { color: c.texto }]}>{"3. Parentesco"}</Text>
                      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
                        {KINSHIP_TYPES.map((k) => (
                          <TouchableOpacity key={k.value} onPress={() => setAssignKinship(k.value)} style={[styles.chip, assignKinship === k.value ? { backgroundColor: c.boton } : { backgroundColor: c.input, borderWidth: 1, borderColor: c.bordeInput }]}>
                            <Text style={{ color: assignKinship === k.value ? "#fff" : c.subtexto, fontSize: 12 }}>{k.label}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                      {assignTeamId && teamPlayers.length > 0 && (
                        <View>
                          <Text style={[styles.inputLabel, { color: c.texto }]}>{"4. Vincular a jugador/a"}</Text>
                          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                            {teamPlayers.map((p) => (
                              <TouchableOpacity key={p.id} onPress={() => setAssignLinkedPlayerId(p.id)} style={[styles.chip, assignLinkedPlayerId === p.id ? { backgroundColor: c.boton } : { backgroundColor: c.input, borderWidth: 1, borderColor: c.bordeInput }]}>
                                <Text style={{ color: assignLinkedPlayerId === p.id ? "#fff" : c.subtexto, fontSize: 12 }}>{p.firstName} {p.lastName || ""}</Text>
                              </TouchableOpacity>
                            ))}
                          </ScrollView>
                        </View>
                      )}
                      {assignTeamId && teamPlayers.length === 0 && (
                        <Text style={{ color: c.subtexto, fontSize: 13, marginBottom: 16 }}>{"No hay jugadores en ese equipo aún."}</Text>
                      )}
                    </View>
                  )}
                </View>
              )}

              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                <TouchableOpacity style={[styles.btnMain, { backgroundColor: c.input, flex: 1, borderWidth: 1, borderColor: c.bordeInput }]} onPress={() => setReviewModal(false)}>
                  <Text style={{ color: c.texto, fontWeight: "bold" }}>{"Cancelar"}</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.btnMain, { backgroundColor: reviewDecision === "APPROVED" ? c.boton : "#DC2626", flex: 1 }]} onPress={handleReview}>
                  <Text style={{ color: "#fff", fontWeight: "bold" }}>{"Confirmar"}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  btnMain: { paddingVertical: 14, borderRadius: 12, alignItems: "center", marginBottom: 12, marginTop: 10 },
  btnAction: { flex: 1, paddingVertical: 10, borderRadius: 8, borderWidth: 1, alignItems: "center" },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 8 },
  inputLabel: { fontSize: 14, fontWeight: "bold", marginBottom: 8 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalBox: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 20 },
  roleBadge: { alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1, marginTop: 6 },
  emptyBox: { borderRadius: 16, borderWidth: 1, padding: 30, marginBottom: 12, alignItems: "center" },
});