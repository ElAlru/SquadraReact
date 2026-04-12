import { useState, useEffect, useCallback } from 'react'
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Image, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useTranslation } from 'react-i18next'
import { useTheme } from '../../lib/useTheme'
import { useAuthStore } from '../../lib/store'
import { apiFetch } from '../../lib/api'

export default function Inicio() {
  const c = useTheme()
  const { t } = useTranslation()
  const router = useRouter()

  // --- 1. DATOS DEL STORE ---
  // 🟢 CORREGIDO: Usamos 'profile' que es donde guardamos los datos de nuestro backend
  const profile = useAuthStore((state: any) => state.profile)
  const clubName = useAuthStore((state: any) => state.activeClubName || 'Mi Club')
  const clubLogo = useAuthStore((state: any) => state.activeClubLogo)
  const teamName = useAuthStore((state: any) => state.activeTeamName)
  const seasonName = useAuthStore((state: any) => state.activeSeasonName || 'Temporada 25/26')
  const activeTeamId = useAuthStore((state: any) => state.activeTeamId)
  const activeRole = useAuthStore((state: any) => state.activeRole)

  // --- 2. ESTADOS ---
  const [saludo, setSaludo] = useState('')
  const [ultimoAnuncio, setUltimoAnuncio] = useState<any>(null)
  const [proximosEventos, setProximosEventos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // --- 3. LÓGICA DE SALUDO ---
  useEffect(() => {
    const hora = new Date().getHours()
    if (hora >= 6 && hora < 12) setSaludo('Buenos días')
    else if (hora >= 12 && hora < 20) setSaludo('Buenas tardes')
    else setSaludo('Buenas noches')
  }, [])

  // --- 4. PETICIONES A LA API ---
  const fetchDashboardData = useCallback(async () => {
    if (!activeTeamId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const resAnuncio = await apiFetch(`/api/tablon/ultimo?teamId=${activeTeamId}`)
      if (resAnuncio.ok) {
        const dataAnuncio = resAnuncio.status === 204 ? null : await resAnuncio.json()
        setUltimoAnuncio(dataAnuncio)
      }

      const resEventos = await apiFetch(`/api/eventos/proximos?teamId=${activeTeamId}&limit=3`)
      if (resEventos.ok) {
        const dataEventos = await resEventos.json()
        setProximosEventos(dataEventos)
      }
    } catch (error) {
      console.error("Fallo al cargar dashboard:", error)
    } finally {
      setLoading(false)
    }
  }, [activeTeamId])

  useEffect(() => {
    fetchDashboardData()
  }, [fetchDashboardData])

  return (
    <View style={[styles.wrapper, { backgroundColor: c.fondo }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* --- CABECERA --- */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.saludo, { color: c.subtexto }]}>{saludo},</Text>
            {/* 🟢 CORREGIDO: Usamos profile?.firstName para que salga tu nombre real */}
            <Text style={[styles.userName, { color: c.texto }]}>
              {profile?.firstName || 'Presidente'} 👋
            </Text>
          </View>
          {clubLogo ? (
            <Image source={{ uri: clubLogo }} style={styles.clubLogo} />
          ) : (
            <View style={[styles.clubLogo, { backgroundColor: c.input, justifyContent: 'center', alignItems: 'center' }]}>
              <Text style={{ fontSize: 20 }}>🛡️</Text>
            </View>
          )}
        </View>

        <Text style={[styles.clubName, { color: c.texto }]}>{clubName}</Text>

        {/* CHIPS DE INFORMACIÓN */}
        {activeTeamId && (
            <View style={styles.chipsRow}>
                <View style={[styles.chip, { backgroundColor: `${c.boton}20` }]}>
                    <Text style={[styles.chipText, { color: c.boton }]}>📅 {seasonName}</Text>
                </View>
                <View style={[styles.chip, { backgroundColor: `${c.boton}20` }]}>
                    <Text style={[styles.chipText, { color: c.boton }]}>👕 {teamName || 'Equipo'}</Text>
                </View>
            </View>
        )}

        {loading ? (
          <ActivityIndicator size="large" color={c.boton} style={{ marginTop: 40 }} />
        ) : !activeTeamId ? (
          <View style={[styles.noTeamCard, { backgroundColor: c.input }]}>
            <Text style={[styles.noTeamTitle, { color: c.texto }]}>¡Bienvenido a tu club!</Text>
            <Text style={[styles.noTeamSub, { color: c.subtexto }]}>
              {activeRole === 'PRESIDENT' 
                ? 'Como presidente, el siguiente paso es crear tu primer equipo desde el menú de gestión.' 
                : 'Aún no tienes un equipo asignado en este club.'}
            </Text>
            {activeRole === 'PRESIDENT' && (
                <TouchableOpacity 
                    style={[styles.btnCrearEquipo, { backgroundColor: c.boton }]}
                    onPress={() => router.push('/gestion-presidente')}
                >
                    <Text style={styles.btnCrearEquipoText}>Ir a Gestión</Text>
                </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: c.texto }]}>Último Anuncio</Text>
              <TouchableOpacity onPress={() => router.push('/tablon')}>
                <Text style={[styles.linkText, { color: c.boton }]}>Ver tablón</Text>
              </TouchableOpacity>
            </View>

            {ultimoAnuncio ? (
              <TouchableOpacity 
                style={[styles.card, { backgroundColor: c.input, borderColor: c.bordeInput }]} 
                onPress={() => router.push('/tablon')}
              >
                <Text style={[styles.anuncioTitulo, { color: c.texto }]}>📌 {ultimoAnuncio.titulo}</Text>
                <Text style={[styles.anuncioResumen, { color: c.subtexto }]} numberOfLines={2}>
                  {ultimoAnuncio.contenido}
                </Text>
                <View style={styles.anuncioMeta}>
                  <Text style={[styles.anuncioMetaText, { color: c.subtexto }]}>👤 {ultimoAnuncio.autor}</Text>
                  <Text style={[styles.anuncioMetaText, { color: c.subtexto }]}>🕒 {ultimoAnuncio.fecha}</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={[styles.card, { backgroundColor: c.input, opacity: 0.7, borderStyle: 'dashed' }]}>
                <Text style={{ color: c.subtexto, textAlign: 'center' }}>No hay anuncios para tu equipo aún.</Text>
              </View>
            )}

            <View style={[styles.sectionHeader, { marginTop: 30 }]}>
              <Text style={[styles.sectionTitle, { color: c.texto }]}>Próximos Eventos</Text>
              <TouchableOpacity onPress={() => router.push('/horarios')}>
                <Text style={[styles.linkText, { color: c.boton }]}>Ver todos</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.eventosList}>
              {proximosEventos.length > 0 ? (
                proximosEventos.map((evento) => (
                  <View 
                    key={evento.id} 
                    style={[
                      styles.card, 
                      { backgroundColor: c.input, borderLeftWidth: 4, borderLeftColor: evento.tipo === 'PARTIDO' ? c.boton : '#3b82f6' }
                    ]}
                  >
                    <View style={styles.eventoHeader}>
                      <Text style={[styles.eventoTitulo, { color: c.texto, flex: 1 }]}>
                        {evento.tipo === 'PARTIDO' ? '⚽' : '🏃'} {evento.titulo}
                      </Text>
                    </View>
                    <View style={styles.eventoMeta}>
                      <Text style={[styles.eventoMetaText, { color: c.subtexto }]}>📅 {evento.fecha} - {evento.horaInicio}</Text>
                    </View>
                  </View>
                ))
              ) : (
                <View style={[styles.card, { backgroundColor: c.input, opacity: 0.7, borderStyle: 'dashed' }]}>
                  <Text style={{ color: c.subtexto, textAlign: 'center' }}>No hay eventos programados.</Text>
                </View>
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 24, paddingTop: 60, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  saludo: { fontSize: 16, fontWeight: '500' },
  userName: { fontSize: 24, fontWeight: 'bold' },
  clubLogo: { width: 50, height: 50, borderRadius: 25 },
  clubName: { fontSize: 20, fontWeight: 'bold', marginBottom: 15 },
  chipsRow: { flexDirection: 'row', gap: 10, marginBottom: 30 },
  chip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  chipText: { fontSize: 13, fontWeight: 'bold' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 15 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  linkText: { fontSize: 14, fontWeight: '600' },
  card: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: 'transparent', marginBottom: 10 },
  anuncioTitulo: { fontSize: 16, fontWeight: 'bold', marginBottom: 6 },
  anuncioResumen: { fontSize: 14, lineHeight: 20, marginBottom: 12 },
  anuncioMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  anuncioMetaText: { fontSize: 12, fontWeight: '500' },
  eventosList: { gap: 8 },
  eventoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  eventoTitulo: { fontSize: 15, fontWeight: 'bold' },
  eventoMeta: { gap: 4 },
  eventoMetaText: { fontSize: 13 },
  noTeamCard: { padding: 30, borderRadius: 20, alignItems: 'center', marginTop: 20 },
  noTeamTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
  noTeamSub: { fontSize: 14, textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  btnCrearEquipo: { paddingHorizontal: 25, paddingVertical: 12, borderRadius: 12 },
  btnCrearEquipoText: { color: 'white', fontWeight: 'bold' }
})