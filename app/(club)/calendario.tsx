import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useTheme } from '../../lib/useTheme'

// MOCK — reemplazar con datos reales de la API
const EVENTOS: Record<string, Array<{
  id: number
  tipo: 'PARTIDO' | 'ENTRENAMIENTO'
  titulo: string
  horaInicio: string
  horaFin: string | null
  lugar: string
  esLocal: boolean | null
  tipoPartido: string | null
  jornada: number | null
  golesA: number | null
  golesC: number | null
}>> = {
  '2025-04-12': [
    { id: 1, tipo: 'PARTIDO', titulo: 'Cadete C vs Canillejas', horaInicio: '11:00', horaFin: null, lugar: 'Campo Municipal', esLocal: true, tipoPartido: 'LEAGUE', jornada: 5, golesA: null, golesC: null },
  ],
  '2025-04-14': [
    { id: 2, tipo: 'ENTRENAMIENTO', titulo: 'Entrenamiento', horaInicio: '19:00', horaFin: '20:30', lugar: 'Campo Municipal', esLocal: null, tipoPartido: null, jornada: null, golesA: null, golesC: null },
  ],
  '2025-04-16': [
    { id: 3, tipo: 'ENTRENAMIENTO', titulo: 'Entrenamiento', horaInicio: '19:00', horaFin: '20:30', lugar: 'Campo Municipal', esLocal: null, tipoPartido: null, jornada: null, golesA: null, golesC: null },
  ],
  '2025-04-19': [
    { id: 4, tipo: 'PARTIDO', titulo: 'Rayo vs Cadete C', horaInicio: '10:00', horaFin: null, lugar: 'Campo Rayo', esLocal: false, tipoPartido: 'LEAGUE', jornada: 6, golesA: null, golesC: null },
  ],
  '2025-04-21': [
    { id: 5, tipo: 'ENTRENAMIENTO', titulo: 'Entrenamiento', horaInicio: '19:00', horaFin: '20:30', lugar: 'Campo Municipal', esLocal: null, tipoPartido: null, jornada: null, golesA: null, golesC: null },
  ],
  '2025-04-05': [
    { id: 6, tipo: 'PARTIDO', titulo: 'Cadete C vs Getafe', horaInicio: '11:00', horaFin: null, lugar: 'Campo Municipal', esLocal: true, tipoPartido: 'LEAGUE', jornada: 4, golesA: 3, golesC: 1 },
  ],
}

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

  const hoy = new Date()
  const [mes, setMes] = useState(hoy.getMonth())
  const [anio, setAnio] = useState(hoy.getFullYear())
  const [diaSeleccionado, setDiaSeleccionado] = useState<string | null>(null)
  const [modalVisible, setModalVisible] = useState(false)

  const primerDia = new Date(anio, mes, 1)
  const diasEnMes = new Date(anio, mes + 1, 0).getDate()

  // Lunes = 0, ajuste europeo
  let inicioSemana = primerDia.getDay() - 1
  if (inicioSemana < 0) inicioSemana = 6

  const mesAnterior = () => {
    if (mes === 0) { setMes(11); setAnio(anio - 1) }
    else setMes(mes - 1)
  }

  const mesSiguiente = () => {
    if (mes === 11) { setMes(0); setAnio(anio + 1) }
    else setMes(mes + 1)
  }

  const formatClave = (dia: number) => {
    const m = (mes + 1).toString().padStart(2, '0')
    const d = dia.toString().padStart(2, '0')
    return `${anio}-${m}-${d}`
  }

  const handleDia = (dia: number) => {
    const clave = formatClave(dia)
    const eventos = EVENTOS[clave]
    if (!eventos || eventos.length === 0) return
    setDiaSeleccionado(clave)
    setModalVisible(true)
  }

  const eventosDelDia = diaSeleccionado ? (EVENTOS[diaSeleccionado] || []) : []

  const formatFechaModal = (clave: string) => {
    const fecha = new Date(clave)
    const diaSemana = DIAS_SEMANA_LARGO[(fecha.getDay() + 6) % 7]
    return `${diaSemana} ${fecha.getDate()} de ${MESES[fecha.getMonth()]}`
  }

  // Celdas del calendario
  const celdas: (number | null)[] = [
    ...Array(inicioSemana).fill(null),
    ...Array.from({ length: diasEnMes }, (_, i) => i + 1),
  ]

  // Rellenar hasta completar filas de 7
  while (celdas.length % 7 !== 0) celdas.push(null)

  return (
    <View style={[styles.wrapper, { backgroundColor: c.fondo }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Text style={[styles.titulo, { color: c.texto }]}>📅 {t('calendar.title')}</Text>

        {/* Navegación mes */}
        <View style={styles.navMes}>
          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: c.input, borderColor: c.bordeInput }]}
            onPress={mesAnterior}
          >
            <Text style={[styles.navButtonText, { color: c.texto }]}>‹</Text>
          </TouchableOpacity>

          <Text style={[styles.mesAnio, { color: c.texto }]}>
            {MESES[mes]} {anio}
          </Text>

          <TouchableOpacity
            style={[styles.navButton, { backgroundColor: c.input, borderColor: c.bordeInput }]}
            onPress={mesSiguiente}
          >
            <Text style={[styles.navButtonText, { color: c.texto }]}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Cabecera días semana */}
        <View style={styles.semanaHeader}>
          {DIAS_SEMANA.map((d) => (
            <Text key={d} style={[styles.diaSemanaLabel, { color: c.subtexto }]}>{d}</Text>
          ))}
        </View>

        {/* Grid calendario */}
        <View style={styles.grid}>
          {celdas.map((dia, i) => {
            if (!dia) return <View key={`empty-${i}`} style={styles.celda} />

            const clave = formatClave(dia)
            const eventos = EVENTOS[clave] || []
            const tienePartido = eventos.some((e) => e.tipo === 'PARTIDO')
            const tieneEntrenamiento = eventos.some((e) => e.tipo === 'ENTRENAMIENTO')
            const esHoy = dia === hoy.getDate() && mes === hoy.getMonth() && anio === hoy.getFullYear()
            const seleccionado = diaSeleccionado === clave

            return (
              <TouchableOpacity
                key={clave}
                style={[
                  styles.celda,
                  esHoy && [styles.celdaHoy, { borderColor: c.boton }],
                  seleccionado && { backgroundColor: `${c.boton}18` },
                ]}
                onPress={() => handleDia(dia)}
                activeOpacity={eventos.length > 0 ? 0.7 : 1}
              >
                <Text style={[
                  styles.celdaNumero,
                  { color: esHoy ? c.boton : c.texto },
                  esHoy && { fontWeight: 'bold' },
                ]}>
                  {dia}
                </Text>
                {/* Puntos de eventos */}
                <View style={styles.puntosRow}>
                  {tienePartido && <View style={[styles.punto, { backgroundColor: c.boton }]} />}
                  {tieneEntrenamiento && <View style={[styles.punto, { backgroundColor: '#3b82f6' }]} />}
                </View>
              </TouchableOpacity>
            )
          })}
        </View>

        {/* Leyenda */}
        <View style={styles.leyenda}>
          <View style={styles.leyendaItem}>
            <View style={[styles.punto, { backgroundColor: c.boton }]} />
            <Text style={[styles.leyendaText, { color: c.subtexto }]}>{t('calendar.match')}</Text>
          </View>
          <View style={styles.leyendaItem}>
            <View style={[styles.punto, { backgroundColor: '#3b82f6' }]} />
            <Text style={[styles.leyendaText, { color: c.subtexto }]}>{t('calendar.training')}</Text>
          </View>
        </View>

      </ScrollView>

      {/* Modal eventos del día */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]}
            onPress={() => {}}
          >
            {/* Header modal */}
            <View style={styles.modalHeader}>
              <Text style={[styles.modalFecha, { color: c.texto }]}>
                {diaSeleccionado ? formatFechaModal(diaSeleccionado) : ''}
              </Text>
              <TouchableOpacity
                style={[styles.modalClose, { backgroundColor: c.input, borderColor: c.bordeInput }]}
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.modalCloseText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* Eventos */}
            <View style={styles.modalEventos}>
              {eventosDelDia.map((evento) => (
                <View
                  key={evento.id}
                  style={[
                    styles.modalEventoCard,
                    {
                      backgroundColor: c.input,
                      borderColor: evento.tipo === 'PARTIDO' ? `${c.boton}40` : '#3b82f640',
                      borderLeftWidth: 3,
                      borderLeftColor: evento.tipo === 'PARTIDO' ? c.boton : '#3b82f6',
                    }
                  ]}
                >
                  <Text style={[styles.modalEventoTitulo, { color: c.texto }]}>
                    {evento.tipo === 'PARTIDO' ? '⚽' : '🏃'} {evento.titulo}
                  </Text>

                  <View style={styles.modalEventoMeta}>
                    <Text style={[styles.modalEventoMetaText, { color: c.subtexto }]}>
                      🕐 {evento.horaInicio}{evento.horaFin ? ` - ${evento.horaFin}` : ''}
                    </Text>
                    <Text style={[styles.modalEventoMetaText, { color: c.subtexto }]}>
                      📍 {evento.lugar}
                    </Text>
                    {evento.tipoPartido && (
                      <Text style={[styles.modalEventoMetaText, { color: c.subtexto }]}>
                        🏆 {TIPO_PARTIDO_LABEL[evento.tipoPartido]}
                        {evento.jornada ? ` · Jornada ${evento.jornada}` : ''}
                      </Text>
                    )}
                    {evento.esLocal !== null && (
                      <Text style={[styles.modalEventoMetaText, { color: evento.esLocal ? c.boton : '#ef4444' }]}>
                        {evento.esLocal ? '🏠 Local' : '✈️ Visitante'}
                      </Text>
                    )}
                    {evento.golesA !== null && evento.golesC !== null && (
                      <Text style={[styles.modalResultado, { color: c.boton }]}>
                        Resultado: {evento.golesA} - {evento.golesC}
                      </Text>
                    )}
                  </View>
                </View>
              ))}
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  container: {
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },

  // Navegación mes
  navMes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  navButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  mesAnio: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Cabecera semana
  semanaHeader: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  diaSemanaLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '600',
  },

  // Grid
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  celda: {
    width: `${100 / 7}%`,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 2,
  },
  celdaHoy: {
    borderWidth: 1.5,
    borderRadius: 10,
  },
  celdaNumero: {
    fontSize: 13,
  },
  puntosRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 2,
  },
  punto: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },

  // Leyenda
  leyenda: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 16,
    justifyContent: 'center',
  },
  leyendaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  leyendaText: {
    fontSize: 12,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    width: '100%',
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalFecha: {
    fontSize: 17,
    fontWeight: 'bold',
  },
  modalClose: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: '600',
  },
  modalEventos: {
    gap: 10,
  },
  modalEventoCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 8,
  },
  modalEventoTitulo: {
    fontSize: 15,
    fontWeight: '700',
  },
  modalEventoMeta: {
    gap: 4,
  },
  modalEventoMetaText: {
    fontSize: 13,
  },
  modalResultado: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
})