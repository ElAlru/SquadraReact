import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { apiFetch } from '../../lib/api'
import { useAuthStore } from '../../lib/store'
import { useTheme } from '../../lib/useTheme'
import ScreenContainer from '../../components/ScreenContainer'

export default function CrearClub() {
  const c = useTheme()
  const { setActiveClub, setSeason } = useAuthStore()

  const [nombre, setNombre] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [created, setCreated] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [clubData, setClubData] = useState<any>(null)

  const handleCrearClub = async () => {
    if (!nombre.trim()) return
    setIsSubmitting(true)
    try {
      const res = await apiFetch('/api/clubs', {
        method: 'POST',
        body: JSON.stringify({
          name: nombre.trim(),
          logoUrl: logoUrl.trim() || null,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setClubData(data)
        setCreated(true)
      } else {
        const errorText = await res.text()
        Alert.alert("Error", errorText || "No se pudo crear el club")
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
      setActiveClub(clubData.id, clubData.name, "PRESIDENT", null, clubData.logoUrl ?? null)
      const res = await apiFetch(`/api/clubs/${clubData.id}/current-season`)
      if (res.ok) {
        const label = await res.text()
        setSeason(label, label)
      }
      router.replace('/inicio')
    } catch (e) {
      router.replace('/')
    }
  }

  if (created) {
    return (
      <ScreenContainer>
      <View style={[styles.container, { backgroundColor: c.fondo, justifyContent: 'center' }]}>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>🏆</Text>
        <Text style={[styles.title, { color: c.texto }]}>¡Club creado!</Text>
        <Text style={[styles.subtitle, { color: c.subtexto }]}>
          Comparte este código con tus jugadores para que puedan unirse.
        </Text>
        <View style={[styles.codeCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
          <Text style={[styles.codeLabel, { color: c.subtexto }]}>CÓDIGO DE INVITACIÓN</Text>
          <Text style={[styles.codeText, { color: c.boton }]}>{clubData?.invitationCode}</Text>
        </View>
        <TouchableOpacity
          style={[styles.button, { backgroundColor: c.boton, width: '100%' }]}
          onPress={handleEntrar}
        >
          <Text style={styles.buttonText}>Empezar a gestionar</Text>
        </TouchableOpacity>
      </View>
      </ScreenContainer>
    )
  }

  return (
    <ScreenContainer>
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}>
      <Text style={[styles.title, { color: c.texto, marginTop: 40 }]}>Nuevo club</Text>

      <Text style={[styles.label, { color: c.subtexto }]}>Nombre del club *</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput }]}
        placeholder="Ej: UD Atlético Parque"
        placeholderTextColor={c.subtexto}
        value={nombre}
        onChangeText={setNombre}
        maxLength={100}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>
        URL del logo{' '}
        <Text style={{ fontStyle: 'italic' }}>(opcional)</Text>
      </Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput }]}
        placeholder="https://ejemplo.com/logo.png"
        placeholderTextColor={c.subtexto}
        value={logoUrl}
        onChangeText={setLogoUrl}
        autoCapitalize="none"
        keyboardType="url"
      />

      <TouchableOpacity
        style={[styles.button, { backgroundColor: nombre.trim() ? c.boton : c.subtexto + '50', marginTop: 8 }]}
        onPress={handleCrearClub}
        disabled={isSubmitting || !nombre.trim()}
      >
        {isSubmitting
          ? <ActivityIndicator color="white" />
          : <Text style={styles.buttonText}>Crear club</Text>
        }
      </TouchableOpacity>
    </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, alignSelf: 'flex-start' },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 20, color: '#888' },
  label: { fontSize: 13, fontWeight: '600', alignSelf: 'flex-start', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: { width: '100%', padding: 16, borderRadius: 12, borderWidth: 1, fontSize: 16, marginBottom: 20 },
  button: { padding: 18, borderRadius: 12, alignItems: 'center', width: '100%' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  codeCard: { padding: 24, borderRadius: 16, marginBottom: 30, width: '100%', alignItems: 'center', borderWidth: 1 },
  codeLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 2, marginBottom: 8, textTransform: 'uppercase' },
  codeText: { fontSize: 36, fontWeight: 'bold', letterSpacing: 8 }
})
