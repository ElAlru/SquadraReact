import { router } from 'expo-router'
import { useEffect, useState, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
  RefreshControl
} from 'react-native'
import { apiFetch } from '../../lib/api'
import { useTheme } from '../../lib/useTheme'
import { useAuthStore } from '../../lib/store'

export default function Esperando() {
  const c = useTheme()
  const { t } = useTranslation()
  const { setActiveClub } = useAuthStore()
  
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // --- ANIMACIÓN DEL ICONO ⏳ ---
  const rotateValue = useRef(new Animated.Value(0)).current
  
  useEffect(() => {
    const startAnimation = () => {
      rotateValue.setValue(0)
      Animated.timing(rotateValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      }).start(() => startAnimation())
    }
    startAnimation()
  }, [])

  const rotateInterpolation = rotateValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  })

  // --- LÓGICA DE CARGA Y COMPROBACIÓN ---
  const checkStatus = async () => {
    setLoading(true)
    try {
      // 1. Miramos si sigue teniendo solicitudes pendientes
      const res = await apiFetch("/api/clubs/my-requests")
      const data = await res.json()

      if (res.ok && data.length > 0) {
        // Seguimos en estado PENDING
        setRequest(data[0]) // Cogemos la más reciente
      } else {
        // 2. Si no hay pendientes, comprobamos si es que ya le han aceptado
        // Llamamos al endpoint que hicimos para el selector para ver si ya tiene el rol
        const resClubes = await apiFetch("/api/selector/mis-clubes")
        if (resClubes.ok) {
          const clubes = await resClubes.json()
          
          // Si el club que buscábamos aparece en la lista de mis clubes, es que es APPROVED
          if (clubes.length > 0) {
            const clubAceptado = clubes[0] // O buscar por ID si fuera necesario
            setActiveClub(clubAceptado.clubId, clubAceptado.role, clubAceptado.teamId)
            router.replace("/(club)/inicio")
            return
          }
        }
        
        // 3. Si no está en pendientes ni en mis clubes, es que fue REJECTED
        Alert.alert(
          "Solicitud rechazada", 
          "El club no ha aceptado tu solicitud de entrada.",
          [{ text: "Volver", onPress: () => router.replace("/(selector)") }]
        )
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { checkStatus() }, [])

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={checkStatus} tintColor={c.boton} />}
    >
      {/* Brand */}
      <Text style={styles.brand}>SQUADRA</Text>

      {/* Icono ⏳ animado */}
      <View style={[styles.iconContainer, { backgroundColor: `${c.boton}15`, borderColor: `${c.boton}35` }]}>
        <Animated.Text style={[styles.iconEmoji, { transform: [{ rotate: rotateInterpolation }] }]}>
          ⏳
        </Animated.Text>
      </View>

      <Text style={[styles.title, { color: c.texto }]}>
        {t('waiting.title', 'Solicitud enviada')}
      </Text>
      <Text style={[styles.subtitle, { color: c.subtexto }]}>
        {t('waiting.subtitle', 'Estás en lista de espera del club')}
      </Text>

      {/* Tarjeta del club (solo si hay datos) */}
      {request && (
        <View style={[styles.clubCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
          <View style={[styles.avatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
            <Text style={[styles.avatarText, { color: c.boton }]}>{request.clubName.charAt(0)}</Text>
          </View>
          <View style={styles.clubInfo}>
            <Text style={[styles.clubName, { color: c.texto }]}>{request.clubName}</Text>
            <Text style={[styles.clubCode, { color: c.subtexto }]}>Código: {request.invitationCode || '---'}</Text>
          </View>
          <View style={[styles.badge, { backgroundColor: '#f59e0b15', borderColor: '#f59e0b35' }]}>
            <Text style={[styles.badgeText, { color: '#f59e0b' }]}>PENDIENTE</Text>
          </View>
        </View>
      )}

      <Text style={[styles.message, { color: c.subtexto }]}>
        El presidente debe aprobar tu entrada. Te avisaremos cuando seas aceptado.
      </Text>

      {/* Botón Actualizar estado */}
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: c.boton, opacity: loading ? 0.7 : 1 }]} 
        onPress={checkStatus}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={c.botonTexto} />
        ) : (
          <Text style={[styles.buttonText, { color: c.botonTexto }]}>
            🔄 Actualizar estado
          </Text>
        )}
      </TouchableOpacity>

      {/* Link Volver */}
      <TouchableOpacity style={styles.backLink} onPress={() => router.replace("/(selector)")}>
        <Text style={[styles.backText, { color: c.boton }]}>← Volver</Text>
      </TouchableOpacity>

    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 80, paddingBottom: 40, alignItems: 'center' },
  brand: { alignSelf: 'flex-start', fontSize: 13, fontWeight: 'bold', color: '#C9A84C', letterSpacing: 4, marginBottom: 40 },
  
  iconContainer: { width: 80, height: 80, borderRadius: 24, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconEmoji: { fontSize: 40 },
  
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, marginBottom: 32, textAlign: 'center' },

  clubCard: { width: '100%', flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 16, borderWidth: 1, marginBottom: 24, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: 'bold' },
  clubInfo: { flex: 1 },
  clubName: { fontSize: 16, fontWeight: 'bold' },
  clubCode: { fontSize: 12, marginTop: 2 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },

  message: { fontSize: 14, lineHeight: 22, textAlign: 'center', marginBottom: 40, paddingHorizontal: 10 },
  
  button: { width: '100%', padding: 16, borderRadius: 12, alignItems: 'center', marginBottom: 24 },
  buttonText: { fontWeight: 'bold', fontSize: 16 },
  
  backLink: { padding: 8 },
  backText: { fontSize: 15, fontWeight: '600' }
})