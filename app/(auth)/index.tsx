import { router } from 'expo-router'
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native'
import { useAuthStore } from '../../lib/store'
import LogoSimbolo from '../../components/LogoSimbolo'

const BULLETS = [
  { icon: '⚽', text: 'Gestiona tu club desde cualquier lugar' },
  { icon: '📅', text: 'Calendario, horarios y convocatorias' },
  { icon: '👥', text: 'Conecta jugadores, familias y cuerpo técnico' },
]

export default function Landing() {
  const themeMode = useAuthStore((s: any) => s.themeMode)
  const colorScheme = useColorScheme()
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && colorScheme === 'dark')

  const fondo      = isDark ? '#1a1a1a' : '#ffffff'
  const subtexto   = isDark ? '#94a3b8' : '#6b7280'
  const boton      = '#16a34a'

  return (
    <View style={[styles.root, { backgroundColor: fondo }]}>
      {/* Marca de agua */}
      <LogoSimbolo
        size={700}
        color="#ffc06d"
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: [{ translateX: -350 }, { translateY: -350 }],
          opacity: 0.06,
        }}
      />

      <ScrollView contentContainerStyle={styles.outer}>
        <View style={styles.container}>

          {/* Branding */}
          <View style={styles.brandBlock}>
            <LogoSimbolo size={100} color="#ffc06d" style={{ alignSelf: 'center' }} />

            <Image
              source={
                isDark
                  ? require('../../assets/images/titulo-squadra-dark.png')
                  : require('../../assets/images/titulo-squadra.png')
              }
              style={styles.imgTitulo}
            />

            <Image
              source={
                isDark
                  ? require('../../assets/images/subtitulo-squadra-dark.png')
                  : require('../../assets/images/subtitulo-squadra.png')
              }
              style={styles.imgSubtitulo}
            />
          </View>

          {/* Bullets */}
          <View style={styles.bullets}>
            {BULLETS.map((item, i) => (
              <View key={i} style={styles.bullet}>
                <Text style={styles.bulletIcon}>{item.icon}</Text>
                <Text style={[styles.bulletText, { color: subtexto }]}>{item.text}</Text>
              </View>
            ))}
          </View>

          {/* Botones */}
          <View style={styles.buttonGroup}>
            <TouchableOpacity
              style={[styles.btn, { backgroundColor: boton }]}
              onPress={() => router.push('/(auth)/login')}
            >
              <Text style={[styles.btnText, { color: '#ffffff' }]}>Iniciar sesión</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.btn, { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: boton }]}
              onPress={() => router.push('/(auth)/registro')}
            >
              <Text style={[styles.btnText, { color: boton }]}>Registrarse</Text>
            </TouchableOpacity>
          </View>

        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  outer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  container: {
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
    gap: 32,
  },
  brandBlock: {
    alignItems: 'center',
    gap: 8,
  },
  imgTitulo: {
    width: '55%',
    height: 40,
    resizeMode: 'contain',
    alignSelf: 'center',
    marginBottom: 4,
  },
  imgSubtitulo: {
    width: '65%',
    height: 30,
    resizeMode: 'contain',
    alignSelf: 'center',
  },
  bullets: {
    gap: 12,
  },
  bullet: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bulletIcon: {
    fontSize: 20,
    width: 28,
    textAlign: 'center',
  },
  bulletText: {
    fontSize: 14,
    flex: 1,
  },
  buttonGroup: {
    gap: 12,
  },
  btn: {
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  btnText: {
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.3,
  },
})
