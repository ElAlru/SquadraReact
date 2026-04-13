import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert, Image } from 'react-native'
import * as Clipboard from 'expo-clipboard'
import { useTheme } from '../../lib/useTheme'
import { useAuthStore } from '../../lib/store'
import { apiFetch } from '../../lib/api'

const POSICION_LABEL: Record<string, string> = {
  GOALKEEPER: 'Portero',
  DEFENDER: 'Defensa',
  MIDFIELDER: 'Centrocampista',
  FORWARD: 'Delantero',
}

const POSICION_COLOR: Record<string, string> = {
  GOALKEEPER: '#f59e0b',
  DEFENDER: '#3b82f6',
  MIDFIELDER: '#8b5cf6',
  FORWARD: '#16a34a',
}

export default function MiClub() {
  const c = useTheme()
  const { t } = useTranslation()
  
  // --- STORE ---
  const activeTeamId = useAuthStore((state: any) => state.activeTeamId)
  const activeRole = useAuthStore((state: any) => state.activeRole)
  const clubId = useAuthStore((state: any) => state.activeClubId)

  // --- ESTADOS ---
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [teams, setTeams] = useState<any[]>([]) // 🟢 Lista de equipos para el Presidente
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null) // 🟢 El equipo que estamos viendo ahora mismo

  // --- 1. LÓGICA DE ROLES: Determinar qué equipo ver ---
  useEffect(() => {
    async function loadInitialState() {
      if (activeRole === 'PRESIDENT' && clubId) {
        try {
          // El presi carga todos los equipos
          const res = await apiFetch(`/api/president/club/${clubId}/teams`)
          if (res.ok) {
            const json = await res.json()
            setTeams(json)
            if (json.length > 0) {
              setSelectedTeamId(json[0].id) // Por defecto, mostramos el primer equipo
            } else {
              setLoading(false) // Si el club no tiene equipos, paramos la carga
            }
          }
        } catch (e) {
          console.error("Error cargando equipos del presi:", e)
          setLoading(false)
        }
      } else {
        // Jugadores y entrenadores ven el suyo directo
        if (activeTeamId) {
          setSelectedTeamId(activeTeamId)
        } else {
          setLoading(false)
        }
      }
    }
    loadInitialState()
  }, [activeRole, clubId, activeTeamId])

  // --- 2. CARGAR DETALLE DEL EQUIPO SELECCIONADO ---
  useEffect(() => {
    async function loadTeamData() {
      if (!selectedTeamId) return
      setLoading(true)
      try {
        const res = await apiFetch(`/api/club/detalle/${selectedTeamId}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        } else {
          setData(null)
        }
      } catch (e) {
        console.error("Error cargando detalle del equipo:", e)
      } finally {
        setLoading(false)
      }
    }
    loadTeamData()
  }, [selectedTeamId])

  const copyToClipboard = async (code: string) => {
    if (!code) return
    await Clipboard.setStringAsync(code)
    Alert.alert("¡Copiado!", "El código de invitación se ha copiado al portapapeles.")
  }

  if (loading && !data) return <ActivityIndicator style={{ flex: 1 }} color={c.boton} />

  // Pantalla vacía si el presi no tiene equipos aún
  if (!data && activeRole === 'PRESIDENT' && teams.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: c.fondo, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={{ fontSize: 40, marginBottom: 10 }}>🏟️</Text>
        <Text style={{ color: c.texto, fontSize: 18, fontWeight: 'bold' }}>Tu club está vacío</Text>
        <Text style={{ color: c.subtexto, textAlign: 'center', marginTop: 10 }}>
          Ve a Gestión para crear tu primer equipo y empezar a añadir jugadores.
        </Text>
      </View>
    )
  }

  if (!data) return <Text style={{ textAlign: 'center', marginTop: 100, color: c.subtexto }}>No se pudo cargar la información</Text>

  return (
    <View style={{ flex: 1, backgroundColor: c.fondo }}>
      {/* 🟢 CARRUSEL DE EQUIPOS (SOLO PRESIDENTE) */}
      {activeRole === 'PRESIDENT' && teams.length > 0 && (
        <View style={[styles.presidentSelectorContainer, { borderBottomColor: c.bordeInput }]}>
          <Text style={[styles.presidentSelectorTitle, { color: c.subtexto }]}>Viendo equipo:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presidentSelectorScroll}>
            {teams.map((t) => {
              const isSelected = selectedTeamId === t.id
              return (
                <TouchableOpacity
                  key={t.id}
                  style={[
                    styles.teamChip,
                    { 
                      backgroundColor: isSelected ? c.boton : c.input,
                      borderColor: isSelected ? c.boton : c.bordeInput
                    }
                  ]}
                  onPress={() => setSelectedTeamId(t.id)}
                >
                  <Text style={{ color: isSelected ? '#fff' : c.texto, fontWeight: isSelected ? 'bold' : '500' }}>
                    {t.category} {t.suffix}
                  </Text>
                </TouchableOpacity>
              )
            })}
          </ScrollView>
        </View>
      )}

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header club */}
        <View style={styles.header}>
          {data.logoUrl ? (
            <Image source={{ uri: data.logoUrl }} style={styles.clubAvatar} />
          ) : (
            <View style={[styles.clubAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
              <Text style={[styles.clubAvatarText, { color: c.boton }]}>{data.nombre?.charAt(0) || 'C'}</Text>
            </View>
          )}
          
          <View style={styles.clubInfo}>
            <Text style={[styles.clubNombre, { color: c.texto }]}>{data.nombre}</Text>
            <Text style={[styles.clubMeta, { color: c.subtexto }]}>{data.equipo} · {data.temporada}</Text>
          </View>
        </View>

        {/* Código de invitación */}
        <View style={[styles.codigoCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
          <View>
            <Text style={[styles.codigoLabel, { color: c.subtexto }]}>CÓDIGO DE INVITACIÓN</Text>
            <Text style={[styles.codigoValue, { color: c.boton }]}>{data.codigoInvitacion || '---'}</Text>
          </View>
          <TouchableOpacity 
            onPress={() => copyToClipboard(data.codigoInvitacion)}
            style={[styles.copiarButton, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}
          >
            <Text style={[styles.copiarText, { color: c.boton }]}>📋 Copiar</Text>
          </TouchableOpacity>
        </View>

        {/* Chips */}
        <View style={styles.chipsRow}>
          <View style={[styles.chip, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
            <Text style={[styles.chipText, { color: c.subtexto }]}>🏷 {data.categoria}</Text>
          </View>
          <View style={[styles.chip, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
            <Text style={[styles.chipText, { color: c.subtexto }]}>
              {data.genero === 'MALE' ? '👦 Masculino' : data.genero === 'FEMALE' ? '👧 Femenino' : '👥 Mixto'}
            </Text>
          </View>
          <View style={[styles.chip, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
            <Text style={[styles.chipText, { color: c.subtexto }]}>👥 {data.plantilla?.length || 0} jugadores</Text>
          </View>
        </View>

        {/* Staff */}
        <Text style={[styles.sectionTitle, { color: c.texto }]}>🎽 Staff técnico</Text>
        {data.staff && data.staff.length > 0 ? (
          <View style={styles.staffList}>
            {data.staff.map((miembro: any) => (
              <View key={miembro.id} style={[styles.staffCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                 <View style={[styles.staffAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                  <Text style={[styles.staffAvatarText, { color: c.boton }]}>{miembro.firstName?.charAt(0)}</Text>
                </View>
                <View style={styles.staffInfo}>
                  <Text style={[styles.staffNombre, { color: c.texto }]}>{miembro.firstName} {miembro.lastName}</Text>
                  {miembro.phone && <Text style={[styles.staffPhone, { color: c.subtexto }]}>📞 {miembro.phone}</Text>}
                </View>
              </View>
            ))}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: c.subtexto }]}>Sin staff registrado</Text>
        )}

        {/* Plantilla */}
        <Text style={[styles.sectionTitle, { color: c.texto, marginTop: data.staff?.length ? 0 : 20 }]}>⚽ Plantilla</Text>
        {data.plantilla && data.plantilla.length > 0 ? (
          <View style={styles.jugadoresList}>
            {data.plantilla.map((jugador: any) => {
              const posColor = POSICION_COLOR[jugador.position] || c.boton;
              return (
                <View key={jugador.id} style={[styles.jugadorCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
                  <View style={[styles.jugadorAvatar, { backgroundColor: `${posColor}18`, borderColor: `${posColor}35` }]}>
                    <Text style={[styles.jugadorAvatarText, { color: posColor }]}>{jugador.firstName?.charAt(0)}</Text>
                  </View>
                  <View style={styles.jugadorInfo}>
                    <Text style={[styles.jugadorNombre, { color: c.texto }]}>{jugador.firstName} {jugador.lastName}</Text>
                    <View style={styles.jugadorMeta}>
                      {jugador.birthDate && <Text style={[styles.jugadorMetaText, { color: c.subtexto }]}>🎂 {jugador.birthDate}</Text>}
                      {jugador.kitSize && <Text style={[styles.jugadorMetaText, { color: c.subtexto }]}>👕 {jugador.kitSize}</Text>}
                    </View>
                    {jugador.docNumber && (
                      <Text style={[styles.jugadorMetaText, { color: c.subtexto, marginTop: 2 }]}>
                        🪪 {jugador.docType || 'DOC'}: {jugador.docNumber}
                      </Text>
                    )}
                  </View>
                  <View style={styles.jugadorDerecha}>
                    <View style={[styles.dorsalBadge, { backgroundColor: `${posColor}18`, borderColor: `${posColor}35` }]}>
                      <Text style={[styles.dorsalText, { color: posColor }]}>#{jugador.jerseyNumber || '?'}</Text>
                    </View>
                    <Text style={[styles.posicionText, { color: c.subtexto }]}>{POSICION_LABEL[jugador.position] || 'Jugador'}</Text>
                  </View>
                </View>
              )
            })}
          </View>
        ) : (
          <Text style={[styles.emptyText, { color: c.subtexto }]}>Sin jugadores registrados</Text>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  presidentSelectorContainer: { paddingTop: 60, paddingBottom: 15, paddingHorizontal: 24, borderBottomWidth: 1 },
  presidentSelectorTitle: { fontSize: 12, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 10, letterSpacing: 1 },
  presidentSelectorScroll: { gap: 10 },
  teamChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  
  container: { flexGrow: 1, padding: 24, paddingTop: 30, paddingBottom: 40 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 },
  clubAvatar: { width: 56, height: 56, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  clubAvatarText: { fontSize: 24, fontWeight: 'bold' },
  clubInfo: { flex: 1 },
  clubNombre: { fontSize: 22, fontWeight: 'bold', marginBottom: 2 },
  clubMeta: { fontSize: 13 },
  codigoCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 16, marginBottom: 16 },
  codigoLabel: { fontSize: 11, fontWeight: '500', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  codigoValue: { fontSize: 22, fontWeight: 'bold', letterSpacing: 4 },
  copiarButton: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  copiarText: { fontSize: 13, fontWeight: '600' },
  chipsRow: { flexDirection: 'row', gap: 8, marginBottom: 28, flexWrap: 'wrap' },
  chip: { borderWidth: 1, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5 },
  chipText: { fontSize: 12, fontWeight: '500' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  emptyText: { fontStyle: 'italic', marginBottom: 20 },
  staffList: { gap: 10, marginBottom: 28 },
  staffCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, borderWidth: 1, padding: 12, gap: 12 },
  staffAvatar: { width: 40, height: 40, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  staffAvatarText: { fontSize: 16, fontWeight: 'bold' },
  staffInfo: { flex: 1, gap: 3 },
  staffNombre: { fontSize: 14, fontWeight: '600' },
  staffPhone: { fontSize: 13 },
  jugadoresList: { gap: 10 },
  jugadorCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 14, borderWidth: 1, padding: 14, gap: 12 },
  jugadorAvatar: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  jugadorAvatarText: { fontSize: 18, fontWeight: 'bold' },
  jugadorInfo: { flex: 1, gap: 2 },
  jugadorNombre: { fontSize: 14, fontWeight: '600', marginBottom: 2 },
  jugadorMeta: { flexDirection: 'row', gap: 10 },
  jugadorMetaText: { fontSize: 11 },
  jugadorDerecha: { alignItems: 'center', gap: 4 },
  dorsalBadge: { width: 36, height: 36, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  dorsalText: { fontSize: 13, fontWeight: 'bold' },
  posicionText: { fontSize: 10, fontWeight: '500', textAlign: 'center' },
})