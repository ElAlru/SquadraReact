import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl
} from 'react-native'
import { apiFetch } from '../../lib/api'
import { useTheme } from '../../lib/useTheme'

export default function Esperando() {
  const c = useTheme()
  const { t } = useTranslation()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const loadRequests = async () => {
    setLoading(true)
    try {
      const res = await apiFetch("/api/clubs/my-requests")
      if (res.ok) {
        const data = await res.json()
        setRequests(data)
        
        // Si ya no hay solicitudes pendientes, es que le han aceptado (o rechazado)
        // Lo mandamos al selector para que vea su nuevo club
        if (data.length === 0 && !loading) {
          router.replace("/(selector)")
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadRequests() }, [])

  return (
    <ScrollView 
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={loadRequests} tintColor={c.boton} />}
    >
      <Text style={styles.brand}>SQUADRA</Text>

      <View style={[styles.iconContainer, { backgroundColor: `${c.boton}15`, borderColor: `${c.boton}35` }]}>
        <Text style={styles.iconEmoji}>⏳</Text>
      </View>

      <Text style={[styles.title, { color: c.texto }]}>
        {t('waiting.title', 'Casi listo...')}
      </Text>
      <Text style={[styles.subtitle, { color: c.subtexto }]}>
        {t('waiting.subtitle', 'Tu solicitud está siendo revisada por el club. Recibirás una notificación cuando seas aceptado.')}
      </Text>

      <View style={styles.list}>
        {requests.map((req) => (
          <View key={req.id} style={[styles.card, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
            <View style={styles.cardInfo}>
              <Text style={[styles.clubName, { color: c.texto }]}>{req.clubName}</Text>
              <Text style={[styles.date, { color: c.subtexto }]}>Solicitado el {new Date(req.requestedAt).toLocaleDateString()}</Text>
            </View>
            <View style={[styles.badge, { backgroundColor: '#f59e0b20', borderColor: '#f59e0b40' }]}>
              <Text style={[styles.badgeText, { color: '#f59e0b' }]}>PENDIENTE</Text>
            </View>
          </View>
        ))}

        {requests.length === 0 && !loading && (
          <Text style={{ textAlign: 'center', color: c.subtexto, marginTop: 20 }}>
            Parece que no tienes solicitudes pendientes.
          </Text>
        )}
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: c.boton }]} 
        onPress={loadRequests}
      >
        <Text style={[styles.buttonText, { color: c.botonTexto }]}>
          {t('waiting.refresh', 'Comprobar de nuevo')}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.backLink} onPress={() => router.replace("/(selector)")}>
        <Text style={{ color: c.subtexto, fontSize: 14 }}>Volver al selector</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, paddingTop: 80, paddingBottom: 40 },
  brand: { fontSize: 13, fontWeight: 'bold', color: '#C9A84C', letterSpacing: 4, marginBottom: 40 },
  iconContainer: { width: 64, height: 64, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconEmoji: { fontSize: 30 },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 32 },
  list: { gap: 12, marginBottom: 32 },
  card: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 14, borderWidth: 1 },
  cardInfo: { flex: 1 },
  clubName: { fontSize: 16, fontWeight: 'bold' },
  date: { fontSize: 12, marginTop: 4 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  button: { padding: 15, borderRadius: 12, alignItems: 'center' },
  buttonText: { fontWeight: 'bold', fontSize: 16 },
  backLink: { marginTop: 20, alignItems: 'center' }
})