import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../lib/useTheme'
import { useAuthStore } from '../../lib/store'
import i18n from '../../lib/i18n'
import ScreenContainer from '../../components/ScreenContainer'

export default function MiPerfil() {
  const c = useTheme()
  const { t } = useTranslation()
  const profile = useAuthStore((s: any) => s.profile)
  const themeMode = useAuthStore((s: any) => s.themeMode)
  const language = useAuthStore((s: any) => s.language)
  const setThemeMode = useAuthStore((s: any) => s.setThemeMode)
  const setLanguage = useAuthStore((s: any) => s.setLanguage)

  const handleLanguage = (lang: 'es' | 'en') => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  return (
    <ScreenContainer>

      {/* Avatar y nombre */}
      <View style={styles.avatarWrapper}>
        <View style={[styles.avatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
          <Text style={[styles.avatarText, { color: c.boton }]}>
            {profile?.firstName?.charAt(0)?.toUpperCase() || 'U'}
          </Text>
        </View>
        <Text style={[styles.nombre, { color: c.texto }]}>
          {profile?.firstName} {profile?.lastName}
        </Text>
        <Text style={[styles.email, { color: c.subtexto }]}>{profile?.email}</Text>
      </View>

      {/* Datos del perfil */}
      <View style={[styles.card, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
        <Text style={[styles.cardTitle, { color: c.subtexto }]}>{t('profile.data')}</Text>
        <Fila label={t('profile.phone')} value={profile?.phone || '—'} c={c} />
        <Fila
          label={t('profile.document')}
          value={profile?.docNumber ? `${profile.docType} · ${profile.docNumber}` : '—'}
          c={c}
        />
      </View>

      {/* Selector de idioma */}
      <View style={[styles.card, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
        <Text style={[styles.cardTitle, { color: c.subtexto }]}>{t('profile.language')}</Text>
        <View style={styles.opciones}>
          {(['es', 'en'] as const).map((lang) => (
            <TouchableOpacity
              key={lang}
              style={[styles.opcion, {
                backgroundColor: language === lang ? c.boton : 'transparent',
                borderColor: language === lang ? c.boton : c.bordeInput,
              }]}
              onPress={() => handleLanguage(lang)}
            >
              <Text style={[styles.opcionText, { color: language === lang ? '#fff' : c.texto }]}>
                {lang === 'es' ? '🇪🇸 Español' : '🇬🇧 English'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Selector de tema */}
      <View style={[styles.card, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
        <Text style={[styles.cardTitle, { color: c.subtexto }]}>{t('profile.theme')}</Text>
        <View style={styles.opciones}>
          {([
            { value: 'auto', label: `⚙️ ${t('profile.themeAuto')}` },
            { value: 'light', label: `☀️ ${t('profile.themeLight')}` },
            { value: 'dark', label: `🌙 ${t('profile.themeDark')}` },
          ] as const).map((opt) => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.opcion, {
                backgroundColor: themeMode === opt.value ? c.boton : 'transparent',
                borderColor: themeMode === opt.value ? c.boton : c.bordeInput,
              }]}
              onPress={() => setThemeMode(opt.value)}
            >
              <Text style={[styles.opcionText, { color: themeMode === opt.value ? '#fff' : c.texto }]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

    </ScreenContainer>
  )
}

function Fila({ label, value, c }: { label: string; value: string; c: any }) {
  return (
    <View style={styles.fila}>
      <Text style={[styles.filaLabel, { color: c.subtexto }]}>{label}</Text>
      <Text style={[styles.filaValue, { color: c.texto }]}>{value}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  avatarWrapper: { alignItems: 'center', paddingVertical: 24, gap: 6 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 34, fontWeight: 'bold' },
  nombre: { fontSize: 20, fontWeight: '700' },
  email: { fontSize: 14 },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  fila: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  filaLabel: { fontSize: 14 },
  filaValue: { fontSize: 14, fontWeight: '500' },
  opciones: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  opcion: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  opcionText: { fontSize: 14, fontWeight: '500' },
})
