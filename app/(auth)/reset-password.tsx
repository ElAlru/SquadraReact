import { useState, useEffect } from 'react'
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
import { router, useLocalSearchParams } from 'expo-router'

export default function ResetPassword() {
  const c = useTheme()
  const { t } = useTranslation()
  
  // Capturamos el token que viene en la URL del email
  const { access_token } = useLocalSearchParams()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      Alert.alert(t('common.error'), t('auth.passwordTooShort'))
      return
    }

    if (password !== confirmPassword) {
      Alert.alert(t('common.error'), t('auth.passwordsDontMatch'))
      return
    }

    setLoading(true)
    try {
      const response = await fetch('https://squadraapi.onrender.com/auth/update-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Mandamos el token que venía en el email para que el backend sepa quién es
          'Authorization': `Bearer ${access_token}` 
        },
        body: JSON.stringify({ newPassword: password }),
      })

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => router.replace('/(auth)/login'), 3000)
      } else {
        const err = await response.text()
        Alert.alert(t('common.error'), err || t('auth.updateError'))
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('common.connectionError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={[styles.container, { backgroundColor: c.fondo }]}>
      <Text style={styles.brand}>SQUADRA</Text>

      <View style={[styles.iconContainer, { backgroundColor: `${c.boton}15`, borderColor: `${c.boton}35` }]}>
        <Text style={styles.iconEmoji}>🔐</Text>
      </View>

      {success ? (
        <View style={styles.successContainer}>
          <Text style={styles.successEmoji}>🎯</Text>
          <Text style={[styles.title, { color: c.texto }]}>{t('resetPassword.successTitle')}</Text>
          <Text style={[styles.message, { color: c.subtexto }]}>{t('resetPassword.successMessage')}</Text>
          <ActivityIndicator size="small" color={c.boton} style={{ marginTop: 20 }} />
        </View>
      ) : (
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: c.texto }]}>{t('resetPassword.title')}</Text>
          <Text style={[styles.subtitle, { color: c.subtexto }]}>{t('resetPassword.subtitle')}</Text>

          <Text style={[styles.label, { color: c.subtexto }]}>{t('auth.newPassword')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            placeholderTextColor={c.subtexto}
          />

          <Text style={[styles.label, { color: c.subtexto }]}>{t('auth.confirmPassword')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
            secureTextEntry
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="••••••••"
            placeholderTextColor={c.subtexto}
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: c.boton, opacity: loading ? 0.7 : 1 }]}
            onPress={handleUpdatePassword}
            disabled={loading}
          >
            {loading ? <ActivityIndicator color={c.botonTexto} /> : (
              <Text style={[styles.buttonText, { color: c.botonTexto }]}>{t('resetPassword.button')}</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, paddingTop: 80 },
  brand: { fontSize: 13, fontWeight: 'bold', color: '#C9A84C', letterSpacing: 4, marginBottom: 40 },
  iconContainer: { width: 64, height: 64, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginBottom: 24 },
  iconEmoji: { fontSize: 30 },
  formContainer: { flex: 1 },
  title: { fontSize: 26, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 14, marginBottom: 32, lineHeight: 20 },
  label: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 13, marginBottom: 20, fontSize: 15 },
  button: { padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  buttonText: { fontWeight: 'bold', fontSize: 16 },
  successContainer: { alignItems: 'center', paddingTop: 40 },
  successEmoji: { fontSize: 50, marginBottom: 20 },
  message: { textAlign: 'center', fontSize: 15, lineHeight: 24 }
})