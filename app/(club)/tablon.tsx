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
const ANUNCIOS = [
  {
    id: 1,
    titulo: 'Convocatoria jornada 5',
    contenido: 'Se convoca a todos los jugadores para el partido del sábado. Concentración a las 10:00h en el campo municipal.',
    autor: 'Marcos Álvarez',
    publishedAt: '12/04/2025',
    isPinned: true,
    teamId: 1, // solo equipo
    leido: false,
  },
  {
    id: 2,
    titulo: 'Cambio de horario entrenamiento',
    contenido: 'El entrenamiento del lunes se adelanta a las 18:00h por obras en el campo.',
    autor: 'Marcos Álvarez',
    publishedAt: '11/04/2025',
    isPinned: false,
    teamId: 1,
    leido: false,
  },
  {
    id: 3,
    titulo: 'Reunión de padres',
    contenido: 'Se convoca reunión de padres el próximo viernes a las 20:00h en el club.',
    autor: 'Pedro Rodríguez',
    publishedAt: '10/04/2025',
    isPinned: false,
    teamId: null, // todo el club
    leido: true,
  },
  {
    id: 4,
    titulo: 'Nuevo patrocinador',
    contenido: 'El club anuncia un nuevo acuerdo de patrocinio con Deportes García.',
    autor: 'Pedro Rodríguez',
    publishedAt: '08/04/2025',
    isPinned: false,
    teamId: null,
    leido: true,
  },
  {
    id: 5,
    titulo: 'Torneo de Semana Santa',
    contenido: 'El equipo participará en el torneo de Semana Santa los días 17, 18 y 19 de abril.',
    autor: 'Marcos Álvarez',
    publishedAt: '07/04/2025',
    isPinned: false,
    teamId: 1,
    leido: true,
  },
  {
    id: 6,
    titulo: 'Cuotas del mes de abril',
    contenido: 'Recordamos que el plazo para el pago de la cuota de abril finaliza el día 15.',
    autor: 'Pedro Rodríguez',
    publishedAt: '05/04/2025',
    isPinned: false,
    teamId: null,
    leido: true,
  },
  {
    id: 7,
    titulo: 'Partido aplazado',
    contenido: 'El partido del sábado 5 de abril ha sido aplazado por lluvia. Nueva fecha pendiente.',
    autor: 'Marcos Álvarez',
    publishedAt: '04/04/2025',
    isPinned: false,
    teamId: 1,
    leido: true,
  },
  {
    id: 8,
    titulo: 'Entrega de equipaciones',
    contenido: 'La entrega de equipaciones de la nueva temporada se realizará el jueves a las 19:00h.',
    autor: 'Pedro Rodríguez',
    publishedAt: '02/04/2025',
    isPinned: false,
    teamId: null,
    leido: true,
  },
  {
    id: 9,
    titulo: 'Inicio de temporada',
    contenido: 'Bienvenidos a la temporada 2025/2026. Os deseamos mucho éxito a todos.',
    autor: 'Pedro Rodríguez',
    publishedAt: '01/04/2025',
    isPinned: false,
    teamId: null,
    leido: true,
  },
]

type Filtro = 'todos' | 'club' | 'equipo'

export default function Tablon() {
  const c = useTheme()
  const { t } = useTranslation()
  const [filtro, setFiltro] = useState<Filtro>('todos')
  const [expandido, setExpandido] = useState<number | null>(null)

  const anunciosFiltrados = ANUNCIOS.filter((a) => {
    if (filtro === 'club') return a.teamId === null
    if (filtro === 'equipo') return a.teamId !== null
    return true
  }).sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1
    if (!a.isPinned && b.isPinned) return 1
    return 0
  })

  const noLeidos = ANUNCIOS.filter((a) => !a.leido).length

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      showsVerticalScrollIndicator={false}
    >

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.titulo, { color: c.texto }]}>📢 {t('announcements.title')}</Text>
          {noLeidos > 0 && (
            <Text style={[styles.noLeidosText, { color: c.subtexto }]}>
              {noLeidos} {t('announcements.unread')}
            </Text>
          )}
        </View>
      </View>

      {/* Filtros */}
      <View style={[styles.filtrosContainer, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
        {(['todos', 'club', 'equipo'] as Filtro[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filtroButton,
              filtro === f && { backgroundColor: c.boton },
            ]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[
              styles.filtroText,
              { color: filtro === f ? c.botonTexto : c.subtexto },
            ]}>
              {t(`announcements.filter_${f}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Lista */}
      <View style={styles.lista}>
        {anunciosFiltrados.map((anuncio) => {
          const abierto = expandido === anuncio.id
          return (
            <TouchableOpacity
              key={anuncio.id}
              style={[
                styles.card,
                {
                  backgroundColor: c.input,
                  borderColor: anuncio.isPinned ? `${c.boton}60` : c.bordeInput,
                  borderWidth: anuncio.isPinned ? 1.5 : 1,
                },
              ]}
              onPress={() => setExpandido(abierto ? null : anuncio.id)}
              activeOpacity={0.85}
            >
              {/* Fila superior */}
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  {/* Punto no leído */}
                  {!anuncio.leido && (
                    <View style={[styles.unreadDot, { backgroundColor: c.boton }]} />
                  )}
                  {/* Badge fijado */}
                  {anuncio.isPinned && (
                    <View style={[styles.pinnedBadge, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                      <Text style={[styles.pinnedText, { color: c.boton }]}>📌 Fijado</Text>
                    </View>
                  )}
                  {/* Badge club/equipo */}
                  <View style={[
                    styles.scopeBadge,
                    {
                      backgroundColor: anuncio.teamId ? '#3b82f618' : '#f59e0b18',
                      borderColor: anuncio.teamId ? '#3b82f635' : '#f59e0b35',
                    }
                  ]}>
                    <Text style={[
                      styles.scopeText,
                      { color: anuncio.teamId ? '#3b82f6' : '#f59e0b' }
                    ]}>
                      {anuncio.teamId ? '👕 Equipo' : '🏆 Club'}
                    </Text>
                  </View>
                </View>
                <Text style={[styles.cardArrow, { color: c.subtexto }]}>
                  {abierto ? '▲' : '▼'}
                </Text>
              </View>

              {/* Título */}
              <Text style={[styles.cardTitulo, { color: c.texto }]}>{anuncio.titulo}</Text>

              {/* Contenido expandido */}
              {abierto && (
                <Text style={[styles.cardContenido, { color: c.subtexto }]}>
                  {anuncio.contenido}
                </Text>
              )}

              {/* Footer */}
              <View style={styles.cardFooter}>
                <Text style={[styles.cardMeta, { color: c.subtexto }]}>✍️ {anuncio.autor}</Text>
                <Text style={[styles.cardMeta, { color: c.subtexto }]}>{anuncio.publishedAt}</Text>
              </View>
            </TouchableOpacity>
          )
        })}
      </View>

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
  header: {
    marginBottom: 16,
  },
  titulo: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  noLeidosText: {
    fontSize: 13,
  },

  // Filtros
  filtrosContainer: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    marginBottom: 20,
    gap: 4,
  },
  filtroButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  filtroText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Lista
  lista: {
    gap: 10,
  },
  card: {
    borderRadius: 14,
    padding: 14,
    gap: 8,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pinnedBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  pinnedText: {
    fontSize: 11,
    fontWeight: '600',
  },
  scopeBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  scopeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  cardArrow: {
    fontSize: 10,
  },
  cardTitulo: {
    fontSize: 15,
    fontWeight: '700',
  },
  cardContenido: {
    fontSize: 13,
    lineHeight: 20,
    paddingTop: 4,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  cardMeta: {
    fontSize: 12,
  },
})