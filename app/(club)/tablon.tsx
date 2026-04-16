import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from 'react-native'
import { apiFetch } from '../../lib/api'
import { useAuthStore } from '../../lib/store'
import { useTheme } from '../../lib/useTheme'
import { useFocusEffect } from 'expo-router'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

type Filtro = 'TODOS' | 'CLUB' | 'EQUIPO'

// Helper para alertas compatibles con Web y Móvil
const showAlert = (titulo: string, mensaje: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${titulo}: ${mensaje}`)
  } else {
    Alert.alert(titulo, mensaje)
  }
}

export default function Tablon() {
  const getAutomaticSeason = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // Enero es 0
  if (month >= 8) { // Agosto en adelante
    return `${year}-${year + 1}`;
  } else {
    return `${year - 1}-${year}`;
  }
};
  const c = useTheme()

  const clubId       = useAuthStore((s: any) => s.activeClubId)
  const activeTeamId = useAuthStore((s: any) => s.activeTeamId)
  const activeRole   = useAuthStore((s: any) => s.activeRole)
  const seasonLabel  = useAuthStore((s: any) => s.activeSeasonLabel)
  const userId       = useAuthStore((s: any) => s.user?.id)

  const isPresident = activeRole === 'PRESIDENT'
  const isCoach     = activeRole === 'COACH' || activeRole === 'STAFF'
  const canCreate   = isPresident || isCoach
  const canDelete   = isPresident

  // ── STATE ─────────────────────────────────────────────────────────────────
  const [anuncios, setAnuncios]         = useState<any[]>([])
  const [filtro, setFiltro]             = useState<Filtro>('TODOS')
  const [loading, setLoading]           = useState(true)
  const [refreshing, setRefreshing]     = useState(false)
  const [expandedId, setExpandedId]     = useState<number | null>(null)

  // Selector de temporada (solo presidente)
  const [seasons, setSeasons]           = useState<string[]>([])
  const [selectedSeason, setSelectedSeason] = useState<string>(seasonLabel || '')

  // Modal crear anuncio
  const [showModal, setShowModal]       = useState(false)
  const [nuevoTitulo, setNuevoTitulo]   = useState('')
  const [nuevoContenido, setNuevoContenido] = useState('')
  const [pinned, setPinned]             = useState(false)
  const [destinoEquipo, setDestinoEquipo] = useState<number | null>(null) // null = club global
  const [creando, setCreando]           = useState(false)

  // ── CARGAR TEMPORADAS (presidente) ────────────────────────────────────────
  useEffect(() => {
    if (isPresident && clubId) {
      apiFetch(`/api/president/club/${clubId}/announcement-seasons`)
        .then(res => res.ok ? res.json() : [])
        .then((data: string[]) => {
          setSeasons(data)
          if (data.length > 0 && !data.includes(selectedSeason)) {
            setSelectedSeason(data[0])
          } else if (!selectedSeason && seasonLabel) {
            setSelectedSeason(seasonLabel)
          }
        })
        .catch(() => {})
    } else if (!selectedSeason && seasonLabel) {
      setSelectedSeason(seasonLabel)
    }
  }, [isPresident, clubId, seasonLabel])

  // ── CARGAR ANUNCIOS ───────────────────────────────────────────────────────
  const fetchAnuncios = useCallback(async () => {
    const targetSeason = selectedSeason || seasonLabel

    if (!userId || !clubId || !targetSeason) {
      setLoading(false)
      return
    }
    if (!isPresident && !activeTeamId) {
      setLoading(false)
      return
    }

    try {
      let url: string
      if (isPresident) {
        url = `/api/president/club/${clubId}/announcements?seasonLabel=${targetSeason}`
      } else {
        url = `/api/tablon/todos?clubId=${clubId}&seasonLabel=${targetSeason}`
        if (activeTeamId) url += `&teamId=${activeTeamId}`
      }

      const res = await apiFetch(url)
      if (res.ok) {
        const data = res.status === 204 ? [] : await res.json()
        setAnuncios(Array.isArray(data) ? data : [])
      }
    } catch (e) {
      console.error('Error tablón:', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [userId, clubId, activeTeamId, isPresident, selectedSeason, seasonLabel])

  useFocusEffect(
    useCallback(() => {
      fetchAnuncios()
    }, [fetchAnuncios])
  )

  // ── MARCAR LEÍDO + EXPANDIR ───────────────────────────────────────────────
  const handlePress = async (anuncio: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    const isOpening = expandedId !== anuncio.id
    setExpandedId(isOpening ? anuncio.id : null)

    const isLeido = anuncio.isRead ?? anuncio.read
    if (isOpening && !isLeido && !isPresident) {
      setAnuncios(prev => prev.map(a =>
        a.id === anuncio.id ? { ...a, isRead: true, read: true } : a
      ))
      try {
        await apiFetch(`/api/tablon/leer/${anuncio.id}?clubId=${clubId}`, { method: 'POST' })
      } catch {}
    }
  }

  // ── ELIMINAR ──────────────────────────────────────────────────────────────
  const ejecutarBorrado = async (id: number) => {
    try {
      const res = await apiFetch(`/api/president/announcements/${id}?clubId=${clubId}`, { method: 'DELETE' })
      if (res.ok) {
        setAnuncios(prev => prev.filter(a => a.id !== id))
      } else {
        showAlert('Error', 'No se pudo eliminar el anuncio.')
      }
    } catch {
      showAlert('Error de red', 'Fallo de conexión al eliminar.')
    }
  }

  const handleEliminar = (id: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm('¿Eliminar este anuncio permanentemente?')) ejecutarBorrado(id)
    } else {
      Alert.alert('Eliminar Anuncio', '¿Eliminar este anuncio permanentemente?', [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Eliminar', style: 'destructive', onPress: () => ejecutarBorrado(id) },
      ])
    }
  }

  // ── CREAR ANUNCIO ─────────────────────────────────────────────────────────
  const handleCrear = async () => {
    // 🟢 Si no hay temporada seleccionada ni en el store, la calculamos automática
    const targetSeason = selectedSeason || seasonLabel || getAutomaticSeason();

    if (!nuevoTitulo.trim() || !nuevoContenido.trim()) {
      showAlert('Atención', 'Título y contenido son obligatorios.');
      return
    }

    setCreando(true)
    try {
      const body: any = {
        titulo: nuevoTitulo.trim(),
        contenido: nuevoContenido.trim(),
        isPinned: pinned,
      }
      if (isCoach) body.teamId = activeTeamId
      else if (destinoEquipo !== null) body.teamId = destinoEquipo

      // 🟢 Ahora targetSeason siempre tendrá un valor (ej: "2025-2026")
      const res = await apiFetch(
        `/api/tablon/crear?clubId=${clubId}&seasonLabel=${targetSeason}`,
        { method: 'POST', body: JSON.stringify(body) }
      )
      
      if (res.ok) {
        const nuevo = await res.json()
        setAnuncios(prev => [nuevo, ...prev])
        
        // Si la temporada no estaba en nuestra lista de "filtros", la añadimos
        if (!seasons.includes(targetSeason)) {
            setSeasons(prev => [targetSeason, ...prev])
        }
        
        cerrarModal()
      } else {
        showAlert('Error', 'No se pudo crear el anuncio. Verifica que tengas conexión.')
      }
    } catch {
      showAlert('Error de red', 'Fallo al publicar.')
    } finally {
      setCreando(false)
    }
  }

  const cerrarModal = () => {
    setShowModal(false)
    setNuevoTitulo('')
    setNuevoContenido('')
    setPinned(false)
    setDestinoEquipo(null)
  }

  // ── FILTRADO ──────────────────────────────────────────────────────────────
  // ── FILTRADO Y ORDENACIÓN ──────────────────────────────────────────────────
  const anunciosFiltrados = useMemo(() => {
    // 1. Filtrar por TODOS, CLUB o EQUIPO
    const filtrados = anuncios.filter(a => {
      const isClub = a.isClub ?? a.club
      if (filtro === 'TODOS') return true
      if (filtro === 'CLUB')  return isClub
      if (filtro === 'EQUIPO') return !isClub
      return true
    });

    // 2. Ordenar: Primero los FIJADOS, luego los más recientes (asumiendo que el ID mayor es más reciente)
    return filtrados.sort((a, b) => {
      const aPinned = a.isPinned ?? a.pinned;
      const bPinned = b.isPinned ?? b.pinned;

      if (aPinned && !bPinned) return -1; // 'a' va primero
      if (!aPinned && bPinned) return 1;  // 'b' va primero
      
      // Si ambos están fijados o ambos sin fijar, el más nuevo (id más alto) va primero
      return b.id - a.id; 
    });
  }, [anuncios, filtro]);

  // ── RENDER ────────────────────────────────────────────────────────────────
  if (loading && !refreshing) {
    return (
      <View style={[styles.center, { backgroundColor: c.fondo }]}>
        <ActivityIndicator size="large" color={c.boton} />
      </View>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: c.fondo }]}>

      {/* ─── HEADER ROW: filtros + botón crear ───────────────────────────── */}
      <View style={styles.topBar}>
        <View style={styles.filterRow}>
          {(['TODOS', 'CLUB', 'EQUIPO'] as Filtro[]).map(f => (
            <TouchableOpacity
              key={f}
              onPress={() => { setFiltro(f); setExpandedId(null) }}
              style={[styles.filterBtn, { backgroundColor: filtro === f ? c.boton : c.input }]}
            >
              <Text style={[styles.filterText, { color: filtro === f ? '#fff' : c.subtexto }]}>
                {f === 'TODOS' ? 'Todos' : f.charAt(0) + f.slice(1).toLowerCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {canCreate && (
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: c.boton }]}
            onPress={() => setShowModal(true)}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* ─── SELECTOR DE TEMPORADA (solo presidente) ─────────────────────── */}
      {isPresident && seasons.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.seasonScroll}
        >
          {seasons.map(s => (
            <TouchableOpacity
              key={s}
              style={[
                styles.seasonChip,
                {
                  backgroundColor: selectedSeason === s ? c.boton : c.input,
                  borderColor: selectedSeason === s ? c.boton : c.bordeInput,
                },
              ]}
              onPress={() => setSelectedSeason(s)}
            >
              <Text style={{ color: selectedSeason === s ? '#fff' : c.texto, fontWeight: '600', fontSize: 13 }}>
                {s}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* ─── LISTA ───────────────────────────────────────────────────────── */}
      <ScrollView
        contentContainerStyle={{ padding: 20, paddingBottom: 50 }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); fetchAnuncios() }}
            tintColor={c.boton}
          />
        }
      >
        {anunciosFiltrados.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📢</Text>
            <Text style={[styles.emptyText, { color: c.subtexto }]}>
              No hay anuncios en esta sección.
            </Text>
          </View>
        ) : (
          anunciosFiltrados.map(a => {
            const isPinned = a.isPinned ?? a.pinned
            const isClub   = a.isClub ?? a.club
            const isRead   = a.isRead ?? a.read
            const isOpen   = expandedId === a.id

            return (
              <TouchableOpacity
                key={a.id}
                activeOpacity={0.85}
                onPress={() => handlePress(a)}
                style={[
                  styles.card,
                  {
                    backgroundColor: c.input,
                    borderColor: isPinned ? c.boton : 'transparent',
                    borderWidth: isPinned ? 1.5 : 0,
                  },
                ]}
              >
                {/* Badges + acciones */}
                <View style={styles.cardHeader}>
                  <View style={styles.badgeRow}>
                    {isPinned && (
                      <View style={[styles.pinnedBadge, { backgroundColor: `${c.boton}20` }]}>
                        <Text style={[styles.pinnedText, { color: c.boton }]}>📌 FIJADO</Text>
                      </View>
                    )}
                    <View style={[styles.typeBadge, { backgroundColor: isClub ? '#6366f120' : '#10b98120' }]}>
                      <Text style={[styles.typeText, { color: isClub ? '#6366f1' : '#10b981' }]}>
                        {isClub ? 'CLUB' : (a.teamName || 'EQUIPO')}
                      </Text>
                    </View>
                  </View>

                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    {!isRead && !isPresident && (
                      <View style={[styles.unreadDot, { backgroundColor: c.boton }]} />
                    )}
                    {canDelete && (
                      <TouchableOpacity
                        onPress={() => handleEliminar(a.id)}
                        style={[styles.deleteBtn, { backgroundColor: '#ef444420' }]}
                      >
                        <Text style={{ fontSize: 12 }}>🗑️</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Título */}
                <Text style={[styles.title, { color: c.texto }]}>{a.titulo || a.title}</Text>

                {/* Contenido expandible */}
                <Text
                  style={[styles.content, { color: c.subtexto }]}
                  numberOfLines={isOpen ? undefined : 3}
                >
                  {a.contenido || a.content}
                </Text>

                {/* Footer expandido */}
                {isOpen && (
                  <View style={[styles.expandedFooter, { borderTopColor: `${c.subtexto}20` }]}>
                    <View style={styles.footerItem}>
                      <Text style={[styles.footerLabel, { color: c.subtexto }]}>Autor</Text>
                      <Text style={[styles.footerValue, { color: c.texto }]}>{a.autor || a.authorName}</Text>
                    </View>
                    <View style={styles.footerItem}>
                      <Text style={[styles.footerLabel, { color: c.subtexto }]}>Fecha</Text>
                      <Text style={[styles.footerValue, { color: c.texto }]}>{a.fecha || a.publishedAt}</Text>
                    </View>
                    {a.seasonLabel && (
                      <View style={styles.footerItem}>
                        <Text style={[styles.footerLabel, { color: c.subtexto }]}>Temporada</Text>
                        <Text style={[styles.footerValue, { color: c.texto }]}>{a.seasonLabel}</Text>
                      </View>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            )
          })
        )}
      </ScrollView>

      {/* ─── MODAL CREAR ANUNCIO ─────────────────────────────────────────── */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={cerrarModal}>
        <Pressable style={styles.overlay} onPress={cerrarModal}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]}
            onPress={() => {}}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>📢 Nuevo Anuncio</Text>
              <TouchableOpacity onPress={cerrarModal}>
                <Text style={{ color: c.subtexto, fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 14 }}>
              {/* Destino (solo presidente) */}
              {isPresident && (
                <View>
                  <Text style={[styles.label, { color: c.subtexto }]}>Destino</Text>
                  <View style={{ flexDirection: 'row', gap: 8, marginTop: 6 }}>
                    <TouchableOpacity
                      style={[
                        styles.destinoBtn,
                        {
                          backgroundColor: destinoEquipo === null ? c.boton : c.input,
                          borderColor: destinoEquipo === null ? c.boton : c.bordeInput,
                        },
                      ]}
                      onPress={() => setDestinoEquipo(null)}
                    >
                      <Text style={{ color: destinoEquipo === null ? '#fff' : c.texto, fontWeight: '600' }}>
                        🏛 Todo el club
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.destinoBtn,
                        {
                          backgroundColor: destinoEquipo !== null ? c.boton : c.input,
                          borderColor: destinoEquipo !== null ? c.boton : c.bordeInput,
                        },
                      ]}
                      onPress={() => {
                        setDestinoEquipo(activeTeamId || 1) // Fallback rápido si el presi no tiene equipo asignado
                      }}
                    >
                      <Text style={{ color: destinoEquipo !== null ? '#fff' : c.texto, fontWeight: '600' }}>
                        👕 Equipo específico
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              <View>
                <Text style={[styles.label, { color: c.subtexto }]}>Título *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
                  value={nuevoTitulo}
                  onChangeText={setNuevoTitulo}
                  placeholder="Título del anuncio..."
                  placeholderTextColor={c.subtexto}
                />
              </View>

              <View>
                <Text style={[styles.label, { color: c.subtexto }]}>Contenido *</Text>
                <TextInput
                  style={[
                    styles.input,
                    { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto, height: 100, textAlignVertical: 'top' },
                  ]}
                  value={nuevoContenido}
                  onChangeText={setNuevoContenido}
                  placeholder="Escribe el contenido..."
                  placeholderTextColor={c.subtexto}
                  multiline
                />
              </View>

              {/* Fijar (solo presidente) */}
              {isPresident && (
                <TouchableOpacity
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  onPress={() => setPinned(p => !p)}
                >
                  <View
                    style={[
                      styles.checkbox,
                      { backgroundColor: pinned ? c.boton : 'transparent', borderColor: c.boton },
                    ]}
                  >
                    {pinned && <Text style={{ color: '#fff', fontSize: 12 }}>✓</Text>}
                  </View>
                  <Text style={{ color: c.texto, fontWeight: '500' }}>📌 Fijar anuncio</Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                style={[styles.btnGuardar, { backgroundColor: c.boton, opacity: creando ? 0.6 : 1 }]}
                onPress={handleCrear}
                disabled={creando}
              >
                <Text style={styles.btnGuardarText}>
                  {creando ? 'Publicando...' : 'Publicar Anuncio'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 60 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },

  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, marginBottom: 10, gap: 10 },
  filterRow: { flexDirection: 'row', gap: 8, flex: 1 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, flex: 1, alignItems: 'center' },
  filterText: { fontWeight: 'bold', fontSize: 12 },
  addBtn: { width: 38, height: 38, borderRadius: 19, justifyContent: 'center', alignItems: 'center' },
  addBtnText: { color: '#fff', fontSize: 22, lineHeight: 26, fontWeight: 'bold' },

  seasonScroll: { paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  seasonChip: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },

  card: {
    padding: 18, borderRadius: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05, shadowRadius: 10, elevation: 3,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badgeRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap', flex: 1 },
  pinnedBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  pinnedText: { fontSize: 10, fontWeight: '900' },
  typeBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 10, fontWeight: 'bold' },
  unreadDot: { width: 10, height: 10, borderRadius: 5 },
  deleteBtn: { padding: 6, borderRadius: 8 },
  title: { fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  content: { fontSize: 15, lineHeight: 22 },
  expandedFooter: { marginTop: 20, paddingTop: 15, borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 },
  footerItem: { gap: 2 },
  footerLabel: { fontSize: 11, textTransform: 'uppercase', fontWeight: 'bold' },
  footerValue: { fontSize: 13, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 100 },
  emptyText: { fontSize: 16, fontWeight: '500', textAlign: 'center' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, borderWidth: 1, borderBottomWidth: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo: { fontSize: 20, fontWeight: 'bold' },
  label: { fontSize: 13, fontWeight: 'bold', marginBottom: 4 },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 15 },
  destinoBtn: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1, alignItems: 'center' },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center' },
  btnGuardar: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 6 },
  btnGuardarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
})