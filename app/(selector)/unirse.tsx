import { useState } from 'react'
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '../../lib/useTheme'
import { apiFetch } from '../../lib/api'

export default function Unirse() {
  const c = useTheme()
  const [codigo, setCodigo] = useState('')
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleJoin = async () => {
    const cleanCode = codigo.toUpperCase().trim()
    if (!cleanCode) return
    setIsLoading(true)
    try {
      const res = await apiFetch("/api/clubs/join", {
        method: "POST",
        body: JSON.stringify({ invitationCode: cleanCode })
      })
      if (res.ok) setSent(true)
      else Alert.alert("Ups", "Código no válido")
    } catch (e) {
      Alert.alert("Error", "Fallo de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <View style={[styles.container, { backgroundColor: c.fondo, justifyContent: 'center' }]}>
        <Text style={{ fontSize: 60, marginBottom: 20 }}>📩</Text>
        <Text style={[styles.title, { color: c.texto }]}>Solicitud enviada</Text>
        <TouchableOpacity style={[styles.button, { backgroundColor: c.boton, width: '100%' }]} onPress={() => router.replace('/')}>
          <Text style={styles.buttonText}>Entendido</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}>
      <Text style={[styles.title, { color: c.texto, marginTop: 40 }]}>Unirme a un club</Text>
      <TextInput
        style={[styles.input, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput }]}
        placeholder="ABCDEF"
        placeholderTextColor={c.subtexto}
        autoCapitalize="characters"
        maxLength={6}
        value={codigo}
        onChangeText={setCodigo}
      />
      <TouchableOpacity 
        style={[styles.button, { backgroundColor: codigo.length === 6 ? c.boton : c.subtexto + '50' }]} 
        onPress={handleJoin}
        disabled={isLoading || codigo.length < 6}
      >
        {isLoading ? <ActivityIndicator color="white" /> : <Text style={styles.buttonText}>Enviar solicitud</Text>}
      </TouchableOpacity>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  input: { width: '100%', padding: 20, borderRadius: 16, borderWidth: 1, fontSize: 32, textAlign: 'center', fontWeight: 'bold', letterSpacing: 8, marginBottom: 24 },
  button: { padding: 18, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
})