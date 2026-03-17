import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useTheme } from '../../lib/useTheme'

// ── MOCK DATA ──────────────────────────────────────────────

const SOLICITUDES = [
  { id: 1, firstName: 'Carlos', lastName: 'García', requestedRole: 'PLAYER', message: 'Soy el hijo de Juan, juego de delantero' },
  { id: 2, firstName: 'María', lastName: 'López', requestedRole: 'RELATIVE', message: 'Soy la madre de Pedro López, Cadete C' },
  { id: 3, firstName: 'Alejandro', lastName: 'Ruiz', requestedRole: 'COACH', message: 'Tengo el título de entrenador nivel 1' },
]

const EQUIPOS_MOCK = [
  { id: 1, nombre: 'Cadete C' },
  { id: 2, nombre: 'Juvenil A' },
  { id: 3, nombre: 'Senior' },
]

const JUGADORES_POR_EQUIPO: Record<number, { id: number; nombre: string; dorsal: number }[]> = {
  1: [
    { id: 1, nombre: 'Carlos García', dorsal: 1 },
    { id: 2, nombre: 'Juan López', dorsal: 7 },
    { id: 3, nombre: 'Pedro Martínez', dorsal: 10 },
  ],
  2: [
    { id: 4, nombre: 'Luis Sánchez', dorsal: 5 },
    { id: 5, nombre: 'Miguel Fernández', dorsal: 9 },
  ],
  3: [
    { id: 6, nombre: 'Antonio García', dorsal: 3 },
  ],
}

const ROLES = ['PLAYER', 'COACH', 'RELATIVE', 'OTHER']
const PARENTESCOS = ['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER']
const CATEGORIAS = ['U6', 'U8', 'U10', 'U12', 'U14', 'U16', 'U19', 'SENIOR']
const GENEROS = ['MALE', 'FEMALE', 'MIXED']

const ANUNCIOS_MOCK = [
  { id: 1, titulo: 'Reunión de padres', contenido: 'Reunión de padres el viernes a las 20:00h.', autor: 'Pedro Rodríguez', fecha: '10/04/2025', isPinned: false, teamId: null },
  { id: 2, titulo: 'Nuevo patrocinador', contenido: 'El club anuncia un nuevo acuerdo de patrocinio.', autor: 'Pedro Rodríguez', fecha: '08/04/2025', isPinned: true, teamId: null },
]

const CUOTAS_MOCK = [
  { id: 1, concept: 'Mensualidad Abril', amount: 50, dueDate: '15/04/2025', teamId: 1, teamNombre: 'Cadete C', paid: 8, pending: 4, overdue: 2 },
  { id: 2, concept: 'Inscripción temporada', amount: 120, dueDate: '01/09/2025', teamId: null, teamNombre: null, paid: 20, pending: 5, overdue: 0 },
]

const PAGOS_MOCK = [
  { id: 1, firstName: 'Carlos', lastName: 'García', status: 'PAID', paidDate: '10/04' },
  { id: 2, firstName: 'Juan', lastName: 'López', status: 'PENDING', paidDate: null },
  { id: 3, firstName: 'Pedro', lastName: 'Martínez', status: 'OVERDUE', paidDate: null },
  { id: 4, firstName: 'Luis', lastName: 'Sánchez', status: 'PAID', paidDate: '09/04' },
]

const EQUIPOS_LIST = [
  { id: 1, categoria: 'U14', genero: 'MALE', sufijo: 'C', isActive: true },
  { id: 2, categoria: 'U16', genero: 'MALE', sufijo: 'A', isActive: true },
  { id: 3, categoria: 'SENIOR', genero: 'MALE', sufijo: 'A', isActive: false },
]

const TEMPORADAS_LIST = [
  { id: 1, nombre: '2025/2026', startDate: '01/09/2025', endDate: '30/06/2026', isActive: true },
  { id: 2, nombre: '2024/2025', startDate: '01/09/2024', endDate: '30/06/2025', isActive: false },
]

// ──────────────────────────────────────────────────────────

type Tab = 'requests' | 'board' | 'fees' | 'club'

const STATUS_COLOR: Record<string, string> = {
  PAID: '#16a34a', PENDING: '#f59e0b', OVERDUE: '#ef4444',
}
const STATUS_LABEL: Record<string, string> = {
  PAID: '✓ Pagado', PENDING: '⏳ Pendiente', OVERDUE: '❌ Vencido',
}

export default function GestionPresidente() {
  const c = useTheme()
  const { t } = useTranslation()

  const [tab, setTab] = useState<Tab>('requests')

  // Solicitudes
  const [solicitudes, setSolicitudes] = useState(SOLICITUDES)
  const [rolesSeleccionados, setRolesSeleccionados] = useState<Record<number, string>>({})
  const [equiposSeleccionados, setEquiposSeleccionados] = useState<Record<number, number | null>>({})
  const [jugadoresSeleccionados, setJugadoresSeleccionados] = useState<Record<number, number | null>>({})
  const [parentescosSeleccionados, setParentescosSeleccionados] = useState<Record<number, string>>({})

  // Tablón
  const [anuncios, setAnuncios] = useState(ANUNCIOS_MOCK)
  const [modalAnuncio, setModalAnuncio] = useState(false)
  const [aTitulo, setATitulo] = useState('')
  const [aContenido, setAContenido] = useState('')
  const [aPinned, setAPinned] = useState(false)

  // Cuotas
  const [cuotas, setCuotas] = useState(CUOTAS_MOCK)
  const [modalCuota, setModalCuota] = useState(false)
  const [modalDetalleCuota, setModalDetalleCuota] = useState(false)
  const [cConcepto, setCConcepto] = useState('')
  const [cImporte, setCImporte] = useState('')
  const [cFecha, setCFecha] = useState('')
  const [cEquipoId, setCEquipoId] = useState<number | null>(null)
  const [pagos, setPagos] = useState(PAGOS_MOCK)

  // Club
  const [clubNombre, setClubNombre] = useState('FC Ejemplo')
  const [equipos, setEquipos] = useState(EQUIPOS_LIST)
  const [modalEquipo, setModalEquipo] = useState(false)
  const [eCategoria, setECategoria] = useState('U14')
  const [eGenero, setEGenero] = useState('MALE')
  const [eSufijo, setESufijo] = useState('')
  const [temporadas, setTemporadas] = useState(TEMPORADAS_LIST)
  const [modalTemporada, setModalTemporada] = useState(false)
  const [tNombre, setTNombre] = useState('')
  const [tInicio, setTInicio] = useState('')
  const [tFin, setTFin] = useState('')

  const getRolSeleccionado = (s: typeof SOLICITUDES[0]) => rolesSeleccionados[s.id] || s.requestedRole
  const getEquipoSeleccionado = (id: number) => equiposSeleccionados[id] ?? null
  const esRelative = (s: typeof SOLICITUDES[0]) => getRolSeleccionado(s) === 'RELATIVE'

  const aprobarSolicitud = (id: number) => setSolicitudes((prev) => prev.filter((s) => s.id !== id))
  const rechazarSolicitud = (id: number) => setSolicitudes((prev) => prev.filter((s) => s.id !== id))

  const publishAnuncio = () => {
    if (!aTitulo || !aContenido) return
    setAnuncios((prev) => [{
      id: Date.now(), titulo: aTitulo, contenido: aContenido,
      autor: 'Pedro Rodríguez', fecha: new Date().toLocaleDateString('es'),
      isPinned: aPinned, teamId: null,
    }, ...prev])
    setATitulo(''); setAContenido(''); setAPinned(false)
    setModalAnuncio(false)
  }

  const deleteAnuncio = (id: number) => setAnuncios((prev) => prev.filter((a) => a.id !== id))
  const marcarPagado = (id: number) => setPagos((prev) => prev.map((p) => p.id === id ? { ...p, status: 'PAID', paidDate: new Date().toLocaleDateString('es') } : p))

  const TABS: { key: Tab; label: string }[] = [
    { key: 'requests', label: t('presidentManagement.tab_requests') },
    { key: 'board', label: t('presidentManagement.tab_board') },
    { key: 'fees', label: t('presidentManagement.tab_fees') },
    { key: 'club', label: t('presidentManagement.tab_club') },
  ]

  return (
    <View style={[styles.wrapper, { backgroundColor: c.fondo }]}>

      {/* Header fijo */}
      <View style={[styles.headerFixed, { backgroundColor: c.fondo, borderBottomColor: c.bordeInput }]}>
        <Text style={[styles.titulo, { color: c.texto }]}>
          👑 {t('presidentManagement.title')}
          {solicitudes.length > 0 && (
            <Text style={{ color: '#f59e0b' }}> · {solicitudes.length} {t('presidentManagement.pending')}</Text>
          )}
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
                  {item.label}{item.key === 'requests' && solicitudes.length > 0 ? ` (${solicitudes.length})` : ''}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

        {/* ── TAB SOLICITUDES ── */}
        {tab === 'requests' && (
          <View>
            {solicitudes.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                <Text style={[styles.emptyText, { color: c.subtexto }]}>✅ {t('presidentManagement.noRequests')}</Text>
              </View>
            ) : (
              solicitudes.map((s) => {
                const rolActual = getRolSeleccionado(s)
                const equipoActualId = getEquipoSeleccionado(s.id)
                const jugadoresDisponibles = equipoActualId ? (JUGADORES_POR_EQUIPO[equipoActualId] || []) : []

                return (
                  <View key={s.id} style={[styles.requestCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>

                    {/* Header */}
                    <View style={styles.requestHeader}>
                      <View style={[styles.avatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                        <Text style={[styles.avatarText, { color: c.boton }]}>{s.firstName.charAt(0)}</Text>
                      </View>
                      <View style={styles.requestInfo}>
                        <Text style={[styles.requestNombre, { color: c.texto }]}>{s.firstName} {s.lastName}</Text>
                        <Text style={[styles.requestRolReq, { color: c.subtexto }]}>{t('presidentManagement.requestedAs')}: {s.requestedRole}</Text>
                      </View>
                    </View>

                    {/* Mensaje */}
                    {s.message && (
                      <View style={[styles.mensajeBox, { backgroundColor: c.fondo, borderColor: c.bordeInput }]}>
                        <Text style={[styles.mensajeText, { color: c.subtexto }]}>"{s.message}"</Text>
                      </View>
                    )}

                    {/* Rol */}
                    <Text style={[styles.selectLabel, { color: c.subtexto }]}>{t('presidentManagement.role')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      <View style={styles.chipsRow}>
                        {ROLES.map((rol) => (
                          <TouchableOpacity
                            key={rol}
                            style={[styles.chip, {
                              backgroundColor: rolActual === rol ? `${c.boton}18` : c.fondo,
                              borderColor: rolActual === rol ? c.boton : c.bordeInput,
                            }]}
                            onPress={() => setRolesSeleccionados((prev) => ({ ...prev, [s.id]: rol }))}
                          >
                            <Text style={[styles.chipText, { color: rolActual === rol ? c.boton : c.subtexto }]}>{rol}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Equipo */}
                    <Text style={[styles.selectLabel, { color: c.subtexto }]}>{t('presidentManagement.team')}</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
                      <View style={styles.chipsRow}>
                        {EQUIPOS_MOCK.map((eq) => (
                          <TouchableOpacity
                            key={eq.id}
                            style={[styles.chip, {
                              backgroundColor: equipoActualId === eq.id ? `${c.boton}18` : c.fondo,
                              borderColor: equipoActualId === eq.id ? c.boton : c.bordeInput,
                            }]}
                            onPress={() => {
                              setEquiposSeleccionados((prev) => ({ ...prev, [s.id]: eq.id }))
                              setJugadoresSeleccionados((prev) => ({ ...prev, [s.id]: null }))
                            }}
                          >
                            <Text style={[styles.chipText, { color: equipoActualId === eq.id ? c.boton : c.subtexto }]}>{eq.nombre}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </ScrollView>

                    {/* Si es RELATIVE → selector de jugador + parentesco */}
                    {esRelative(s) && equipoActualId && (
                      <>
                        <Text style={[styles.selectLabel, { color: c.subtexto }]}>Jugador familiar</Text>
                        <View style={[styles.jugadoresList, { borderColor: c.bordeInput }]}>
                          {jugadoresDisponibles.map((jug) => {
                            const seleccionado = jugadoresSeleccionados[s.id] === jug.id
                            return (
                              <TouchableOpacity
                                key={jug.id}
                                style={[
                                  styles.jugadorRow,
                                  { borderBottomColor: c.bordeInput },
                                  seleccionado && { backgroundColor: `${c.boton}08` },
                                ]}
                                onPress={() => setJugadoresSeleccionados((prev) => ({ ...prev, [s.id]: jug.id }))}
                              >
                                <View style={[styles.jugAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                                  <Text style={[styles.jugAvatarText, { color: c.boton }]}>{jug.nombre.charAt(0)}</Text>
                                </View>
                                <Text style={[styles.jugNombre, { color: c.texto }]}>{jug.nombre}</Text>
                                <Text style={[styles.jugDorsal, { color: c.subtexto }]}>#{jug.dorsal}</Text>
                                {seleccionado && <Text style={{ color: c.boton, fontSize: 16 }}>✓</Text>}
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
                                  <TouchableOpacity
                                    key={par}
                                    style={[styles.chip, {
                                      backgroundColor: parentescosSeleccionados[s.id] === par ? `${c.boton}18` : c.fondo,
                                      borderColor: parentescosSeleccionados[s.id] === par ? c.boton : c.bordeInput,
                                    }]}
                                    onPress={() => setParentescosSeleccionados((prev) => ({ ...prev, [s.id]: par }))}
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

                    {/* Botones */}
                    <View style={styles.actionsRow}>
                      <TouchableOpacity style={[styles.aprobarBtn, { backgroundColor: c.boton }]} onPress={() => aprobarSolicitud(s.id)}>
                        <Text style={styles.actionBtnText}>✓ {t('presidentManagement.approve')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.rechazarBtn, { borderColor: '#ef444440', backgroundColor: '#ef444410' }]} onPress={() => rechazarSolicitud(s.id)}>
                        <Text style={[styles.actionBtnText, { color: '#ef4444' }]}>✗ {t('presidentManagement.reject')}</Text>
                      </TouchableOpacity>
                    </View>

                  </View>
                )
              })
            )}
          </View>
        )}

        {/* ── TAB TABLÓN ── */}
        {tab === 'board' && (
          <View>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.boton }]} onPress={() => setModalAnuncio(true)}>
              <Text style={[styles.primaryButtonText, { color: c.botonTexto }]}>{t('presidentManagement.newAnnouncement')}</Text>
            </TouchableOpacity>
            <View style={styles.list}>
              {anuncios.map((a) => (
                <View key={a.id} style={[styles.anuncioCard, { backgroundColor: c.input, borderColor: a.isPinned ? `${c.boton}60` : c.bordeInput, borderWidth: a.isPinned ? 1.5 : 1 }]}>
                  <View style={styles.anuncioHeader}>
                    <View style={styles.anuncioBadges}>
                      {a.isPinned && (
                        <View style={[styles.badge, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                          <Text style={[styles.badgeText, { color: c.boton }]}>📌 Fijado</Text>
                        </View>
                      )}
                      <View style={[styles.badge, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b35' }]}>
                        <Text style={[styles.badgeText, { color: '#f59e0b' }]}>🏆 Club</Text>
                      </View>
                    </View>
                    <View style={styles.anuncioActions}>
                      <TouchableOpacity style={[styles.iconBtn, { borderColor: c.bordeInput }]}>
                        <Text style={styles.iconBtnText}>✏️</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={[styles.iconBtn, { borderColor: '#ef444435', backgroundColor: '#ef444410' }]} onPress={() => deleteAnuncio(a.id)}>
                        <Text style={styles.iconBtnText}>🗑️</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                  <Text style={[styles.anuncioTitulo, { color: c.texto }]}>{a.titulo}</Text>
                  <Text style={[styles.anuncioContenido, { color: c.subtexto }]} numberOfLines={2}>{a.contenido}</Text>
                  <View style={styles.anuncioFooter}>
                    <Text style={[styles.anuncioMeta, { color: c.subtexto }]}>✍️ {a.autor}</Text>
                    <Text style={[styles.anuncioMeta, { color: c.subtexto }]}>{a.fecha}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── TAB CUOTAS ── */}
        {tab === 'fees' && (
          <View>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.boton }]} onPress={() => setModalCuota(true)}>
              <Text style={[styles.primaryButtonText, { color: c.botonTexto }]}>{t('presidentManagement.newFee')}</Text>
            </TouchableOpacity>
            <View style={styles.list}>
              {cuotas.map((cuota) => (
                <View key={cuota.id} style={[styles.cuotaCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                  <View style={styles.cuotaHeader}>
                    <Text style={[styles.cuotaTitulo, { color: c.texto }]}>{cuota.concept}</Text>
                    <Text style={[styles.cuotaImporte, { color: c.boton }]}>{cuota.amount}€</Text>
                  </View>
                  <View style={styles.cuotaMeta}>
                    <Text style={[styles.cuotaMetaText, { color: c.subtexto }]}>Vence {cuota.dueDate}</Text>
                    <View style={[styles.badge, { backgroundColor: cuota.teamId ? '#3b82f618' : '#f59e0b18', borderColor: cuota.teamId ? '#3b82f635' : '#f59e0b35' }]}>
                      <Text style={[styles.badgeText, { color: cuota.teamId ? '#3b82f6' : '#f59e0b' }]}>
                        {cuota.teamId ? `👕 ${cuota.teamNombre}` : '🏆 Todo el club'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.cuotaStats}>
                    <View style={[styles.statPill, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                      <Text style={[styles.statText, { color: c.boton }]}>✅ {cuota.paid} {t('presidentManagement.paid')}</Text>
                    </View>
                    <View style={[styles.statPill, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b35' }]}>
                      <Text style={[styles.statText, { color: '#f59e0b' }]}>⏳ {cuota.pending} {t('presidentManagement.pending_pay')}</Text>
                    </View>
                    <View style={[styles.statPill, { backgroundColor: '#ef444418', borderColor: '#ef444435' }]}>
                      <Text style={[styles.statText, { color: '#ef4444' }]}>❌ {cuota.overdue} {t('presidentManagement.overdue')}</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={[styles.verDetalleBtn, { borderColor: c.bordeInput }]} onPress={() => setModalDetalleCuota(true)}>
                    <Text style={[styles.verDetalleText, { color: c.subtexto }]}>{t('presidentManagement.viewDetail')} →</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* ── TAB CLUB ── */}
        {tab === 'club' && (
          <View>
            <Text style={[styles.subSectionTitle, { color: c.texto }]}>🏆 {t('presidentManagement.clubName')}</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} value={clubNombre} onChangeText={setClubNombre} placeholder={t('presidentManagement.clubNamePlaceholder')} placeholderTextColor={c.subtexto} />

            <View style={[styles.codigoCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
              <View>
                <Text style={[styles.codigoLabel, { color: c.subtexto }]}>{t('presidentManagement.invitationCode')}</Text>
                <Text style={[styles.codigoValue, { color: c.boton }]}>ABC-123</Text>
              </View>
              <TouchableOpacity style={[styles.regenBtn, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                <Text style={[styles.regenText, { color: c.boton }]}>🔄 {t('presidentManagement.regenerate')}</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.boton, marginBottom: 28 }]}>
              <Text style={[styles.primaryButtonText, { color: c.botonTexto }]}>{t('presidentManagement.saveChanges')}</Text>
            </TouchableOpacity>

            {/* Equipos */}
            <View style={styles.subSectionHeader}>
              <Text style={[styles.subSectionTitle, { color: c.texto, marginBottom: 0 }]}>👕 Equipos</Text>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]} onPress={() => setModalEquipo(true)}>
                <Text style={[styles.smallBtnText, { color: c.boton }]}>{t('presidentManagement.newTeam')}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.list, { marginBottom: 24 }]}>
              {equipos.map((eq) => (
                <View key={eq.id} style={[styles.equipoCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                  <View style={styles.equipoInfo}>
                    <Text style={[styles.equipoNombre, { color: c.texto }]}>{eq.categoria} {eq.genero === 'MALE' ? '♂' : eq.genero === 'FEMALE' ? '♀' : '⚥'} {eq.sufijo}</Text>
                    {eq.isActive && (
                      <View style={[styles.badge, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                        <Text style={[styles.badgeText, { color: c.boton }]}>{t('presidentManagement.active')}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleBtn, { backgroundColor: eq.isActive ? '#ef444410' : `${c.boton}10`, borderColor: eq.isActive ? '#ef444435' : `${c.boton}35` }]}
                    onPress={() => setEquipos((prev) => prev.map((e) => e.id === eq.id ? { ...e, isActive: !e.isActive } : e))}
                  >
                    <Text style={[styles.toggleBtnText, { color: eq.isActive ? '#ef4444' : c.boton }]}>
                      {eq.isActive ? t('presidentManagement.deactivate') : t('presidentManagement.activate')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>

            {/* Temporadas */}
            <View style={styles.subSectionHeader}>
              <Text style={[styles.subSectionTitle, { color: c.texto, marginBottom: 0 }]}>🗓 Temporadas</Text>
              <TouchableOpacity style={[styles.smallBtn, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]} onPress={() => setModalTemporada(true)}>
                <Text style={[styles.smallBtnText, { color: c.boton }]}>{t('presidentManagement.newSeason')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.list}>
              {temporadas.map((temp) => (
                <View key={temp.id} style={[styles.equipoCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                  <View style={styles.equipoInfo}>
                    <Text style={[styles.equipoNombre, { color: c.texto }]}>{temp.nombre}</Text>
                    {temp.isActive && (
                      <View style={[styles.badge, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                        <Text style={[styles.badgeText, { color: c.boton }]}>{t('presidentManagement.active')}</Text>
                      </View>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.toggleBtn, { backgroundColor: temp.isActive ? '#ef444410' : `${c.boton}10`, borderColor: temp.isActive ? '#ef444435' : `${c.boton}35` }]}
                    onPress={() => setTemporadas((prev) => prev.map((t) => ({ ...t, isActive: t.id === temp.id })))}
                  >
                    <Text style={[styles.toggleBtnText, { color: temp.isActive ? '#ef4444' : c.boton }]}>
                      {temp.isActive ? t('presidentManagement.deactivate') : t('presidentManagement.activate')}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── MODAL NUEVO ANUNCIO ── */}
      <Modal visible={modalAnuncio} transparent animationType="slide" onRequestClose={() => setModalAnuncio(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalAnuncio(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>📢 {t('presidentManagement.newAnnouncement')}</Text>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setModalAnuncio(false)}>
                <Text style={[styles.closeBtnText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('presidentManagement.announcementTitle')} *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder={t('presidentManagement.announcementTitlePlaceholder')} placeholderTextColor={c.subtexto} value={aTitulo} onChangeText={setATitulo} />
            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('presidentManagement.announcementContent')} *</Text>
            <TextInput style={[styles.textArea, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder={t('presidentManagement.announcementContentPlaceholder')} placeholderTextColor={c.subtexto} value={aContenido} onChangeText={setAContenido} multiline numberOfLines={4} textAlignVertical="top" />
            <View style={styles.switchRow}>
              <Text style={[styles.inputLabel, { color: c.subtexto, marginBottom: 0 }]}>📌 {t('presidentManagement.announcementPin')}</Text>
              <Switch value={aPinned} onValueChange={setAPinned} trackColor={{ true: c.boton }} />
            </View>
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.boton, marginTop: 16 }]} onPress={publishAnuncio}>
              <Text style={[styles.primaryButtonText, { color: c.botonTexto }]}>{t('presidentManagement.publish')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MODAL NUEVA CUOTA ── */}
      <Modal visible={modalCuota} transparent animationType="slide" onRequestClose={() => setModalCuota(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalCuota(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>💶 {t('presidentManagement.newFee')}</Text>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setModalCuota(false)}>
                <Text style={[styles.closeBtnText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('presidentManagement.feeConcept')} *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder={t('presidentManagement.feeConceptPlaceholder')} placeholderTextColor={c.subtexto} value={cConcepto} onChangeText={setCConcepto} />

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('presidentManagement.feeAmount')} *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder={t('presidentManagement.feeAmountPlaceholder')} placeholderTextColor={c.subtexto} value={cImporte} onChangeText={setCImporte} keyboardType="numeric" />

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('presidentManagement.feeDueDate')} *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="15/04/2025" placeholderTextColor={c.subtexto} value={cFecha} onChangeText={setCFecha} />

            {/* Selector equipo */}
            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('presidentManagement.feeTeam')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              <View style={styles.chipsRow}>
                <TouchableOpacity
                  style={[styles.chip, { backgroundColor: cEquipoId === null ? `${c.boton}18` : c.fondo, borderColor: cEquipoId === null ? c.boton : c.bordeInput }]}
                  onPress={() => setCEquipoId(null)}
                >
                  <Text style={[styles.chipText, { color: cEquipoId === null ? c.boton : c.subtexto }]}>🏆 {t('presidentManagement.feeAllClub')}</Text>
                </TouchableOpacity>
                {EQUIPOS_MOCK.map((eq) => (
                  <TouchableOpacity
                    key={eq.id}
                    style={[styles.chip, { backgroundColor: cEquipoId === eq.id ? `${c.boton}18` : c.fondo, borderColor: cEquipoId === eq.id ? c.boton : c.bordeInput }]}
                    onPress={() => setCEquipoId(eq.id)}
                  >
                    <Text style={[styles.chipText, { color: cEquipoId === eq.id ? c.boton : c.subtexto }]}>👕 {eq.nombre}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.boton, opacity: cConcepto && cImporte && cFecha ? 1 : 0.5 }]}>
              <Text style={[styles.primaryButtonText, { color: c.botonTexto }]}>{t('presidentManagement.feeSave')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MODAL DETALLE CUOTA ── */}
      <Modal visible={modalDetalleCuota} transparent animationType="slide" onRequestClose={() => setModalDetalleCuota(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalDetalleCuota(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>💶 Mensualidad Abril</Text>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setModalDetalleCuota(false)}>
                <Text style={[styles.closeBtnText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>
            {pagos.map((pago) => (
              <View key={pago.id} style={[styles.pagoRow, { borderBottomColor: c.bordeInput }]}>
                <View style={[styles.avatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                  <Text style={[styles.avatarText, { color: c.boton }]}>{pago.firstName.charAt(0)}</Text>
                </View>
                <View style={styles.pagoInfo}>
                  <Text style={[styles.pagoNombre, { color: c.texto }]}>{pago.firstName} {pago.lastName}</Text>
                  {pago.paidDate && <Text style={[styles.pagoFecha, { color: c.subtexto }]}>{pago.paidDate}</Text>}
                </View>
                {pago.status !== 'PAID' ? (
                  <TouchableOpacity style={[styles.markPaidBtn, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]} onPress={() => marcarPagado(pago.id)}>
                    <Text style={[styles.markPaidText, { color: c.boton }]}>{t('presidentManagement.markPaid')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={[styles.statusPill, { backgroundColor: `${STATUS_COLOR[pago.status]}18`, borderColor: `${STATUS_COLOR[pago.status]}35` }]}>
                    <Text style={[styles.statusText, { color: STATUS_COLOR[pago.status] }]}>{STATUS_LABEL[pago.status]}</Text>
                  </View>
                )}
              </View>
            ))}
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MODAL NUEVO EQUIPO ── */}
      <Modal visible={modalEquipo} transparent animationType="slide" onRequestClose={() => setModalEquipo(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalEquipo(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>👕 {t('presidentManagement.newTeam')}</Text>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setModalEquipo(false)}>
                <Text style={[styles.closeBtnText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('presidentManagement.teamCategory')}</Text>
            <View style={styles.chipsWrap}>
              {CATEGORIAS.map((cat) => (
                <TouchableOpacity key={cat} style={[styles.chip, { backgroundColor: eCategoria === cat ? `${c.boton}18` : c.input, borderColor: eCategoria === cat ? c.boton : c.bordeInput }]} onPress={() => setECategoria(cat)}>
                  <Text style={[styles.chipText, { color: eCategoria === cat ? c.boton : c.subtexto }]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('presidentManagement.teamGender')}</Text>
            <View style={styles.chipsWrap}>
              {GENEROS.map((gen) => (
                <TouchableOpacity key={gen} style={[styles.chip, { backgroundColor: eGenero === gen ? `${c.boton}18` : c.input, borderColor: eGenero === gen ? c.boton : c.bordeInput }]} onPress={() => setEGenero(gen)}>
                  <Text style={[styles.chipText, { color: eGenero === gen ? c.boton : c.subtexto }]}>{gen}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('presidentManagement.teamSuffix')} *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder={t('presidentManagement.teamSuffixPlaceholder')} placeholderTextColor={c.subtexto} value={eSufijo} onChangeText={setESufijo} />
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.boton, opacity: eSufijo ? 1 : 0.5 }]}>
              <Text style={[styles.primaryButtonText, { color: c.botonTexto }]}>{t('presidentManagement.teamSave')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── MODAL NUEVA TEMPORADA ── */}
      <Modal visible={modalTemporada} transparent animationType="slide" onRequestClose={() => setModalTemporada(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalTemporada(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>🗓 {t('presidentManagement.newSeason')}</Text>
              <TouchableOpacity style={[styles.closeBtn, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={() => setModalTemporada(false)}>
                <Text style={[styles.closeBtnText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('presidentManagement.seasonName')} *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder={t('presidentManagement.seasonNamePlaceholder')} placeholderTextColor={c.subtexto} value={tNombre} onChangeText={setTNombre} />
            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('presidentManagement.seasonStart')} *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="01/09/2025" placeholderTextColor={c.subtexto} value={tInicio} onChangeText={setTInicio} />
            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('presidentManagement.seasonEnd')} *</Text>
            <TextInput style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]} placeholder="30/06/2026" placeholderTextColor={c.subtexto} value={tFin} onChangeText={setTFin} />
            <TouchableOpacity style={[styles.primaryButton, { backgroundColor: c.boton, opacity: tNombre && tInicio && tFin ? 1 : 0.5 }]}>
              <Text style={[styles.primaryButtonText, { color: c.botonTexto }]}>{t('presidentManagement.seasonSave')}</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  headerFixed: { paddingTop: 60, paddingHorizontal: 24, paddingBottom: 0, borderBottomWidth: 1 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  tabsRow: { flexDirection: 'row', gap: 4, marginBottom: 0 },
  tabButton: { paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabText: { fontSize: 14, fontWeight: '600' },
  container: { padding: 24, paddingBottom: 40 },
  list: { gap: 10 },
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 20, alignItems: 'center' },
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
  anuncioCard: { borderRadius: 14, padding: 14, gap: 6 },
  anuncioHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  anuncioBadges: { flexDirection: 'row', gap: 6 },
  anuncioActions: { flexDirection: 'row', gap: 6 },
  iconBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  iconBtnText: { fontSize: 12 },
  anuncioTitulo: { fontSize: 14, fontWeight: '700' },
  anuncioContenido: { fontSize: 12, lineHeight: 18 },
  anuncioFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  anuncioMeta: { fontSize: 11 },
  badge: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 8, paddingVertical: 2 },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Cuotas
  cuotaCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  cuotaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cuotaTitulo: { fontSize: 15, fontWeight: '700' },
  cuotaImporte: { fontSize: 18, fontWeight: 'bold' },
  cuotaMeta: { flexDirection: 'row', alignItems: 'center', gap: 8 },
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
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 14 },
  codigoCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, marginBottom: 14 },
  codigoLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  codigoValue: { fontSize: 22, fontWeight: 'bold', letterSpacing: 4 },
  regenBtn: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  regenText: { fontSize: 12, fontWeight: '600' },
  equipoCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 8 },
  equipoInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  equipoNombre: { fontSize: 14, fontWeight: '600' },
  toggleBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  toggleBtnText: { fontSize: 12, fontWeight: '600' },
  smallBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 5 },
  smallBtnText: { fontSize: 12, fontWeight: '600' },
  chipsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 14 },

  // Modales
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', padding: 16, paddingBottom: 32 },
  modalCard: { borderRadius: 20, borderWidth: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitulo: { fontSize: 17, fontWeight: 'bold', flex: 1 },
  closeBtn: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { fontSize: 13, fontWeight: '600' },
  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  textArea: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 14, minHeight: 100 },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
})