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

export default function Unirse() {
  const c = useTheme()
  const { t } = useTranslation()

  const [codigo, setCodigo] = useState('')
  const [sent, setSent] = useState(false)

  return (
    <View style={[styles.container, { backgroundColor: c.fondo }]}>

      {/* Brand */}
      <Text style={styles.brand}>SQUADRA</Text>

      {/* Icono */}
      <View style={[styles.iconContainer, { backgroundColor: `${c.boton}15`, borderColor: `${c.boton}35` }]}>
        <Text style={styles.iconEmoji}>🔗</Text>
      </View>

      {sent ? (
        /* Estado: solicitud enviada */
        <View style={styles.successContainer}>
          <View style={[styles.successBadge, { backgroundColor: `${c.boton}15`, borderColor: `${c.boton}35` }]}>
            <Text style={styles.successEmoji}>✅</Text>
          </View>

          <Text style={[styles.title, { color: c.texto }]}>{t('joinClub.successTitle')}</Text>
          <Text style={[styles.successMessage, { color: c.subtexto }]}>
            {t('joinClub.successMessage')}
          </Text>

          <View style={[styles.codePill, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
            <Text style={[styles.codePillText, { color: c.boton }]}>{codigo.toUpperCase()}</Text>
          </View>

          {/* Ver estado */}
          <TouchableOpacity style={[styles.button, { backgroundColor: c.boton, marginTop: 32 }]}>
            <Text style={[styles.buttonText, { color: c.botonTexto }]}>{t('joinClub.successButton')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Estado: formulario */
        <View style={styles.formContainer}>
          <Text style={[styles.title, { color: c.texto }]}>{t('joinClub.title')}</Text>
          <Text style={[styles.subtitle, { color: c.subtexto }]}>{t('joinClub.subtitle')}</Text>

          {/* Campo código */}
          <Text style={[styles.label, { color: c.subtexto }]}>{t('joinClub.code')} *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
            placeholder={t('joinClub.codePlaceholder')}
            placeholderTextColor={c.subtexto}
            value={codigo}
            onChangeText={setCodigo}
            autoCapitalize="characters"
            autoCorrect={false}
          />

          {/* Botón unirme */}
          <TouchableOpacity
            style={[styles.button, { backgroundColor: c.boton, opacity: codigo ? 1 : 0.5 }]}
            onPress={() => codigo && setSent(true)}
          >
            <Text style={[styles.buttonText, { color: c.botonTexto }]}>{t('joinClub.button')}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Volver */}
      <TouchableOpacity style={styles.backContainer}>
        <Text style={[styles.backArrow, { color: c.boton }]}>←</Text>
        <Text style={[styles.backText, { color: c.boton }]}>{t('joinClub.back')}</Text>
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
    fontSize: 18,
    letterSpacing: 4,
    fontWeight: '600',
    textAlign: 'center',
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
  codePill: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  codePillText: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 4,
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