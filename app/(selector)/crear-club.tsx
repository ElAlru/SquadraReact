import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { apiFetch } from '../../lib/api'
import { useAuthStore } from '../../lib/store'
import { useTheme } from '../../lib/useTheme'

export default function CrearClub() {
  const c = useTheme()
  const { setActiveClub, setSeason } = useAuthStore()

  const [nombre, setNombre] = useState('')
  const [created, setCreated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clubData, setClubData] = useState<any>(null)

  const handleCrearClub = async () => {
    if (!nombre.trim()) return
    setIsSubmitting(true)
    try {
      const res = await apiFetch('/api/clubs', {
        method: 'POST',
        body: JSON.stringify({ name: nombre, logoUrl: null }),
      })
      if (res.ok) {
        setClubData(await res.json())
        setCreated(true)
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo crear el club")
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleEntrar = async () => {
    if (!clubData) return
    try {
      setActiveClub(clubData.id, clubData.name, "PRESIDENT", null, null)
      const res = await apiFetch(`/api/clubs/${clubData.id}/current-season`)
      if (res.ok) {
        const label = await res.text()
        setSeason(label, label)
      }
      router.replace('/inicio') // 👈 Ruta de tu imagen
    } catch (e) {
      router.replace('/')
    }
  }

  if (created) {
    return (
      <View style={[styles.container, { backgroundColor: c.fondo, justifyContent: 'center' }]}>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>🏆</Text>
        <Text style={[styles.title, { color: c.texto }]}>¡Club creado!</Text>
        <View style={[styles.codeCard, { backgroundColor: c.input }]}>
          <Text style={[styles.codeText, { color: c.boton }]}>{clubData?.invitationCode}</Text>
        </View>
        <TouchableOpacity style={[styles.button, { backgroundColor: c.boton, width: '100%' }]} onPress={handleEntrar}>
          <Text style={styles.buttonText}>Empezar a gestionar</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}>
      <Text style={[styles.title, { color: c.texto, marginTop: 40 }]}>Nuevo club</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput }]}
        placeholder="Nombre del club"
        placeholderTextColor={c.subtexto}
        value={nombre}
        onChangeText={setNombre}
      />
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: nombre.trim() ? c.boton : c.subtexto + '50' }]} 
        onPress={handleCrearClub}
        disabled={isSubmitting || !nombre.trim()}
      >
        {isSubmitting ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Crear club</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  input: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 16, marginBottom: 20 },
  button: { padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  codeCard: { padding: 20, borderRadius: 16, marginBottom: 30, width: '100%', alignItems: 'center' },
  codeText: { fontSize: 32, fontWeight: 'bold', letterSpacing: 5 }
})