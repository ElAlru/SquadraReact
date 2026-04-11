import { useState, useEffect, useMemo } from 'react'
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useTheme } from '../../lib/useTheme'
import { useAuthStore } from '../../lib/store'
import { apiFetch } from '../../lib/api'

// Mapeo para los textos de los tipos de partido
const TIPO_PARTIDO_LABEL: Record<string, string> = {
  LEAGUE: 'Liga',
  FRIENDLY: 'Amistoso',
  CUP: 'Copa',
  TOURNAMENT: 'Torneo',
  OTHER: 'Otro',
}

export default function Horarios() {
  const c = useTheme()
  const activeTeamId = useAuthStore((state: any) => state.activeTeamId)
  
  const [eventos, setEventos] = useState<any[]>([])
  const [filtro, setFiltro] = useState<'TODOS' | 'PARTIDO' | 'ENTRENAMIENTO'>('TODOS')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      if (!activeTeamId) return
      try {
        const res = await apiFetch(`/api/eventos/equipo/${activeTeamId}`)
        if (res.ok) {
          const data = await res.json()
          setEventos(data)
        }
      } catch (e) { 
        console.error("Error cargando horarios:", e) 
      } finally { 
        setLoading(false) 
      }
    }
    load()
  }, [activeTeamId])

  // --- LÓGICA DE FILTRADO Y AGRUPACIÓN ---
  const eventosAgrupados = useMemo(() => {
    const filtrados = eventos.filter(e => filtro === 'TODOS' || e.tipo === filtro)
    
    const grupos: { [key: string]: any[] } = {}
    filtrados.forEach(e => {
      const fecha = new Date(e.fecha)
      // Sacamos el mes y lo ponemos TODO EN MAYÚSCULAS
      const mes = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' }).toUpperCase()
      if (!grupos[mes]) grupos[mes] = []
      grupos[mes].push(e)
    })
    return grupos
  }, [eventos, filtro])

  // Función auxiliar para el color de los badges de competición
  const getColorTipoPartido = (tipo: string) => {
    switch(tipo) {
      case 'FRIENDLY': return '#9ca3af' // Gris
      case 'CUP': return '#eab308' // Amarillo
      case 'LEAGUE': return c.boton // Verde (u otro color base)
      default: return c.boton
    }
  }

  if (loading) return (
    <View style={[styles.container, { backgroundColor: c.fondo, justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color={c.boton} />
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: c.fondo }]}>
      
      {/* TÍTULO AÑADIDO */}
      <View style={{ paddingHorizontal: 20, marginBottom: 15 }}>
        <Text style={[styles.mainTitle, { color: c.texto }]}>📅 Horarios</Text>
      </View>

      {/* FILTROS SUPERIORES */}
      <View style={styles.filterRow}>
        {['TODOS', 'PARTIDO', 'ENTRENAMIENTO'].map((f: any) => (
          <TouchableOpacity 
            key={f} 
            onPress={() => setFiltro(f)}
            style={[styles.filterBtn, { backgroundColor: filtro === f ? c.boton : c.input }]}
          >
            <Text style={[styles.filterText, { color: filtro === f ? '#fff' : c.subtexto }]}>
              {f === 'TODOS' ? 'Todos' : f === 'PARTIDO' ? 'Partidos' : 'Entrenos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
        {Object.keys(eventosAgrupados).length > 0 ? (
          Object.entries(eventosAgrupados).map(([mes, evs]) => (
            <View key={mes} style={{ marginBottom: 25 }}>
              <Text style={[styles.monthTitle, { color: c.texto }]}>{mes}</Text>
              
              {evs.map((e: any) => (
                <View key={e.id} style={[styles.card, { backgroundColor: c.input, borderLeftColor: e.tipo === 'PARTIDO' ? c.boton : '#3b82f6' }]}>
                  
                  {/* FILA SUPERIOR: Fecha y Badges */}
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: c.subtexto, fontSize: 12, fontWeight: 'bold' }}>{e.fecha}</Text>
                    
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      {e.tipoPartido && (
                        <View style={[styles.badge, { backgroundColor: `${getColorTipoPartido(e.tipoPartido)}20` }]}>
                          <Text style={[styles.badgeText, { color: getColorTipoPartido(e.tipoPartido) }]}>
                            {TIPO_PARTIDO_LABEL[e.tipoPartido] || e.tipoPartido}
                          </Text>
                        </View>
                      )}
                      {e.esLocal !== undefined && e.tipo === 'PARTIDO' && (
                        <View style={[styles.badge, { backgroundColor: e.esLocal ? `${c.boton}20` : '#ef444420' }]}>
                          <Text style={[styles.badgeText, { color: e.esLocal ? c.boton : '#ef4444' }]}>
                            {e.esLocal ? 'Local' : 'Visitante'}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* INFO PRINCIPAL: Titulo y Resultado */}
                  <View style={styles.cardHeader}>
                    <Text style={{fontSize: 20}}>{e.tipo === 'PARTIDO' ? '⚽' : '🏃'}</Text>
                    
                    <View style={{flex:1, marginLeft: 10}}>
                      <Text style={[styles.cardTitle, { color: c.texto }]}>{e.titulo}</Text>
                    </View>
                    
                    {/* RESULTADO (Color Verde) */}
                    <View style={{ alignItems: 'flex-end' }}>
                      {e.tipo === 'PARTIDO' && e.golesA !== null && e.golesC !== null && (
                        <View style={[styles.marcadorBox, { backgroundColor: `${c.boton}15`, borderColor: `${c.boton}40` }]}>
                          <Text style={[styles.marcadorText, { color: c.boton }]}>
                            {e.golesA} - {e.golesC}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  
                  {/* FILA INFERIOR: Hora, Campo y Jornada */}
                  <View style={styles.cardFooter}>
                    <View style={{ flexDirection: 'row', gap: 15 }}>
                      <Text style={{ color: c.texto, fontSize: 13, fontWeight: '600' }}>
                        🕐 {e.horaInicio} {e.tipo === 'ENTRENAMIENTO' && e.horaFin ? `- ${e.horaFin}` : ''}
                      </Text>
                      <Text style={{ color: c.subtexto, fontSize: 13, flexShrink: 1 }} numberOfLines={1}>
                        📍 {e.lugar || 'Sin asignar'}
                      </Text>
                    </View>
                    
                    {e.jornada && (
                      <Text style={{ color: c.subtexto, fontSize: 12, fontWeight: 'bold' }}>J{e.jornada}</Text>
                    )}
                  </View>

                </View>
              ))}
            </View>
          ))
        ) : (
          <View style={{ marginTop: 40, alignItems: 'center' }}>
            <Text style={{ color: c.subtexto }}>No hay eventos que coincidan con el filtro.</Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  mainTitle: { fontSize: 24, fontWeight: 'bold' },
  filterRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontWeight: 'bold', fontSize: 13 },
  monthTitle: { fontSize: 16, fontWeight: '900', marginBottom: 15, letterSpacing: 1 },
  card: { padding: 15, borderRadius: 12, marginBottom: 12, borderLeftWidth: 5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardFooter: { 
    marginTop: 12, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f020', 
    paddingTop: 10 
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  marcadorBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  marcadorText: {
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
})