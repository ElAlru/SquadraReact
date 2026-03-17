import { useTranslation } from 'react-i18next'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useTheme } from '../../lib/useTheme'

// MOCK: simula clubes del usuario. Cambia a [] para ver el estado vacío
const MIS_CLUBES = [
  { id: 1, nombre: 'FC Ejemplo', rol: 'COACH' },
  { id: 2, nombre: 'CD Prueba', rol: 'PLAYER' },
]

const ROL_LABEL: Record<string, string> = {
  PRESIDENT: '👑 Presidente',
  COACH: '🎽 Entrenador',
  PLAYER: '⚽ Jugador',
  RELATIVE: '👨‍👧 Familiar',
  OTHER: '👤 Otro',
}

export default function SelectorIndex() {
  const c = useTheme()
  const { t } = useTranslation()

  const tienesClubes = MIS_CLUBES.length > 0

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Brand */}
      <Text style={styles.brand}>SQUADRA</Text>

      {tienesClubes ? (
        <>
          {/* Estado: tiene clubes */}
          <Text style={[styles.title, { color: c.texto }]}>{t('selector.title')}</Text>
          <Text style={[styles.subtitle, { color: c.subtexto }]}>{t('selector.subtitle')}</Text>

          {/* Lista de clubes */}
          <View style={styles.clubList}>
            {MIS_CLUBES.map((club) => (
              <TouchableOpacity
                key={club.id}
                style={[styles.clubCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}
              >
                {/* Avatar del club */}
                <View style={[styles.clubAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                  <Text style={styles.clubAvatarText}>
                    {club.nombre.charAt(0)}
                  </Text>
                </View>

                {/* Info */}
                <View style={styles.clubInfo}>
                  <Text style={[styles.clubName, { color: c.texto }]}>{club.nombre}</Text>
                  <Text style={[styles.clubRol, { color: c.subtexto }]}>{ROL_LABEL[club.rol]}</Text>
                </View>

                {/* Flecha */}
                <Text style={[styles.clubArrow, { color: c.boton }]}>›</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Divisor */}
          <View style={styles.dividerContainer}>
            <View style={[styles.dividerLine, { backgroundColor: c.bordeInput }]} />
            <Text style={[styles.dividerText, { color: c.subtexto }]}>{t('selector.or')}</Text>
            <View style={[styles.dividerLine, { backgroundColor: c.bordeInput }]} />
          </View>

          {/* Botones secundarios */}
          <TouchableOpacity style={[styles.secondaryButton, { borderColor: c.boton }]}>
            <Text style={[styles.secondaryButtonText, { color: c.boton }]}>
              🔗 {t('selector.joinAnother')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.secondaryButton, { borderColor: c.bordeInput }]}>
            <Text style={[styles.secondaryButtonText, { color: c.subtexto }]}>
              ➕ {t('selector.createAnother')}
            </Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          {/* Estado: sin clubes */}
          <Text style={[styles.title, { color: c.texto }]}>{t('selector.titleEmpty')}</Text>
          <Text style={[styles.subtitle, { color: c.subtexto }]}>{t('selector.subtitleEmpty')}</Text>

          {/* Tarjeta crear */}
          <TouchableOpacity
            style={[styles.bigCard, { backgroundColor: c.boton }]}
          >
            <Text style={styles.bigCardIcon}>🏆</Text>
            <View style={styles.bigCardText}>
              <Text style={styles.bigCardTitle}>{t('selector.createClub')}</Text>
              <Text style={styles.bigCardSubtitle}>{t('selector.createClubSub')}</Text>
            </View>
            <Text style={styles.bigCardArrow}>›</Text>
          </TouchableOpacity>

          {/* Tarjeta unirse */}
          <TouchableOpacity
            style={[styles.bigCard, { backgroundColor: c.input, borderWidth: 1.5, borderColor: c.bordeInput }]}
          >
            <Text style={styles.bigCardIcon}>🔗</Text>
            <View style={styles.bigCardText}>
              <Text style={[styles.bigCardTitle, { color: c.texto }]}>{t('selector.joinClub')}</Text>
              <Text style={[styles.bigCardSubtitle, { color: c.subtexto }]}>{t('selector.joinClubSub')}</Text>
            </View>
            <Text style={[styles.bigCardArrow, { color: c.subtexto }]}>›</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  brand: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#C9A84C',
    letterSpacing: 4,
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 28,
    lineHeight: 20,
  },

  // Lista de clubes
  clubList: {
    gap: 12,
    marginBottom: 8,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 14,
  },
  clubAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubAvatarText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#16a34a',
  },
  clubInfo: {
    flex: 1,
    gap: 3,
  },
  clubName: {
    fontSize: 16,
    fontWeight: '600',
  },
  clubRol: {
    fontSize: 13,
  },
  clubArrow: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  // Divisor
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 13,
  },

  // Botones secundarios
  secondaryButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },

  // Tarjetas grandes (estado vacío)
  bigCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 20,
    marginBottom: 14,
    gap: 16,
  },
  bigCardIcon: {
    fontSize: 32,
  },
  bigCardText: {
    flex: 1,
    gap: 4,
  },
  bigCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  bigCardSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 18,
  },
  bigCardArrow: {
    fontSize: 26,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.8)',
  },
})