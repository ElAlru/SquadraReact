import { Drawer } from 'expo-router/drawer'
import { useTranslation } from 'react-i18next'
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useTheme } from '../../lib/useTheme'

type Rol = 'PRESIDENT' | 'COACH' | 'PLAYER' | 'RELATIVE' | 'OTHER'
const getRolUsuario = (): Rol => 'PRESIDENT'
const ROL_USUARIO = getRolUsuario()
const NOMBRE_USUARIO = 'Pedro Rodríguez'
const CLUB_NOMBRE = 'FC Ejemplo'

const esCoach = ROL_USUARIO === 'COACH' || ROL_USUARIO === 'PRESIDENT'
const esPresidente = ROL_USUARIO === 'PRESIDENT'

function DrawerContent({ navigation }: { navigation: any }) {
  const c = useTheme()
  const { t } = useTranslation()

  const ITEMS_COMUNES = [
    { ruta: 'inicio', icono: '🏠', label: t('nav.home') },
    { ruta: 'calendario', icono: '📅', label: t('nav.calendar') },
    { ruta: 'horarios', icono: '🕐', label: t('nav.schedule') },
    { ruta: 'tablon', icono: '📢', label: t('nav.board') },
    { ruta: 'mi-club', icono: '🏆', label: t('nav.myClub') },
    { ruta: 'campos', icono: '📍', label: t('nav.fields') },
  ]

  const ITEMS_ROL = [
    ...(esCoach ? [{ ruta: 'gestion-coach', icono: '🎽', label: t('nav.coachManagement') }] : []),
    ...(esPresidente ? [{ ruta: 'gestion-presidente', icono: '👑', label: t('nav.presidentManagement') }] : []),
  ]

  return (
    <View style={[styles.drawerContainer, { backgroundColor: c.fondo }]}>

      {/* Header */}
      <View style={[styles.drawerHeader, { borderBottomColor: c.bordeInput }]}>
        <View style={[styles.drawerAvatar, { backgroundColor: '#16a34a18', borderColor: '#16a34a35' }]}>
          <Text style={[styles.drawerAvatarText, { color: '#16a34a' }]}>
            {NOMBRE_USUARIO.charAt(0)}
          </Text>
        </View>
        <View style={styles.drawerUserInfo}>
          <Text style={[styles.drawerUserName, { color: c.texto }]}>{NOMBRE_USUARIO}</Text>
          <Text style={[styles.drawerClubName, { color: c.subtexto }]}>{CLUB_NOMBRE}</Text>
          <View style={[styles.rolBadge, { backgroundColor: '#16a34a18', borderColor: '#16a34a35' }]}>
            <Text style={[styles.rolBadgeText, { color: '#16a34a' }]}>{ROL_USUARIO}</Text>
          </View>
        </View>
      </View>

      {/* Items comunes */}
      <View style={styles.drawerSection}>
        {ITEMS_COMUNES.map((item) => (
          <TouchableOpacity
            key={item.ruta}
            style={styles.drawerItem}
            onPress={() => {
              navigation.navigate(item.ruta)
              navigation.closeDrawer()
            }}
          >
            <Text style={styles.drawerItemIcon}>{item.icono}</Text>
            <Text style={[styles.drawerItemLabel, { color: c.texto }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Items por rol */}
      {ITEMS_ROL.length > 0 && (
        <>
          <View style={[styles.drawerDivider, { borderTopColor: c.bordeInput }]}>
            <Text style={[styles.drawerDividerText, { color: c.subtexto }]}>Gestión</Text>
          </View>
          <View style={styles.drawerSection}>
            {ITEMS_ROL.map((item) => (
              <TouchableOpacity
                key={item.ruta}
                style={styles.drawerItem}
                onPress={() => {
                  navigation.navigate(item.ruta)
                  navigation.closeDrawer()
                }}
              >
                <Text style={styles.drawerItemIcon}>{item.icono}</Text>
                <Text style={[styles.drawerItemLabel, { color: c.texto }]}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </>
      )}

      {/* Footer */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity style={[styles.cerrarSesionBtn, { borderColor: '#ef444435', backgroundColor: '#ef444410' }]}>
          <Text style={styles.cerrarSesionText}>🚪 {t('nav.logout')}</Text>
        </TouchableOpacity>
        <Text style={[styles.drawerVersion, { color: c.subtexto }]}>Squadra v1.0</Text>
      </View>

    </View>
  )
}

export default function ClubLayout() {
  const c = useTheme()

  return (
    <Drawer
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={({ navigation }) => ({
        headerShown: true,
        headerStyle: { backgroundColor: c.fondo },
        headerTintColor: c.texto,
        headerShadowVisible: false,
        drawerStyle: { width: 280 },
        headerLeft: () => (
          <TouchableOpacity
            style={styles.hamburger}
            onPress={() => navigation.toggleDrawer()}
          >
            <Text style={[styles.hamburgerIcon, { color: c.texto }]}>☰</Text>
          </TouchableOpacity>
        ),
        headerTitle: () => (
          <Text style={styles.headerBrand}>SQUADRA</Text>
        ),
      })}
    >
      <Drawer.Screen name="inicio" />
      <Drawer.Screen name="calendario" />
      <Drawer.Screen name="horarios" />
      <Drawer.Screen name="tablon" />
      <Drawer.Screen name="mi-club" />
      <Drawer.Screen
        name="gestion-coach"
        options={{ drawerItemStyle: { display: esCoach ? 'flex' : 'none' } }}
      />
      <Drawer.Screen
        name="gestion-presidente"
        options={{ drawerItemStyle: { display: esPresidente ? 'flex' : 'none' } }}
      />
      <Drawer.Screen name="campos" />
    </Drawer>
  )
}

const styles = StyleSheet.create({
  hamburger: {
    marginLeft: 16,
    padding: 4,
  },
  hamburgerIcon: {
    fontSize: 22,
  },
  headerBrand: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#C9A84C',
    letterSpacing: 4,
  },
  drawerContainer: {
    flex: 1,
    paddingTop: 60,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    marginBottom: 8,
  },
  drawerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerAvatarText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  drawerUserInfo: {
    flex: 1,
    gap: 3,
  },
  drawerUserName: {
    fontSize: 15,
    fontWeight: '700',
  },
  drawerClubName: {
    fontSize: 12,
  },
  rolBadge: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
    alignSelf: 'flex-start',
  },
  rolBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  drawerSection: {
    paddingHorizontal: 12,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 10,
  },
  drawerItemIcon: {
    fontSize: 18,
    width: 28,
    textAlign: 'center',
  },
  drawerItemLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  drawerDivider: {
    borderTopWidth: 1,
    marginHorizontal: 20,
    marginVertical: 12,
    paddingTop: 12,
  },
  drawerDividerText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  drawerFooter: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    gap: 12,
    alignItems: 'center',
  },
  cerrarSesionBtn: {
    width: '100%',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
  },
  cerrarSesionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ef4444',
  },
  drawerVersion: {
    fontSize: 12,
  },
})