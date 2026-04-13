import { useState, useEffect, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator, Alert, Modal, Pressable, RefreshControl,
  ScrollView, StyleSheet, Switch, Text, TextInput,
  TouchableOpacity, View
} from 'react-native'
import { useTheme } from '../../lib/useTheme'
import { useAuthStore } from '../../lib/store'
import { apiFetch } from '../../lib/api'

// --- CONSTANTES ---
const ROLES = ['PLAYER', 'COACH', 'RELATIVE', 'OTHER']
const PARENTESCOS = ['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER']
const CATEGORIAS = ['U6', 'U8', 'U10', 'U12', 'U14', 'U16', 'U19', 'SENIOR']
const GENEROS = ['MALE', 'FEMALE', 'MIXED']

const STATUS_COLOR: Record<string, string> = {
  PAID: '#16a34a', PENDING: '#f59e0b', OVERDUE: '#ef4444',
}
const STATUS_LABEL: Record<string, string> = {
  PAID: '✓ Pagado', PENDING: '⏳ Pendiente', OVERDUE: '❌ Vencido',
}

type Tab = 'requests' | 'board' | 'fees' | 'club'

export default function GestionPresidente() {
  const c = useTheme()
  const { t } = useTranslation()

  // --- STORE ---
  const clubId = useAuthStore((state: any) => state.activeClubId)
  const activeClubName = useAuthStore((state: any) => state.activeClubName)
  const userId = useAuthStore((state: any) => state.user?.id)

  // --- ESTADOS GENERALES ---
  const [tab, setTab] = useState<Tab>('requests')
  const [loading, setLoading] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // --- DATOS ---
  const [solicitudes, setSolicitudes] = useState<any[]>([])
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [equipos, setEquipos] = useState<any[]>([])
  const [temporadas, setTemporadas] = useState<any[]>([])
  const [cuotas, setCuotas] = useState<any[]>([])

  // --- TEMPORADA ACTIVA ---
  const activeSeason = useMemo(() => temporadas.find((s: any) => s.isActive), [temporadas])

  // --- ESTADOS SOLICITUDES ---
  const [rolesSeleccionados, setRolesSeleccionados] = useState<Record<number, string>>({})
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<Record<number, number | null>>({})
  const [jugadoresDisponibles, setJugadoresDisponibles] = useState<Record<number, any[]>>({})
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState<Record<number, number | null>>({})
  const [parentescosSeleccionados, setParentescosSeleccionados] = useState<Record<number, string>>({})

  // --- ESTADOS MODALES ---
  const [modalAnuncio, setModalAnuncio] = useState(false)
  const [modalEquipo, setModalEquipo] = useState(false)
  const [modalTemporada, setModalTemporada] = useState(false)
  const [modalCuota, setModalCuota] = useState(false)
  const [modalDetalleCuota, setModalDetalleCuota] = useState(false)
  const [cuotaSeleccionada, setCuotaSeleccionada] = useState<any>(null)
  const [pagosDetalle, setPagosDetalle] = useState<any[]>([])

  // --- FORMS ---
  const [aTitulo, setATitulo] = useState('')
  const [aContenido, setAContenido] = useState('')
  const [aTargetTeamId, setATargetTeamId] = useState<number | null>(null)
  const [aPinned, setAPinned] = useState(false)

  const [eCategoria, setECategoria] = useState('U14')
  const [eGenero, setEGenero] = useState('MALE')
  const [eSufijo, setESufijo] = useState('')

  const [tNombre, setTNombre] = useState('')
  const [tInicio, setTInicio] = useState('2025-09-01')
  const [tFin, setTFin] = useState('2026-06-30')

  const [cConcepto, setCConcepto] = useState('')
  const [cImporte, setCImporte] = useState('')
  const [cFecha, setCFecha] = useState('')
  const [cTargetTeamId, setCTargetTeamId] = useState<number | null>(null)

  // ==========================================
  // 📥 CARGA DE DATOS
  // ==========================================
  const fetchData = useCallback(async () => {
    if (!clubId) return
    setLoading(true)
    try {

        const [resSol, resAnuncios, resEquipos, resTemporadas] = await Promise.all([
        apiFetch(`/api/president/club/${clubId}/requests`),
        apiFetch(`/api/president/club/${clubId}/announcements`), // ✅ LA LÍNEA DEL PRESI
        apiFetch(`/api/president/club/${clubId}/teams`),
        apiFetch(`/api/president/club/${clubId}/seasons`),
      ])

      if (resSol.ok) setSolicitudes(await resSol.json())
      if (resAnuncios.ok) setAnuncios(await resAnuncios.json())
      if (resEquipos.ok) setEquipos(await resEquipos.json())
      if (resTemporadas.ok) {
        const temps = await resTemporadas.json()
        setTemporadas(temps)
        const active = temps.find((t: any) => t.isActive)
        if (active) {
          const resFees = await apiFetch(`/api/president/seasons/${active.id}/fees`)
          if (resFees.ok) setCuotas(await resFees.json())
        }
      }
    } catch (e) {
      console.error('Error cargando datos de presidencia', e)
    } finally {
      setLoading(false)
    }
  }, [clubId, userId])

  // EL FIX MÁGICO DE LA SINCRONIZACIÓN 🪄
  useEffect(() => { 
    if (clubId) {
      fetchData() 
    }
  }, [fetchData, clubId])

  // ==========================================
  // 👥 SOLICITUDES
  // ==========================================
  const cargarJugadoresEquipo = async (solicitudId: number, equipoId: number) => {
    try {
      const res = await apiFetch(`/api/president/club/${clubId}/teams/${equipoId}/players`)
      if (res.ok) {
        const jugadores = await res.json()
        setJugadoresDisponibles(prev => ({ ...prev, [solicitudId]: jugadores }))
      }
    } catch (e) {
      console.error('Error cargando jugadores', e)
    }
  }

  const handleSeleccionarEquipoSolicitud = (solicitudId: number, equipoId: number) => {
    setEquiposSeleccionados(prev => ({ ...prev, [solicitudId]: equipoId }))
    setJugadoresSeleccionados(prev => ({ ...prev, [solicitudId]: null }))
    const rolActual = rolesSeleccionados[solicitudId] || solicitudes.find((s: any) => s.id === solicitudId)?.requestedRole
    if (rolActual === 'RELATIVE') {
      cargarJugadoresEquipo(solicitudId, equipoId)
    }
  }

  const handleAprobar = async (requestId: number) => {
    // 1. CHIVATOS DE DEPURACIÓN (Para ver en la consola al instante)
    console.log("🔥 BOTON 'APROBAR' PULSADO PARA SOLICITUD ID:", requestId);
    
    // 2. RECOPILAR DATOS DEL ESTADO
    const teamId = equiposSeleccionados[requestId];
    const role = rolesSeleccionados[requestId] || solicitudes.find((s: any) => s.id === requestId)?.requestedRole;
    const playerId = jugadoresSeleccionados[requestId];
    const kinship = parentescosSeleccionados[requestId];

    console.log("📌 Equipo seleccionado:", teamId);
    console.log("📌 Rol a asignar:", role);

    // 3. VALIDACIÓN DE SEGURIDAD
    if (!teamId) {
      console.warn("⚠️ ERROR: La ejecución se ha frenado porque no hay 'teamId'.");
      Alert.alert("Atención", "Debes seleccionar un equipo (que se ponga en verde) antes de aprobar.");
      return; // 👈 Esto es lo que frenaba el cohete
    }

    // 4. BLOQUEAR EL BOTÓN (Para no enviar la petición 5 veces)
    setIsSubmitting(true);

    try {
      // 5. PREPARAR EL PAQUETE PARA JAVA (Basado en ApproveRequestDto)
      const payload = {
        role: role,
        teamId: teamId,
        playerId: role === 'RELATIVE' ? playerId : null,
        kinship: role === 'RELATIVE' ? kinship : null
      };

      console.log("📤 [Aprobación] Enviando JSON al servidor:", payload);

      // 6. LANZAR EL COHETE
      const res = await apiFetch(`/api/president/club/${clubId}/requests/${requestId}/approve`, {
        method: "PUT",
        body: JSON.stringify(payload)
      });

      console.log(`📥 [Aprobación] Status recibido: ${res.status}`);

      // 7. RESULTADO
      if (res.ok) {
        Alert.alert("✅ Fichado", "La solicitud ha sido aprobada correctamente.");
        fetchData(); // Recarga la lista para limpiar la pantalla
      } else {
        const errText = await res.text();
        console.error("❌ Error devuelto por Java:", errText);
        Alert.alert("Error del servidor", errText || "No se pudo procesar la aprobación.");
      }
    } catch (e) {
      console.error("💥 Error crítico de red o código:", e);
      Alert.alert("Error", "Fallo de conexión. Revisa tu internet o la consola.");
    } finally {
      // 8. LIBERAR EL BOTÓN (Pase lo que pase, error o éxito)
      setIsSubmitting(false);
    }
  };

  const handleRechazar = async (solicitudId: number) => {
    setIsSubmitting(true)
    try {
      const res = await apiFetch(`/api/president/club/${clubId}/requests/${solicitudId}/reject`, {
        method: 'PUT',
      })
      if (res.ok) {
        setSolicitudes(prev => prev.filter((s: any) => s.id !== solicitudId))
      } else {
        Alert.alert('Error', 'No se pudo rechazar la solicitud.')
      }
    } catch (e) {
      Alert.alert('Error', 'Fallo al rechazar.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==========================================
  // 📢 ANUNCIOS
  // ==========================================
  const publishAnuncio = async () => {
    if (!aTitulo || !aContenido) return

    // Preparamos el body (suponiendo que CreateAnnouncementDto espera title y content)
    const payload = {
      title: aTitulo,
      content: aContenido,
      teamId: aTargetTeamId,
      clubId: clubId,
      isPinned: aPinned,
    };
    
    console.log("📤 [Anuncios] Enviando payload:", payload);

    setIsSubmitting(true)
    try {
      // 🪄 EL ARREGLO ESTÁ AQUÍ: Añadimos ?userId=${userId}
      const res = await apiFetch(`/api/president/announcements?userId=${userId}`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      console.log("📥 [Anuncios] Respuesta servidor:", res.status);

      if (res.ok) {
        setModalAnuncio(false)
        setATitulo(''); setAContenido(''); setAPinned(false); setATargetTeamId(null)
        fetchData()
        Alert.alert('✅ Éxito', 'Anuncio publicado en el tablón')
      } else {
        const errorText = await res.text();
        console.error("❌ [Anuncios] Error del backend:", errorText);
        Alert.alert('Error', `No se pudo publicar. Status: ${res.status}`);
      }
    } catch (e) {
      console.error("💥 [Anuncios] Error en fetch:", e);
      Alert.alert('Error', 'Fallo de conexión al publicar anuncio.');
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEliminarAnuncio = async (id: number) => {
    try {
      await apiFetch(`/api/president/announcements/${id}`, { method: 'DELETE' })
      setAnuncios(prev => prev.filter((a: any) => a.id !== id))
    } catch (e) {
      Alert.alert('Error', 'No se pudo eliminar el anuncio.')
    }
  }

  // ==========================================
  // 💶 CUOTAS
  // ==========================================
  const handleCrearCuota = async () => {
    if (!activeSeason) return Alert.alert('Error', 'No hay temporada activa.')
    if (!cConcepto || !cImporte || !cFecha) return

    // 🪄 TRUCO: Convertir "15/04/2028" a "2028-04-15"
    let fechaFormateada = cFecha;
    if (cFecha.includes('/')) {
      const [dia, mes, anio] = cFecha.split('/');
      fechaFormateada = `${anio}-${mes}-${dia}`;
    }

    const payload = {
      concept: cConcepto,
      amount: parseFloat(cImporte),
      dueDate: fechaFormateada, // Mandamos la fecha traducida
      teamId: cTargetTeamId,
      seasonId: activeSeason.id,
    };
    
    console.log("📤 1. Enviando cuota al backend:", payload);

    setIsSubmitting(true)
    try {
      const res = await apiFetch(`/api/president/club/${clubId}/fees`, {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      console.log("📥 2. Estado de la respuesta:", res.status);

      if (res.ok) {
        setModalCuota(false)
        setCConcepto(''); setCImporte(''); setCFecha(''); setCTargetTeamId(null)
        fetchData()
        Alert.alert('✅ Éxito', 'Cuota creada correctamente')
      } else {
        const errorText = await res.text();
        console.error("❌ 3. Error del backend:", errorText);
        Alert.alert('Error del Servidor', `No se pudo crear. Status: ${res.status}`);
      }
    } catch (e) {
      console.error("💥 Error en el fetch:", e);
      Alert.alert('Error', 'Fallo al conectar con el servidor.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const abrirDetalleCuota = async (cuota: any) => {
    setCuotaSeleccionada(cuota)
    setModalDetalleCuota(true)
    try {
      const res = await apiFetch(`/api/president/fees/${cuota.id}/payments`)
      if (res.ok) setPagosDetalle(await res.json())
    } catch (e) {
      console.error('Error cargando pagos', e)
    }
  }

  const marcarPagado = async (pagoId: number) => {
    try {
      const res = await apiFetch(`/api/president/payments/${pagoId}/pay`, { method: 'PUT' })
      if (res.ok) {
        setPagosDetalle(prev => prev.map((p: any) =>
          p.id === pagoId ? { ...p, status: 'PAID', paidDate: new Date().toLocaleDateString('es') } : p
        ))
      }
    } catch (e) {
      Alert.alert('Error', 'No se pudo marcar como pagado.')
    }
  }

  // ==========================================
  // 🗓️ TEMPORADAS
  // ==========================================
  const handleToggleSeason = async (id: number) => {
    // Solo se puede activar, no desactivar manualmente
    const temporada = temporadas.find((t: any) => t.id === id)
    if (temporada?.isActive) return Alert.alert('Atención', 'No puedes desactivar una temporada directamente. Activa otra para desactivar esta.')

    setTemporadas(prev => prev.map((t: any) => ({
      ...t,
      isActive: t.id === id,
    })))
    try {
      await apiFetch(`/api/president/seasons/${id}/toggle`, { method: 'PATCH' })
      fetchData()
    } catch (e) {
      Alert.alert('Error', 'No se pudo cambiar el estado de la temporada.')
      fetchData()
    }
  }

  const saveTemporada = async () => {
    if (!tNombre || !tInicio || !tFin) return
    setIsSubmitting(true)
    try {
      const res = await apiFetch(`/api/president/club/${clubId}/seasons`, {
        method: 'POST',
        body: JSON.stringify({ name: tNombre, startDate: tInicio, endDate: tFin }),
      })
      if (res.ok) {
        setModalTemporada(false)
        setTNombre(''); setTInicio(''); setTFin('')
        fetchData()
      }
    } catch (e) {
      Alert.alert('Error', 'Fallo al crear temporada.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ==========================================
  // 👕 EQUIPOS
  // ==========================================
  const saveEquipo = async () => {
    if (!activeSeason) return Alert.alert('Atención', 'Debes tener una temporada activa para crear equipos.')
    if (!eSufijo) return
    setIsSubmitting(true)
    try {
      const res = await apiFetch(`/api/president/club/${clubId}/teams`, {
        method: 'POST',
        body: JSON.stringify({
          category: eCategoria,
          gender: eGenero,
          suffix: eSufijo,
          seasonId: activeSeason.id,
        }),
      })
      if (res.ok) {
        setModalEquipo(false)
        setESufijo('')
        fetchData()
      }
    } catch (e) {
      Alert.alert('Error', 'Fallo al crear equipo.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const equiposTemporadaActiva = useMemo(
    () => equipos.filter((e: any) => e.seasonId === activeSeason?.id),
    [equipos, activeSeason]
  )

  // ==========================================
  // 🎨 RENDER
  // ==========================================
  return (
    <View style={[styles.wrapper, { backgroundColor: c.fondo }]}>

      {/* HEADER FIJO CON TABS */}
      <View style={[styles.headerFixed, { backgroundColor: c.fondo, borderBottomColor: c.bordeInput }]}>
        <Text style={[styles.titulo, { color: c.texto }]}>
          👑 Presidencia
          {solicitudes.length > 0 && (
            <Text style={{ color: '#f59e0b' }}> · {solicitudes.length} pendientes</Text>
          )}
        </Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabsRow}>
            {([
              { key: 'requests', label: `Solicitudes${solicitudes.length > 0 ? ` (${solicitudes.length})` : ''}` },
              { key: 'board', label: 'Tablón' },
              { key: 'fees', label: 'Cuotas' },
              { key: 'club', label: 'Mi Club' },
            ] as { key: Tab; label: string }[]).map(item => (
              <TouchableOpacity
                key={item.key}
                style={[styles.tabButton, tab === item.key && { borderBottomColor: c.boton, borderBottomWidth: 2 }]}
                onPress={() => setTab(item.key)}
              >
                <Text style={[styles.tabText, { color: tab === item.key ? c.boton : c.subtexto }]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchData} tintColor={c.boton} />}
      >

        {/* ==================== TAB SOLICITUDES ==================== */}
        {tab === 'requests' && (
          <View>
            {solicitudes.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                <Text style={[styles.emptyText, { color: c.subtexto }]}>✅ No hay solicitudes pendientes</Text>
              </View>
            ) : (
              solicitudes.map((s: any) => {
                const rolActual = rolesSeleccionados[s.id] || s.requestedRole
                const equipoActualId = equiposSeleccionados[s.id] ?? null
                const esRelative = rolActual === 'RELATIVE'
                const jugadores = jugadoresDisponibles[s.id] || []

                return (
                  <View key={s.id} style={[styles.requestCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>

                    {/* Header solicitud */}
                    <View style={styles.requestHeader}>
                      <View style={[styles.avatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                        <Text style={[styles.avatarText, { color: c.boton }]}>{s.firstName?.charAt(0)}</Text>
                      </View>
                      <View style={styles.requestInfo}>
                        <Text style={[styles.requestNombre, { color: c.texto }]}>{s.firstName} {s.lastName}</Text>
                        <Text style={[styles.requestRolReq, { color: c.subtexto }]}>Quiere unirse como: {s.requestedRole}</Text>
                      </View>
                    </View>

                    {/* Mensaje */}
                    {s.message && (
                      <View style={[styles.mensajeBox, { backgroundColor: c.fondo, borderColor: c.bordeInput }]}>
                        <Text style={[styles.mensajeText, { color: c.subtexto }]}>"{s.message}"</Text>
                      </View>
                    )}

                    {/* Selector de rol */}
                    <Text style={[styles.selectLabel, { color: c.subtexto }]}>Rol</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      <View style={styles.chipsRow}>
                        {ROLES.map(rol => (
                          <TouchableOpacity
                            key={rol}
                            style={[styles.chip, {
                              backgroundColor: rolActual === rol ? `${c.boton}18` : c.fondo,
                              borderColor: rolActual === rol ? c.boton : c.bordeInput,
                            }]}
                            onPress={() => setRolesSeleccionados(prev => ({ ...prev, [s.id]: rol }))}
                          >
                            <Text style={[styles.chipText, { color: rolActual === rol ? c.boton : c.subtexto }]}>{rol}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Selector de equipo */}
                    <Text style={[styles.selectLabel, { color: c.subtexto }]}>Equipo</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      <View style={styles.chipsRow}>
                        {equiposTemporadaActiva.map((eq: any) => (
                          <TouchableOpacity
                            key={eq.id}
                            style={[styles.chip, {
                              backgroundColor: equipoActualId === eq.id ? `${c.boton}18` : c.fondo,
                              borderColor: equipoActualId === eq.id ? c.boton : c.bordeInput,
                            }]}
                            onPress={() => handleSeleccionarEquipoSolicitud(s.id, eq.id)}
                          >
                            <Text style={[styles.chipText, { color: equipoActualId === eq.id ? c.boton : c.subtexto }]}>
                              {eq.category} {eq.suffix}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Si es RELATIVE → selector de jugador */}
                    {esRelative && equipoActualId && (
                      <>
                        <Text style={[styles.selectLabel, { color: c.subtexto }]}>Jugador familiar</Text>
                        <View style={[styles.jugadoresList, { borderColor: c.bordeInput }]}>
                          {jugadores.length === 0 ? (
                            <Text style={[styles.emptyText, { color: c.subtexto, padding: 10 }]}>Cargando jugadores...</Text>
                          ) : (
                            jugadores.map((jug: any) => {
                              const seleccionado = jugadoresSeleccionados[s.id] === jug.id
                              return (
                                <TouchableOpacity
                                  key={jug.id}
                                  style={[
                                    styles.jugadorRow,
                                    { borderBottomColor: c.bordeInput },
                                    seleccionado && { backgroundColor: `${c.boton}08` },
                                  ]}
                                  onPress={() => setJugadoresSeleccionados(prev => ({ ...prev, [s.id]: jug.id }))}
                                >
                                  <View style={[styles.jugAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                                    <Text style={[styles.jugAvatarText, { color: c.boton }]}>{jug.firstName?.charAt(0)}</Text>
                                  </View>
                                  <Text style={[styles.jugNombre, { color: c.texto }]}>{jug.firstName} {jug.lastName}</Text>
                                  <Text style={[styles.jugDorsal, { color: c.subtexto }]}>#{jug.jerseyNumber}</Text>
                                  {seleccionado && <Text style={{ color: c.boton, fontSize: 16 }}>✓</Text>}
                                </TouchableOpacity>
                              )
                            })
                          )}
                        </View>

                        {/* Selector parentesco */}
                        {jugadoresSeleccionados[s.id] && (
                          <>
                            <Text style={[styles.selectLabel, { color: c.subtexto, marginTop: 10 }]}>Parentesco</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                              <View style={styles.chipsRow}>
                                {PARENTESCOS.map(par => (
                                  <TouchableOpacity
                                    key={par}
                                    style={[styles.chip, {
                                      backgroundColor: parentescosSeleccionados[s.id] === par ? `${c.boton}18` : c.fondo,
                                      borderColor: parentescosSeleccionados[s.id] === par ? c.boton : c.bordeInput,
                                    }]}
                                    onPress={() => setParentescosSeleccionados(prev => ({ ...prev, [s.id]: par }))}
                                  >
                                    <Text style={[styles.chipText, { color: parentescosSeleccionados[s.id] === par ? c.boton : c.subtexto }]}>{par}</Text>
                                  </TouchableOpacity>
                                ))}
                              </View>
                            </ScrollView>
                          </>
                        )}
                      </>
                    )}

                    {/* Botones aprobar/rechazar */}
                    <View style={styles.actionsRow}>
                      <TouchableOpacity
                        style={[styles.aprobarBtn, { backgroundColor: c.boton, opacity: isSubmitting ? 0.6 : 1 }]}
                        onPress={() => handleAprobar(s.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={styles.actionBtnText}>✓ Aprobar</Text>
                        }
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.rechazarBtn, { borderColor: '#ef444440', backgroundColor: '#ef444410' }]}
                        onPress={() => handleRechazar(s.id)}
                        disabled={isSubmitting}
                      >
                        <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>✗ Rechazar</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )
              })
            )}
          </View>
        )}

        {/* ==================== TAB TABLÓN ==================== */}
        {tab === 'board' && (
          <View>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.boton }]} onPress={() => setModalAnuncio(true)}>
              <Text style={[styles.primaryButtonText, { color: '#fff' }]}>+ Nuevo anuncio</Text>
            </TouchableOpacity>

            {anuncios.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                <Text style={[styles.emptyText, { color: c.subtexto }]}>No hay anuncios publicados</Text>
              </View>
            ) : (
              anuncios.map((a: any) => (
                <View key={a.id} style={[styles.anuncioCard, {
                  backgroundColor: c.input,
                  borderColor: a.isPinned ? `${c.boton}60` : c.bordeInput,
                  borderWidth: a.isPinned ? 1.5 : 1,
                }]}>
                  <View style={styles.anuncioHeader}>
                    <View style={styles.anuncioBadges}>
                      {a.isPinned && (
                        <View style={[styles.badge, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                          <Text style={[styles.badgeText, { color: c.boton }]}>📌 Fijado</Text>
                        </View>
                      )}
                      <View style={[styles.badge, {
                        backgroundColor: a.teamId ? '#3b82f618' : '#f59e0b18',
                        borderColor: a.teamId ? '#3b82f635' : '#f59e0b35',
                      }]}>
                        <Text style={[styles.badgeText, { color: a.teamId ? '#3b82f6' : '#f59e0b' }]}>
                          {a.teamId ? `👕 ${a.teamName || 'Equipo'}` : '🏆 Todo el club'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.iconBtn, { borderColor: '#ef444435', backgroundColor: '#ef444410' }]}
                      onPress={() => handleEliminarAnuncio(a.id)}
                    >
                      <Text style={styles.iconBtnText}>🗑️</Text>
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.anuncioTitulo, { color: c.texto }]}>{a.titulo || a.title}</Text>
                  <Text style={[styles.anuncioContenido, { color: c.subtexto }]} numberOfLines={2}>{a.contenido || a.content}</Text>
                  <View style={styles.anuncioFooter}>
                    <Text style={[styles.anuncioMeta, { color: c.subtexto }]}>✍️ {a.autorNombre || 'Presidente'}</Text>
                    <Text style={[styles.anuncioMeta, { color: c.subtexto }]}>{a.publishedAt || a.fecha}</Text>
                  </View>
                </View>
              ))
            )}
          </View>
        )}

        {/* ==================== TAB CUOTAS ==================== */}
        {tab === 'fees' && (
          <View>
            {!activeSeason ? (
              <View style={[styles.emptyCard, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b35' }]}>
                <Text style={[styles.emptyText, { color: '#f59e0b' }]}>⚠️ Activa una temporada para gestionar cuotas</Text>
              </View>
            ) : (
              <>
                <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.boton }]} onPress={() => setModalCuota(true)}>
                  <Text style={[styles.primaryButtonText, { color: '#fff' }]}>+ Nueva cuota</Text>
                </TouchableOpacity>

                {cuotas.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                    <Text style={[styles.emptyText, { color: c.subtexto }]}>No hay cuotas creadas</Text>
                  </View>
                ) : (
                  cuotas.map((cuota: any) => (
                    <View key={cuota.id} style={[styles.cuotaCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                      <View style={styles.cuotaHeader}>
                        <Text style={[styles.cuotaTitulo, { color: c.texto }]}>{cuota.concept}</Text>
                        <Text style={[styles.cuotaImporte, { color: c.boton }]}>{cuota.amount}€</Text>
                      </View>
                      <View style={styles.cuotaMetaRow}>
                        <Text style={[styles.cuotaMetaText, { color: c.subtexto }]}>Vence {cuota.dueDate}</Text>
                        <View style={[styles.badge, {
                          backgroundColor: cuota.teamId ? '#3b82f618' : '#f59e0b18',
                          borderColor: cuota.teamId ? '#3b82f635' : '#f59e0b35',
                        }]}>
                          <Text style={[styles.badgeText, { color: cuota.teamId ? '#3b82f6' : '#f59e0b' }]}>
                            {cuota.teamId ? `👕 ${cuota.teamName || 'Equipo'}` : '🏆 Todo el club'}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.cuotaStats}>
                        <View style={[styles.statPill, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                          <Text style={[styles.statText, { color: c.boton }]}>✅ {cuota.paidCount || 0} pagados</Text>
                        </View>
                        <View style={[styles.statPill, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b35' }]}>
                          <Text style={[styles.statText, { color: '#f59e0b' }]}>⏳ {cuota.pendingCount || 0} pendientes</Text>
                        </View>
                        <View style={[styles.statPill, { backgroundColor: '#ef444418', borderColor: '#ef444435' }]}>
                          <Text style={[styles.statText, { color: '#ef4444' }]}>❌ {cuota.overdueCount || 0} vencidos</Text>
                        </View>
                      </View>
                      <TouchableOpacity
                        style={[styles.verDetalleBtn, { borderColor: c.bordeInput }]}
                        onPress={() => abrirDetalleCuota(cuota)}
                      >
                        <Text style={[styles.verDetalleText, { color: c.subtexto }]}>Ver detalle →</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </>
            )}
          </View>
        )}

        {/* ==================== TAB MI CLUB ==================== */}
        {tab === 'club' && (
          <View>
            <Text style={[styles.subSectionTitle, { color: c.texto }]}>🏆 {activeClubName}</Text>

            {/* ── TEMPORADAS ── */}
            <View style={styles.subSectionHeader}>
              <Text style={[styles.subSectionTitle, { color: c.texto, marginBottom: 0 }]}>🗓 Temporadas</Text>
              <TouchableOpacity
                style={[styles.smallBtn, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}
                onPress={() => setModalTemporada(true)}
              >
                <Text style={[styles.smallBtnText, { color: c.boton }]}>+ Nueva</Text>
              </TouchableOpacity>
            </View>

            {temporadas.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: c.input, borderColor: c.bordeInput, marginBottom: 20 }]}>
                <Text style={[styles.emptyText, { color: c.subtexto }]}>No hay temporadas creadas</Text>
              </View>
            ) : (
              <View style={[styles.list, { marginBottom: 24 }]}>
                {temporadas.map((temp: any) => (
                  <View key={temp.id} style={[styles.equipoCard, {
                    backgroundColor: c.input,
                    borderColor: temp.isActive ? c.boton : c.bordeInput,
                    borderWidth: temp.isActive ? 1.5 : 1,
                  }]}>
                    <View style={styles.equipoInfo}>
                      <Text style={[styles.equipoNombre, { color: c.texto }]}>{temp.name}</Text>
                      {temp.isActive && (
                        <View style={[styles.badge, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                          <Text style={[styles.badgeText, { color: c.boton }]}>✅ Activa</Text>
                        </View>
                      )}
                    </View>
                    <Switch
                      value={temp.isActive}
                      onValueChange={() => handleToggleSeason(temp.id)}
                      trackColor={{ false: c.bordeInput, true: c.boton }}
                      thumbColor={temp.isActive ? '#fff' : '#f4f3f4'}
                    />
                  </View>
                ))}
              </View>
            )}

            {/* ── EQUIPOS (de la temporada activa) ── */}
            <View style={styles.subSectionHeader}>
              <View>
                <Text style={[styles.subSectionTitle, { color: c.texto, marginBottom: 0 }]}>👕 Equipos</Text>
                {activeSeason && (
                  <Text style={[styles.seasonLabel, { color: c.subtexto }]}>Temporada: {activeSeason.name}</Text>
                )}
              </View>
              <TouchableOpacity
                style={[styles.smallBtn, {
                  backgroundColor: activeSeason ? `${c.boton}18` : c.input,
                  borderColor: activeSeason ? `${c.boton}35` : c.bordeInput,
                }]}
                onPress={() => {
                  if (!activeSeason) {
                    Alert.alert('Atención', 'Debes activar una temporada antes de crear equipos.')
                    return
                  }
                  setModalEquipo(true)
                }}
              >
                <Text style={[styles.smallBtnText, { color: activeSeason ? c.boton : c.subtexto }]}>+ Nuevo</Text>
              </TouchableOpacity>
            </View>

            {!activeSeason ? (
              <View style={[styles.emptyCard, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b35' }]}>
                <Text style={[styles.emptyText, { color: '#f59e0b' }]}>⚠️ Activa una temporada para ver y crear equipos</Text>
              </View>
            ) : equiposTemporadaActiva.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                <Text style={[styles.emptyText, { color: c.subtexto }]}>No hay equipos en esta temporada</Text>
              </View>
            ) : (
              <View style={styles.list}>
                {equiposTemporadaActiva.map((eq: any) => (
                  <View key={eq.id} style={[styles.equipoCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                    <View style={styles.equipoInfo}>
                      <Text style={[styles.equipoNombre, { color: c.texto }]}>
                        {eq.category} {eq.gender === 'MALE' ? '♂' : eq.gender === 'FEMALE' ? '♀' : '⚥'} {eq.suffix}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

      </ScrollView>

      {/* ==================== MODAL NUEVO ANUNCIO ==================== */}
      <Modal visible={modalAnuncio} transparent animationType="slide" onRequestClose={() => setModalAnuncio(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalAnuncio(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>📢 Nuevo anuncio</Text>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setModalAnuncio(false)}>
                <Text style={[styles.closeBtnText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>Enviar a</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, { backgroundColor: aTargetTeamId === null ? `${c.boton}18` : c.fondo, borderColor: aTargetTeamId === null ? c.boton : c.bordeInput }]}
                  onPress={() => setATargetTeamId(null)}
                >
                  <Text style={[styles.chipText, { color: aTargetTeamId === null ? c.boton : c.subtexto }]}>🏆 Todo el club</Text>
                </TouchableOpacity>
                {equiposTemporadaActiva.map((eq: any) => (
                  <TouchableOpacity
                    key={eq.id}
                    style={[styles.chip, { backgroundColor: aTargetTeamId === eq.id ? `${c.boton}18` : c.fondo, borderColor: aTargetTeamId === eq.id ? c.boton : c.bordeInput }]}
                    onPress={() => setATargetTeamId(eq.id)}
                  >
                    <Text style={[styles.chipText, { color: aTargetTeamId === eq.id ? c.boton : c.subtexto }]}>👕 {eq.category} {eq.suffix}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>Título *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Título del anuncio" placeholderTextColor={c.subtexto} value={aTitulo} onChangeText={setATitulo} />

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>Contenido *</Text>
            <TextInput style={[styles.textArea, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Escribe el mensaje..." placeholderTextColor={c.subtexto} value={aContenido} onChangeText={setAContenido} multiline numberOfLines={4} textAlignVertical="top" />

            <View style={styles.switchRow}>
              <Text style={[styles.inputLabel, { color: c.subtexto, marginBottom: 0 }]}>📌 Fijar anuncio</Text>
              <Switch value={aPinned} onValueChange={setAPinned} trackColor={{ true: c.boton }} />
            </View>

            <TouchableOpacity
              disabled={isSubmitting || !aTitulo || !aContenido}
              style={[styles.primaryButton, { backgroundColor: c.boton, marginTop: 16, opacity: aTitulo && aContenido ? 1 : 0.5 }]}
              onPress={publishAnuncio}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={[styles.primaryButtonText, { color: '#fff' }]}>Publicar</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ==================== MODAL NUEVA CUOTA ==================== */}
      <Modal visible={modalCuota} transparent animationType="slide" onRequestClose={() => setModalCuota(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalCuota(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>💶 Nueva cuota</Text>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setModalCuota(false)}>
                <Text style={[styles.closeBtnText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>Concepto *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Ej: Mensualidad Abril" placeholderTextColor={c.subtexto} value={cConcepto} onChangeText={setCConcepto} />

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>Importe (€) *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Ej: 50" placeholderTextColor={c.subtexto} value={cImporte} onChangeText={setCImporte} keyboardType="numeric" />

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>Fecha límite *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="15/04/2025" placeholderTextColor={c.subtexto} value={cFecha} onChangeText={setCFecha} />

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>Aplicar a</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, { backgroundColor: cTargetTeamId === null ? `${c.boton}18` : c.fondo, borderColor: cTargetTeamId === null ? c.boton : c.bordeInput }]}
                  onPress={() => setCTargetTeamId(null)}
                >
                  <Text style={[styles.chipText, { color: cTargetTeamId === null ? c.boton : c.subtexto }]}>🏆 Todo el club</Text>
                </TouchableOpacity>
                {equiposTemporadaActiva.map((eq: any) => (
                  <TouchableOpacity
                    key={eq.id}
                    style={[styles.chip, { backgroundColor: cTargetTeamId === eq.id ? `${c.boton}18` : c.fondo, borderColor: cTargetTeamId === eq.id ? c.boton : c.bordeInput }]}
                    onPress={() => setCTargetTeamId(eq.id)}
                  >
                    <Text style={[styles.chipText, { color: cTargetTeamId === eq.id ? c.boton : c.subtexto }]}>👕 {eq.category} {eq.suffix}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity
              disabled={isSubmitting || !cConcepto || !cImporte || !cFecha}
              style={[styles.primaryButton, { backgroundColor: c.boton, opacity: cConcepto && cImporte && cFecha ? 1 : 0.5 }]}
              onPress={handleCrearCuota}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={[styles.primaryButtonText, { color: '#fff' }]}>Crear cuota</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ==================== MODAL DETALLE CUOTA ==================== */}
      <Modal visible={modalDetalleCuota} transparent animationType="slide" onRequestClose={() => setModalDetalleCuota(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalDetalleCuota(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>💶 {cuotaSeleccionada?.concept}</Text>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setModalDetalleCuota(false)}>
                <Text style={[styles.closeBtnText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 400 }} showsVerticalScrollIndicator={false}>
              {pagosDetalle.length === 0 ? (
                <Text style={[styles.emptyText, { color: c.subtexto }]}>Cargando pagos...</Text>
              ) : (
                pagosDetalle.map((pago: any) => (
                  <View key={pago.id} style={[styles.pagoRow, { borderBottomColor: c.bordeInput }]}>
                    <View style={[styles.avatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                      <Text style={[styles.avatarText, { color: c.boton }]}>{pago.firstName?.charAt(0)}</Text>
                    </View>
                    <View style={styles.pagoInfo}>
                      <Text style={[styles.pagoNombre, { color: c.texto }]}>{pago.firstName} {pago.lastName}</Text>
                      {pago.paidDate && <Text style={[styles.pagoFecha, { color: c.subtexto }]}>{pago.paidDate}</Text>}
                    </View>
                    {pago.status !== 'PAID' ? (
                      <TouchableOpacity
                        style={[styles.markPaidBtn, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}
                        onPress={() => marcarPagado(pago.id)}
                      >
                        <Text style={[styles.markPaidText, { color: c.boton }]}>Pagado</Text>
                      </TouchableOpacity>
                    ) : (
                      <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[pago.status]}18`, borderColor: `${STATUS_COLOR[pago.status]}35` }]}>
                        <Text style={[styles.statusText, { color: STATUS_COLOR[pago.status] }]}>{STATUS_LABEL[pago.status]}</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ==================== MODAL NUEVA TEMPORADA ==================== */}
      <Modal visible={modalTemporada} transparent animationType="slide" onRequestClose={() => setModalTemporada(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalTemporada(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>🗓 Nueva temporada</Text>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setModalTemporada(false)}>
                <Text style={[styles.closeBtnText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>Nombre *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="Ej: 2025/2026" placeholderTextColor={c.subtexto} value={tNombre} onChangeText={setTNombre} />

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>Fecha inicio *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="01/09/2025" placeholderTextColor={c.subtexto} value={tInicio} onChangeText={setTInicio} />

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>Fecha fin *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="30/06/2026" placeholderTextColor={c.subtexto} value={tFin} onChangeText={setTFin} />

            <TouchableOpacity
              disabled={isSubmitting || !tNombre || !tInicio || !tFin}
              style={[styles.primaryButton, { backgroundColor: c.boton, opacity: tNombre && tInicio && tFin ? 1 : 0.5 }]}
              onPress={saveTemporada}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={[styles.primaryButtonText, { color: '#fff' }]}>Crear temporada</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ==================== MODAL NUEVO EQUIPO ==================== */}
      <Modal visible={modalEquipo} transparent animationType="slide" onRequestClose={() => setModalEquipo(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalEquipo(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>👕 Nuevo equipo</Text>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setModalEquipo(false)}>
                <Text style={[styles.closeBtnText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {activeSeason && (
              <View style={[styles.badge, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35`, alignSelf: 'flex-start', marginBottom: 16 }]}>
                <Text style={[styles.badgeText, { color: c.boton }]}>📅 Temporada: {activeSeason.name}</Text>
              </View>
            )}

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>Categoría</Text>
            <View style={styles.chipsWrap}>
              {CATEGORIAS.map(cat => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, { backgroundColor: eCategoria === cat ? `${c.boton}18` : c.input, borderColor: eCategoria === cat ? c.boton : c.bordeInput }]}
                  onPress={() => setECategoria(cat)}
                >
                  <Text style={[styles.chipText, { color: eCategoria === cat ? c.boton : c.subtexto }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>Género</Text>
            <View style={styles.chipsWrap}>
              {GENEROS.map(gen => (
                <TouchableOpacity
                  key={gen}
                  style={[styles.chip, { backgroundColor: eGenero === gen ? `${c.boton}18` : c.input, borderColor: eGenero === gen ? c.boton : c.bordeInput }]}
                  onPress={() => setEGenero(gen)}
                >
                  <Text style={[styles.chipText, { color: eGenero === gen ? c.boton : c.subtexto }]}>{gen}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>Sufijo *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
              placeholder="Ej: A, B, C, Femenino"
              placeholderTextColor={c.subtexto}
              value={eSufijo}
              onChangeText={setESufijo}
            />

            <TouchableOpacity
              disabled={isSubmitting || !eSufijo}
              style={[styles.primaryButton, { backgroundColor: c.boton, opacity: eSufijo ? 1 : 0.5 }]}
              onPress={saveEquipo}
            >
              {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={[styles.primaryButtonText, { color: '#fff' }]}>Crear equipo</Text>}
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  headerFixed: { paddingTop: 20, paddingHorizontal: 24, borderBottomWidth: 1, paddingBottom: 0 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  tabsRow: { flexDirection: 'row', gap: 4 },
  tabButton: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '600' },
  container: { padding: 24, paddingBottom: 40 },
  list: { gap: 10 },

  // Empty
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: 'center', marginBottom: 12 },
  emptyText: { fontSize: 14 },

  // Solicitudes
  requestCard: { borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 12, gap: 10 },
  requestHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  avatar: { width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: 'bold' },
  requestInfo: { flex: 1 },
  requestNombre: { fontSize: 15, fontWeight: '600' },
  requestRolReq: { fontSize: 12 },
  mensajeBox: { borderRadius: 8, padding: 10, borderLeftWidth: 2 },
  mensajeText: { fontSize: 12, fontStyle: 'italic' },
  selectLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 },
  chipsRow: { flexDirection: 'row', gap: 6 },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 10, paddingVertical: 5 },
  chipText: { fontSize: 12, fontWeight: '600' },
  jugadoresList: { borderWidth: 1, borderRadius: 12, marginBottom: 10, overflow: 'hidden' },
  jugadorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 1 },
  jugAvatar: { width: 32, height: 32, borderRadius: 8, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  jugAvatarText: { fontSize: 13, fontWeight: 'bold' },
  jugNombre: { flex: 1, fontSize: 13, fontWeight: '500' },
  jugDorsal: { fontSize: 12 },
  actionsRow: { flexDirection: 'row', gap: 8 },
  aprobarBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center' },
  rechazarBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#ffffff' },

  // Tablón
  primaryButton: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 16 },
  primaryButtonText: { fontWeight: 'bold', fontSize: 15 },
  anuncioCard: { borderRadius: 14, padding: 14, gap: 6, marginBottom: 10 },
  anuncioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  anuncioBadges: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { fontSize: 12 },
  anuncioTitulo: { fontSize: 14, fontWeight: '700' },
  anuncioContenido: { fontSize: 12, lineHeight: 18 },
  anuncioFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  anuncioMeta: { fontSize: 11 },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Cuotas
  cuotaCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, marginBottom: 10 },
  cuotaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cuotaTitulo: { fontSize: 15, fontWeight: '700' },
  cuotaImporte: { fontSize: 18, fontWeight: 'bold' },
  cuotaMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cuotaMetaText: { fontSize: 12 },
  cuotaStats: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  statPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statText: { fontSize: 11, fontWeight: '600' },
  verDetalleBtn: { borderWidth: 1, borderRadius: 8, padding: 8, alignItems: 'center' },
  verDetalleText: { fontSize: 12, fontWeight: '500' },
  pagoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  pagoInfo: { flex: 1 },
  pagoNombre: { fontSize: 13, fontWeight: '600' },
  pagoFecha: { fontSize: 11 },
  markPaidBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  markPaidText: { fontSize: 12, fontWeight: '600' },
  statusPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 3 },
  statusText: { fontSize: 11, fontWeight: '600' },

  // Club
  subSectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  subSectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 10 },
  seasonLabel: { fontSize: 12, marginTop: 2 },
  smallBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  smallBtnText: { fontSize: 12, fontWeight: '600' },
  equipoCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  equipoInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  equipoNombre: { fontSize: 14, fontWeight: '600' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },

  // Modales
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', padding: 16, paddingBottom: 32 },
  modalCard: { borderRadius: 20, borderWidth: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitulo: { fontSize: 17, fontWeight: 'bold', flex: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 13, fontWeight: '600' },
  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 14 },
  textArea: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 14, minHeight: 100 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
})