import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Alert
} from 'react-native'
import { useTheme } from '../../lib/useTheme'
import { router } from 'expo-router'

export default function RecuperarPassword() {
  const c = useTheme()
  const { t } = useTranslation()

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

const handleRecover = async () => {
  if (!email) {
    Alert.alert(t('common.error'), t('forgotPassword.emailRequired'))
    return
  }

  setLoading(true)
  try {
    // CAMBIA ESTA IP por la que te sale en la terminal al hacer npx expo start
    const miIpLocal = '192.168.1.130'; 
    const urlRedireccion = `exp://${miIpLocal}:8081/--/reset-password`;

    const response = await fetch('https://squadraapi.onrender.com/auth/recover', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        email: email.toLowerCase().trim(),
        redirectTo: urlRedireccion // <--- Enviamos la URL a la API
      }),
    })

    if (response.ok) {
      setSent(true)
    } else {
      const errorData = await response.text()
      Alert.alert(t('common.error'), errorData || t('forgotPassword.errorMessage'))
    }
  } catch (error) {
    console.error('Error en recuperación:', error)
    Alert.alert(t('common.error'), t('common.connectionError'))
  } finally {
    setLoading(false)
  }
}

  return (
    <View style={[styles.container, { backgroundColor: c.fondo }]}>

      {/* Brand */}
      <Text style={styles.brand}>SQUADRA</Text>

      {/* Icono Principal */}
      <View style={[styles.iconContainer, { backgroundColor: `${c.boton}15`, borderColor: `${c.boton}35` }]}>
        <Text style={styles.iconEmoji}>🔑</Text>
      </View>

      {sent ? (
        /* ESTADO: Email enviado con éxito */
        <View style={styles.successContainer}>
          <View style={[styles.successBadge, { backgroundColor: `${c.boton}15`, borderColor: `${c.boton}35` }]}>
            <Text style={styles.successEmoji}>✅</Text>
          </View>
          <Text style={[styles.title, { color: c.texto }]}>{t('forgotPassword.successTitle')}</Text>
          <Text style={[styles.successMessage, { color: c.subtexto }]}>
            {t('forgotPassword.successMessage')}
          </Text>
          <View style={[styles.emailPill, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
            <Text style={[styles.emailPillText, { color: c.boton }]}>{email}</Text>
          </View>
        </View>
      ) : (
        /* ESTADO: Formulario de entrada */
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: c.texto }]}>{t('forgotPassword.title')}</Text>
          <Text style={[styles.subtitle, { color: c.subtexto }]}>{t('forgotPassword.subtitle')}</Text>

          <Text style={[styles.label, { color: c.subtexto }]}>{t('forgotPassword.email')} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
            placeholder={t('forgotPassword.emailPlaceholder')}
            placeholderTextColor={c.subtexto}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: c.boton, opacity: loading ? 0.7 : 1 }]}
            onPress={handleRecover}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color={c.botonTexto} />
            ) : (
              <Text style={[styles.buttonText, { color: c.botonTexto }]}>{t('forgotPassword.button')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* Volver al login */}
      <TouchableOpacity 
        style={styles.backContainer} 
        onPress={() => router.back()}
        disabled={loading}
      >
        <Text style={[styles.backArrow, { color: c.boton }]}>←</Text>
        <Text style={[styles.backText, { color: c.boton }]}>{t('forgotPassword.backToLogin')}</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
    borderRadius: 10,
    padding: 13,
    marginBottom: 24,
    fontSize: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
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
    marginBottom: 20,
    paddingHorizontal: 16,
  },
  emailPill: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  emailPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  backContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 24,
  },
  backArrow: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  backText: {
    fontSize: 14,
    fontWeight: '600',
  },
})