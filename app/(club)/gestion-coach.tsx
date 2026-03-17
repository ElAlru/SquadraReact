import { useState } from 'react'
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
} from 'react-native'
import { useTheme } from '../../lib/useTheme'

// MOCK — reemplazar con datos reales de la API
const EVENTOS = [
  {
    id: 1,
    tipo: 'PARTIDO',
    titulo: 'Cadete C vs Canillejas',
    fecha: 'Sáb 12/04',
    horaInicio: '11:00',
    horaFin: null,
    lugar: 'Campo Municipal',
    esLocal: true,
    tipoPartido: 'LEAGUE',
    jornada: 5,
    isClosed: false, // partido pendiente
  },
  {
    id: 2,
    tipo: 'ENTRENAMIENTO',
    titulo: 'Entrenamiento',
    fecha: 'Lun 14/04',
    horaInicio: '19:00',
    horaFin: '20:30',
    lugar: 'Campo Municipal',
    esLocal: null,
    tipoPartido: null,
    jornada: null,
    isClosed: false,
  },
  {
    id: 3,
    tipo: 'ENTRENAMIENTO',
    titulo: 'Entrenamiento',
    fecha: 'Mié 16/04',
    horaInicio: '19:00',
    horaFin: '20:30',
    lugar: 'Campo Municipal',
    esLocal: null,
    tipoPartido: null,
    jornada: null,
    isClosed: false,
  },
  {
    id: 4,
    tipo: 'PARTIDO',
    titulo: 'Cadete C vs Getafe',
    fecha: 'Sáb 05/04',
    horaInicio: '11:00',
    horaFin: null,
    lugar: 'Campo Municipal',
    esLocal: true,
    tipoPartido: 'LEAGUE',
    jornada: 4,
    isClosed: true, // partido acabado
  },
]

type EstadoConvocatoria = 'CALLED_UP' | 'CONFIRMED' | 'DECLINED'
type EstadoAsistencia = 'ATTENDED' | 'MISSED' | null

const JUGADORES_INIT = [
  { id: 1, firstName: 'Carlos', lastName: 'García', jerseyNumber: 1, estadoConv: 'CALLED_UP' as EstadoConvocatoria, estadoAsist: null as EstadoAsistencia },
  { id: 2, firstName: 'Juan', lastName: 'López', jerseyNumber: 7, estadoConv: 'CONFIRMED' as EstadoConvocatoria, estadoAsist: null as EstadoAsistencia },
  { id: 3, firstName: 'Pedro', lastName: 'Martínez', jerseyNumber: 10, estadoConv: 'DECLINED' as EstadoConvocatoria, estadoAsist: null as EstadoAsistencia },
  { id: 4, firstName: 'Luis', lastName: 'Sánchez', jerseyNumber: 4, estadoConv: 'CALLED_UP' as EstadoConvocatoria, estadoAsist: null as EstadoAsistencia },
  { id: 5, firstName: 'Miguel', lastName: 'Fernández', jerseyNumber: 9, estadoConv: 'CONFIRMED' as EstadoConvocatoria, estadoAsist: null as EstadoAsistencia },
]

type Stats = {
  goals: string
  assists: string
  yellowCards: string
  redCards: string
  minutesPlayed: string
  wasStarter: boolean
}

const STATS_INIT: Record<number, Stats> = {
  1: { goals: '0', assists: '0', yellowCards: '0', redCards: '0', minutesPlayed: '90', wasStarter: true },
  2: { goals: '1', assists: '0', yellowCards: '1', redCards: '0', minutesPlayed: '90', wasStarter: true },
  3: { goals: '0', assists: '2', yellowCards: '0', redCards: '0', minutesPlayed: '75', wasStarter: true },
  4: { goals: '0', assists: '0', yellowCards: '0', redCards: '0', minutesPlayed: '45', wasStarter: false },
  5: { goals: '2', assists: '1', yellowCards: '0', redCards: '0', minutesPlayed: '90', wasStarter: true },
}

const TIPO_PARTIDO_LABEL: Record<string, string> = {
  LEAGUE: 'Liga', FRIENDLY: 'Amistoso', CUP: 'Copa', TOURNAMENT: 'Torneo',
}

type TipoEvento = 'PARTIDO' | 'ENTRENAMIENTO'

export default function GestionCoach() {
  const c = useTheme()
  const { t } = useTranslation()

  const [eventoSeleccionado, setEventoSeleccionado] = useState<typeof EVENTOS[0] | null>(null)
  const [modalGestionar, setModalGestionar] = useState(false)
  const [jugadorMulta, setJugadorMulta] = useState<typeof JUGADORES_INIT[0] | null>(null)
  const [modalMulta, setModalMulta] = useState(false)
  const [motivoMulta, setMotivoMulta] = useState('')
  const [importeMulta, setImporteMulta] = useState('')
  const [modalCrear, setModalCrear] = useState(false)
  const [tipoNuevo, setTipoNuevo] = useState<TipoEvento>('PARTIDO')
  const [rival, setRival] = useState('')
  const [campo, setCampo] = useState('')
  const [horaInicio, setHoraInicio] = useState('')
  const [horaFin, setHoraFin] = useState('')
  const [jugadores, setJugadores] = useState(JUGADORES_INIT)
  const [stats, setStats] = useState<Record<number, Stats>>(STATS_INIT)
  const [tabModal, setTabModal] = useState<'convocatoria' | 'stats'>('convocatoria')

  const toggleConvocatoria = (jugadorId: number) => {
    setJugadores((prev) => prev.map((j) => {
      if (j.id !== jugadorId) return j
      const estados: EstadoConvocatoria[] = ['CALLED_UP', 'CONFIRMED', 'DECLINED']
      const idx = estados.indexOf(j.estadoConv)
      return { ...j, estadoConv: estados[(idx + 1) % estados.length] }
    }))
  }

  const toggleAsistencia = (jugadorId: number) => {
    setJugadores((prev) => prev.map((j) => {
      if (j.id !== jugadorId) return j
      const nuevo: EstadoAsistencia = j.estadoAsist === 'ATTENDED' ? 'MISSED' : 'ATTENDED'
      return { ...j, estadoAsist: nuevo }
    }))
  }

  const abrirMulta = (jugador: typeof JUGADORES_INIT[0]) => {
    setJugadorMulta(jugador)
    setMotivoMulta('')
    setImporteMulta('')
    setModalMulta(true)
  }

  const updateStat = (jugadorId: number, campo: keyof Stats, valor: string | boolean) => {
    setStats((prev) => ({
      ...prev,
      [jugadorId]: { ...prev[jugadorId], [campo]: valor },
    }))
  }

  const getConvLabel = (estado: EstadoConvocatoria) => {
    if (estado === 'CALLED_UP') return t('coachManagement.called')
    if (estado === 'CONFIRMED') return t('coachManagement.confirmed')
    return t('coachManagement.declined')
  }

  const getConvColor = (estado: EstadoConvocatoria) => {
    if (estado === 'CONFIRMED') return c.boton
    if (estado === 'DECLINED') return '#ef4444'
    return '#f59e0b'
  }

  const abrirModal = (evento: typeof EVENTOS[0]) => {
    setEventoSeleccionado(evento)
    setTabModal('convocatoria')
    setModalGestionar(true)
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: c.fondo }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        <Text style={[styles.titulo, { color: c.texto }]}>🎽 {t('coachManagement.title')}</Text>

        <TouchableOpacity
          style={[styles.crearButton, { backgroundColor: c.boton }]}
          onPress={() => setModalCrear(true)}
        >
          <Text style={[styles.crearButtonText, { color: c.botonTexto }]}>{t('coachManagement.createEvent')}</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionLabel, { color: c.subtexto }]}>{t('coachManagement.upcomingEvents')}</Text>

        <View style={styles.eventosList}>
          {EVENTOS.map((evento) => (
            <View key={evento.id} style={[
              styles.eventoCard,
              {
                backgroundColor: c.input,
                borderColor: evento.isClosed ? c.bordeInput : c.bordeInput,
                borderLeftColor: evento.tipo === 'PARTIDO' ? c.boton : '#3b82f6',
              }
            ]}>
              <View style={styles.eventoRow}>
                <View style={styles.eventoInfo}>
                  <Text style={[styles.eventoTitulo, { color: c.texto }]}>
                    {evento.tipo === 'PARTIDO' ? '⚽' : '🏃'} {evento.titulo}
                  </Text>
                  <Text style={[styles.eventoMeta, { color: c.subtexto }]}>
                    {evento.fecha} · {evento.horaInicio}{evento.horaFin ? ` - ${evento.horaFin}` : ''}
                  </Text>
                  <Text style={[styles.eventoMeta, { color: c.subtexto }]}>📍 {evento.lugar}</Text>
                  <View style={styles.badgesRow}>
                    {evento.tipoPartido && (
                      <View style={[styles.badge, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                        <Text style={[styles.badgeText, { color: c.boton }]}>
                          {TIPO_PARTIDO_LABEL[evento.tipoPartido]}{evento.jornada ? ` J${evento.jornada}` : ''}
                        </Text>
                      </View>
                    )}
                    {evento.esLocal !== null && (
                      <View style={[styles.badge, { backgroundColor: evento.esLocal ? `${c.boton}18` : '#ef444418', borderColor: evento.esLocal ? `${c.boton}35` : '#ef444435' }]}>
                        <Text style={[styles.badgeText, { color: evento.esLocal ? c.boton : '#ef4444' }]}>
                          {evento.esLocal ? t('coachManagement.home') : t('coachManagement.away')}
                        </Text>
                      </View>
                    )}
                    {evento.isClosed && (
                      <View style={[styles.badge, { backgroundColor: '#6b728018', borderColor: '#6b728035' }]}>
                        <Text style={[styles.badgeText, { color: '#6b7280' }]}>✓ Finalizado</Text>
                      </View>
                    )}
                  </View>
                </View>
                <TouchableOpacity
                  style={[styles.gestionarButton, { borderColor: `${c.boton}40`, backgroundColor: `${c.boton}10` }]}
                  onPress={() => abrirModal(evento)}
                >
                  <Text style={[styles.gestionarText, { color: c.boton }]}>{t('coachManagement.manage')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ── MODAL GESTIONAR EVENTO ── */}
      <Modal visible={modalGestionar} transparent animationType="slide" onRequestClose={() => setModalGestionar(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalGestionar(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>
                {eventoSeleccionado?.tipo === 'PARTIDO' ? '⚽' : '🏃'} {eventoSeleccionado?.titulo}
              </Text>
              <TouchableOpacity style={[styles.closeButton, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setModalGestionar(false)}>
                <Text style={[styles.closeText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSubtitulo, { color: c.subtexto }]}>
              {eventoSeleccionado?.fecha} · {eventoSeleccionado?.horaInicio}
              {eventoSeleccionado?.horaFin ? ` - ${eventoSeleccionado?.horaFin}` : ''}
            </Text>

            {/* Tabs si es partido cerrado */}
            {eventoSeleccionado?.tipo === 'PARTIDO' && eventoSeleccionado?.isClosed && (
              <View style={[styles.tabsRow, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                <TouchableOpacity
                  style={[styles.tabBtn, tabModal === 'convocatoria' && { backgroundColor: c.boton }]}
                  onPress={() => setTabModal('convocatoria')}
                >
                  <Text style={[styles.tabBtnText, { color: tabModal === 'convocatoria' ? '#fff' : c.subtexto }]}>
                    Convocatoria
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.tabBtn, tabModal === 'stats' && { backgroundColor: c.boton }]}
                  onPress={() => setTabModal('stats')}
                >
                  <Text style={[styles.tabBtnText, { color: tabModal === 'stats' ? '#fff' : c.subtexto }]}>
                    📊 Estadísticas
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {/* ── CONVOCATORIA / ASISTENCIA ── */}
            {(tabModal === 'convocatoria' || eventoSeleccionado?.tipo === 'ENTRENAMIENTO' || !eventoSeleccionado?.isClosed) && (
              <>
                <Text style={[styles.sectionLabel, { color: c.subtexto, marginTop: 12 }]}>
                  {eventoSeleccionado?.tipo === 'PARTIDO' ? t('coachManagement.callup') : t('coachManagement.attendance')}
                </Text>

                <View style={styles.jugadoresList}>
                  {jugadores.map((jugador) => (
                    <View key={jugador.id} style={[styles.jugadorRow, { borderBottomColor: c.bordeInput }]}>
                      <View style={[styles.jugadorAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                        <Text style={[styles.jugadorAvatarText, { color: c.boton }]}>{jugador.firstName.charAt(0)}</Text>
                      </View>
                      <View style={styles.jugadorInfo}>
                        <Text style={[styles.jugadorNombre, { color: c.texto }]}>{jugador.firstName} {jugador.lastName}</Text>
                        <Text style={[styles.jugadorDorsal, { color: c.subtexto }]}>#{jugador.jerseyNumber}</Text>
                      </View>
                      {eventoSeleccionado?.tipo === 'PARTIDO' ? (
                        <TouchableOpacity
                          style={[styles.estadoButton, { backgroundColor: `${getConvColor(jugador.estadoConv)}18`, borderColor: `${getConvColor(jugador.estadoConv)}40` }]}
                          onPress={() => !eventoSeleccionado?.isClosed && toggleConvocatoria(jugador.id)}
                        >
                          <Text style={[styles.estadoText, { color: getConvColor(jugador.estadoConv) }]}>{getConvLabel(jugador.estadoConv)}</Text>
                        </TouchableOpacity>
                      ) : (
                        <TouchableOpacity
                          style={[styles.estadoButton, {
                            backgroundColor: jugador.estadoAsist === 'ATTENDED' ? `${c.boton}18` : jugador.estadoAsist === 'MISSED' ? '#ef444418' : `${c.bordeInput}40`,
                            borderColor: jugador.estadoAsist === 'ATTENDED' ? `${c.boton}40` : jugador.estadoAsist === 'MISSED' ? '#ef444440' : c.bordeInput,
                          }]}
                          onPress={() => toggleAsistencia(jugador.id)}
                        >
                          <Text style={[styles.estadoText, { color: jugador.estadoAsist === 'ATTENDED' ? c.boton : jugador.estadoAsist === 'MISSED' ? '#ef4444' : c.subtexto }]}>
                            {jugador.estadoAsist === 'ATTENDED' ? `✓ ${t('coachManagement.attended')}` : jugador.estadoAsist === 'MISSED' ? `✗ ${t('coachManagement.missed')}` : '—'}
                          </Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={[styles.multaButton, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b40' }]} onPress={() => abrirMulta(jugador)}>
                        <Text style={styles.multaButtonText}>⚠️</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* ── ESTADÍSTICAS ── */}
            {tabModal === 'stats' && eventoSeleccionado?.isClosed && (
              <ScrollView style={styles.statsScroll} showsVerticalScrollIndicator={false}>
                {jugadores
                  .filter((j) => j.estadoConv !== 'DECLINED')
                  .map((jugador) => {
                    const s = stats[jugador.id] || { goals: '0', assists: '0', yellowCards: '0', redCards: '0', minutesPlayed: '0', wasStarter: false }
                    return (
                      <View key={jugador.id} style={[styles.statsCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>

                        {/* Header jugador */}
                        <View style={styles.statsCardHeader}>
                          <View style={[styles.jugadorAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                            <Text style={[styles.jugadorAvatarText, { color: c.boton }]}>{jugador.firstName.charAt(0)}</Text>
                          </View>
                          <Text style={[styles.jugadorNombre, { color: c.texto }]}>{jugador.firstName} {jugador.lastName} · #{jugador.jerseyNumber}</Text>
                          {/* Titular toggle */}
                          <TouchableOpacity
                            style={[styles.titularBtn, { backgroundColor: s.wasStarter ? `${c.boton}18` : c.fondo, borderColor: s.wasStarter ? c.boton : c.bordeInput }]}
                            onPress={() => updateStat(jugador.id, 'wasStarter', !s.wasStarter)}
                          >
                            <Text style={[styles.titularText, { color: s.wasStarter ? c.boton : c.subtexto }]}>
                              {s.wasStarter ? '⬛ Titular' : '⬜ Suplente'}
                            </Text>
                          </TouchableOpacity>
                        </View>

                        {/* Stats grid */}
                        <View style={styles.statsGrid}>
                          <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: c.subtexto }]}>⚽ Goles</Text>
                            <TextInput
                              style={[styles.statInput, { backgroundColor: c.fondo, borderColor: c.bordeInput, color: c.texto }]}
                              value={s.goals}
                              onChangeText={(v) => updateStat(jugador.id, 'goals', v)}
                              keyboardType="numeric"
                              maxLength={2}
                            />
                          </View>
                          <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: c.subtexto }]}>🅰️ Asist.</Text>
                            <TextInput
                              style={[styles.statInput, { backgroundColor: c.fondo, borderColor: c.bordeInput, color: c.texto }]}
                              value={s.assists}
                              onChangeText={(v) => updateStat(jugador.id, 'assists', v)}
                              keyboardType="numeric"
                              maxLength={2}
                            />
                          </View>
                          <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: c.subtexto }]}>🟨 Amar.</Text>
                            <TextInput
                              style={[styles.statInput, { backgroundColor: c.fondo, borderColor: c.bordeInput, color: c.texto }]}
                              value={s.yellowCards}
                              onChangeText={(v) => updateStat(jugador.id, 'yellowCards', v)}
                              keyboardType="numeric"
                              maxLength={1}
                            />
                          </View>
                          <View style={styles.statItem}>
                            <Text style={[styles.statLabel, { color: c.subtexto }]}>🟥 Rojas</Text>
                            <TextInput
                              style={[styles.statInput, { backgroundColor: c.fondo, borderColor: c.bordeInput, color: c.texto }]}
                              value={s.redCards}
                              onChangeText={(v) => updateStat(jugador.id, 'redCards', v)}
                              keyboardType="numeric"
                              maxLength={1}
                            />
                          </View>
                          <View style={[styles.statItem, { flex: 2 }]}>
                            <Text style={[styles.statLabel, { color: c.subtexto }]}>⏱ Minutos</Text>
                            <TextInput
                              style={[styles.statInput, { backgroundColor: c.fondo, borderColor: c.bordeInput, color: c.texto }]}
                              value={s.minutesPlayed}
                              onChangeText={(v) => updateStat(jugador.id, 'minutesPlayed', v)}
                              keyboardType="numeric"
                              maxLength={3}
                            />
                          </View>
                        </View>

                      </View>
                    )
                  })}

                {/* Botón guardar stats */}
                <TouchableOpacity style={[styles.guardarStatsBtn, { backgroundColor: c.boton }]}>
                  <Text style={[styles.guardarStatsBtnText, { color: c.botonTexto }]}>💾 Guardar estadísticas</Text>
                </TouchableOpacity>
              </ScrollView>
            )}

          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MODAL MULTA ── */}
      <Modal visible={modalMulta} transparent animationType="fade" onRequestClose={() => setModalMulta(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalMulta(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>⚠️ {t('coachManagement.fineTitle')}</Text>
              <TouchableOpacity style={[styles.closeButton, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setModalMulta(false)}>
                <Text style={[styles.closeText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {jugadorMulta && (
              <View style={[styles.jugadorPill, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                <Text style={[styles.jugadorPillText, { color: c.boton }]}>
                  {jugadorMulta.firstName} {jugadorMulta.lastName} · #{jugadorMulta.jerseyNumber}
                </Text>
              </View>
            )}

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('coachManagement.fineReason')} *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder={t('coachManagement.fineReasonPlaceholder')} placeholderTextColor={c.subtexto} value={motivoMulta} onChangeText={setMotivoMulta} />

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('coachManagement.fineAmount')} *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder={t('coachManagement.fineAmountPlaceholder')} placeholderTextColor={c.subtexto} value={importeMulta} onChangeText={setImporteMulta} keyboardType="numeric" />

            <TouchableOpacity style={[styles.confirmarButton, { backgroundColor: '#f59e0b', opacity: motivoMulta && importeMulta ? 1 : 0.5 }]}>
              <Text style={styles.confirmarText}>{t('coachManagement.fineConfirm')}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.cancelarButton, { borderColor: c.bordeInput }]} onPress={() => setModalMulta(false)}>
              <Text style={[styles.cancelarText, { color: c.subtexto }]}>{t('coachManagement.cancel')}</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MODAL CREAR EVENTO ── */}
      <Modal visible={modalCrear} transparent animationType="slide" onRequestClose={() => setModalCrear(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalCrear(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>📅 {t('coachManagement.createTitle')}</Text>
              <TouchableOpacity style={[styles.closeButton, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setModalCrear(false)}>
                <Text style={[styles.closeText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('coachManagement.createType')}</Text>
            <View style={styles.tipoRow}>
              {(['PARTIDO', 'ENTRENAMIENTO'] as TipoEvento[]).map((tipo) => (
                <TouchableOpacity
                  key={tipo}
                  style={[styles.tipoButton, { borderColor: tipoNuevo === tipo ? c.boton : c.bordeInput, backgroundColor: tipoNuevo === tipo ? `${c.boton}18` : c.input }]}
                  onPress={() => setTipoNuevo(tipo)}
                >
                  <Text style={[styles.tipoText, { color: tipoNuevo === tipo ? c.boton : c.subtexto }]}>
                    {tipo === 'PARTIDO' ? `⚽ ${t('coachManagement.createMatch')}` : `🏃 ${t('coachManagement.createTraining')}`}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {tipoNuevo === 'PARTIDO' && (
              <>
                <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('coachManagement.createOpponent')} *</Text>
                <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder={t('coachManagement.createOpponentPlaceholder')} placeholderTextColor={c.subtexto} value={rival} onChangeText={setRival} />
              </>
            )}

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('coachManagement.createTimeStart')} *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="19:00" placeholderTextColor={c.subtexto} value={horaInicio} onChangeText={setHoraInicio} />

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('coachManagement.createTimeEnd')}</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="20:30" placeholderTextColor={c.subtexto} value={horaFin} onChangeText={setHoraFin} />

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('coachManagement.createField')}</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder={t('coachManagement.createFieldPlaceholder')} placeholderTextColor={c.subtexto} value={campo} onChangeText={setCampo} />

            <TouchableOpacity style={[styles.confirmarButton, { backgroundColor: c.boton }]}>
              <Text style={styles.confirmarText}>{t('coachManagement.createSave')}</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>

    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 24, paddingTop: 20, paddingBottom: 40 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  crearButton: { padding: 14, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  crearButtonText: { fontWeight: 'bold', fontSize: 15, letterSpacing: 0.3 },
  sectionLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  eventosList: { gap: 10 },
  eventoCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 3, padding: 14 },
  eventoRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  eventoInfo: { flex: 1, gap: 3 },
  eventoTitulo: { fontSize: 14, fontWeight: '700' },
  eventoMeta: { fontSize: 12 },
  badgesRow: { flexDirection: 'row', gap: 6, marginTop: 4, flexWrap: 'wrap' },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  gestionarButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start' },
  gestionarText: { fontSize: 12, fontWeight: '600' },
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', padding: 16, paddingBottom: 32 },
  modalCard: { borderRadius: 20, borderWidth: 1, padding: 20, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  modalTitulo: { fontSize: 17, fontWeight: 'bold', flex: 1 },
  modalSubtitulo: { fontSize: 13, marginBottom: 8 },
  closeButton: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 13, fontWeight: '600' },

  // Tabs modal
  tabsRow: { flexDirection: 'row', borderRadius: 10, borderWidth: 1, padding: 3, marginVertical: 10, gap: 3 },
  tabBtn: { flex: 1, paddingVertical: 7, borderRadius: 8, alignItems: 'center' },
  tabBtnText: { fontSize: 13, fontWeight: '600' },

  // Jugadores
  jugadoresList: { marginTop: 4 },
  jugadorRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, borderBottomWidth: 1 },
  jugadorAvatar: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  jugadorAvatarText: { fontSize: 15, fontWeight: 'bold' },
  jugadorInfo: { flex: 1 },
  jugadorNombre: { fontSize: 13, fontWeight: '600' },
  jugadorDorsal: { fontSize: 12 },
  estadoButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  estadoText: { fontSize: 11, fontWeight: '600' },
  multaButton: { width: 32, height: 32, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  multaButtonText: { fontSize: 14 },

  // Stats
  statsScroll: { maxHeight: 420 },
  statsCard: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10, gap: 10 },
  statsCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titularBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, marginLeft: 'auto' },
  titularText: { fontSize: 11, fontWeight: '600' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  statItem: { flex: 1, minWidth: 60, gap: 4, alignItems: 'center' },
  statLabel: { fontSize: 11, fontWeight: '500', textAlign: 'center' },
  statInput: { borderWidth: 1, borderRadius: 8, padding: 6, fontSize: 16, fontWeight: 'bold', textAlign: 'center', width: 52 },
  guardarStatsBtn: { padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 8, marginBottom: 16 },
  guardarStatsBtnText: { fontWeight: 'bold', fontSize: 15 },

  // Multa
  jugadorPill: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, alignSelf: 'flex-start', marginBottom: 16 },
  jugadorPillText: { fontSize: 13, fontWeight: '600' },
  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 14 },
  confirmarButton: { padding: 14, borderRadius: 10, alignItems: 'center', marginTop: 4, marginBottom: 10 },
  confirmarText: { color: '#ffffff', fontWeight: 'bold', fontSize: 15 },
  cancelarButton: { padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  cancelarText: { fontSize: 14, fontWeight: '500' },

  // Crear evento
  tipoRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tipoButton: { flex: 1, padding: 10, borderRadius: 10, borderWidth: 1.5, alignItems: 'center' },
  tipoText: { fontSize: 13, fontWeight: '600' },
})