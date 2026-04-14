import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation, Platform,
  RefreshControl,
  ScrollView,
  StyleSheet, Text,
  TouchableOpacity,
  UIManager,
  View
} from 'react-native'
import { apiFetch } from '../../lib/api'
import { useAuthStore } from '../../lib/store'
import { useTheme } from '../../lib/useTheme'
// Busca donde importas 'expo-router' (si no lo tienes, añádelo)
import { useFocusEffect } from 'expo-router'

// Habilitar animaciones en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function Tablon() {
  const c = useTheme()
  
  // --- DATA DEL STORE ---
  const clubId = useAuthStore((state: any) => state.activeClubId) 
  const activeTeamId = useAuthStore((state: any) => state.activeTeamId)
  const activeRole = useAuthStore((state: any) => state.activeRole) 
  const userId = useAuthStore((state: any) => state.user?.id)
  // 🟢 AÑADIDO: Necesitamos el ID de la temporada activa para filtrar
  const activeSeasonId = useAuthStore((state: any) => state.activeSeasonId)
  
  // --- ESTADOS ---
  const [anuncios, setAnuncios] = useState<any[]>([])
  const [filtro, setFiltro] = useState<'TODOS' | 'CLUB' | 'EQUIPO'>('TODOS')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [expandedId, setExpandedId] = useState<number | null>(null)

  // --- CARGA DE DATOS ---

  useEffect(() => {
    // Si el usuario no tiene temporada activa en el store, vamos a buscarla
    if (!activeSeasonId && clubId) {
      apiFetch(`/api/president/club/${clubId}/seasons`)
        .then(res => res.json())
        .then(seasons => {
          const active = seasons.find((s: any) => s.isActive);
          if (active) {
            // Guardamos en el store localmente (si tienes la función set en el store)
            // useAuthStore.setState({ activeSeasonId: active.id });
          }
        });
    }
  }, [clubId, activeSeasonId]);
const fetchAnuncios = useCallback(async () => {
    // 🟢 Si faltan datos críticos, paramos la carga pero quitamos la ruedita
    if (!userId || !clubId) {
      setLoading(false);
      return;
    }

    // Si es un jugador y aún no tiene equipo o no hay temporada activa en el store
    if ((activeRole !== 'PRESIDENT' && !activeTeamId) || !activeSeasonId) {
      setLoading(false);
      return;
    }

    try {
      const url = activeRole === 'PRESIDENT'
        ? `/api/president/club/${clubId}/announcements?seasonId=${activeSeasonId}`
        : `/api/tablon/todos?teamId=${activeTeamId}&userId=${userId}&seasonId=${activeSeasonId}`;

      const res = await apiFetch(url);
      
      if (res.ok) {
        const data = res.status === 204 ? [] : await res.json();
        setAnuncios(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error("Error al cargar el tablón:", e);
    } finally {
      // 🟢 Esto asegura que la ruedita siempre pare, pase lo que pase
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTeamId, userId, clubId, activeRole, activeSeasonId]);

  useFocusEffect(
    useCallback(() => {
      // Esto se ejecuta cada vez que entras a la pestaña Tablón
      fetchAnuncios();
    }, [fetchAnuncios])
  );

  // --- LÓGICA DE BORRADO (Solo Presidente) ---
  const ejecutarBorrado = async (id: number) => {
    console.log(`🔥 Intentando borrar anuncio con ID: ${id}...`);
    try {
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
      const confirmado = window.confirm("¿Estás seguro de que quieres borrar este anuncio permanentemente?");
      if (confirmado) {
        ejecutarBorrado(id);
      }
    } else {
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

    const isLeido = anuncio.isRead !== undefined ? anuncio.isRead : anuncio.read;

    if (isOpening && !isLeido) {
      setAnuncios(prev => prev.map(a => 
        a.id === anuncio.id ? { ...a, isRead: true, read: true } : a
      ))

      try {
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
              setExpandedId(null) 
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