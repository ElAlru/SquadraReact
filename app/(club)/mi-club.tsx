import React, { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator, Alert } from 'react-native'
import * as Clipboard from 'expo-clipboard' // Necesitas instalar expo-clipboard
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
  const activeTeamId = useAuthStore((state: any) => state.activeTeamId)

  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)

  useEffect(() => {
    async function loadData() {
      if (!activeTeamId) return
      try {
        const res = await apiFetch(`/api/club/detalle/${activeTeamId}`)
        if (res.ok) {
          const json = await res.json()
          setData(json)
        }
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [activeTeamId])

  const copyToClipboard = async (code: string) => {
    await Clipboard.setStringAsync(code)
    Alert.alert(t('common.success'), t('myClub.codeCopied'))
  }

  if (loading) return <ActivityIndicator style={{ flex: 1 }} color={c.boton} />
  if (!data) return <Text style={{ textAlign: 'center', marginTop: 100 }}>No se pudo cargar la info</Text>

  return (
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header club */}
      <View style={styles.header}>
        <View style={[styles.clubAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
          <Text style={[styles.clubAvatarText, { color: c.boton }]}>{data.nombre.charAt(0)}</Text>
        </View>
        <View style={styles.clubInfo}>
          <Text style={[styles.clubNombre, { color: c.texto }]}>{data.nombre}</Text>
          <Text style={[styles.clubMeta, { color: c.subtexto }]}>{data.equipo} · {data.temporada}</Text>
        </View>
      </View>

      {/* Código de invitación */}
      <View style={[styles.codigoCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
        <View>
          <Text style={[styles.codigoLabel, { color: c.subtexto }]}>{t('myClub.invitationCode')}</Text>
          <Text style={[styles.codigoValue, { color: c.boton }]}>{data.codigoInvitacion}</Text>
        </View>
        <TouchableOpacity 
          onPress={() => copyToClipboard(data.codigoInvitacion)}
          style={[styles.copiarButton, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}
        >
          <Text style={[styles.copiarText, { color: c.boton }]}>📋 {t('myClub.copy')}</Text>
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
          <Text style={[styles.chipText, { color: c.subtexto }]}>👥 {data.plantilla.length} jugadores</Text>
        </View>
      </View>

      {/* Staff */}
      <Text style={[styles.sectionTitle, { color: c.texto }]}>🎽 {t('myClub.staff')}</Text>
      <View style={styles.staffList}>
        {data.staff.map((miembro: any) => (
          <View key={miembro.id} style={[styles.staffCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
             <View style={[styles.staffAvatar, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
              <Text style={[styles.staffAvatarText, { color: c.boton }]}>{miembro.firstName.charAt(0)}</Text>
            </View>
            <View style={styles.staffInfo}>
              <Text style={[styles.staffNombre, { color: c.texto }]}>{miembro.firstName} {miembro.lastName}</Text>
              <Text style={[styles.staffPhone, { color: c.subtexto }]}>📞 {miembro.phone}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Plantilla */}
      <Text style={[styles.sectionTitle, { color: c.texto }]}>⚽ {t('myClub.squad')}</Text>
      <View style={styles.jugadoresList}>
        {data.plantilla.map((jugador: any) => (
          <View key={jugador.id} style={[styles.jugadorCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
            <View style={[styles.jugadorAvatar, { backgroundColor: `${POSICION_COLOR[jugador.position]}18`, borderColor: `${POSICION_COLOR[jugador.position]}35` }]}>
              <Text style={[styles.jugadorAvatarText, { color: POSICION_COLOR[jugador.position] }]}>{jugador.firstName.charAt(0)}</Text>
            </View>
            <View style={styles.jugadorInfo}>
              <Text style={[styles.jugadorNombre, { color: c.texto }]}>{jugador.firstName} {jugador.lastName}</Text>
              <View style={styles.jugadorMeta}>
                <Text style={[styles.jugadorMetaText, { color: c.subtexto }]}>🎂 {jugador.birthDate}</Text>
                <Text style={[styles.jugadorMetaText, { color: c.subtexto }]}>👕 {jugador.kitSize}</Text>
              </View>
              <Text style={[styles.jugadorMetaText, { color: c.subtexto }]}>🪪 {jugador.docType}: {jugador.docNumber}</Text>
            </View>
            <View style={styles.jugadorDerecha}>
              <View style={[styles.dorsalBadge, { backgroundColor: `${POSICION_COLOR[jugador.position]}18`, borderColor: `${POSICION_COLOR[jugador.position]}35` }]}>
                <Text style={[styles.dorsalText, { color: POSICION_COLOR[jugador.position] }]}>#{jugador.jerseyNumber}</Text>
              </View>
              <Text style={[styles.posicionText, { color: c.subtexto }]}>{POSICION_LABEL[jugador.position]}</Text>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 16,
  },
  clubAvatar: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubAvatarText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  clubInfo: {
    flex: 1,
  },
  clubNombre: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  clubMeta: {
    fontSize: 13,
  },

  // Código invitación
  codigoCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  codigoLabel: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  codigoValue: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 4,
  },
  copiarButton: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  copiarText: {
    fontSize: 13,
    fontWeight: '600',
  },

  // Chips
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 28,
    flexWrap: 'wrap',
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

  // Sección
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Staff
  staffList: {
    gap: 10,
    marginBottom: 28,
  },
  staffCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    gap: 12,
  },
  staffAvatar: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffAvatarText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  staffInfo: {
    flex: 1,
    gap: 3,
  },
  staffNombre: {
    fontSize: 14,
    fontWeight: '600',
  },
  staffPhone: {
    fontSize: 13,
  },

  // Jugadores
  jugadoresList: {
    gap: 10,
  },
  jugadorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  jugadorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  jugadorAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  jugadorInfo: {
    flex: 1,
    gap: 3,
  },
  jugadorNombre: {
    fontSize: 14,
    fontWeight: '600',
  },
  jugadorMeta: {
    flexDirection: 'row',
    gap: 10,
  },
  jugadorMetaText: {
    fontSize: 11,
  },
  jugadorDerecha: {
    alignItems: 'center',
    gap: 4,
  },
  dorsalBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dorsalText: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  posicionText: {
    fontSize: 10,
    fontWeight: '500',
    textAlign: 'center',
  },
})