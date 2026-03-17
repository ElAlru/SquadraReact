import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ScrollView,
  StyleSheet,
  Text,
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
    fecha: '2025-04-12',
    horaInicio: '11:00',
    horaFin: null,
    lugar: 'Campo Municipal',
    esLocal: true,
    tipoPartido: 'LEAGUE',
    jornada: 5,
    golesA: null,
    golesC: null,
  },
  {
    id: 2,
    tipo: 'ENTRENAMIENTO',
    titulo: 'Entrenamiento',
    fecha: '2025-04-14',
    horaInicio: '19:00',
    horaFin: '20:30',
    lugar: 'Campo Municipal',
    esLocal: null,
    tipoPartido: null,
    jornada: null,
    golesA: null,
    golesC: null,
  },
  {
    id: 3,
    tipo: 'ENTRENAMIENTO',
    titulo: 'Entrenamiento',
    fecha: '2025-04-16',
    horaInicio: '19:00',
    horaFin: '20:30',
    lugar: 'Campo Municipal',
    esLocal: null,
    tipoPartido: null,
    jornada: null,
    golesA: null,
    golesC: null,
  },
  {
    id: 4,
    tipo: 'PARTIDO',
    titulo: 'Rayo Vallecano vs Cadete C',
    fecha: '2025-04-19',
    horaInicio: '10:00',
    horaFin: null,
    lugar: 'Campo Rayo',
    esLocal: false,
    tipoPartido: 'LEAGUE',
    jornada: 6,
    golesA: null,
    golesC: null,
  },
  {
    id: 5,
    tipo: 'ENTRENAMIENTO',
    titulo: 'Entrenamiento',
    fecha: '2025-04-21',
    horaInicio: '19:00',
    horaFin: '20:30',
    lugar: 'Campo Municipal',
    esLocal: null,
    tipoPartido: null,
    jornada: null,
    golesA: null,
    golesC: null,
  },
  {
    id: 6,
    tipo: 'PARTIDO',
    titulo: 'Cadete C vs Alcobendas',
    fecha: '2025-05-03',
    horaInicio: '11:00',
    horaFin: null,
    lugar: 'Campo Municipal',
    esLocal: true,
    tipoPartido: 'CUP',
    jornada: null,
    golesA: null,
    golesC: null,
  },
  {
    id: 7,
    tipo: 'ENTRENAMIENTO',
    titulo: 'Entrenamiento',
    fecha: '2025-05-05',
    horaInicio: '19:00',
    horaFin: '20:30',
    lugar: 'Campo Municipal',
    esLocal: null,
    tipoPartido: null,
    jornada: null,
    golesA: null,
    golesC: null,
  },
  // Partido ya jugado con resultado
  {
    id: 8,
    tipo: 'PARTIDO',
    titulo: 'Cadete C vs Getafe',
    fecha: '2025-04-05',
    horaInicio: '11:00',
    horaFin: null,
    lugar: 'Campo Municipal',
    esLocal: true,
    tipoPartido: 'LEAGUE',
    jornada: 4,
    golesA: 3,
    golesC: 1,
  },
]

const TIPO_PARTIDO_LABEL: Record<string, string> = {
  LEAGUE: 'Liga',
  FRIENDLY: 'Amistoso',
  CUP: 'Copa',
  TOURNAMENT: 'Torneo',
  OTHER: 'Otro',
}

const TIPO_PARTIDO_COLOR: Record<string, string> = {
  LEAGUE: '#16a34a',
  FRIENDLY: '#6b7280',
  CUP: '#f59e0b',
  TOURNAMENT: '#8b5cf6',
  OTHER: '#6b7280',
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const DIAS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

type Filtro = 'todos' | 'partidos' | 'entrenamientos'

export default function Horarios() {
  const c = useTheme()
  const { t } = useTranslation()
  const [filtro, setFiltro] = useState<Filtro>('todos')

  const eventosFiltrados = EVENTOS.filter((e) => {
    if (filtro === 'partidos') return e.tipo === 'PARTIDO'
    if (filtro === 'entrenamientos') return e.tipo === 'ENTRENAMIENTO'
    return true
  }).sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime())

  // Agrupar por mes
  const eventosPorMes: Record<string, typeof EVENTOS> = {}
  eventosFiltrados.forEach((evento) => {
    const fecha = new Date(evento.fecha)
    const clave = `${MESES[fecha.getMonth()]} ${fecha.getFullYear()}`
    if (!eventosPorMes[clave]) eventosPorMes[clave] = []
    eventosPorMes[clave].push(evento)
  })

  const formatFecha = (fechaStr: string) => {
    const fecha = new Date(fechaStr)
    return `${DIAS[fecha.getDay()]} ${fecha.getDate().toString().padStart(2, '0')}/${(fecha.getMonth() + 1).toString().padStart(2, '0')}`
  }

  const tieneResultado = (e: typeof EVENTOS[0]) =>
    e.golesA !== null && e.golesC !== null

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[styles.titulo, { color: c.texto }]}>📅 {t('schedule.title')}</Text>

      {/* Filtros */}
      <View style={[styles.filtrosContainer, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
        {(['todos', 'partidos', 'entrenamientos'] as Filtro[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filtroButton, filtro === f && { backgroundColor: c.boton }]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[styles.filtroText, { color: filtro === f ? c.botonTexto : c.subtexto }]}>
              {f === 'todos' ? t('schedule.filter_all') : f === 'partidos' ? t('schedule.filter_matches') : t('schedule.filter_training')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Eventos agrupados por mes */}
      {Object.entries(eventosPorMes).map(([mes, eventos]) => (
        <View key={mes} style={styles.mesGroup}>
          <Text style={[styles.mesLabel, { color: c.subtexto }]}>{mes}</Text>

          <View style={styles.eventosList}>
            {eventos.map((evento) => (
              <TouchableOpacity
                key={evento.id}
                style={[
                  styles.eventoCard,
                  {
                    backgroundColor: c.input,
                    borderColor: evento.tipo === 'PARTIDO' ? `${c.boton}40` : c.bordeInput,
                    borderLeftWidth: evento.tipo === 'PARTIDO' ? 3 : 1,
                    borderLeftColor: evento.tipo === 'PARTIDO' ? c.boton : '#3b82f6',
                  },
                ]}
              >
                {/* Fila superior */}
                <View style={styles.eventoHeader}>
                  <Text style={[styles.eventoFecha, { color: c.boton }]}>
                    {formatFecha(evento.fecha)}
                  </Text>
                  <View style={styles.eventoBadges}>
                    {/* Badge tipo partido */}
                    {evento.tipoPartido && (
                      <View style={[
                        styles.badge,
                        { backgroundColor: `${TIPO_PARTIDO_COLOR[evento.tipoPartido]}18`, borderColor: `${TIPO_PARTIDO_COLOR[evento.tipoPartido]}35` }
                      ]}>
                        <Text style={[styles.badgeText, { color: TIPO_PARTIDO_COLOR[evento.tipoPartido] }]}>
                          {TIPO_PARTIDO_LABEL[evento.tipoPartido]}
                        </Text>
                      </View>
                    )}
                    {/* Badge local/visitante */}
                    {evento.esLocal !== null && (
                      <View style={[
                        styles.badge,
                        { backgroundColor: evento.esLocal ? `${c.boton}18` : '#ef444418', borderColor: evento.esLocal ? `${c.boton}35` : '#ef444435' }
                      ]}>
                        <Text style={[styles.badgeText, { color: evento.esLocal ? c.boton : '#ef4444' }]}>
                          {evento.esLocal ? t('schedule.home') : t('schedule.away')}
                        </Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Título */}
                <Text style={[styles.eventoTitulo, { color: c.texto }]}>
                  {evento.tipo === 'PARTIDO' ? '⚽' : '🏃'} {evento.titulo}
                </Text>

                {/* Resultado si ya se jugó */}
                {tieneResultado(evento) && (
                  <View style={[styles.resultadoCard, { backgroundColor: `${c.boton}10`, borderColor: `${c.boton}30` }]}>
                    <Text style={[styles.resultadoLabel, { color: c.subtexto }]}>{t('schedule.result')}</Text>
                    <Text style={[styles.resultadoValor, { color: c.boton }]}>
                      {evento.golesA} - {evento.golesC}
                    </Text>
                  </View>
                )}

                {/* Footer */}
                <View style={styles.eventoFooter}>
                  <Text style={[styles.eventoMeta, { color: c.subtexto }]}>
                    🕐 {evento.horaInicio}{evento.horaFin ? ` - ${evento.horaFin}` : ''}
                  </Text>
                  <Text style={[styles.eventoMeta, { color: c.subtexto }]}>
                    📍 {evento.lugar}
                  </Text>
                  {evento.jornada && (
                    <Text style={[styles.eventoMeta, { color: c.subtexto }]}>
                      {t('schedule.matchDay')} {evento.jornada}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      ))}

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  // Filtros
  filtrosContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filtroText: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Mes
  mesGroup: {
    marginBottom: 24,
  },
  mesLabel: {
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  eventosList: {
    gap: 10,
  },

  // Evento
  eventoCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  eventoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  eventoFecha: {
    fontSize: 13,
    fontWeight: '700',
  },
  eventoBadges: {
    flexDirection: 'row',
    gap: 6,
  },
  badge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  eventoTitulo: {
    fontSize: 15,
    fontWeight: '700',
  },
  resultadoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  resultadoLabel: {
    fontSize: 12,
  },
  resultadoValor: {
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  eventoFooter: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 2,
  },
  eventoMeta: {
    fontSize: 12,
  },
})