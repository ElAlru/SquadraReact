import React, { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  ActivityIndicator,
  RefreshControl
} from 'react-native'
import { useTheme } from '../../lib/useTheme'
import { useAuthStore } from '../../lib/store'
import { apiFetch } from '../../lib/api'

// --- Tipos de Datos ---
type EstadoConvocatoria = 'CALLED_UP' | 'CONFIRMED' | 'DECLINED'
type EstadoAsistencia = 'ATTENDED' | 'MISSED' | null
type TipoEvento = 'PARTIDO' | 'ENTRENAMIENTO'

interface PlayerStats {
  goals: string
  assists: string
  yellowCards: string
  redCards: string
  minutesPlayed: string
  wasStarter: boolean
}

export default function GestionCoach() {
  const c = useTheme()
  const { t } = useTranslation()

  // Data del Store
  const activeTeamId = useAuthStore((state: any) => state.activeTeamId)
  const activeSeasonId = useAuthStore((state: any) => state.activeSeasonId || 1)

  // Estados de carga y listas
  const [eventos, setEventos] = useState<any[]>([])
  const [jugadores, setJugadores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Modales
  const [modalCrear, setModalCrear] = useState(false)
  const [modalGestionar, setModalGestionar] = useState(false)
  const [modalMulta, setModalMulta] = useState(false)
  
  // Estado del Evento Seleccionado
  const [eventoSeleccionado, setEventoSeleccionado] = useState<any | null>(null)
  const [tabModal, setTabModal] = useState<'convocatoria' | 'stats'>('convocatoria')
  const [playerStats, setPlayerStats] = useState<Record<number, PlayerStats>>({})

  // Formulario Crear Evento
  const [tipoNuevo, setTipoNuevo] = useState<TipoEvento>('PARTIDO')
  const [rival, setRival] = useState('')
  const [fechaNuevo, setFechaNuevo] = useState('') // Formato YYYY-MM-DD
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [lugar, setLugar] = useState('')

  // Formulario Multa
  const [jugadorMulta, setJugadorMulta] = useState<any | null>(null)
  const [motivoMulta, setMotivoMulta] = useState('')
  const [importeMulta, setImporteMulta] = useState('')

  // --- 1. CARGA DE DATOS ---

  const fetchEventos = useCallback(async () => {
    if (!activeTeamId) return
    try {
      const res = await apiFetch(`/api/eventos/equipo/${activeTeamId}`)
      if (res.ok) setEventos(await res.json())
    } catch (e) { console.error(e) } 
    finally { setLoading(false); setRefreshing(false); }
  }, [activeTeamId])

  useEffect(() => { fetchEventos() }, [fetchEventos])

  const abrirGestion = async (evento: any) => {
    setEventoSeleccionado(evento)
    setTabModal('convocatoria')
    setModalGestionar(true)
    setLoading(true)

    try {
      const res = await apiFetch(`/api/coach/events/team/${activeTeamId}/players?eventId=${evento.id}&type=${evento.tipo}`)
      if (res.ok) {
        const data = await res.json()
        setJugadores(data)
        
        // Inicializar stats si es partido cerrado
        if (evento.tipo === 'PARTIDO' && evento.isClosed) {
          const statsMap: Record<number, PlayerStats> = {}
          data.forEach((j: any) => {
            statsMap[j.id] = {
              goals: String(j.goals || 0),
              assists: String(j.assists || 0),
              yellowCards: String(j.yellowCards || 0),
              redCards: String(j.redCards || 0),
              minutesPlayed: String(j.minutesPlayed || 0),
              wasStarter: !!j.wasStarter
            }
          })
          setPlayerStats(statsMap)
        }
      }
    } catch (e) { Alert.alert("Error", "No se pudo cargar la plantilla.") } 
    finally { setLoading(false) }
  }

  // --- 2. ACCIONES (API) ---

  const handleCrearEvento = async () => {
    if (!fechaNuevo || !horaInicio || (tipoNuevo === 'PARTIDO' && !rival)) {
      return Alert.alert("Error", "Rellena los campos obligatorios (*)")
    }
    setIsSubmitting(true)
    try {
      const res = await apiFetch(`/api/coach/events/team/${activeTeamId}`, {
        method: 'POST',
        body: JSON.stringify({ tipo: tipoNuevo, rival, fecha: fechaNuevo, horaInicio, horaFin, lugar })
      })
      if (res.ok) {
        setModalCrear(false); fetchEventos()
        Alert.alert("Éxito", "Evento creado correctamente")
      }
    } catch (e) { Alert.alert("Error", "Fallo al crear el evento") }
    finally { setIsSubmitting(false) }
  }

  const handleMulta = async () => {
    if (!motivoMulta || !importeMulta || !jugadorMulta) return
    setIsSubmitting(true)
    try {
      const res = await apiFetch(`/api/coach/fines`, {
        method: 'POST',
        body: JSON.stringify({ 
          playerId: jugadorMulta.id, teamId: activeTeamId, 
          seasonId: activeSeasonId, reason: motivoMulta, amount: parseFloat(importeMulta) 
        })
      })
      if (res.ok) {
        setModalMulta(false); Alert.alert("Éxito", "Multa aplicada")
      }
    } catch (e) { Alert.alert("Error", "Fallo al aplicar multa") }
    finally { setIsSubmitting(false) }
  }

  const toggleConvocatoria = async (jId: number) => {
    if (eventoSeleccionado.isClosed) return
    const j = jugadores.find(it => it.id === jId)
    const estados: EstadoConvocatoria[] = ['CALLED_UP', 'CONFIRMED', 'DECLINED']
    const nuevo = estados[(estados.indexOf(j.estadoConv as EstadoConvocatoria) + 1) % 3]

    setJugadores(prev => prev.map(it => it.id === jId ? { ...it, estadoConv: nuevo } : it))
    await apiFetch(`/api/coach/events/match/${eventoSeleccionado.id}/callup/${jId}?status=${nuevo}`, { method: 'PATCH' })
  }

  const toggleAsistencia = async (jId: number) => {
    const j = jugadores.find(it => it.id === jId)
    const nuevo: EstadoAsistencia = j.estadoAsist === 'ATTENDED' ? 'MISSED' : 'ATTENDED'

    setJugadores(prev => prev.map(it => it.id === jId ? { ...it, estadoAsist: nuevo } : it))
    await apiFetch(`/api/coach/events/training/${eventoSeleccionado.id}/attendance/${jId}?status=${nuevo}`, { method: 'PATCH' })
  }

  const guardarEstadisticas = async () => {
    setIsSubmitting(true)
    try {
      for (const jId of Object.keys(playerStats)) {
        const s = playerStats[Number(jId)]
        await apiFetch(`/api/coach/events/match/${eventoSeleccionado.id}/stats/${jId}`, {
          method: 'POST',
          body: JSON.stringify({
            goals: parseInt(s.goals), assists: parseInt(s.assists),
            yellowCards: parseInt(s.yellowCards), redCards: parseInt(s.redCards),
            minutesPlayed: parseInt(s.minutesPlayed), wasStarter: s.wasStarter
          })
        })
      }
      Alert.alert("Éxito", "Estadísticas guardadas correctamente")
    } catch (e) { Alert.alert("Error", "Algunas estadísticas no se pudieron guardar") }
    finally { setIsSubmitting(false) }
  }

  // --- UI HELPERS ---
  const getConvColor = (st: EstadoConvocatoria) => st === 'CONFIRMED' ? c.boton : st === 'DECLINED' ? '#ef4444' : '#f59e0b'

  return (
    <View style={[styles.wrapper, { backgroundColor: c.fondo }]}>
      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={fetchEventos} tintColor={c.boton} />}
      >
        <Text style={[styles.titulo, { color: c.texto }]}>🎽 Gestión Deportiva</Text>

        <TouchableOpacity style={[styles.crearButton, { backgroundColor: c.boton }]} onPress={() => setModalCrear(true)}>
          <Text style={styles.crearButtonText}>+ Crear entrenamiento / partido</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: c.subtexto }]}>PRÓXIMOS EVENTOS</Text>

        <View style={styles.eventosList}>
          {eventos.map(e => (
            <View key={e.id} style={[styles.eventoCard, { backgroundColor: c.input, borderLeftColor: e.tipo === 'PARTIDO' ? c.boton : '#3b82f6' }]}>
              <View style={styles.eventoInfo}>
                <Text style={[styles.eventoTitulo, { color: c.texto }]}>{e.tipo === 'PARTIDO' ? '⚽' : '🏃'} {e.titulo}</Text>
                <Text style={[styles.metaText, { color: c.subtexto }]}>{e.fecha} · {e.horaInicio} @ {e.lugar || 'Sin campo'}</Text>
                {e.isClosed && <Text style={{ color: c.boton, fontSize: 11, fontWeight: 'bold', marginTop: 4 }}>✓ FINALIZADO</Text>}
              </View>
              <TouchableOpacity 
                style={[styles.gestionarBtn, { borderColor: c.boton }]} 
                onPress={() => abrirGestion(e)}
              >
                <Text style={{ color: c.boton, fontWeight: 'bold', fontSize: 12 }}>Gestionar</Text>
              </TouchableOpacity>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* --- MODAL GESTIONAR --- */}
      <Modal visible={modalGestionar} transparent animationType="slide">
        <Pressable style={styles.overlay} onPress={() => setModalGestionar(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>{eventoSeleccionado?.titulo}</Text>
              <TouchableOpacity onPress={() => setModalGestionar(false)}><Text style={{ color: c.subtexto, fontSize: 20 }}>✕</Text></TouchableOpacity>
            </View>

            {/* Tabs para Partidos Finalizados */}
            {eventoSeleccionado?.tipo === 'PARTIDO' && eventoSeleccionado?.isClosed && (
              <View style={styles.tabs}>
                <TouchableOpacity onPress={() => setTabModal('convocatoria')} style={[styles.tab, tabModal === 'convocatoria' && { borderBottomColor: c.boton, borderBottomWidth: 2 }]}>
                  <Text style={{ color: tabModal === 'convocatoria' ? c.boton : c.subtexto, fontWeight: 'bold' }}>Convocatoria</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setTabModal('stats')} style={[styles.tab, tabModal === 'stats' && { borderBottomColor: c.boton, borderBottomWidth: 2 }]}>
                  <Text style={{ color: tabModal === 'stats' ? c.boton : c.subtexto, fontWeight: 'bold' }}>Estadísticas</Text>
                </TouchableOpacity>
              </View>
            )}

            <ScrollView style={{ maxHeight: 500 }} showsVerticalScrollIndicator={false}>
              {tabModal === 'convocatoria' ? (
                <View style={{ gap: 12, marginTop: 15 }}>
                  {jugadores.map(j => (
                    <View key={j.id} style={styles.jugadorRow}>
                      <View style={[styles.avatar, { backgroundColor: c.input }]}><Text style={{ color: c.boton }}>{j.firstName.charAt(0)}</Text></View>
                      <View style={{ flex: 1 }}><Text style={{ color: c.texto, fontWeight: '600' }}>{j.firstName} {j.lastName}</Text><Text style={{ color: c.subtexto, fontSize: 12 }}>#{j.jerseyNumber}</Text></View>
                      
                      {eventoSeleccionado.tipo === 'PARTIDO' ? (
                        <TouchableOpacity 
                          style={[styles.statusBadge, { backgroundColor: `${getConvColor(j.estadoConv)}20` }]}
                          onPress={() => toggleConvocatoria(j.id)}
                        >
                          <Text style={{ color: getConvColor(j.estadoConv), fontSize: 11, fontWeight: 'bold' }}>
                            {j.estadoConv === 'CALLED_UP' ? 'CONV.' : j.estadoConv === 'CONFIRMED' ? 'CONF.' : 'DECL.'}
                          </Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity 
                          style={[styles.statusBadge, { backgroundColor: j.estadoAsist === 'ATTENDED' ? `${c.boton}20` : j.estadoAsist === 'MISSED' ? '#ef444420' : '#ccc20' }]}
                          onPress={() => toggleAsistencia(j.id)}
                        >
                          <Text style={{ color: j.estadoAsist === 'ATTENDED' ? c.boton : j.estadoAsist === 'MISSED' ? '#ef4444' : c.subtexto, fontSize: 11, fontWeight: 'bold' }}>
                            {j.estadoAsist === 'ATTENDED' ? '✓' : j.estadoAsist === 'MISSED' ? '✗' : '—'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      
                      <TouchableOpacity style={styles.fineBtn} onPress={() => { setJugadorMulta(j); setModalMulta(true) }}>
                        <Text>⚠️</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              ) : (
                <View style={{ gap: 15, marginTop: 15 }}>
                  {jugadores.filter(j => j.estadoConv !== 'DECLINED').map(j => (
                    <View key={j.id} style={[styles.statsCard, { backgroundColor: c.input }]}>
                      <View style={styles.statsHeader}>
                        <Text style={{ color: c.texto, fontWeight: 'bold' }}>{j.firstName} #{j.jerseyNumber}</Text>
                        <TouchableOpacity 
                          onPress={() => setPlayerStats(prev => ({ ...prev, [j.id]: { ...prev[j.id], wasStarter: !prev[j.id].wasStarter } }))}
                          style={[styles.starterToggle, { backgroundColor: playerStats[j.id]?.wasStarter ? c.boton : 'transparent' }]}
                        >
                          <Text style={{ color: playerStats[j.id]?.wasStarter ? '#fff' : c.subtexto, fontSize: 10 }}>{playerStats[j.id]?.wasStarter ? 'TITULAR' : 'SUPLENTE'}</Text>
                        </TouchableOpacity>
                      </View>
                      <View style={styles.statsGrid}>
                        {['goals', 'assists', 'yellowCards', 'redCards', 'minutesPlayed'].map(field => (
                          <View key={field} style={{ alignItems: 'center', flex: 1 }}>
                            <Text style={{ fontSize: 9, color: c.subtexto, marginBottom: 4 }}>{field.toUpperCase()}</Text>
                            <TextInput 
                              keyboardType="numeric" 
                              style={styles.statInput} 
                              value={playerStats[j.id]?.[field as keyof PlayerStats] as string}
                              onChangeText={(v) => setPlayerStats(prev => ({ ...prev, [j.id]: { ...prev[j.id], [field]: v } }))}
                            />
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                  <TouchableOpacity style={[styles.crearButton, { backgroundColor: c.boton }]} onPress={guardarEstadisticas}>
                    {isSubmitting ? <ActivityIndicator color="#fff" /> : <Text style={styles.crearButtonText}>💾 Guardar estadísticas</Text>}
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- MODAL CREAR EVENTO --- */}
      <Modal visible={modalCrear} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setModalCrear(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo }]}>
            <Text style={[styles.modalTitulo, { color: c.texto, marginBottom: 20 }]}>Crear Evento</Text>
            
            <View style={styles.typeSelector}>
              <TouchableOpacity onPress={() => setTipoNuevo('PARTIDO')} style={[styles.typeBtn, tipoNuevo === 'PARTIDO' && { backgroundColor: c.boton }]}><Text style={{ color: tipoNuevo === 'PARTIDO' ? '#fff' : c.subtexto }}>⚽ Partido</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setTipoNuevo('ENTRENAMIENTO')} style={[styles.typeBtn, tipoNuevo === 'ENTRENAMIENTO' && { backgroundColor: c.boton }]}><Text style={{ color: tipoNuevo === 'ENTRENAMIENTO' ? '#fff' : c.subtexto }}>🏃 Entreno</Text></TouchableOpacity>
            </View>

            {tipoNuevo === 'PARTIDO' && <TextInput placeholder="Rival *" placeholderTextColor={c.subtexto} style={[styles.input, { color: c.texto, borderColor: c.bordeInput }]} value={rival} onChangeText={setRival} />}
            <TextInput placeholder="Fecha (YYYY-MM-DD) *" placeholderTextColor={c.subtexto} style={[styles.input, { color: c.texto, borderColor: c.bordeInput }]} value={fechaNuevo} onChangeText={setFechaNuevo} />
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <TextInput placeholder="Inicio (HH:MM) *" placeholderTextColor={c.subtexto} style={[styles.input, { flex: 1, color: c.texto, borderColor: c.bordeInput }]} value={horaInicio} onChangeText={setHoraInicio} />
              <TextInput placeholder="Fin (HH:MM)" placeholderTextColor={c.subtexto} style={[styles.input, { flex: 1, color: c.texto, borderColor: c.bordeInput }]} value={horaFin} onChangeText={setHoraFin} />
            </View>
            <TextInput placeholder="Campo / Lugar" placeholderTextColor={c.subtexto} style={[styles.input, { color: c.texto, borderColor: c.bordeInput }]} value={lugar} onChangeText={setLugar} />

            <TouchableOpacity 
              disabled={isSubmitting}
              style={[styles.crearButton, { backgroundColor: c.boton, opacity: (tipoNuevo === 'PARTIDO' && !rival) || !fechaNuevo || !horaInicio ? 0.5 : 1 }]} 
              onPress={handleCrearEvento}
            >
              <Text style={styles.crearButtonText}>Crear Evento</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* --- MODAL MULTA --- */}
      <Modal visible={modalMulta} transparent animationType="fade">
        <Pressable style={styles.overlay} onPress={() => setModalMulta(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo }]}>
            <Text style={[styles.modalTitulo, { color: c.texto, marginBottom: 15 }]}>⚠️ Aplicar Multa</Text>
            <Text style={{ color: c.boton, fontWeight: 'bold', marginBottom: 20 }}>{jugadorMulta?.firstName} {jugadorMulta?.lastName}</Text>
            
            <TextInput placeholder="Motivo de la multa *" placeholderTextColor={c.subtexto} style={[styles.input, { color: c.texto, borderColor: c.bordeInput }]} value={motivoMulta} onChangeText={setMotivoMulta} />
            <TextInput placeholder="Importe (€) *" keyboardType="numeric" placeholderTextColor={c.subtexto} style={[styles.input, { color: c.texto, borderColor: c.bordeInput }]} value={importeMulta} onChangeText={setImporteMulta} />

            <TouchableOpacity 
              disabled={isSubmitting || !motivoMulta || !importeMulta}
              style={[styles.crearButton, { backgroundColor: '#f59e0b', opacity: !motivoMulta || !importeMulta ? 0.5 : 1 }]} 
              onPress={handleMulta}
            >
              <Text style={styles.crearButtonText}>Confirmar Multa</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 24, paddingTop: 60 },
  titulo: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  crearButton: { padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 30 },
  crearButtonText: { color: '#fff', fontWeight: 'bold' },
  sectionLabel: { fontSize: 11, fontWeight: 'bold', letterSpacing: 1, marginBottom: 15 },
  eventosList: { gap: 12 },
  eventoCard: { padding: 16, borderRadius: 16, borderWidth: 1, borderLeftWidth: 6, flexDirection: 'row', alignItems: 'center' },
  eventoInfo: { flex: 1 },
  eventoTitulo: { fontSize: 15, fontWeight: 'bold', marginBottom: 4 },
  metaText: { fontSize: 12 },
  gestionarBtn: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1 },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', padding: 20 },
  modalCard: { borderRadius: 24, padding: 24, width: '100%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitulo: { fontSize: 18, fontWeight: 'bold' },
  tabs: { flexDirection: 'row', marginTop: 20, gap: 20 },
  tab: { paddingBottom: 8 },
  jugadorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10 },
  avatar: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, minWidth: 50, alignItems: 'center' },
  fineBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  statsCard: { padding: 12, borderRadius: 12, gap: 10 },
  statsHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  starterToggle: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, borderColor: '#eee' },
  statsGrid: { flexDirection: 'row', gap: 6 },
  statInput: { backgroundColor: '#fff', borderRadius: 6, padding: 4, textAlign: 'center', fontSize: 14, fontWeight: 'bold', width: '100%', borderWidth: 1, borderColor: '#ddd' },
  typeSelector: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  typeBtn: { flex: 1, padding: 12, borderRadius: 10, alignItems: 'center', backgroundColor: '#eee' },
  input: { padding: 14, borderRadius: 10, borderWidth: 1, marginBottom: 12 }
})