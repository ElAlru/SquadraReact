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
  const profile = useAuthStore((state: any) => state.profile)
  const clubId = useAuthStore((state: any) => state.activeClubId)
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
  const [hayEquipos, setHayEquipos] = useState(false)

  // --- 3. LÓGICA DE SALUDO ---
  useEffect(() => {
    const hora = new Date().getHours()
    if (hora >= 6 && hora < 12) setSaludo('Buenos días')
    else if (hora >= 12 && hora < 20) setSaludo('Buenas tardes')
    else setSaludo('Buenas noches')
  }, [])

  // --- 4. PETICIONES A LA API ---
  const fetchDashboardData = useCallback(async () => {
    setLoading(true)
    try {
      let isPresidentWithTeams = false;

      // 🟢 1. Si es presidente, miramos si hay equipos
      if (activeRole === 'PRESIDENT' && clubId) {
        const resEquipos = await apiFetch(`/api/president/club/${clubId}/teams`)
        if (resEquipos.ok) {
          const dataEquipos = await resEquipos.json()
          isPresidentWithTeams = dataEquipos.length > 0;
          setHayEquipos(isPresidentWithTeams)
        }
      }

      // 🟢 2. CONDICIÓN DE PARADA CORRECTA:
      // Paramos si NO es presi y NO tiene equipo. O si ES presi pero el club está vacío.
      if ((activeRole !== 'PRESIDENT' && !activeTeamId) || (activeRole === 'PRESIDENT' && !isPresidentWithTeams)) {
        setLoading(false)
        return
      }

      // 🟢 3. CARGAR ANUNCIOS (Global para presi, Específico para jugadores)
      const urlAnuncio = activeRole === 'PRESIDENT' 
          ? `/api/president/club/${clubId}/announcements` 
          : `/api/tablon/ultimo?teamId=${activeTeamId}`;

      const resAnuncio = await apiFetch(urlAnuncio)
      if (resAnuncio.ok && resAnuncio.status !== 204) {
        const dataAnuncio = await resAnuncio.json()
        
        if (activeRole === 'PRESIDENT') {
          // El presi recibe un array (AnuncioCompletoDTO). Cogemos el primero.
          if (dataAnuncio && dataAnuncio.length > 0) {
            setUltimoAnuncio({
              titulo: dataAnuncio[0].titulo,
              contenido: dataAnuncio[0].contenido,
              autor: dataAnuncio[0].autor,
              fecha: dataAnuncio[0].fecha
            })
          } else {
            setUltimoAnuncio(null)
          }
        } else {
          // El jugador recibe el objeto directo
          setUltimoAnuncio(dataAnuncio)
        }
      }

      // 🟢 4. CARGAR EVENTOS
      const urlEventos = activeRole === 'PRESIDENT'
          ? `/api/eventos/proximos?clubId=${clubId}&limit=3` // Asume que tu backend soporta buscar por clubId
          : `/api/eventos/proximos?teamId=${activeTeamId}&limit=3`;

      const resEventos = await apiFetch(urlEventos)
      if (resEventos.ok) {
        const dataEventos = await resEventos.json()
        setProximosEventos(dataEventos)
      }

    } catch (error) {
      console.error("Fallo al cargar dashboard:", error)
    } finally {
      setLoading(false)
    }
  }, [activeTeamId, activeRole, clubId])

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

        {/* CHIPS DE INFORMACIÓN (Solo se muestran si tienes equipo o temporada activa) */}
        {(activeTeamId || activeRole === 'PRESIDENT') && (
            <View style={styles.chipsRow}>
                <View style={[styles.chip, { backgroundColor: `${c.boton}20` }]}>
                    <Text style={[styles.chipText, { color: c.boton }]}>📅 {seasonName}</Text>
                </View>
                {activeTeamId && (
                  <View style={[styles.chip, { backgroundColor: `${c.boton}20` }]}>
                      <Text style={[styles.chipText, { color: c.boton }]}>👕 {teamName || 'Equipo'}</Text>
                  </View>
                )}
                {activeRole === 'PRESIDENT' && !activeTeamId && (
                  <View style={[styles.chip, { backgroundColor: `${c.boton}20` }]}>
                      <Text style={[styles.chipText, { color: c.boton }]}>👑 Modo Presidencia</Text>
                  </View>
                )}
            </View>
        )}

        {/* --- RENDERIZADO CONDICIONAL --- */}
        {loading ? (
          <ActivityIndicator size="large" color={c.boton} style={{ marginTop: 40 }} />
        ) : (activeRole === 'PRESIDENT' && !hayEquipos) || (activeRole !== 'PRESIDENT' && !activeTeamId) ? (
          
          /* 🛑 PANTALLA VACÍA (Para club nuevo o jugador sin equipo) */
          <View style={[styles.noTeamCard, { backgroundColor: c.input }]}>
            <Text style={[styles.noTeamTitle, { color: c.texto }]}>¡Bienvenido a tu club!</Text>
            <Text style={[styles.noTeamSub, { color: c.subtexto }]}>
              {activeRole === 'PRESIDENT'
                ? 'Como presidente, el siguiente paso es crear tu primer equipo desde el menú de gestión.' 
                : 'Aún no tienes un equipo asignado para ver el tablón y los eventos.'}
            </Text>
            
            {activeRole === 'PRESIDENT' && (
                <TouchableOpacity 
                    style={[styles.btnCrearEquipo, { backgroundColor: c.boton }]}
                    onPress={() => router.push('/(club)/gestion')}
                >
                    <Text style={styles.btnCrearEquipoText}>Ir a Gestión</Text>
                </TouchableOpacity>
            )}
          </View>

        ) : (
          
          /* ✅ DASHBOARD (Anuncios y Eventos) */
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
                <Text style={{ color: c.subtexto, textAlign: 'center' }}>No hay anuncios para mostrar aún.</Text>
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