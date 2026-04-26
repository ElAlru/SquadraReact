import { useState } from 'react'
import { Alert, ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '../../lib/useTheme'
import ScreenContainer from '../../components/ScreenContainer'
import { apiFetch } from '../../lib/api'

const ROLES = [
  { value: 'PLAYER', label: '⚽ Jugador' },
  { value: 'COACH', label: '🎽 Entrenador' },
  { value: 'RELATIVE', label: '👨‍👧 Familiar' },
  { value: 'OTHER', label: '👤 Otro' },
]

export default function Unirse() {
  const c = useTheme()
  const [codigo, setCodigo] = useState('')
  const [rolSeleccionado, setRolSeleccionado] = useState('PLAYER')
  const [mensaje, setMensaje] = useState('')
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleJoin = async () => {
    const cleanCode = codigo.toUpperCase().trim();
    if (!cleanCode || cleanCode.length !== 6) return;
    setIsLoading(true);
    
    try {
      console.log("➡️ Enviando petición con código:", cleanCode);
      const res = await apiFetch("/api/clubs/join", {
        method: "POST",
        body: JSON.stringify({
          invitationCode: cleanCode,
          requestedRole: rolSeleccionado,
          message: mensaje
        })
      });
      
      if (res.ok) {
        setSent(true);
      } else {
        // Leemos la respuesta cruda del backend
        const errorText = await res.text();
        console.log("🚨 RESPUESTA DEL BACKEND (Error 400):", errorText);
        
        try {
          // Intentamos sacarlo como JSON si viene bien formateado
          const data = JSON.parse(errorText);
          Alert.alert("Aviso", data.error || "No se pudo unir al club");
        } catch (e) {
          // Si es texto plano, lo mostramos tal cual
          Alert.alert("Aviso", errorText);
        }
      }
    } catch (err: any) {
      console.log("💥 EXPLOSIÓN EN EL CÓDIGO (Catch):", err.message);
      Alert.alert("Error", "Problema de conexión con el servidor.");
    } finally {
      setIsLoading(false);
    }
  }
  
  if (sent) {
    return (
      <ScreenContainer>
        <View style={[styles.successContainer, { backgroundColor: c.fondo }]}>
          <Text style={{ fontSize: 60, marginBottom: 20 }}>📩</Text>
          <Text style={[styles.title, { color: c.texto }]}>Solicitud enviada</Text>
          <Text style={[styles.subtitle, { color: c.subtexto }]}>
            El presidente del club revisará tu solicitud en breve.
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: c.boton, width: '100%' }]}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.buttonText}>Entendido</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    )
  }

  const canSubmit = codigo.length === 6 && !isLoading

  return (
    <ScreenContainer>
    <ScrollView contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}>
      <Text style={[styles.title, { color: c.texto, marginTop: 40 }]}>Unirme a un club</Text>
      <Text style={[styles.label, { color: c.subtexto }]}>Código de invitación</Text>
      <TextInput
        style={[styles.codeInput, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput }]}
        placeholder="ABCDEF"
        placeholderTextColor={c.subtexto}
        autoCapitalize="characters"
        maxLength={6}
        value={codigo}
        onChangeText={setCodigo}
      />

      <Text style={[styles.label, { color: c.subtexto }]}>¿Con qué rol quieres unirte?</Text>
      <View style={styles.rolesGrid}>
        {ROLES.map((rol) => {
          const isSelected = rolSeleccionado === rol.value
          return (
            <TouchableOpacity
              key={rol.value}
              style={[
                styles.rolCard,
                {
                  backgroundColor: isSelected ? c.boton : c.input,
                  borderColor: isSelected ? c.boton : c.bordeInput,
                }
              ]}
              onPress={() => setRolSeleccionado(rol.value)}
            >
              <Text style={[styles.rolText, { color: isSelected ? 'white' : c.texto }]}>
                {rol.label}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <Text style={[styles.label, { color: c.subtexto }]}>
        Mensaje para el presidente{' '}
        <Text style={{ color: c.subtexto, fontStyle: 'italic' }}>(opcional)</Text>
      </Text>
      <TextInput
        style={[styles.messageInput, { backgroundColor: c.input, color: c.texto, borderColor: c.bordeInput }]}
        placeholder="Ej: Soy el portero del equipo alevín..."
        placeholderTextColor={c.subtexto}
        multiline
        maxLength={500}
        value={mensaje}
        onChangeText={setMensaje}
        textAlignVertical="top"
      />
      <Text style={[styles.charCount, { color: c.subtexto }]}>{mensaje.length}/500</Text>

      <TouchableOpacity
        style={[styles.button, { backgroundColor: canSubmit ? c.boton : c.subtexto + '50', marginTop: 8 }]}
        onPress={handleJoin}
        disabled={!canSubmit}
      >
        {isLoading
          ? <ActivityIndicator color="white" />
          : <Text style={styles.buttonText}>Enviar solicitud</Text>
        }
      </TouchableOpacity>
    </ScrollView>
    </ScreenContainer>
  )
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, padding: 24, alignItems: 'center' },
  successContainer: { flex: 1, padding: 24, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 24, alignSelf: 'flex-start' },
  subtitle: { fontSize: 15, textAlign: 'center', marginBottom: 32 },
  label: { fontSize: 13, fontWeight: '600', alignSelf: 'flex-start', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  codeInput: { width: '100%', padding: 20, borderRadius: 16, borderWidth: 1, fontSize: 32, textAlign: 'center', fontWeight: 'bold', letterSpacing: 8, marginBottom: 24 },
  rolesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, width: '100%', marginBottom: 24 },
  rolCard: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1.5, minWidth: '45%', flex: 1, alignItems: 'center' },
  rolText: { fontWeight: '600', fontSize: 14 },
  messageInput: { width: '100%', padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 15, minHeight: 90, marginBottom: 4 },
  charCount: { alignSelf: 'flex-end', fontSize: 12, marginBottom: 16 },
  button: { padding: 18, borderRadius: 12, alignItems: 'center', width: '100%' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 }
})
