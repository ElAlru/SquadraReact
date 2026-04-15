import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native'
import { apiFetch } from '../../lib/api'
import { useTheme } from '../../lib/useTheme'

const ROL_LABEL: Record<string, string> = {
  PLAYER: '⚽ Jugador',
  COACH: '🎽 Entrenador',
  RELATIVE: '👨‍👧 Familiar',
  OTHER: '👤 Otro',
}

export default function Esperando() {
  const c = useTheme()
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const checkStatus = async () => {
    setLoading(true)
    try {
      const res = await apiFetch("/api/clubs/my-requests")
      if (res.ok) {
        const data = await res.json()
        if (data.length > 0) {
          setRequest(data[0])
        } else {
          // No hay solicitudes pendientes, volver al inicio
          router.replace('/')
        }
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
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={checkStatus} tintColor={c.boton} />
      }
    >
      <View style={[styles.iconContainer, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
        <Text style={{ fontSize: 40 }}>⏳</Text>
      </View>

      <Text style={[styles.title, { color: c.texto }]}>Solicitud pendiente</Text>

      {request && (
        <View style={[styles.infoCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: c.subtexto }]}>Club</Text>
            <Text style={[styles.infoValue, { color: c.texto }]}>{request.clubName}</Text>
          </View>
          <View style={[styles.divider, { backgroundColor: c.bordeInput }]} />
          <View style={styles.infoRow}>
            <Text style={[styles.infoLabel, { color: c.subtexto }]}>Rol solicitado</Text>
            <Text style={[styles.infoValue, { color: c.texto }]}>
              {ROL_LABEL[request.requestedRole] || request.requestedRole}
            </Text>
          </View>
          {request.message && (
            <>
              <View style={[styles.divider, { backgroundColor: c.bordeInput }]} />
              <View style={styles.infoRow}>
                <Text style={[styles.infoLabel, { color: c.subtexto }]}>Tu mensaje</Text>
                <Text style={[styles.infoValue, { color: c.texto, flex: 1, textAlign: 'right' }]}>
                  {request.message}
                </Text>
              </View>
            </>
          )}
        </View>
      )}

      <Text style={[styles.hint, { color: c.subtexto }]}>
        Desliza hacia abajo para actualizar el estado de tu solicitud.
      </Text>

      <TouchableOpacity
        style={[styles.backButton, { borderColor: c.bordeInput, borderWidth: 1 }]}
        onPress={() => router.replace('/')}
      >
        <Text style={[styles.backButtonText, { color: c.texto }]}>Volver atrás</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  iconContainer: { width: 80, height: 80, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  infoCard: { width: '100%', borderRadius: 16, borderWidth: 1, padding: 16, marginBottom: 20, gap: 12 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  infoLabel: { fontSize: 13, fontWeight: '600' },
  infoValue: { fontSize: 14, fontWeight: '500', maxWidth: '60%', textAlign: 'right' },
  divider: { height: 1, width: '100%' },
  hint: { fontSize: 13, textAlign: 'center', marginBottom: 32, lineHeight: 20 },
  backButton: { padding: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
  backButtonText: { fontWeight: '600', fontSize: 15 }
})
