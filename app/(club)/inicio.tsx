import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
} from 'react-native'
import { useTheme } from '../../lib/useTheme'
import { apiFetch } from '../../lib/api'
import { useAuthStore } from '../../lib/store'
import { useRouter } from 'expo-router'

const EVENTO_ICONO: Record<string, string> = {
  PARTIDO: '⚽',
  ENTRENAMIENTO: '🏃',
}

const EVENTO_COLOR: Record<string, string> = {
  PARTIDO: '#16a34a',
  ENTRENAMIENTO: '#3b82f6',
}

export default function Inicio() {
  const c = useTheme()
  const { t } = useTranslation()
  const router = useRouter()

  // 1. Aquí recibiremos el ID automáticamente cuando el selector funcione
  const activeClubId = useAuthStore((state) => state.activeClubId)

  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchDashboard = useCallback(async () => {
    // Si no hay club seleccionado, no pedimos nada a la API
    if (!activeClubId) {
      setLoading(false)
      return
    }
    
    try {
      const response = await apiFetch(`/api/dashboard/inicio?clubId=${activeClubId}`)
      if (response.ok) {
        const result = await response.json()
        setData(result)
      }
    } catch (error) {
      console.error("Error de red conectando con Render:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeClubId])

  useEffect(() => {
    fetchDashboard()
  }, [fetchDashboard])

  const onRefresh = () => {
    setRefreshing(true)
    fetchDashboard()
  }

  // Pantalla de carga
  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: c.fondo, justifyContent: 'center' }]}>
        <ActivityIndicator size="large" color={c.boton} />
      </View>
    )
  }

  // Si no hay datos (porque no hay club o falló la API), mostramos aviso
  if (!data) {
    return (
      <View style={[styles.container, { backgroundColor: c.fondo, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ color: c.texto, marginBottom: 20 }}>No se han podido cargar los datos del club.</Text>
        <TouchableOpacity 
          style={{ backgroundColor: c.boton, padding: 12, borderRadius: 10 }}
          onPress={() => router.push('/(selector)')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold' }}>Volver al Selector</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const hora = new Date().getHours()
  const saludo = hora < 12 ? 'Buenos días' : hora < 20 ? 'Buenas tardes' : 'Buenas noches'

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.boton} />
      }
    >
      {/* Todo el resto del diseño que ya tienes abajo... (mantén tus estilos y el return del diseño) */}
      <View style={styles.header}>
         <View>
           <Text style={[styles.greeting, { color: c.subtexto }]}>
             {saludo}, {data.usuario.nombre} 👋
           </Text>
           <Text style={[styles.clubNombre, { color: c.texto }]}>{data.club.nombre}</Text>
         </View>
         <View style={[styles.clubAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
           <Text style={[styles.clubAvatarText, { color: c.boton }]}>
             {data.club.nombre.charAt(0)}
           </Text>
         </View>
       </View>

       {/* Chips info */}
       <View style={styles.chipsRow}>
         <View style={[styles.chip, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
           <Text style={[styles.chipText, { color: c.subtexto }]}>🗓 {data.club.temporada}</Text>
         </View>
         <View style={[styles.chip, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
           <Text style={[styles.chipText, { color: c.subtexto }]}>👕 {data.club.equipo}</Text>
         </View>
       </View>

       {/* Sección de Anuncios y Eventos (mantén el resto del código igual) */}
       {/* ... */}
    </ScrollView>
  )
}

// Mantén tus estilos (const styles = StyleSheet.create...)

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    marginBottom: 2,
  },
  clubNombre: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clubAvatar: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubAvatarText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
  },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  seeAll: {
    fontSize: 13,
    fontWeight: '600',
  },
  anuncioCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 28,
    gap: 8,
  },
  anuncioTitulo: {
    fontSize: 15,
    fontWeight: '700',
  },
  anuncioContenido: {
    fontSize: 13,
    lineHeight: 20,
  },
  anuncioFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  anuncioMeta: {
    fontSize: 12,
  },
  eventosList: {
    gap: 10,
  },
  eventoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  eventoIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventoIcono: {
    fontSize: 20,
  },
  eventoInfo: {
    flex: 1,
    gap: 3,
  },
  eventoTitulo: {
    fontSize: 14,
    fontWeight: '600',
  },
  eventoMeta: {
    fontSize: 12,
  },
  eventoFecha: {
    alignItems: 'flex-end',
    gap: 3,
  },
  eventoFechaTexto: {
    fontSize: 12,
    fontWeight: '700',
  },
  eventoHoraTexto: {
    fontSize: 12,
  },
  localBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  localBadgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
})