import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useRouter, usePathname } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../lib/useTheme'
import { useAuthStore } from '../lib/store'

export default function WebNavBar() {
  const c = useTheme()
  const { t } = useTranslation()
  const router = useRouter()
  const pathname = usePathname()

  const profile = useAuthStore((state: any) => state.profile)
  const activeRole = useAuthStore((state: any) => state.activeRole)
  const logout = useAuthStore((state: any) => state.logout)

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
    await logout()
    router.replace('/login')
  }

  return (
    <View
      style={[
        styles.navbar,
        { backgroundColor: c.fondo, borderBottomColor: c.bordeInput },
        Platform.OS === 'web' ? ({ position: 'fixed', top: 0, left: 0, right: 0 } as any) : {},
      ]}
    >
      <Text style={styles.brand}>SQUADRA</Text>

      <View style={styles.navLinks}>
        {navItems.map((item) => {
          const isActive = pathname === item.path || pathname.endsWith(item.path)
          return (
            <TouchableOpacity
              key={item.path}
              onPress={() => router.push(item.path as any)}
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
        <TouchableOpacity
          style={styles.avatarBtn}
          onPress={() => router.push('/mi-perfil' as any)}
        >
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
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutIcon}>🚪</Text>
        </TouchableOpacity>
      </View>
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
  brand: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#C9A84C',
    letterSpacing: 4,
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
    gap: 8,
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
  logoutBtn: {
    padding: 6,
    marginLeft: 4,
  },
  logoutIcon: {
    fontSize: 16,
  },
})
