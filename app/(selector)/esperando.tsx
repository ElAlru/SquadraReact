import { useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useTheme } from '../../lib/useTheme'

// pa probar
const CLUB_SOLICITADO = {
  nombre: 'FC Ejemplo',
  codigo: 'ABC-123',
}

export default function Esperando() {
  const c = useTheme()
  const { t } = useTranslation()

  // Animación del reloj de arena, esto me lo dijo la ia y es clave para darle dinamismo 
  const rotacion = useRef(new Animated.Value(0)).current

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotacion, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.delay(600),
        Animated.timing(rotacion, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start()
  }, [])

  const rotacionInterpolada = rotacion.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  })

  return (
    <View style={[styles.container, { backgroundColor: c.fondo }]}>

      {/* Brand */}
      <Text style={styles.brand}>SQUADRA</Text>

      {/* Contenido centrado */}
      <View style={styles.content}>

        {/* Icono animado */}
        <Animated.View
          style={[
            styles.iconContainer,
            {
              backgroundColor: `${c.boton}15`,
              borderColor: `${c.boton}35`,
              transform: [{ rotate: rotacionInterpolada }],
            },
          ]}
        >
          <Text style={styles.iconEmoji}>⏳</Text>
        </Animated.View>

        {/* Título */}
        <Text style={[styles.title, { color: c.texto }]}>{t('waiting.title')}</Text>
        <Text style={[styles.subtitle, { color: c.subtexto }]}>{t('waiting.subtitle')}</Text>

        {/* Tarjeta del club */}
        <View style={[styles.clubCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
          <Text style={[styles.clubCardLabel, { color: c.subtexto }]}>{t('waiting.requestedClub')}</Text>
          <View style={styles.clubCardRow}>
            <View style={[styles.clubAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
              <Text style={[styles.clubAvatarText, { color: c.boton }]}>
                {CLUB_SOLICITADO.nombre.charAt(0)}
              </Text>
            </View>
            <View style={styles.clubInfo}>
              <Text style={[styles.clubNombre, { color: c.texto }]}>{CLUB_SOLICITADO.nombre}</Text>
              <Text style={[styles.clubCodigo, { color: c.subtexto }]}>{CLUB_SOLICITADO.codigo}</Text>
            </View>
            {/* Badge estado */}
            <View style={[styles.badge, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b40' }]}>
              <Text style={[styles.badgeText, { color: '#f59e0b' }]}>Pendiente</Text>
            </View>
          </View>
        </View>

        {/* Mensaje */}
        <Text style={[styles.message, { color: c.subtexto }]}>{t('waiting.message')}</Text>

        {/* Botón actualizar */}
        <TouchableOpacity style={[styles.button, { backgroundColor: c.boton }]}>
          <Text style={[styles.buttonText, { color: c.botonTexto }]}>🔄 {t('waiting.refresh')}</Text>
        </TouchableOpacity>

      </View>

      {/* Volver */}
      <TouchableOpacity style={styles.backContainer}>
        <Text style={[styles.backArrow, { color: c.boton }]}>←</Text>
        <Text style={[styles.backText, { color: c.boton }]}>{t('waiting.back')}</Text>
      </TouchableOpacity>

    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  brand: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#C9A84C',
    letterSpacing: 4,
    marginBottom: 40,
  },
  content: {
    flex: 1,
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 34,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 28,
    textAlign: 'center',
  },
  clubCard: {
    width: '100%',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
    gap: 10,
  },
  clubCardLabel: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  clubCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  clubInfo: {
    flex: 1,
    gap: 3,
  },
  clubNombre: {
    fontSize: 15,
    fontWeight: '600',
  },
  clubCodigo: {
    fontSize: 13,
    letterSpacing: 1,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  button: {
    width: '100%',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 24,
  },
  backArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
})