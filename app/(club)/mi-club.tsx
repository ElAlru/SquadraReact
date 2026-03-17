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
const CLUB = {
  nombre: 'FC Ejemplo',
  codigoInvitacion: 'ABC-123',
  temporada: '2025/2026',
  equipo: 'Cadete C',
  categoria: 'U14',
  genero: 'MALE',
}

const STAFF = [
  { id: 1, firstName: 'Marcos', lastName: 'Álvarez', phone: '600 123 456' },
  { id: 2, firstName: 'Pedro', lastName: 'Rodríguez', phone: '600 789 012' },
]

const POSICION_LABEL: Record<string, string> = {
  GOALKEEPER: 'Portero',
  DEFENDER: 'Defensa',
  MIDFIELDER: 'Centrocampista',
  FORWARD: 'Delantero',
}

const POSICION_COLOR: Record<string, string> = {
  GOALKEEPER: '#f59e0b',
  DEFENDER: '#3b82f6',
  MIDFIELDER: '#8b5cf6',
  FORWARD: '#16a34a',
}

const JUGADORES = [
  { id: 1, firstName: 'Carlos', lastName: 'García', birthDate: '12/03/2010', docType: 'DNI', docNumber: '12345678A', jerseyNumber: 1, kitSize: 'S', position: 'GOALKEEPER' },
  { id: 2, firstName: 'Juan', lastName: 'López', birthDate: '05/07/2010', docType: 'DNI', docNumber: '23456789B', jerseyNumber: 7, kitSize: 'M', position: 'FORWARD' },
  { id: 3, firstName: 'Pedro', lastName: 'Martínez', birthDate: '22/11/2009', docType: 'DNI', docNumber: '34567890C', jerseyNumber: 10, kitSize: 'M', position: 'MIDFIELDER' },
  { id: 4, firstName: 'Luis', lastName: 'Sánchez', birthDate: '18/04/2010', docType: 'DNI', docNumber: '45678901D', jerseyNumber: 4, kitSize: 'L', position: 'DEFENDER' },
  { id: 5, firstName: 'Miguel', lastName: 'Fernández', birthDate: '30/08/2009', docType: 'NIE', docNumber: 'X1234567A', jerseyNumber: 9, kitSize: 'M', position: 'FORWARD' },
]

export default function MiClub() {
  const c = useTheme()
  const { t } = useTranslation()

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      showsVerticalScrollIndicator={false}
    >

      {/* Header club */}
      <View style={styles.header}>
        <View style={[styles.clubAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
          <Text style={[styles.clubAvatarText, { color: c.boton }]}>
            {CLUB.nombre.charAt(0)}
          </Text>
        </View>
        <View style={styles.clubInfo}>
          <Text style={[styles.clubNombre, { color: c.texto }]}>{CLUB.nombre}</Text>
          <Text style={[styles.clubMeta, { color: c.subtexto }]}>{CLUB.equipo} · {CLUB.temporada}</Text>
        </View>
      </View>

      {/* Código de invitación */}
      <View style={[styles.codigoCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
        <View>
          <Text style={[styles.codigoLabel, { color: c.subtexto }]}>
            {t('myClub.invitationCode')}
          </Text>
          <Text style={[styles.codigoValue, { color: c.boton }]}>{CLUB.codigoInvitacion}</Text>
        </View>
        <TouchableOpacity style={[styles.copiarButton, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
          <Text style={[styles.copiarText, { color: c.boton }]}>📋 {t('myClub.copy')}</Text>
        </TouchableOpacity>
      </View>

      {/* Chips */}
      <View style={styles.chipsRow}>
        <View style={[styles.chip, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
          <Text style={[styles.chipText, { color: c.subtexto }]}>🏷 {CLUB.categoria}</Text>
        </View>
        <View style={[styles.chip, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
          <Text style={[styles.chipText, { color: c.subtexto }]}>
            {CLUB.genero === 'MALE' ? '👦' : CLUB.genero === 'FEMALE' ? '👧' : '👥'} {CLUB.genero === 'MALE' ? 'Masculino' : CLUB.genero === 'FEMALE' ? 'Femenino' : 'Mixto'}
          </Text>
        </View>
        <View style={[styles.chip, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
          <Text style={[styles.chipText, { color: c.subtexto }]}>👥 {JUGADORES.length} jugadores</Text>
        </View>
      </View>

      {/* Staff */}
      <Text style={[styles.sectionTitle, { color: c.texto }]}>🎽 {t('myClub.staff')}</Text>
      <View style={styles.staffList}>
        {STAFF.map((miembro) => (
          <View
            key={miembro.id}
            style={[styles.staffCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}
          >
            <View style={[styles.staffAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
              <Text style={[styles.staffAvatarText, { color: c.boton }]}>
                {miembro.firstName.charAt(0)}
              </Text>
            </View>
            <View style={styles.staffInfo}>
              <Text style={[styles.staffNombre, { color: c.texto }]}>
                {miembro.firstName} {miembro.lastName}
              </Text>
              <Text style={[styles.staffPhone, { color: c.subtexto }]}>📞 {miembro.phone}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Plantilla */}
      <Text style={[styles.sectionTitle, { color: c.texto }]}>⚽ {t('myClub.squad')}</Text>
      <View style={styles.jugadoresList}>
        {JUGADORES.map((jugador) => (
          <TouchableOpacity
            key={jugador.id}
            style={[styles.jugadorCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}
          >
            {/* Avatar */}
            <View style={[styles.jugadorAvatar, { backgroundColor: `${POSICION_COLOR[jugador.position]}18`, borderColor: `${POSICION_COLOR[jugador.position]}35` }]}>
              <Text style={[styles.jugadorAvatarText, { color: POSICION_COLOR[jugador.position] }]}>
                {jugador.firstName.charAt(0)}
              </Text>
            </View>

            {/* Info */}
            <View style={styles.jugadorInfo}>
              <Text style={[styles.jugadorNombre, { color: c.texto }]}>
                {jugador.firstName} {jugador.lastName}
              </Text>
              <View style={styles.jugadorMeta}>
                <Text style={[styles.jugadorMetaText, { color: c.subtexto }]}>
                  🎂 {jugador.birthDate}
                </Text>
                <Text style={[styles.jugadorMetaText, { color: c.subtexto }]}>
                  👕 {jugador.kitSize}
                </Text>
              </View>
              <View style={styles.jugadorMeta}>
                <Text style={[styles.jugadorMetaText, { color: c.subtexto }]}>
                  🪪 {jugador.docType}: {jugador.docNumber}
                </Text>
              </View>
            </View>

            {/* Dorsal y posición */}
            <View style={styles.jugadorDerecha}>
              <View style={[styles.dorsalBadge, { backgroundColor: `${POSICION_COLOR[jugador.position]}18`, borderColor: `${POSICION_COLOR[jugador.position]}35` }]}>
                <Text style={[styles.dorsalText, { color: POSICION_COLOR[jugador.position] }]}>
                  #{jugador.jerseyNumber}
                </Text>
              </View>
              <Text style={[styles.posicionText, { color: c.subtexto }]}>
                {POSICION_LABEL[jugador.position]}
              </Text>
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
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  clubAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clubInfo: {
    flex: 1,
  },
  clubNombre: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  clubMeta: {
    fontSize: 13,
  },

  // Código invitación
  codigoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  codigoLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  codigoValue: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  copiarButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copiarText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
    flexWrap: 'wrap',
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
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Staff
  staffList: {
    gap: 10,
    marginBottom: 28,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  staffInfo: {
    flex: 1,
    gap: 3,
  },
  staffNombre: {
    fontSize: 14,
    fontWeight: '600',
  },
  staffPhone: {
    fontSize: 13,
  },

  // Jugadores
  jugadoresList: {
    gap: 10,
  },
  jugadorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  jugadorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jugadorAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  jugadorInfo: {
    flex: 1,
    gap: 3,
  },
  jugadorNombre: {
    fontSize: 14,
    fontWeight: '600',
  },
  jugadorMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  jugadorMetaText: {
    fontSize: 11,
  },
  jugadorDerecha: {
    alignItems: 'center',
    gap: 4,
  },
  dorsalBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dorsalText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  posicionText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
})