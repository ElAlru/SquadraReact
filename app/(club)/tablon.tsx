import { useState, useEffect, useMemo, useCallback } from 'react'
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, 
  ActivityIndicator, LayoutAnimation, Platform, UIManager, RefreshControl,
  Alert // 🟢 Importante para confirmar el borrado
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
  const clubId = useAuthStore((state: any) => state.activeClubId) // 🟢 Necesario para el Presi
  const activeTeamId = useAuthStore((state: any) => state.activeTeamId)
  const activeRole = useAuthStore((state: any) => state.activeRole) // 🟢 Para saber si es Presi
  const userId = useAuthStore((state: any) => state.user?.id)
  
  // --- ESTADOS ---
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [filtro, setFiltro] = useState<'TODOS' | 'CLUB' | 'EQUIPO'>('TODOS')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // --- CARGA DE DATOS ---
  const fetchAnuncios = useCallback(async () => {
    // 🟢 Si es jugador/coach sin equipo, no carga. Si es presi, carga siempre con su club.
    if ((activeRole !== 'PRESIDENT' && !activeTeamId) || !userId || !clubId) return

    try {
      // 🟢 Enrutamiento inteligente según el rol
      const url = activeRole === 'PRESIDENT'
        ? `/api/president/club/${clubId}/announcements`
        : `/api/tablon/todos?teamId=${activeTeamId}&userId=${userId}`

      const res = await apiFetch(url)
      
      if (res.ok) {
        // Asegurar que si viene vacío 204 no pete
        const data = res.status === 204 ? [] : await res.json()
        setAnuncios(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error("Error al cargar el tablón:", e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [activeTeamId, userId, clubId, activeRole])

  useEffect(() => {
    fetchAnuncios()
  }, [fetchAnuncios])

  // --- LÓGICA DE BORRADO (Solo Presidente) ---
// --- LÓGICA DE BORRADO (Compatible Web/Móvil) ---
  const ejecutarBorrado = async (id: number) => {
    console.log(`🔥 Intentando borrar anuncio con ID: ${id}...`);
    try {
      // Ajusta esta ruta si tu endpoint de Java es diferente
      const res = await apiFetch(`/api/president/announcements/${id}`, { method: 'DELETE' });
      
      if (res.ok) {
        console.log("✅ Borrado exitoso en BD. Actualizando pantalla...");
        setAnuncios(prev => prev.filter(a => a.id !== id));
      } else {
        const errorText = await res.text();
        console.error("❌ El servidor rechazó el borrado:", res.status, errorText);
        Alert.alert("Error del servidor", "No se pudo eliminar el anuncio en la base de datos.");
      }
    } catch (e) {
      console.error("💥 Error de conexión:", e);
      Alert.alert("Error de red", "Fallo de conexión al eliminar.");
    }
  };

  const handleEliminarAnuncio = (id: number) => {
    if (Platform.OS === 'web') {
      // 🌐 Pop-up especial para navegador Web
      const confirmado = window.confirm("¿Estás seguro de que quieres borrar este anuncio permanentemente?");
      if (confirmado) {
        ejecutarBorrado(id);
      }
    } else {
      // 📱 Pop-up nativo para iOS/Android
      Alert.alert(
        "Eliminar Anuncio",
        "¿Estás seguro de que quieres borrar este anuncio permanentemente?",
        [
          { text: "Cancelar", style: "cancel" },
          { text: "Eliminar", style: "destructive", onPress: () => ejecutarBorrado(id) }
        ]
      );
    }
  };

  // --- LÓGICA DE LECTURA Y EXPANSIÓN ---
  const handlePressAnuncio = async (anuncio: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    
    const isOpening = expandedId !== anuncio.id
    setExpandedId(isOpening ? anuncio.id : null)

    // 🟢 Mapeamos los campos del DTO (puede venir como isRead o read según el endpoint)
    const isLeido = anuncio.isRead !== undefined ? anuncio.isRead : anuncio.read;

    if (isOpening && !isLeido) {
      // 1. Optimistic Update
      setAnuncios(prev => prev.map(a => 
        a.id === anuncio.id ? { ...a, isRead: true, read: true } : a
      ))

      try {
        // 2. Notificar lectura (solo si tienes endpoint de lectura implementado)
        if (activeRole !== 'PRESIDENT') {
          await apiFetch(`/api/tablon/leer/${anuncio.id}?userId=${userId}`, { method: 'POST' })
        }
      } catch (e) {
        console.error("No se pudo sincronizar la lectura con el servidor", e)
      }
    }
  }

  // --- FILTRADO EN MEMORIA ---
  const anunciosFiltrados = useMemo(() => {
    return anuncios.filter(a => {
      // 🟢 Mapeamos isClub/club (por si el backend manda 'club' en vez de 'isClub')
      const isAnuncioClub = a.isClub !== undefined ? a.isClub : a.club;

      if (filtro === 'TODOS') return true
      if (filtro === 'CLUB') return isAnuncioClub
      if (filtro === 'EQUIPO') return !isAnuncioClub
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
            onPress={() => {
              setFiltro(f)
              setExpandedId(null) // Cerrar tarjetas al cambiar filtro
            }}
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
          anunciosFiltrados.map((a) => {
            // Adaptación de los nombres del DTO de Java
            const isPinned = a.isPinned !== undefined ? a.isPinned : a.pinned;
            const isClub = a.isClub !== undefined ? a.isClub : a.club;
            const isRead = a.isRead !== undefined ? a.isRead : a.read;

            return (
              <TouchableOpacity 
                key={a.id} 
                activeOpacity={0.8}
                onPress={() => handlePressAnuncio(a)}
                style={[
                  styles.card, 
                  { 
                    backgroundColor: c.input, 
                    borderColor: isPinned ? c.boton : 'transparent',
                    borderWidth: isPinned ? 1.5 : 0 
                  }
                ]}
              >
                {/* CABECERA: Badges y Punto de lectura */}
                <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    {isPinned && (
                      <View style={[styles.pinnedBadge, { backgroundColor: `${c.boton}20` }]}>
                        <Text style={[styles.pinnedText, { color: c.boton }]}>📌 FIJADO</Text>
                      </View>
                    )}
                    <View style={[
                      styles.typeBadge, 
                      { backgroundColor: isClub ? '#6366f120' : '#10b98120' }
                    ]}>
                      <Text style={[
                        styles.typeText, 
                        { color: isClub ? '#6366f1' : '#10b981' }
                      ]}>
                        {isClub ? 'CLUB' : 'EQUIPO'}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {!isRead && (
                      <View style={[styles.unreadDot, { backgroundColor: c.boton }]} />
                    )}
                    {/* 🟢 BOTÓN ELIMINAR SOLO PARA PRESIDENTE */}
                    {activeRole === 'PRESIDENT' && (
                      <TouchableOpacity 
                        onPress={() => handleEliminarAnuncio(a.id)}
                        style={[styles.deleteBtn, { backgroundColor: '#ef444420' }]}
                      >
                        <Text style={{ fontSize: 12 }}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* TÍTULO */}
                <Text style={[styles.title, { color: c.texto }]}>{a.titulo || a.title}</Text>

                {/* CONTENIDO (Expandible) */}
                <Text 
                  style={[styles.content, { color: c.subtexto }]} 
                  numberOfLines={expandedId === a.id ? undefined : 3}
                >
                  {a.contenido || a.content}
                </Text>

                {/* PIE DE TARJETA (Solo visible si está expandido) */}
                {expandedId === a.id && (
                  <View style={[styles.expandedFooter, { borderTopColor: `${c.subtexto}20` }]}>
                    <View style={styles.footerItem}>
                      <Text style={[styles.footerLabel, { color: c.subtexto }]}>Autor:</Text>
                      <Text style={[styles.footerValue, { color: c.texto }]}>{a.autor || a.authorName}</Text>
                    </View>
                    <View style={styles.footerItem}>
                      <Text style={[styles.footerLabel, { color: c.subtexto }]}>Fecha:</Text>
                      <Text style={[styles.footerValue, { color: c.texto }]}>{a.fecha || a.publishedAt}</Text>
                    </View>
                  </View>
                )}
              </TouchableOpacity>
            )
          })
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
  deleteBtn: { padding: 6, borderRadius: 8 },
  
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
  emptyText: { fontSize: 16, fontWeight: '500', textAlign: 'center' }
})