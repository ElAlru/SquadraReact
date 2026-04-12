import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View, Alert, ActivityIndicator, RefreshControl
} from 'react-native'
import { useTheme } from '../../lib/useTheme'
import { useAuthStore } from '../../lib/store'
import { apiFetch } from '../../lib/api'

// --- CONSTANTES ---
const ROLES = ['PLAYER', 'COACH', 'RELATIVE', 'OTHER']
const PARENTESCOS = ['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER']
const CATEGORIAS = ['U6', 'U8', 'U10', 'U12', 'U14', 'U16', 'U19', 'SENIOR']
const GENEROS = ['MALE', 'FEMALE', 'MIXED']
const STATUS_COLOR: Record<string, string> = { PAID: '#16a34a', PENDING: '#f59e0b', OVERDUE: '#ef4444' }
const STATUS_LABEL: Record<string, string> = { PAID: '✓ Pagado', PENDING: '⏳ Pendiente', OVERDUE: '❌ Vencido' }

type Tab = 'requests' | 'board' | 'fees' | 'club'

export default function GestionPresidente() {
  const c = useTheme()
  const { t } = useTranslation()

  // --- DATOS GLOBALES (Store) ---
  const clubId = 1 // TODO: Sustituir por useAuthStore((state) => state.activeClubId)
  const activeSeasonId = 1 // TODO: Sustituir por useAuthStore((state) => state.activeSeasonId)
  const userId = useAuthStore((state: any) => state.user?.id)

  // --- ESTADOS PRINCIPALES ---
  const [tab, setTab] = useState<Tab>('requests')
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Listas de datos
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [equipos, setEquipos] = useState<any[]>([])
  const [temporadas, setTemporadas] = useState<any[]>([])
  const [cuotas, setCuotas] = useState<any[]>([])
  const [jugadoresClub, setJugadoresClub] = useState<any[]>([]) // Para buscar familiares

  // --- ESTADOS: FASE 1 (Solicitudes) ---
  const [rolesSeleccionados, setRolesSeleccionados] = useState<Record<number, string>>({})
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<Record<number, number | null>>({})
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState<Record<number, number | null>>({})
  const [parentescosSeleccionados, setParentescosSeleccionados] = useState<Record<number, string>>({})

  // --- ESTADOS: FASE 2 (Tablón) ---
  const [modalAnuncio, setModalAnuncio] = useState(false)
  const [aTitulo, setATitulo] = useState('')
  const [aContenido, setAContenido] = useState('')
  const [aPinned, setAPinned] = useState(false)

  // --- ESTADOS: FASE 2 (Club y Temporadas) ---
  const [modalEquipo, setModalEquipo] = useState(false)
  const [eCategoria, setECategoria] = useState('U14')
  const [eGenero, setEGenero] = useState('MALE')
  const [eSufijo, setESufijo] = useState('')

  const [modalTemporada, setModalTemporada] = useState(false)
  const [tNombre, setTNombre] = useState('')
  const [tInicio, setTInicio] = useState('')
  const [tFin, setTFin] = useState('')

  // --- ESTADOS: FASE 3 (Cuotas y Pagos) ---
  const [modalCuota, setModalCuota] = useState(false)
  const [cConcepto, setCConcepto] = useState('')
  const [cImporte, setCImporte] = useState('')
  const [cFecha, setCFecha] = useState('')
  const [cEquipoId, setCEquipoId] = useState<number | null>(null)

  const [modalDetalleCuota, setModalDetalleCuota] = useState(false)
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<any>(null)
  const [pagos, setPagos] = useState<any[]>([])

  // ==========================================
  // 📥 CARGA DE DATOS (SUPER FETCH)
  // ==========================================
  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const [resSol, resAnuncios, resCuotas] = await Promise.all([
        apiFetch(`/api/president/club/${clubId}/requests`).catch(() => ({ ok: false, json: () => [] })),
        apiFetch(`/api/tablon/todos?userId=${userId}`).catch(() => ({ ok: false, json: () => [] })),
        apiFetch(`/api/president/seasons/${activeSeasonId}/fees`).catch(() => ({ ok: false, json: () => [] })),
      ])

      // En Producción real, añadirías aquí las llamadas a tus endpoints GET de equipos, temporadas y jugadores:
      // const resEquipos = await apiFetch(`/api/equipos/club/${clubId}`)
      // const resTemporadas = await apiFetch(`/api/temporadas/club/${clubId}`)
      // const resJugadores = await apiFetch(`/api/jugadores/club/${clubId}`)

      if (resSol.ok) setSolicitudes(await resSol.json())
      if (resAnuncios.ok) setAnuncios(await resAnuncios.json())
      if (resCuotas.ok) setCuotas(await resCuotas.json())
      
      // MOCK TEMPORAL hasta que tengas los GETs de equipos y jugadores:
      setEquipos([{ id: 1, category: 'U14', gender: 'MALE', suffix: 'A', isActive: true }, { id: 2, category: 'SENIOR', gender: 'FEMALE', suffix: 'A', isActive: true }])
      setTemporadas([{ id: 1, name: '2025/2026', startDate: '2025-09-01', endDate: '2026-06-30', isActive: true }])
      setJugadoresClub([{ id: 1, nombre: 'Carlos García', teamId: 1, dorsal: 10 }, { id: 2, nombre: 'Laura Sánchez', teamId: 2, dorsal: 7 }])

    } catch (e) { console.error("Error fetching admin data", e) }
    finally { setLoading(false) }
  }, [clubId, activeSeasonId, userId])

  useEffect(() => { fetchData() }, [fetchData])

  // ==========================================
  // 🛠️ ACCIONES FASE 1: SOLICITUDES
  // ==========================================
  const aprobarSolicitud = async (id: number) => {
    const role = rolesSeleccionados[id] || solicitudes.find(s => s.id === id)?.requestedRole
    const teamId = equiposSeleccionados[id] || null
    const playerId = jugadoresSeleccionados[id] || null
    const kinship = parentescosSeleccionados[id] || null

    if (role === 'RELATIVE' && playerId && !kinship) return Alert.alert("Atención", "Selecciona el parentesco.")

    try {
      const res = await apiFetch(`/api/president/requests/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ role, teamId, playerId, kinship })
      })
      if (res.ok) { Alert.alert("Aprobado", "Usuario admitido."); fetchData() }
    } catch (e) { Alert.alert("Error", "No se pudo aprobar.") }
  }

  const rechazarSolicitud = async (id: number) => {
    try {
      const res = await apiFetch(`/api/president/requests/${id}/reject`, { method: 'POST' })
      if (res.ok) fetchData()
    } catch (e) { Alert.alert("Error", "No se pudo rechazar.") }
  }

  // ==========================================
  // 🛠️ ACCIONES FASE 2: TABLÓN Y CLUB
  // ==========================================
  const publishAnuncio = async () => {
    if (!aTitulo || !aContenido) return Alert.alert("Error", "Faltan datos.")
    setIsSubmitting(true)
    try {
      const res = await apiFetch(`/api/president/announcements`, {
        method: 'POST',
        body: JSON.stringify({ title: aTitulo, content: aContenido, isPinned: aPinned })
      })
      if (res.ok) { setModalAnuncio(false); setATitulo(''); setAContenido(''); fetchData() }
    } catch (e) { Alert.alert("Error", "Fallo al publicar.") }
    finally { setIsSubmitting(false) }
  }

  const deleteAnuncio = async (id: number) => {
    try {
      const res = await apiFetch(`/api/president/announcements/${id}`, { method: 'DELETE' })
      if (res.ok) fetchData()
    } catch (e) { Alert.alert("Error", "No se pudo borrar.") }
  }

  const saveEquipo = async () => {
    if (!eSufijo) return
    setIsSubmitting(true)
    try {
      const res = await apiFetch(`/api/president/club/${clubId}/teams`, {
        method: 'POST',
        body: JSON.stringify({ category: eCategoria, gender: eGenero, suffix: eSufijo })
      })
      if (res.ok) { setModalEquipo(false); setESufijo(''); fetchData() }
    } catch (e) { Alert.alert("Error", "Fallo al crear equipo.") }
    finally { setIsSubmitting(false) }
  }

  const toggleEquipo = async (id: number) => {
    setEquipos(prev => prev.map(e => e.id === id ? { ...e, isActive: !e.isActive } : e))
    await apiFetch(`/api/president/teams/${id}/toggle`, { method: 'PATCH' })
  }

  const saveTemporada = async () => {
    if (!tNombre || !tInicio || !tFin) return
    setIsSubmitting(true)
    try {
      const res = await apiFetch(`/api/president/club/${clubId}/seasons`, {
        method: 'POST',
        body: JSON.stringify({ name: tNombre, startDate: tInicio, endDate: tFin })
      })
      if (res.ok) { setModalTemporada(false); setTNombre(''); fetchData() }
    } catch (e) { Alert.alert("Error", "Fallo al crear temporada.") }
    finally { setIsSubmitting(false) }
  }

  const toggleTemporada = async (id: number) => {
    setTemporadas(prev => prev.map(t => t.id === id ? { ...t, isActive: !t.isActive } : t))
    await apiFetch(`/api/president/seasons/${id}/toggle`, { method: 'PATCH' })
  }

  // ==========================================
  // 🛠️ ACCIONES FASE 3: CUOTAS Y PAGOS
  // ==========================================
  const handleCrearCuota = async () => {
    if (!cConcepto || !cImporte || !cFecha) return Alert.alert("Error", "Rellena los campos.")
    setIsSubmitting(true)
    try {
      const res = await apiFetch(`/api/president/club/${clubId}/fees`, {
        method: 'POST',
        body: JSON.stringify({ concept: cConcepto, amount: parseFloat(cImporte), dueDate: cFecha, teamId: cEquipoId, seasonId: activeSeasonId })
      })
      if (res.ok) {
        setModalCuota(false); setCConcepto(''); setCImporte(''); setCFecha(''); setCEquipoId(null);
        Alert.alert("Éxito", "Cuota y recibos generados."); fetchData()
      }
    } catch (e) { Alert.alert("Error", "Fallo al crear cuota.") }
    finally { setIsSubmitting(false) }
  }

  const abrirDetallesCuota = async (cuota: any) => {
    setCuotaSeleccionada(cuota)
    setModalDetalleCuota(true)
    try {
      const res = await apiFetch(`/api/president/fees/${cuota.id}/payments`)
      if (res.ok) setPagos(await res.json())
    } catch (e) { console.error(e) }
  }

  const marcarPagado = async (paymentId: number) => {
    setPagos(prev => prev.map(p => p.paymentId === paymentId ? { ...p, status: 'PAID', paidDate: 'Hoy' } : p))
    try {
      await apiFetch(`/api/president/payments/${paymentId}/pay`, { method: 'PATCH' })
      fetchData() // Para actualizar barritas de cuotas
    } catch (e) { Alert.alert("Error", "Fallo al cobrar.") }
  }

  // --- HELPERS UI ---
  const getRolSeleccionado = (s: any) => rolesSeleccionados[s.id] || s.requestedRole
  const getEquipoSeleccionado = (id: number) => equiposSeleccionados[id] ?? null
  const esRelative = (s: any) => getRolSeleccionado(s) === 'RELATIVE'

  const TABS: { key: Tab; label: string }[] = [
    { key: 'requests', label: 'Solicitudes' },
    { key: 'board', label: 'Tablón' },
    { key: 'fees', label: 'Cuotas' },
    { key: 'club', label: 'Mi Club' },
  ]

  // ==========================================
  // 🖥️ RENDERIZADO
  // ==========================================
  return (
    <View style={[styles.wrapper, { backgroundColor: c.fondo }]}>
      
      {/* HEADER FIJO */}
      <View style={[styles.headerFixed, { backgroundColor: c.fondo, borderBottomColor: c.bordeInput }]}>
        <Text style={[styles.titulo, { color: c.texto }]}>
          👑 Presidencia
          {solicitudes.length > 0 && <Text style={{ color: '#f59e0b' }}> · {solicitudes.length} pendientes</Text>}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabsRow}>
            {TABS.map((item) => (
              <TouchableOpacity
                key={item.key}
                style={[styles.tabButton, tab === item.key && { borderBottomColor: c.boton, borderBottomWidth: 2 }]}
                onPress={() => setTab(item.key)}
              >
                <Text style={[styles.tabText, { color: tab === item.key ? c.boton : c.subtexto }]}>
                  {item.label} {item.key === 'requests' && solicitudes.length > 0 ? `(${solicitudes.length})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={c.boton} />}>

        {/* ── TAB: SOLICITUDES ── */}
        {tab === 'requests' && (
          <View>
            {solicitudes.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                <Text style={[styles.emptyText, { color: c.subtexto }]}>✅ No hay solicitudes pendientes</Text>
              </View>
            ) : (
              solicitudes.map((s) => {
                const rolActual = getRolSeleccionado(s)
                const equipoActualId = getEquipoSeleccionado(s.id)
                const jugadoresDisponibles = equipoActualId ? jugadoresClub.filter(j => j.teamId === equipoActualId) : []

                return (
                  <View key={s.id} style={[styles.card, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                    <View style={styles.requestHeader}>
                      <View style={[styles.avatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                        <Text style={[styles.avatarText, { color: c.boton }]}>{s.firstName.charAt(0)}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.requestNombre, { color: c.texto }]}>{s.firstName} {s.lastName}</Text>
                        <Text style={[styles.requestRolReq, { color: c.subtexto }]}>Quiere unirse como: {s.requestedRole}</Text>
                      </View>
                    </View>

                    {s.message && (
                      <View style={[styles.mensajeBox, { backgroundColor: c.fondo, borderColor: c.bordeInput }]}>
                        <Text style={[styles.mensajeText, { color: c.subtexto }]}>"{s.message}"</Text>
                      </View>
                    )}

                    <Text style={[styles.selectLabel, { color: c.subtexto }]}>Rol final a asignar</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      <View style={styles.chipsRow}>
                        {ROLES.map((rol) => (
                          <TouchableOpacity key={rol} style={[styles.chip, { backgroundColor: rolActual === rol ? `${c.boton}18` : c.fondo, borderColor: rolActual === rol ? c.boton : c.bordeInput }]} onPress={() => setRolesSeleccionados(prev => ({ ...prev, [s.id]: rol }))}>
                            <Text style={[styles.chipText, { color: rolActual === rol ? c.boton : c.subtexto }]}>{rol}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    <Text style={[styles.selectLabel, { color: c.subtexto }]}>Asignar a equipo (Opcional)</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      <View style={styles.chipsRow}>
                        {equipos.map((eq) => (
                          <TouchableOpacity key={eq.id} style={[styles.chip, { backgroundColor: equipoActualId === eq.id ? `${c.boton}18` : c.fondo, borderColor: equipoActualId === eq.id ? c.boton : c.bordeInput }]} onPress={() => { setEquiposSeleccionados(prev => ({ ...prev, [s.id]: eq.id })); setJugadoresSeleccionados(prev => ({ ...prev, [s.id]: null })) }}>
                            <Text style={[styles.chipText, { color: equipoActualId === eq.id ? c.boton : c.subtexto }]}>{eq.category} {eq.suffix}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {esRelative(s) && equipoActualId && (
                      <>
                        <Text style={[styles.selectLabel, { color: c.subtexto }]}>Familiar del jugador:</Text>
                        <View style={[styles.listWrapper, { borderColor: c.bordeInput }]}>
                          {jugadoresDisponibles.map((jug) => {
                            const sel = jugadoresSeleccionados[s.id] === jug.id
                            return (
                              <TouchableOpacity key={jug.id} style={[styles.row, { borderBottomColor: c.bordeInput }, sel && { backgroundColor: `${c.boton}08` }]} onPress={() => setJugadoresSeleccionados(prev => ({ ...prev, [s.id]: jug.id }))}>
                                <Text style={{ flex: 1, color: c.texto }}>{jug.nombre} #{jug.dorsal}</Text>
                                {sel && <Text style={{ color: c.boton, fontSize: 16 }}>✓</Text>}
                              </TouchableOpacity>
                            )
                          })}
                        </View>

                        {jugadoresSeleccionados[s.id] && (
                          <>
                            <Text style={[styles.selectLabel, { color: c.subtexto, marginTop: 10 }]}>Parentesco</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                              <View style={styles.chipsRow}>
                                {PARENTESCOS.map((par) => (
                                  <TouchableOpacity key={par} style={[styles.chip, { backgroundColor: parentescosSeleccionados[s.id] === par ? `${c.boton}18` : c.fondo, borderColor: parentescosSeleccionados[s.id] === par ? c.boton : c.bordeInput }]} onPress={() => setParentescosSeleccionados(prev => ({ ...prev, [s.id]: par }))}>
                                    <Text style={[styles.chipText, { color: parentescosSeleccionados[s.id] === par ? c.boton : c.subtexto }]}>{par}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </ScrollView>
                          </>
                        )}
                      </>
                    )}

                    <View style={styles.actionsRow}>
                      <TouchableOpacity style={[styles.aprobarBtn, { backgroundColor: c.boton }]} onPress={() => aprobarSolicitud(s.id)}>
                        <Text style={styles.actionBtnText}>✓ Aprobar</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.rechazarBtn, { borderColor: '#ef444440', backgroundColor: '#ef444410' }]} onPress={() => rechazarSolicitud(s.id)}>
                        <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>✗ Rechazar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })
            )}
          </View>
        )}

        {/* ── TAB: TABLÓN ── */}
        {tab === 'board' && (
          <View>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.boton }]} onPress={() => setModalAnuncio(true)}>
              <Text style={[styles.primaryButtonText, { color: c.botonTexto }]}>+ Crear Anuncio Oficial</Text>
            </TouchableOpacity>
            <View style={styles.list}>
              {anuncios.map((a) => (
                <View key={a.id} style={[styles.card, { backgroundColor: c.input, borderColor: a.isPinned ? `${c.boton}60` : c.bordeInput, borderWidth: a.isPinned ? 1.5 : 1 }]}>
                  <View style={styles.cardHeader}>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {a.isPinned && <View style={[styles.badge, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}><Text style={[styles.badgeText, { color: c.boton }]}>📌 Fijado</Text></View>}
                      <View style={[styles.badge, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b35' }]}><Text style={[styles.badgeText, { color: '#f59e0b' }]}>🏆 Club</Text></View>
                    </View>
                    <TouchableOpacity style={[styles.iconBtn, { borderColor: '#ef444435', backgroundColor: '#ef444410' }]} onPress={() => deleteAnuncio(a.id)}>
                      <Text style={{fontSize: 12}}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.cardTitulo, { color: c.texto }]}>{a.titulo}</Text>
                  <Text style={[styles.cardContenido, { color: c.subtexto }]} numberOfLines={2}>{a.contenido}</Text>
                  <Text style={{ fontSize: 11, color: c.subtexto, marginTop: 6 }}>✍️ Presidencia · {a.fecha || 'Hoy'}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── TAB: CUOTAS ── */}
        {tab === 'fees' && (
          <View>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.boton }]} onPress={() => setModalCuota(true)}>
              <Text style={[styles.primaryButtonText, { color: c.botonTexto }]}>+ Generar Nueva Cuota</Text>
            </TouchableOpacity>
            <View style={styles.list}>
              {cuotas.map((cuota) => (
                <View key={cuota.id} style={[styles.card, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                  <View style={styles.cardHeader}>
                    <Text style={[styles.cardTitulo, { color: c.texto }]}>{cuota.concept}</Text>
                    <Text style={{ fontSize: 18, fontWeight: 'bold', color: c.boton }}>{cuota.amount}€</Text>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <Text style={{ fontSize: 12, color: c.subtexto }}>Vence: {cuota.dueDate}</Text>
                    <View style={[styles.badge, { backgroundColor: cuota.teamId ? '#3b82f618' : '#f59e0b18', borderColor: cuota.teamId ? '#3b82f635' : '#f59e0b35' }]}>
                      <Text style={[styles.badgeText, { color: cuota.teamId ? '#3b82f6' : '#f59e0b' }]}>{cuota.teamId ? `👕 ${cuota.teamName}` : '🏆 Todo el club'}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                    <View style={[styles.statPill, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}><Text style={{ color: c.boton, fontSize: 11, fontWeight: 'bold' }}>✅ {cuota.paidCount} Pagados</Text></View>
                    <View style={[styles.statPill, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b35' }]}><Text style={{ color: '#f59e0b', fontSize: 11, fontWeight: 'bold' }}>⏳ {cuota.pendingCount} Ptes.</Text></View>
                    <View style={[styles.statPill, { backgroundColor: '#ef444418', borderColor: '#ef444435' }]}><Text style={{ color: '#ef4444', fontSize: 11, fontWeight: 'bold' }}>❌ {cuota.overdueCount} Vencidos</Text></View>
                  </View>
                  <TouchableOpacity style={[styles.outlineBtn, { borderColor: c.bordeInput }]} onPress={() => abrirDetallesCuota(cuota)}>
                    <Text style={{ fontSize: 12, fontWeight: '500', color: c.subtexto }}>Ver Recibos →</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── TAB: CLUB ── */}
        {tab === 'club' && (
          <View>
            <Text style={[styles.subSectionTitle, { color: c.texto }]}>🏆 Datos del Club</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} value="FC Squadra" editable={false} />

            <View style={styles.subSectionHeader}>
              <Text style={[styles.subSectionTitle, { color: c.texto, marginBottom: 0 }]}>👕 Equipos</Text>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]} onPress={() => setModalEquipo(true)}>
                <Text style={{ color: c.boton, fontSize: 12, fontWeight: 'bold' }}>+ Nuevo</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.list, { marginBottom: 24 }]}>
              {equipos.map((eq) => (
                <View key={eq.id} style={[styles.listCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: c.texto }}>{eq.category} {eq.gender} {eq.suffix}</Text>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: eq.isActive ? '#ef444410' : `${c.boton}10`, borderColor: eq.isActive ? '#ef444435' : `${c.boton}35` }]} onPress={() => toggleEquipo(eq.id)}>
                    <Text style={{ color: eq.isActive ? '#ef4444' : c.boton, fontSize: 12, fontWeight: 'bold' }}>{eq.isActive ? 'Desactivar' : 'Activar'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            <View style={styles.subSectionHeader}>
              <Text style={[styles.subSectionTitle, { color: c.texto, marginBottom: 0 }]}>🗓 Temporadas</Text>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]} onPress={() => setModalTemporada(true)}>
                <Text style={{ color: c.boton, fontSize: 12, fontWeight: 'bold' }}>+ Nueva</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.list}>
              {temporadas.map((temp) => (
                <View key={temp.id} style={[styles.listCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                  <Text style={{ fontSize: 14, fontWeight: 'bold', color: c.texto }}>{temp.name}</Text>
                  <TouchableOpacity style={[styles.smallBtn, { backgroundColor: temp.isActive ? '#ef444410' : `${c.boton}10`, borderColor: temp.isActive ? '#ef444435' : `${c.boton}35` }]} onPress={() => toggleTemporada(temp.id)}>
                    <Text style={{ color: temp.isActive ? '#ef4444' : c.boton, fontSize: 12, fontWeight: 'bold' }}>{temp.isActive ? 'Desactivar' : 'Activar'}</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* ========================================== */}
      {/* 🧩 MODALES */}
      {/* ========================================== */}

      {/* MODAL: ANUNCIO */}
      <Modal visible={modalAnuncio} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setModalAnuncio(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitulo, { color: c.texto }]}>📢 Nuevo Anuncio</Text><TouchableOpacity onPress={() => setModalAnuncio(false)}><Text style={{ color: c.subtexto, fontSize: 20 }}>✕</Text></TouchableOpacity></View>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Título *" placeholderTextColor={c.subtexto} value={aTitulo} onChangeText={setATitulo} />
            <TextInput style={[styles.textArea, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Contenido *" placeholderTextColor={c.subtexto} value={aContenido} onChangeText={setAContenido} multiline textAlignVertical="top" />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <Text style={{ color: c.subtexto, fontWeight: 'bold' }}>📌 Fijar en el tablón</Text>
              <Switch value={aPinned} onValueChange={setAPinned} trackColor={{ true: c.boton }} />
            </View>
            <TouchableOpacity disabled={isSubmitting} style={[styles.primaryButton, { backgroundColor: c.boton, opacity: aTitulo && aContenido ? 1 : 0.5 }]} onPress={publishAnuncio}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Publicar Anuncio</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL: EQUIPO */}
      <Modal visible={modalEquipo} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setModalEquipo(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitulo, { color: c.texto }]}>👕 Nuevo Equipo</Text><TouchableOpacity onPress={() => setModalEquipo(false)}><Text style={{ color: c.subtexto, fontSize: 20 }}>✕</Text></TouchableOpacity></View>
            <Text style={[styles.selectLabel, { color: c.subtexto }]}>Categoría</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 15 }}>
              {CATEGORIAS.map(cat => <TouchableOpacity key={cat} style={[styles.chip, { backgroundColor: eCategoria === cat ? `${c.boton}18` : c.input, borderColor: eCategoria === cat ? c.boton : c.bordeInput }]} onPress={() => setECategoria(cat)}><Text style={{ color: eCategoria === cat ? c.boton : c.subtexto, fontSize: 12 }}>{cat}</Text></TouchableOpacity>)}
            </View>
            <Text style={[styles.selectLabel, { color: c.subtexto }]}>Género</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 15 }}>
              {GENEROS.map(gen => <TouchableOpacity key={gen} style={[styles.chip, { backgroundColor: eGenero === gen ? `${c.boton}18` : c.input, borderColor: eGenero === gen ? c.boton : c.bordeInput }]} onPress={() => setEGenero(gen)}><Text style={{ color: eGenero === gen ? c.boton : c.subtexto, fontSize: 12 }}>{gen}</Text></TouchableOpacity>)}
            </View>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Sufijo (Ej: A, B, Femenino) *" placeholderTextColor={c.subtexto} value={eSufijo} onChangeText={setESufijo} />
            <TouchableOpacity disabled={isSubmitting} style={[styles.primaryButton, { backgroundColor: c.boton, opacity: eSufijo ? 1 : 0.5, marginTop: 10 }]} onPress={saveEquipo}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Crear Equipo</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL: TEMPORADA */}
      <Modal visible={modalTemporada} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setModalTemporada(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitulo, { color: c.texto }]}>🗓 Nueva Temporada</Text><TouchableOpacity onPress={() => setModalTemporada(false)}><Text style={{ color: c.subtexto, fontSize: 20 }}>✕</Text></TouchableOpacity></View>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Nombre (Ej: 2026/2027) *" placeholderTextColor={c.subtexto} value={tNombre} onChangeText={setTNombre} />
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Inicio (YYYY-MM-DD) *" placeholderTextColor={c.subtexto} value={tInicio} onChangeText={setTInicio} />
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Fin (YYYY-MM-DD) *" placeholderTextColor={c.subtexto} value={tFin} onChangeText={setTFin} />
            <TouchableOpacity disabled={isSubmitting} style={[styles.primaryButton, { backgroundColor: c.boton, opacity: tNombre && tInicio && tFin ? 1 : 0.5, marginTop: 10 }]} onPress={saveTemporada}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Crear Temporada</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL: CREAR CUOTA */}
      <Modal visible={modalCuota} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setModalCuota(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]}>
            <View style={styles.modalHeader}><Text style={[styles.modalTitulo, { color: c.texto }]}>💶 Generar Recibos</Text><TouchableOpacity onPress={() => setModalCuota(false)}><Text style={{ color: c.subtexto, fontSize: 20 }}>✕</Text></TouchableOpacity></View>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Concepto (Ej: Matrícula) *" placeholderTextColor={c.subtexto} value={cConcepto} onChangeText={setCConcepto} />
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Importe (€) *" keyboardType="numeric" placeholderTextColor={c.subtexto} value={cImporte} onChangeText={setCImporte} />
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Fecha de Vencimiento (YYYY-MM-DD) *" placeholderTextColor={c.subtexto} value={cFecha} onChangeText={setCFecha} />
            
            <Text style={[styles.selectLabel, { color: c.subtexto }]}>Aplicar a:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }}>
              <View style={styles.chipsRow}>
                <TouchableOpacity style={[styles.chip, { backgroundColor: cEquipoId === null ? `${c.boton}18` : c.fondo, borderColor: cEquipoId === null ? c.boton : c.bordeInput }]} onPress={() => setCEquipoId(null)}>
                  <Text style={{ color: cEquipoId === null ? c.boton : c.subtexto, fontSize: 12, fontWeight: 'bold' }}>🏆 Todo el Club</Text>
                </TouchableOpacity>
                {equipos.map((eq) => (
                  <TouchableOpacity key={eq.id} style={[styles.chip, { backgroundColor: cEquipoId === eq.id ? `${c.boton}18` : c.fondo, borderColor: cEquipoId === eq.id ? c.boton : c.bordeInput }]} onPress={() => setCEquipoId(eq.id)}>
                    <Text style={{ color: cEquipoId === eq.id ? c.boton : c.subtexto, fontSize: 12, fontWeight: 'bold' }}>👕 {eq.category} {eq.suffix}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TouchableOpacity disabled={isSubmitting} style={[styles.primaryButton, { backgroundColor: c.boton, opacity: cConcepto && cImporte && cFecha ? 1 : 0.5 }]} onPress={handleCrearCuota}>
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Generar y Enviar Cuota</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* MODAL: DETALLES CUOTA Y PAGOS */}
      <Modal visible={modalDetalleCuota} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setModalDetalleCuota(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput, maxHeight: '80%' }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>💶 {cuotaSeleccionada?.concept}</Text>
              <TouchableOpacity onPress={() => setModalDetalleCuota(false)}><Text style={{ color: c.subtexto, fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {pagos.map((pago) => (
                <View key={pago.paymentId} style={[styles.row, { borderBottomColor: c.bordeInput }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.texto, fontWeight: 'bold' }}>{pago.firstName} {pago.lastName}</Text>
                    {pago.paidDate && <Text style={{ color: c.subtexto, fontSize: 11 }}>Pagado el {pago.paidDate}</Text>}
                  </View>
                  {pago.status !== 'PAID' ? (
                    <TouchableOpacity style={[styles.smallBtn, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]} onPress={() => marcarPagado(pago.paymentId)}>
                      <Text style={{ color: c.boton, fontSize: 12, fontWeight: 'bold' }}>Marcar Pagado</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={[styles.badge, { backgroundColor: `${STATUS_COLOR[pago.status]}18`, borderColor: `${STATUS_COLOR[pago.status]}35` }]}>
                      <Text style={{ color: STATUS_COLOR[pago.status], fontSize: 11, fontWeight: 'bold' }}>{STATUS_LABEL[pago.status]}</Text>
                    </View>
                  )}
                </View>
              ))}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  )
}

// ==========================================
// 🎨 ESTILOS UNIFICADOS
// ==========================================
const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  headerFixed: { paddingTop: 60, paddingHorizontal: 24, borderBottomWidth: 1 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  tabsRow: { flexDirection: 'row', gap: 10 },
  tabButton: { paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '600' },
  container: { padding: 24, paddingBottom: 40 },
  
  primaryButton: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { fontWeight: 'bold', fontSize: 15 },
  outlineBtn: { borderWidth: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  smallBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6 },
  
  list: { gap: 12 },
  card: { borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 12 },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  cardTitulo: { fontSize: 15, fontWeight: '700' },
  cardContenido: { fontSize: 13, lineHeight: 18 },
  listCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 14 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14, fontWeight: '500' },

  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 10 },
  requestNombre: { fontSize: 15, fontWeight: '700' },
  requestRolReq: { fontSize: 12 },
  mensajeBox: { borderRadius: 8, padding: 10, borderLeftWidth: 3, marginBottom: 10 },
  mensajeText: { fontSize: 12, fontStyle: 'italic' },
  
  avatar: { width: 42, height: 42, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: 'bold' },
  
  selectLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 8, letterSpacing: 0.5 },
  chipsRow: { flexDirection: 'row', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  chipText: { fontSize: 12, fontWeight: '600' },
  
  listWrapper: { borderWidth: 1, borderRadius: 12, marginBottom: 15, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1 },
  
  actionsRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  aprobarBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center' },
  rechazarBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  actionBtnText: { fontSize: 14, fontWeight: '700', color: '#ffffff' },

  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  statPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  iconBtn: { width: 30, height: 30, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },

  subSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  subSectionTitle: { fontSize: 16, fontWeight: '800', marginBottom: 10 },
  
  input: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 14 },
  textArea: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 14, fontSize: 14, minHeight: 100 },

  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 24, borderWidth: 1, padding: 24, width: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo: { fontSize: 18, fontWeight: '800' },
})