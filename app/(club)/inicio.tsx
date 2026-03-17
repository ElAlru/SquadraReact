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
const USUARIO = {
  nombre: 'Carlos',
}

const CLUB = {
  nombre: 'FC Ejemplo',
  temporada: '2025/2026',
  equipo: 'Cadete C',
}

const ULTIMO_ANUNCIO = {
  titulo: 'Convocatoria jornada 5',
  autor: 'Marcos Álvarez',
  fecha: '12/04/2025',
  contenido: 'Se convoca a todos los jugadores para el partido del sábado. Concentración a las 10:00h en el campo.',
}

const PROXIMOS_EVENTOS = [
  {
    id: 1,
    tipo: 'PARTIDO',
    titulo: 'Cadete C vs Canillejas',
    fecha: 'Sáb 12/04',
    hora: '11:00',
    lugar: 'Campo Municipal',
    esLocal: true,
  },
  {
    id: 2,
    tipo: 'ENTRENAMIENTO',
    titulo: 'Entrenamiento',
    fecha: 'Lun 14/04',
    hora: '19:00',
    lugar: 'Campo Municipal',
    esLocal: null,
  },
  {
    id: 3,
    tipo: 'ENTRENAMIENTO',
    titulo: 'Entrenamiento',
    fecha: 'Mié 16/04',
    hora: '19:00',
    lugar: 'Campo Municipal',
    esLocal: null,
  },
]

const EVENTO_ICONO: Record<string, string> = {
  PARTIDO: '⚽',
  ENTRENAMIENTO: '🏃',
}

const EVENTO_COLOR: Record<string, string> = {
  PARTIDO: '#16a34a',
  ENTRENAMIENTO: '#3b82f6',
}

export default function Inicio() {
  const c = useTheme()
  const { t } = useTranslation()

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: c.subtexto }]}>
            {saludo}, {USUARIO.nombre} 👋
          </Text>
          <Text style={[styles.clubNombre, { color: c.texto }]}>{CLUB.nombre}</Text>
        </View>
        <View style={[styles.clubAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
          <Text style={[styles.clubAvatarText, { color: c.boton }]}>
            {CLUB.nombre.charAt(0)}
          </Text>
        </View>
      </View>

      {/* Chips info */}
      <View style={styles.chipsRow}>
        <View style={[styles.chip, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
          <Text style={[styles.chipText, { color: c.subtexto }]}>🗓 {CLUB.temporada}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
          <Text style={[styles.chipText, { color: c.subtexto }]}>👕 {CLUB.equipo}</Text>
        </View>
      </View>

      {/* Último anuncio */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: c.texto }]}>
          📢 {t('home.latestAnnouncement')}
        </Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: c.boton }]}>{t('home.seeAll')}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.anuncioCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}
      >
        <Text style={[styles.anuncioTitulo, { color: c.texto }]}>{ULTIMO_ANUNCIO.titulo}</Text>
        <Text style={[styles.anuncioContenido, { color: c.subtexto }]} numberOfLines={2}>
          {ULTIMO_ANUNCIO.contenido}
        </Text>
        <View style={styles.anuncioFooter}>
          <Text style={[styles.anuncioMeta, { color: c.subtexto }]}>✍️ {ULTIMO_ANUNCIO.autor}</Text>
          <Text style={[styles.anuncioMeta, { color: c.subtexto }]}>{ULTIMO_ANUNCIO.fecha}</Text>
        </View>
      </TouchableOpacity>

      {/* Próximos eventos */}
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: c.texto }]}>
          📅 {t('home.upcomingEvents')}
        </Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: c.boton }]}>{t('home.seeAll')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.eventosList}>
        {PROXIMOS_EVENTOS.map((evento) => (
          <TouchableOpacity
            key={evento.id}
            style={[styles.eventoCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}
          >
            {/* Icono */}
            <View style={[
              styles.eventoIconContainer,
              { backgroundColor: `${EVENTO_COLOR[evento.tipo]}18`, borderColor: `${EVENTO_COLOR[evento.tipo]}35` }
            ]}>
              <Text style={styles.eventoIcono}>{EVENTO_ICONO[evento.tipo]}</Text>
            </View>

            {/* Info */}
            <View style={styles.eventoInfo}>
              <Text style={[styles.eventoTitulo, { color: c.texto }]}>{evento.titulo}</Text>
              <Text style={[styles.eventoMeta, { color: c.subtexto }]}>
                📍 {evento.lugar}
              </Text>
            </View>

            {/* Fecha y hora */}
            <View style={styles.eventoFecha}>
              <Text style={[styles.eventoFechaTexto, { color: c.boton }]}>{evento.fecha}</Text>
              <Text style={[styles.eventoHoraTexto, { color: c.subtexto }]}>{evento.hora}</Text>
              {evento.esLocal !== null && (
                <View style={[
                  styles.localBadge,
                  { backgroundColor: evento.esLocal ? `${c.boton}18` : '#ef444418' }
                ]}>
                  <Text style={[
                    styles.localBadgeText,
                    { color: evento.esLocal ? c.boton : '#ef4444' }
                  ]}>
                    {evento.esLocal ? 'Local' : 'Visitante'}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
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

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 2,
  },
  clubNombre: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clubAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubAvatarText: {
    fontSize: 22,
    fontWeight: 'bold',
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },

  // Sección
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Anuncio
  anuncioCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
    gap: 8,
  },
  anuncioTitulo: {
    fontSize: 15,
    fontWeight: '700',
  },
  anuncioContenido: {
    fontSize: 13,
    lineHeight: 20,
  },
  anuncioFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  anuncioMeta: {
    fontSize: 12,
  },

  // Eventos
  eventosList: {
    gap: 10,
  },
  eventoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  eventoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventoIcono: {
    fontSize: 20,
  },
  eventoInfo: {
    flex: 1,
    gap: 3,
  },
  eventoTitulo: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventoMeta: {
    fontSize: 12,
  },
  eventoFecha: {
    alignItems: 'flex-end',
    gap: 3,
  },
  eventoFechaTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  eventoHoraTexto: {
    fontSize: 12,
  },
  localBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  localBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
})