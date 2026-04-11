import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  TextInput,
  Alert
} from 'react-native'
import { useTheme } from '../../lib/useTheme'
import { useAuthStore } from '../../lib/store'
import { apiFetch } from '../../lib/api'

const TIPO_PARTIDO_LABEL: Record<string, string> = {
  LEAGUE: 'Liga',
  FRIENDLY: 'Amistoso',
  CUP: 'Copa',
  TOURNAMENT: 'Torneo',
  OTHER: 'Otro',
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DIAS_SEMANA = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do']
const DIAS_SEMANA_LARGO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

export default function Calendario() {
  const c = useTheme()
  const { t } = useTranslation()

  // --- 1. DATOS DEL STORE ---
  const activeClubId = useAuthStore((state: any) => state.activeClubId)
  const activeTeamId = useAuthStore((state: any) => state.activeTeamId) // 🟢 Sacamos el equipo
  const userRole = useAuthStore((state: any) => state.activeClubRole || 'COACH')
  const puedeEditar = userRole === 'COACH' || userRole === 'PRESIDENT'

  // --- 2. ESTADOS ---
  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)

  // Formulario nuevo evento
  const [nuevoTitulo, setNuevoTitulo] = useState('')
  const [nuevoTipo, setNuevoTipo] = useState<'PARTIDO' | 'ENTRENAMIENTO'>('ENTRENAMIENTO')
  const [nuevoTipoPartido, setNuevoTipoPartido] = useState<string>('LEAGUE') 
  const [nuevaHora, setNuevaHora] = useState('')
  
  // Modal y doble estado
  const [modalVisible, setModalVisible] = useState(false)
  const [modoModal, setModoModal] = useState<'ver' | 'crear'>('ver')
  
  // Datos API
  const [eventosDict, setEventosDict] = useState<Record<string, any[]>>({})
  const [loading, setLoading] = useState(false)

  // --- 3. PETICIÓN A LA API (GET) ---
  const fetchEventos = useCallback(async () => {
    const clubId = activeClubId || 7 // Fallback temporal
    setLoading(true)
    try {
      const response = await apiFetch(`/api/eventos/calendario?clubId=${clubId}&year=${anio}&month=${mes + 1}`)
      if (response.ok) {
        const data = await response.json()
        const agrupados: Record<string, any[]> = {}
        data.forEach((evento: any) => {
          if (!agrupados[evento.fecha]) agrupados[evento.fecha] = []
          agrupados[evento.fecha].push(evento)
        })
        setEventosDict(agrupados)
      } else {
        console.error("Error al cargar el calendario del servidor")
        setEventosDict({}) // Vaciamos si hay error
      }
    } catch (error) {
      console.error("Fallo:", error)
    } finally {
      setLoading(false)
    }
  }, [activeClubId, mes, anio])

  useEffect(() => {
    fetchEventos()
  }, [fetchEventos])

  // --- 4. LÓGICA DEL CALENDARIO ---
  const primerDia = new Date(anio, mes, 1)
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()
  let inicioSemana = primerDia.getDay() - 1
  if (inicioSemana < 0) inicioSemana = 6

  const mesAnterior = () => { if (mes === 0) { setMes(11); setAnio(anio - 1) } else setMes(mes - 1) }
  const mesSiguiente = () => { if (mes === 11) { setMes(0); setAnio(anio + 1) } else setMes(mes + 1) }
  const formatClave = (dia: number) => `${anio}-${(mes + 1).toString().padStart(2, '0')}-${dia.toString().padStart(2, '0')}`

  const handleDia = (dia: number) => {
    setDiaSeleccionado(formatClave(dia))
    setModoModal('ver') // Siempre abrimos en modo vista primero
    setModalVisible(true)
  }

  const eventosDelDia = diaSeleccionado ? (eventosDict[diaSeleccionado] || []) : []

  const formatFechaModal = (clave: string) => {
    const fecha = new Date(clave)
    const diaSemana = DIAS_SEMANA_LARGO[(fecha.getDay() + 6) % 7]
    return `${diaSemana} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`
  }

  // --- 5. ACCIONES CONECTADAS A LA API (POST / DELETE) ---
  const handleGuardarEvento = async () => {
    if(!nuevoTitulo || !nuevaHora) return Alert.alert("Error", "Por favor, rellena el título y la hora.")
    
    try {
      const payload = {
        clubId: activeClubId || 7, // Ajusta a tus datos de prueba si hace falta
        equipoId: activeTeamId || 1, // 🟢 Ajusta a tu equipo de prueba (vital para que Java no salte error)
        fecha: diaSeleccionado,
        titulo: nuevoTitulo,
        tipo: nuevoTipo,
        tipoPartido: nuevoTipo === 'PARTIDO' ? nuevoTipoPartido : null,
        horaInicio: nuevaHora,
        esLocal: true, // Lo forzamos a local por ahora, podrías añadir un botón más adelante
      }

      const response = await apiFetch('/api/eventos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.ok) {
        setModoModal('ver')
        setNuevoTitulo('')
        setNuevaHora('')
        fetchEventos() // 🔄 Recarga silenciosa para pintar el nuevo puntito
      } else {
        const errText = await response.text()
        Alert.alert("Error del servidor", errText || "No se pudo guardar el evento")
      }
    } catch (error) {
      console.error(error)
      Alert.alert("Error", "Fallo de conexión con el servidor")
    }
  }

  const handleEliminarEvento = (id: number, tipo: string) => {
    Alert.alert(
      "Eliminar evento", 
      "¿Seguro que quieres borrar este evento del calendario?",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: async () => {
          try {
            // Pasamos el ID y el tipo al endpoint de Spring Boot
            const response = await apiFetch(`/api/eventos/${id}?tipo=${tipo}`, { method: 'DELETE' })
            if (response.ok) {
              fetchEventos() // 🔄 Refrescamos el calendario
            } else {
              Alert.alert("Error", "No se pudo eliminar el evento")
            }
          } catch (e) {
            Alert.alert("Error", "Problema de red al eliminar")
          }
        }}
      ]
    )
  }

  // Construcción del array de días para el grid
  const celdas: (number | null)[] = [...Array(inicioSemana).fill(null), ...Array.from({ length: diasEnMes }, (_, i) => i + 1)]
  while (celdas.length % 7 !== 0) celdas.push(null)

  return (
    <View style={[styles.wrapper, { backgroundColor: c.fondo }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Cabecera */}
        <Text style={[styles.titulo, { color: c.texto }]}>📅 {t('calendar.title', 'Calendario')}</Text>

        <View style={styles.navMes}>
          <TouchableOpacity style={[styles.navButton, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={mesAnterior}>
            <Text style={[styles.navButtonText, { color: c.texto }]}>‹</Text>
          </TouchableOpacity>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <Text style={[styles.mesAnio, { color: c.texto }]}>{MESES[mes]} {anio}</Text>
            {loading && <ActivityIndicator size="small" color={c.boton} />}
          </View>
          <TouchableOpacity style={[styles.navButton, { backgroundColor: c.input, borderColor: c.bordeInput }]} onPress={mesSiguiente}>
            <Text style={[styles.navButtonText, { color: c.texto }]}>›</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.semanaHeader}>
          {DIAS_SEMANA.map((d) => <Text key={d} style={[styles.diaSemanaLabel, { color: c.subtexto }]}>{d}</Text>)}
        </View>

        {/* Grid de días */}
        <View style={styles.grid}>
          {celdas.map((dia, i) => {
            if (!dia) return <View key={`empty-${i}`} style={styles.celda} />
            
            const clave = formatClave(dia)
            const eventos = eventosDict[clave] || []
            const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()

            return (
              <TouchableOpacity key={clave} onPress={() => handleDia(dia)}
                style={[
                  styles.celda, 
                  esHoy && [styles.celdaHoy, { borderColor: c.boton }], 
                  diaSeleccionado === clave && { backgroundColor: `${c.boton}18` }
                ]}
              >
                <Text style={[styles.celdaNumero, { color: esHoy ? c.boton : c.texto }, esHoy && { fontWeight: 'bold' }]}>{dia}</Text>
                
                {/* Lógica de múltiples puntos */}
                <View style={styles.puntosRow}>
                  {eventos.slice(0, 3).map((e, idx) => (
                    <View key={idx} style={[styles.punto, { backgroundColor: e.tipo === 'PARTIDO' ? c.boton : '#3b82f6' }]} />
                  ))}
                  {eventos.length > 3 && <Text style={{fontSize: 9, color: c.subtexto, fontWeight: 'bold'}}>+</Text>}
                </View>
                
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Leyenda */}
        <View style={styles.leyenda}>
          <View style={styles.leyendaItem}><View style={[styles.punto, { backgroundColor: c.boton }]} /><Text style={[styles.leyendaText, { color: c.subtexto }]}>Partido</Text></View>
          <View style={styles.leyendaItem}><View style={[styles.punto, { backgroundColor: '#3b82f6' }]} /><Text style={[styles.leyendaText, { color: c.subtexto }]}>Entrenamiento</Text></View>
        </View>
      </ScrollView>

      {/* --- MODAL DE EVENTOS (DOBLE ESTADO) --- */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setModalVisible(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>
            
            <View style={styles.modalHeader}>
              <Text style={[styles.modalFecha, { color: c.texto }]}>
                {modoModal === 'crear' ? 'Nuevo Evento' : (diaSeleccionado ? formatFechaModal(diaSeleccionado) : '')}
              </Text>
              <TouchableOpacity 
                style={[styles.modalClose, { backgroundColor: c.input, borderColor: c.bordeInput }]} 
                onPress={() => { modoModal === 'crear' ? setModoModal('ver') : setModalVisible(false) }}
              >
                <Text style={[styles.modalCloseText, { color: c.subtexto }]}>{modoModal === 'crear' ? '↩' : '✕'}</Text>
              </TouchableOpacity>
            </View>

            {modoModal === 'ver' ? (
              /* --- ESTADO 1: VER EVENTOS --- */
              <>
                <ScrollView style={{ maxHeight: 350, width: '100%' }} showsVerticalScrollIndicator={false}>
                  <View style={styles.modalEventos}>
                    {eventosDelDia.length > 0 ? (
                      eventosDelDia.map((evento) => (
                        <View key={evento.id} style={[styles.modalEventoCard, { backgroundColor: c.input, borderColor: evento.tipo === 'PARTIDO' ? `${c.boton}40` : '#3b82f640', borderLeftWidth: 3, borderLeftColor: evento.tipo === 'PARTIDO' ? c.boton : '#3b82f6' }]}>
                          <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
                            <Text style={[styles.modalEventoTitulo, { color: c.texto, flex: 1 }]}>
                              {evento.tipo === 'PARTIDO' ? '⚽' : '🏃'} {evento.titulo}
                            </Text>
                            {/* 🟢 Pasamos el ID y el TIPO a la función de eliminar */}
                            {puedeEditar && (
                              <TouchableOpacity onPress={() => handleEliminarEvento(evento.id, evento.tipo)} style={{padding: 5}}>
                                <Text style={{fontSize: 18}}>🗑️</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                          <View style={styles.modalEventoMeta}>
                            <Text style={[styles.modalEventoMetaText, { color: c.subtexto }]}>🕐 {evento.horaInicio}</Text>
                            {evento.lugar && <Text style={[styles.modalEventoMetaText, { color: c.subtexto }]}>📍 {evento.lugar}</Text>}
                            {evento.esLocal !== undefined && <Text style={[styles.modalEventoMetaText, { color: evento.esLocal ? c.boton : '#ef4444' }]}>{evento.esLocal ? '🏠 Local' : '✈️ Visitante'}</Text>}
                          </View>
                        </View>
                      ))
                    ) : (
                      <Text style={{ color: c.subtexto, textAlign: 'center', marginVertical: 10 }}>No hay eventos programados.</Text>
                    )}
                  </View>
                </ScrollView>

                {puedeEditar && (
                  <TouchableOpacity style={[styles.btnAñadir, { backgroundColor: c.boton, width: '100%' }]} onPress={() => setModoModal('crear')}>
                    <Text style={styles.btnAñadirText}>➕ Añadir Evento</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
             /* --- ESTADO 2: CREAR EVENTO --- */
            <View style={{ gap: 15, width: '100%' }}>
              <View style={{flexDirection: 'row', gap: 10}}>48123422q
                <TouchableOpacity 
                  style={[styles.tipoBtn, nuevoTipo === 'ENTRENAMIENTO' && {backgroundColor: '#3b82f6', borderColor: '#3b82f6'}]}
                  onPress={() => setNuevoTipo('ENTRENAMIENTO')}
                ><Text style={{color: nuevoTipo === 'ENTRENAMIENTO' ? '#fff' : c.texto, fontWeight: 'bold'}}>🏃 Entreno</Text></TouchableOpacity>
                
                <TouchableOpacity 
                  style={[styles.tipoBtn, nuevoTipo === 'PARTIDO' && {backgroundColor: c.boton, borderColor: c.boton}]}
                  onPress={() => setNuevoTipo('PARTIDO')}
                ><Text style={{color: nuevoTipo === 'PARTIDO' ? '#fff' : c.texto, fontWeight: 'bold'}}>⚽ Partido</Text></TouchableOpacity>
              </View>

              {/* CHIPS DE TIPO DE PARTIDO */}
              {nuevoTipo === 'PARTIDO' && (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                  {Object.entries(TIPO_PARTIDO_LABEL).map(([key, label]) => (
                    <TouchableOpacity
                      key={key}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1,
                        backgroundColor: nuevoTipoPartido === key ? c.boton : c.input,
                        borderColor: nuevoTipoPartido === key ? c.boton : c.bordeInput
                      }}
                      onPress={() => setNuevoTipoPartido(key)}
                    >
                      <Text style={{ color: nuevoTipoPartido === key ? '#fff' : c.subtexto, fontSize: 13, fontWeight: 'bold' }}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              <TextInput
                placeholder={nuevoTipo === 'PARTIDO' ? "Título (ej: vs Getafe)" : "Título (ej: Físico y Táctica)"}
                placeholderTextColor={c.subtexto}
                style={[styles.inputField, { color: c.texto, borderColor: c.bordeInput, backgroundColor: c.input }]}
                value={nuevoTitulo}
                onChangeText={setNuevoTitulo}
              />
              <TextInput
                placeholder="Hora (ej: 19:00)"
                placeholderTextColor={c.subtexto}
                style={[styles.inputField, { color: c.texto, borderColor: c.bordeInput, backgroundColor: c.input }]}
                value={nuevaHora}
                onChangeText={setNuevaHora}
                keyboardType="numeric"
              />

              <TouchableOpacity style={[styles.btnAñadir, { backgroundColor: c.boton, width: '100%' }]} onPress={handleGuardarEvento}>
                <Text style={styles.btnAñadirText}>Guardar Evento</Text>
              </TouchableOpacity>
            </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  titulo: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  navMes: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  navButton: { width: 36, height: 36, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  navButtonText: { fontSize: 20, fontWeight: 'bold' },
  mesAnio: { fontSize: 18, fontWeight: 'bold' },
  semanaHeader: { flexDirection: 'row', marginBottom: 4 },
  diaSemanaLabel: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  celda: { width: `${100 / 7}%`, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: 8, padding: 2 },
  celdaHoy: { borderWidth: 1.5, borderRadius: 10 },
  celdaNumero: { fontSize: 13 },
  puntosRow: { flexDirection: 'row', gap: 2, marginTop: 2, alignItems: 'center' },
  punto: { width: 5, height: 5, borderRadius: 3 },
  leyenda: { flexDirection: 'row', gap: 16, marginTop: 16, justifyContent: 'center' },
  leyendaItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  leyendaText: { fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { width: '100%', borderRadius: 20, borderWidth: 1, padding: 20, gap: 16, alignItems: 'center' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 5 },
  modalFecha: { fontSize: 17, fontWeight: 'bold' },
  modalClose: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  modalCloseText: { fontSize: 15, fontWeight: 'bold' },
  modalEventos: { gap: 10, width: '100%' },
  modalEventoCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8, width: '100%' },
  modalEventoTitulo: { fontSize: 15, fontWeight: '700' },
  modalEventoMeta: { gap: 4 },
  modalEventoMetaText: { fontSize: 13 },
  tipoBtn: { flex: 1, padding: 12, borderRadius: 10, borderWidth: 1, alignItems: 'center', borderColor: '#ccc' },
  inputField: { padding: 14, borderRadius: 10, borderWidth: 1, fontSize: 15, width: '100%' },
  btnAñadir: { marginTop: 10, paddingVertical: 14, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  btnAñadirText: { color: '#fff', fontSize: 15, fontWeight: 'bold' }
})