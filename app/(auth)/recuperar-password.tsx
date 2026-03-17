import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useTheme } from '../../lib/useTheme'

export default function RecuperarPassword() {
  const c = useTheme()
  const { t } = useTranslation()

  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <View style={[styles.container, { backgroundColor: c.fondo }]}>

      {/* Brand */}
      <Text style={styles.brand}>SQUADRA</Text>

      {/* Icono */}
      <View style={[styles.iconContainer, { backgroundColor: `${c.boton}15`, borderColor: `${c.boton}35` }]}>
        <Text style={styles.iconEmoji}>🔑</Text>
      </View>

      {sent ? (
        /* Estado: email enviado */
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
        /* Estado: formulario */
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
          />

          <TouchableOpacity
            style={[styles.button, { backgroundColor: c.boton }]}
            onPress={() => email && setSent(true)}
          >
            <Text style={[styles.buttonText, { color: c.botonTexto }]}>{t('forgotPassword.button')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Volver al login */}
      <TouchableOpacity style={styles.backContainer}>
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