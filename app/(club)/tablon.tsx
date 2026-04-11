import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, LayoutAnimation, Platform, UIManager, RefreshControl 
} from 'react-native'
import { useTheme } from '../../lib/useTheme'
import { useAuthStore } from '../../lib/store'
import { apiFetch } from '../../lib/api'

// Habilitar animaciones en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Tablon() {
  const c = useTheme()
  
  // --- DATA DEL STORE ---
  const activeTeamId = useAuthStore((state: any) => state.activeTeamId)
  const userId = useAuthStore((state: any) => state.user?.id)
  
  // --- ESTADOS ---
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [filtro, setFiltro] = useState<'TODOS' | 'CLUB' | 'EQUIPO'>('TODOS')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // --- CARGA DE DATOS ---
  const fetchAnuncios = useCallback(async () => {
    if (!activeTeamId || !userId) return
    try {
      // Endpoint que creamos en el TablonController
      const res = await apiFetch(`/api/tablon/todos?teamId=${activeTeamId}&userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setAnuncios(data)
      }
    } catch (e) {
      console.error("Error al cargar el tablón:", e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeTeamId, userId])

  useEffect(() => {
    fetchAnuncios()
  }, [fetchAnuncios])

  // --- LÓGICA DE LECTURA Y EXPANSIÓN ---
  const handlePressAnuncio = async (anuncio: any) => {
    // Configurar animación suave para el despliegue
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    
    const isOpening = expandedId !== anuncio.id
    setExpandedId(isOpening ? anuncio.id : null)

    // Si lo está abriendo y no estaba leído, lanzamos el proceso de lectura
    if (isOpening && !anuncio.isRead) {
      // 1. Actualización inmediata en la UI (Optimistic Update)
      setAnuncios(prev => prev.map(a => 
        a.id === anuncio.id ? { ...a, isRead: true } : a
      ))

      try {
        // 2. Notificamos al Backend
        await apiFetch(`/api/tablon/leer/${anuncio.id}?userId=${userId}`, {
          method: 'POST'
        })
      } catch (e) {
        console.error("No se pudo sincronizar la lectura con el servidor", e)
        // Opcional: Si falla mucho, podrías revertir el estado aquí
      }
    }
  }

  // --- FILTRADO EN MEMORIA ---
  const anunciosFiltrados = useMemo(() => {
    return anuncios.filter(a => {
      if (filtro === 'TODOS') return true
      if (filtro === 'CLUB') return a.isClub
      if (filtro === 'EQUIPO') return !a.isClub
      return true
    })
  }, [anuncios, filtro])

  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: c.fondo }]}>
        <ActivityIndicator size="large" color={c.boton} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: c.fondo }]}>
      
      {/* SELECTOR DE FILTROS */}
      <View style={styles.filterRow}>
        {(['TODOS', 'CLUB', 'EQUIPO'] as const).map((f) => (
          <TouchableOpacity 
            key={f} 
            onPress={() => setFiltro(f)}
            style={[
              styles.filterBtn, 
              { backgroundColor: filtro === f ? c.boton : c.input }
            ]}
          >
            <Text style={[
              styles.filterText, 
              { color: filtro === f ? '#fff' : c.subtexto }
            ]}>
              {f === 'TODOS' ? 'Todos' : f.charAt(0) + f.slice(1).toLowerCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); fetchAnuncios(); }} tintColor={c.boton} />
        }
      >
        {anunciosFiltrados.length > 0 ? (
          anunciosFiltrados.map((a) => (
            <TouchableOpacity 
              key={a.id} 
              activeOpacity={0.8}
              onPress={() => handlePressAnuncio(a)}
              style={[
                styles.card, 
                { 
                  backgroundColor: c.input, 
                  borderColor: a.isPinned ? c.boton : 'transparent',
                  borderWidth: a.isPinned ? 1.5 : 0 
                }
              ]}
            >
              {/* CABECERA: Badges y Punto de lectura */}
              <View style={styles.cardHeader}>
                <View style={styles.badgeRow}>
                  {a.isPinned && (
                    <View style={[styles.pinnedBadge, { backgroundColor: `${c.boton}20` }]}>
                      <Text style={[styles.pinnedText, { color: c.boton }]}>📌 FIJADO</Text>
                    </View>
                  )}
                  <View style={[
                    styles.typeBadge, 
                    { backgroundColor: a.isClub ? '#6366f120' : '#10b98120' }
                  ]}>
                    <Text style={[
                      styles.typeText, 
                      { color: a.isClub ? '#6366f1' : '#10b981' }
                    ]}>
                      {a.isClub ? 'CLUB' : 'EQUIPO'}
                    </Text>
                  </View>
                </View>

                {!a.isRead && (
                  <View style={[styles.unreadDot, { backgroundColor: c.boton }]} />
                )}
              </View>

              {/* TÍTULO */}
              <Text style={[styles.title, { color: c.texto }]}>{a.titulo}</Text>

              {/* CONTENIDO (Expandible) */}
              <Text 
                style={[styles.content, { color: c.subtexto }]} 
                numberOfLines={expandedId === a.id ? undefined : 3}
              >
                {a.contenido}
              </Text>

              {/* PIE DE TARJETA (Solo visible si está expandido) */}
              {expandedId === a.id && (
                <View style={[styles.expandedFooter, { borderTopColor: `${c.subtexto}20` }]}>
                  <View style={styles.footerItem}>
                    <Text style={[styles.footerLabel, { color: c.subtexto }]}>Autor:</Text>
                    <Text style={[styles.footerValue, { color: c.texto }]}>{a.autor}</Text>
                  </View>
                  <View style={styles.footerItem}>
                    <Text style={[styles.footerLabel, { color: c.subtexto }]}>Fecha:</Text>
                    <Text style={[styles.footerValue, { color: c.texto }]}>{a.fecha}</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📢</Text>
            <Text style={[styles.emptyText, { color: c.subtexto }]}>
              No hay anuncios en esta sección.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  filterRow: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    gap: 10, 
    marginBottom: 10,
    paddingHorizontal: 20 
  },
  filterBtn: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20 },
  filterText: { fontWeight: 'bold', fontSize: 13 },

  card: { 
    padding: 18, 
    borderRadius: 20, 
    marginBottom: 16, 
    // Sombras ligeras para elevación
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3 
  },
  cardHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  badgeRow: { flexDirection: 'row', gap: 8 },
  
  pinnedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pinnedText: { fontSize: 10, fontWeight: '900' },
  
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: 'bold' },
  
  unreadDot: { width: 10, height: 10, borderRadius: 5 },
  
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  content: { fontSize: 15, lineHeight: 22 },

  expandedFooter: { 
    marginTop: 20, 
    paddingTop: 15, 
    borderTopWidth: 1, 
    flexDirection: 'row', 
    justifyContent: 'space-between' 
  },
  footerItem: { gap: 2 },
  footerLabel: { fontSize: 11, textTransform: 'uppercase', fontWeight: 'bold' },
  footerValue: { fontSize: 13, fontWeight: '600' },

  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, fontWeight: '500' }
})