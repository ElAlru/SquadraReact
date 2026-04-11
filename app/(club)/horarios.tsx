import { useState, useEffect, useMemo } from 'react'
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native'
import { useTheme } from '../../lib/useTheme'
import { useAuthStore } from '../../lib/store'
import { apiFetch } from '../../lib/api'

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
    // 1. Filtrar por tipo
    const filtrados = eventos.filter(e => filtro === 'TODOS' || e.tipo === filtro)
    
    // 2. Agrupar por Mes
    const grupos: { [key: string]: any[] } = {}
    filtrados.forEach(e => {
      const fecha = new Date(e.fecha)
      const mes = fecha.toLocaleString('es-ES', { month: 'long', year: 'numeric' })
      const mesCapitalizado = mes.charAt(0).toUpperCase() + mes.slice(1)
      if (!grupos[mesCapitalizado]) grupos[mesCapitalizado] = []
      grupos[mesCapitalizado].push(e)
    })
    return grupos
  }, [eventos, filtro])

  if (loading) return (
    <View style={[styles.container, { backgroundColor: c.fondo, justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color={c.boton} />
    </View>
  )

  return (
    <View style={[styles.container, { backgroundColor: c.fondo }]}>
      
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
                  <View style={styles.cardHeader}>
                    {/* ICONO SEGÚN TIPO */}
                    <Text style={{fontSize: 20}}>{e.tipo === 'PARTIDO' ? '⚽' : '🏃'}</Text>
                    
                    {/* INFO PRINCIPAL */}
                    <View style={{flex:1, marginLeft: 10}}>
                      <Text style={[styles.cardTitle, { color: c.texto }]}>{e.titulo}</Text>
                      <Text style={{ color: c.subtexto, fontSize: 13 }}>{e.fecha} • {e.horaInicio}</Text>
                    </View>
                    
                    {/* SECCIÓN RESULTADO O BADGE LOCAL/VISTANTE */}
                    <View style={{ alignItems: 'flex-end' }}>
                      {e.tipo === 'PARTIDO' && e.golesA !== null && e.golesC !== null ? (
                        <View style={[styles.marcadorBox, { backgroundColor: c.fondo }]}>
                          <Text style={[styles.marcadorText, { color: c.texto }]}>
                            {e.golesA} - {e.golesC}
                          </Text>
                        </View>
                      ) : e.tipo === 'PARTIDO' ? (
                        <View style={[styles.badge, { backgroundColor: e.esLocal ? `${c.boton}20` : '#ef444420' }]}>
                          <Text style={[styles.badgeText, { color: e.esLocal ? c.boton : '#ef4444' }]}>
                            {e.esLocal ? 'Local' : 'Visitante'}
                          </Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                  
                  {/* FOOTER DE LA TARJETA */}
                  <View style={styles.cardFooter}>
                     <Text style={{ color: c.subtexto, fontSize: 13 }}>📍 {e.lugar || 'Campo sin asignar'}</Text>
                     {e.tipoPartido && (
                       <Text style={[styles.badgeTipo, { color: c.boton }]}>{e.tipoPartido}</Text>
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
  filterRow: { flexDirection: 'row', justifyContent: 'center', gap: 10, marginBottom: 10 },
  filterBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontWeight: 'bold', fontSize: 13 },
  monthTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 15, textTransform: 'capitalize' },
  card: { padding: 15, borderRadius: 12, marginBottom: 12, borderLeftWidth: 5 },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: 'bold' },
  cardFooter: { 
    marginTop: 10, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    borderTopWidth: 1, 
    borderTopColor: '#f0f0f020', 
    paddingTop: 10 
  },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 10, fontWeight: 'bold' },
  badgeTipo: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
  marcadorBox: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc3',
  },
  marcadorText: {
    fontSize: 16,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
  },
})