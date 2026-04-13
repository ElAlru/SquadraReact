import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { router } from 'expo-router'
import { useTheme } from '../../lib/useTheme'
import { apiFetch } from '../../lib/api'

export default function Unirse() {
  const c = useTheme()
  const { t } = useTranslation()

  const [codigo, setCodigo] = useState('')
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // 🟢 Función para llamar al backend real
  const handleJoin = async () => {
      const cleanCode = codigo.toUpperCase().trim();
      if (!cleanCode) return;
      
      console.log("1. Botón pulsado. Código:", cleanCode); // 👈 Log de seguridad
      setIsLoading(true);

      try {
        console.log("2. Llamando a apiFetch...");
        const res = await apiFetch("/api/clubs/join", {
          method: "POST",
          body: JSON.stringify({ invitationCode: cleanCode })
        });

        console.log("3. Respuesta recibida. Status:", res.status);

        if (res.ok) {
          setSent(true);
        } else {
          const errorMsg = await res.text();
          console.warn("4. Error del servidor:", errorMsg);
          Alert.alert("Atención", errorMsg || "Código no válido.");
        }
      } catch (e) {
        console.error("❌ Error atrapado en catch:", e);
        Alert.alert("Error", "Fallo de conexión.");
      } finally {
        console.log("5. Finalizando isLoading");
        setIsLoading(false);
      }
    }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={{ flex: 1 }}
    >
      <ScrollView 
        contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <Text style={styles.brand}>SQUADRA</Text>

        <View style={[styles.iconContainer, { backgroundColor: `${c.boton}15`, borderColor: `${c.boton}35` }]}>
          <Text style={styles.iconEmoji}>🔗</Text>
        </View>

        {sent ? (
          /* --- ESTADO: SOLICITUD ENVIADA CON ÉXITO --- */
          <View style={styles.successContainer}>
            <View style={[styles.successBadge, { backgroundColor: `${c.boton}15`, borderColor: `${c.boton}35` }]}>
              <Text style={styles.successEmoji}>✅</Text>
            </View>

            <Text style={[styles.title, { color: c.texto }]}>
              {t('joinClub.successTitle', '¡Solicitud enviada!')}
            </Text>
            <Text style={[styles.successMessage, { color: c.subtexto }]}>
              {t('joinClub.successMessage', 'El presidente del club debe aceptarte antes de que puedas acceder.')}
            </Text>

            <View style={[styles.codePill, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
              <Text style={[styles.codePillText, { color: c.boton }]}>{codigo.toUpperCase()}</Text>
            </View>

            <TouchableOpacity 
              style={[styles.button, { backgroundColor: c.boton, marginTop: 32, width: '100%' }]}
              onPress={() => router.push("/(selector)/esperando")}
            >
              <Text style={[styles.buttonText, { color: c.botonTexto }]}>
                {t('joinClub.successButton', 'Ver estado')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* --- ESTADO: FORMULARIO DE ENTRADA --- */
          <View style={styles.formContainer}>
            <Text style={[styles.title, { color: c.texto }]}>
              {t('joinClub.title', 'Unirse a un club')}
            </Text>
            <Text style={[styles.subtitle, { color: c.subtexto }]}>
              {t('joinClub.subtitle', 'Introduce el código que te ha dado tu entrenador o presidente')}
            </Text>

            <Text style={[styles.label, { color: c.subtexto }]}>
              {t('joinClub.code', 'Código de invitación')} *
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
              placeholder="ABC-123"
              placeholderTextColor={c.subtexto}
              value={codigo}
              onChangeText={(txt) => setCodigo(txt.toUpperCase())}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              editable={!isLoading}
            />

            <TouchableOpacity
              style={[styles.button, { backgroundColor: c.boton, opacity: codigo.length >= 3 && !isLoading ? 1 : 0.5 }]}
              onPress={handleJoin}
              disabled={codigo.length < 3 || isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={c.botonTexto} />
              ) : (
                <Text style={[styles.buttonText, { color: c.botonTexto }]}>
                  {t('joinClub.button', 'Enviar solicitud')}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Botón Volver (solo si no se ha enviado) */}
        {!sent && (
          <TouchableOpacity 
            style={styles.backContainer} 
            onPress={() => router.back()}
            disabled={isLoading}
          >
            <Text style={[styles.backArrow, { color: c.boton }]}>←</Text>
            <Text style={[styles.backText, { color: c.boton }]}>{t('joinClub.back', 'Volver')}</Text>
          </TouchableOpacity>
        )}

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
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
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 18,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  iconEmoji: {
    fontSize: 30,
  },
  formContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    fontSize: 22,
    letterSpacing: 6,
    fontWeight: '800',
    textAlign: 'center',
  },
  button: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  buttonText: {
    fontWeight: 'bold',
    fontSize: 16,
    letterSpacing: 0.5,
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 16,
  },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  successEmoji: {
    fontSize: 34,
  },
  successMessage: {
    fontSize: 14,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  codePill: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
  },
  codePillText: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: 4,
  },
  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 32,
  },
  backArrow: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backText: {
    fontSize: 15,
    fontWeight: '600',
  },
})