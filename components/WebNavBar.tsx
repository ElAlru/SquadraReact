import { useState } from 'react'
import { Image, Platform, Pressable, StyleSheet, Text, TouchableOpacity, useColorScheme, View } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../lib/useTheme'
import { useAuthStore } from '../lib/store'
import i18n from '../lib/i18n'
import LogoSimbolo from './LogoSimbolo'

export default function WebNavBar() {
  const c = useTheme()
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()

  const profile = useAuthStore((state: any) => state.profile)
  const activeRole = useAuthStore((state: any) => state.activeRole)
  const logout = useAuthStore((state: any) => state.logout)
  const themeMode = useAuthStore((state: any) => state.themeMode)
  const language = useAuthStore((state: any) => state.language)
  const setThemeMode = useAuthStore((state: any) => state.setThemeMode)
  const setLanguage = useAuthStore((state: any) => state.setLanguage)

  const colorScheme = useColorScheme()
  const isDark = themeMode === 'dark' || (themeMode === 'auto' && colorScheme === 'dark')

  const [open, setOpen] = useState(false)

  const esCoach = activeRole === 'COACH' || activeRole === 'PRESIDENT'
  const esPresidente = activeRole === 'PRESIDENT'

  const navItems = [
    { path: '/inicio', label: t('nav.home') },
    { path: '/calendario', label: t('nav.calendar') },
    { path: '/horarios', label: t('nav.schedule') },
    { path: '/tablon', label: t('nav.board') },
    { path: '/mi-club', label: t('nav.myClub') },
    { path: '/campos', label: t('nav.fields') },
    ...(esCoach ? [{ path: '/gestion-coach', label: t('nav.coachManagement') }] : []),
    ...(esPresidente ? [{ path: '/gestion-presidente', label: t('nav.presidentManagement') }] : []),
  ]

  const handleLogout = async () => {
    setOpen(false)
    await logout()
    router.replace('/login')
  }

  const handleLanguage = (lang: 'es' | 'en') => {
    setLanguage(lang)
    i18n.changeLanguage(lang)
  }

  return (
    <View
      style={[
        styles.navbar,
        { backgroundColor: c.fondo, borderBottomColor: c.bordeInput },
        Platform.OS === 'web' ? ({ position: 'fixed', top: 0, left: 0, right: 0 } as any) : {},
      ]}
    >
      <View style={styles.brandRow}>
        <LogoSimbolo size={32} color="#ffc06d" />
        <Image
          source={
            isDark
              ? require('../assets/images/titulo-squadra-dark.png')
              : require('../assets/images/titulo-squadra.png')
          }
          style={{ height: 28, width: 120, resizeMode: 'contain' }}
        />
      </View>

      <View style={styles.navLinks}>
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.endsWith(item.path)
          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => {
                setOpen(false)
                router.push(item.path as any)
              }}
              style={styles.navLink}
            >
              <Text style={[styles.navLinkText, { color: isActive ? c.boton : c.subtexto }]}>
                {item.label}
              </Text>
              {isActive && <View style={[styles.activeIndicator, { backgroundColor: c.boton }]} />}
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity style={styles.avatarBtn} onPress={() => setOpen(!open)}>
          <View
            style={[
              styles.avatarCircle,
              { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` },
            ]}
          >
            <Text style={[styles.avatarText, { color: c.boton }]}>
              {profile?.firstName?.charAt(0)?.toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[styles.avatarName, { color: c.texto }]} numberOfLines={1}>
            {profile?.firstName || 'Usuario'}
          </Text>
          <Text style={[styles.chevron, { color: c.subtexto }]}>{open ? '▲' : '▼'}</Text>
        </TouchableOpacity>
      </View>

      {/* Overlay transparente para cerrar al hacer click fuera */}
      {open && (
        <Pressable
          onPress={() => setOpen(false)}
          style={
            Platform.OS === 'web'
              ? ({ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999 } as any)
              : { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }
          }
        />
      )}

      {/* Dropdown */}
      {open && (
        <View
          style={[
            styles.dropdown,
            { backgroundColor: c.fondo, borderColor: c.bordeInput },
            Platform.OS === 'web' ? ({ position: 'fixed', top: 56, right: 16 } as any) : {},
          ]}
        >
          {/* Mi perfil */}
          <TouchableOpacity
            style={styles.dropdownItem}
            onPress={() => {
              setOpen(false)
              router.push('/mi-perfil' as any)
            }}
          >
            <Text style={[styles.dropdownItemText, { color: c.texto }]}>👤 Mi perfil</Text>
          </TouchableOpacity>

          <View style={[styles.separator, { backgroundColor: c.bordeInput }]} />

          {/* Selector de tema */}
          <Text style={[styles.sectionLabel, { color: c.subtexto }]}>
            {t('profile.theme')}
          </Text>
          <View style={styles.selectorRow}>
            {([
              { value: 'light', label: '☀️ Claro' },
              { value: 'auto', label: '⚙️ Auto' },
              { value: 'dark', label: '🌙 Oscuro' },
            ] as const).map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.chip,
                  {
                    backgroundColor: themeMode === opt.value ? c.boton : 'transparent',
                    borderColor: themeMode === opt.value ? c.boton : c.bordeInput,
                  },
                ]}
                onPress={() => setThemeMode(opt.value)}
              >
                <Text style={[styles.chipText, { color: themeMode === opt.value ? '#fff' : c.texto }]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Selector de idioma */}
          <Text style={[styles.sectionLabel, { color: c.subtexto }]}>
            {t('profile.language')}
          </Text>
          <View style={styles.selectorRow}>
            {(['es', 'en'] as const).map((lang) => (
              <TouchableOpacity
                key={lang}
                style={[
                  styles.chip,
                  {
                    backgroundColor: language === lang ? c.boton : 'transparent',
                    borderColor: language === lang ? c.boton : c.bordeInput,
                  },
                ]}
                onPress={() => handleLanguage(lang)}
              >
                <Text style={[styles.chipText, { color: language === lang ? '#fff' : c.texto }]}>
                  {lang === 'es' ? 'ES' : 'EN'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.separator, { backgroundColor: c.bordeInput }]} />

          {/* Cerrar sesión */}
          <TouchableOpacity style={styles.dropdownItem} onPress={handleLogout}>
            <Text style={[styles.dropdownItemText, { color: '#ef4444' }]}>🚪 Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  navbar: {
    height: 56,
    zIndex: 1000,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    gap: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginRight: 16,
  },
  navLinks: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  navLink: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  navLinkText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeIndicator: {
    height: 2,
    borderRadius: 1,
    width: '80%',
    marginTop: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  avatarName: {
    fontSize: 14,
    fontWeight: '500',
    maxWidth: 120,
  },
  chevron: {
    fontSize: 10,
  },
  dropdown: {
    minWidth: 220,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    zIndex: 1002,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
  },
  dropdownItem: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  dropdownItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    marginVertical: 4,
    marginHorizontal: 8,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
    paddingHorizontal: 14,
    paddingTop: 8,
    paddingBottom: 6,
  },
  selectorRow: {
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
  },
})
