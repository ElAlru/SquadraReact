import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, RefreshControl } from 'react-native'
import { apiFetch } from '../../lib/api'
import { useTheme } from '../../lib/useTheme'

export default function Esperando() {
  const c = useTheme()
  const [request, setRequest] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const checkStatus = async () => {
    try {
      const res = await apiFetch("/api/clubs/my-requests")
      const data = await res.json()
      if (res.ok && data.length > 0) setRequest(data[0])
      else router.replace('/') 
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
      <View style={[styles.iconContainer, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
        <Text style={{ fontSize: 40 }}>⏳</Text>
      </View>
      <Text style={[styles.title, { color: c.texto }]}>Solicitud pendiente</Text>
      <Text style={[styles.subtitle, { color: c.subtexto }]}>Esperando aprobación de {request?.clubName}.</Text>
      <TouchableOpacity style={[styles.button, { borderColor: c.bordeInput, borderWidth: 1 }]} onPress={() => router.replace('/')}>
        <Text style={[styles.buttonText, { color: c.texto }]}>Volver atrás</Text>
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  iconContainer: { width: 80, height: 80, borderRadius: 20, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, textAlign: 'center', marginBottom: 40 },
  button: { padding: 16, borderRadius: 12, width: '100%', alignItems: 'center' },
  buttonText: { fontWeight: '600' }
})