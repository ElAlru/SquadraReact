import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { 
  Linking, 
  Modal, 
  Pressable, 
  ScrollView, 
  StyleSheet, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  View, 
  ActivityIndicator,
  Alert
} from 'react-native'
import { useTheme } from '../../lib/useTheme'
import { useAuthStore } from '../../lib/store'
import { apiFetch } from '../../lib/api'

export default function Campos() {
  const c = useTheme()
  const { t } = useTranslation()
  
  // --- DATA DEL STORE ---
  const user = useAuthStore((state: any) => state.user)
  const activeTeamId = useAuthStore((state: any) => state.activeTeamId)
  
  // RBAC: Solo Presidente y Staff pueden gestionar
  const puedeGestionar = user?.role === 'PRESIDENT' || user?.role === 'STAFF'

  // --- ESTADOS ---
  const [campos, setCampos] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [modalAnadir, setModalAnadir] = useState(false)
  
  // Formulario Modal
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')

  // --- CARGA DE DATOS ---
  const fetchCampos = async () => {
    if (!activeTeamId) return
    try {
      // Usamos el endpoint que busca el club a través del equipo activo
      const res = await apiFetch(`/api/fields/club-by-team/${activeTeamId}`)
      if (res.ok) {
        const data = await res.json()
        setCampos(data)
      }
    } catch (e) {
      console.error("Error al cargar campos:", e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampos()
  }, [activeTeamId])

  // --- ACCIONES ---
  const abrirMaps = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert("Error", "No se pudo abrir el enlace de Maps")
      })
    }
  }

  const toggleActivo = async (id: number) => {
    // Optimistic UI
    setCampos(prev => prev.map(c => c.id === id ? { ...c, isActive: !c.isActive } : c))
    
    try {
      const res = await apiFetch(`/api/fields/${id}/toggle`, { method: 'PATCH' })
      if (!res.ok) throw new Error()
    } catch (e) {
      Alert.alert("Error", "No se pudo actualizar el estado del campo")
      fetchCampos() // Revertimos si falla
    }
  }

  const guardarCampo = async () => {
    if (!nombre || !direccion) {
      Alert.alert("Atención", "Nombre y dirección son obligatorios")
      return
    }

    try {
      // Enviamos el activeTeamId para que el backend sepa a qué Club asociarlo
      const res = await apiFetch(`/api/fields/team/${activeTeamId}`, {
        method: 'POST',
        body: JSON.stringify({ 
          name: nombre, 
          address: direccion, 
          mapUrl: mapsUrl 
        })
      })

      if (res.ok) {
        const nuevo = await res.json()
        setCampos(prev => [...prev, nuevo])
        cerrarModal()
      }
    } catch (e) {
      Alert.alert("Error", "No se pudo guardar el campo")
    }
  }

  const cerrarModal = () => {
    setModalAnadir(false)
    setNombre('')
    setDireccion('')
    setMapsUrl('')
  }

  const camposActivos = campos.filter(c => c.isActive)
  const camposInactivos = campos.filter(c => !c.isActive)

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: c.fondo }]}>
        <ActivityIndicator size="large" color={c.boton} />
      </View>
    )
  }

  return (
    <View style={[styles.wrapper, { backgroundColor: c.fondo }]}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* HEADER */}
        <View style={styles.header}>
          <Text style={[styles.titulo, { color: c.texto }]}>📍 {t('fields.title')}</Text>
          {puedeGestionar && (
            <TouchableOpacity 
              style={[styles.addButton, { backgroundColor: c.boton }]} 
              onPress={() => setModalAnadir(true)}
            >
              <Text style={[styles.addButtonText, { color: '#fff' }]}>+ {t('fields.addField')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* SIN CAMPOS */}
        {campos.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
            <Text style={[styles.emptyText, { color: c.subtexto }]}>🏟 {t('fields.noFields')}</Text>
          </View>
        )}

        {/* LISTA ACTIVOS */}
        {camposActivos.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.subtexto }]}>{t('fields.active')}</Text>
            <View style={styles.list}>
              {camposActivos.map((campo) => (
                <View 
                  key={campo.id} 
                  style={[styles.campoCard, { backgroundColor: c.input, borderColor: c.bordeInput, borderLeftColor: c.boton }]}
                >
                  <View style={styles.campoInfo}>
                    <View style={styles.campoIconRow}>
                      <View style={[styles.campoIcon, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                        <Text style={styles.campoIconText}>🏟</Text>
                      </View>
                      <View style={styles.campoTexts}>
                        <Text style={[styles.campoNombre, { color: c.texto }]}>{campo.name}</Text>
                        <Text style={[styles.campoDireccion, { color: c.subtexto }]}>{campo.address}</Text>
                      </View>
                    </View>

                    <View style={styles.campoActions}>
                      {campo.mapUrl && (
                        <TouchableOpacity 
                          style={[styles.actionButton, { backgroundColor: '#3b82f615', borderColor: '#3b82f630' }]} 
                          onPress={() => abrirMaps(campo.mapUrl)}
                        >
                          <Text style={[styles.actionButtonText, { color: '#3b82f6' }]}>🗺 {t('fields.viewMaps')}</Text>
                        </TouchableOpacity>
                      )}
                      {puedeGestionar && (
                        <TouchableOpacity 
                          style={[styles.actionButton, { backgroundColor: '#ef444410', borderColor: '#ef444430' }]} 
                          onPress={() => toggleActivo(campo.id)}
                        >
                          <Text style={[styles.actionButtonText, { color: '#ef4444' }]}>{t('fields.deactivate')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* LISTA INACTIVOS */}
        {puedeGestionar && camposInactivos.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.subtexto }]}>Inactivos</Text>
            <View style={styles.list}>
              {camposInactivos.map((campo) => (
                <View 
                  key={campo.id} 
                  style={[styles.campoCard, { backgroundColor: c.input, borderColor: c.bordeInput, opacity: 0.7 }]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={[styles.campoNombre, { color: c.subtexto, fontSize: 14 }]}>{campo.name}</Text>
                    <TouchableOpacity 
                      onPress={() => toggleActivo(campo.id)}
                      style={[styles.miniButton, { backgroundColor: `${c.boton}15` }]}
                    >
                      <Text style={{ color: c.boton, fontSize: 12, fontWeight: 'bold' }}>{t('fields.activate')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* MODAL AÑADIR */}
      <Modal visible={modalAnadir} transparent animationType="slide" onRequestClose={cerrarModal}>
        <Pressable style={styles.overlay} onPress={cerrarModal}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>
            
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>📍 {t('fields.addField')}</Text>
              <TouchableOpacity onPress={cerrarModal} style={styles.closeBtn}>
                <Text style={{ color: c.subtexto, fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.form}>
              <Text style={[styles.label, { color: c.subtexto }]}>{t('fields.name')} *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
                value={nombre}
                onChangeText={setNombre}
                placeholder={t('fields.namePlaceholder')}
                placeholderTextColor={c.subtexto}
              />

              <Text style={[styles.label, { color: c.subtexto }]}>{t('fields.address')} *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
                value={direccion}
                onChangeText={setDireccion}
                placeholder={t('fields.addressPlaceholder')}
                placeholderTextColor={c.subtexto}
              />

              <Text style={[styles.label, { color: c.subtexto }]}>{t('fields.mapsUrl')}</Text>
              <TextInput
                style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
                value={mapsUrl}
                onChangeText={setMapsUrl}
                placeholder="https://goo.gl/maps/..."
                placeholderTextColor={c.subtexto}
                autoCapitalize="none"
              />

              <TouchableOpacity 
                style={[styles.btnGuardar, { backgroundColor: c.boton }]} 
                onPress={guardarCampo}
              >
                <Text style={styles.btnGuardarText}>{t('fields.save')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  container: { padding: 20, paddingTop: 60, paddingBottom: 40 },
  
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 },
  titulo: { fontSize: 24, fontWeight: 'bold' },
  addButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 12 },
  addButtonText: { fontWeight: 'bold', fontSize: 13 },

  emptyCard: { padding: 40, borderRadius: 20, borderWidth: 1, alignItems: 'center', borderStyle: 'dashed' },
  emptyText: { fontSize: 15, fontWeight: '500' },

  section: { marginBottom: 30 },
  sectionLabel: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 12 },
  list: { gap: 12 },

  campoCard: { padding: 16, borderRadius: 18, borderWidth: 1, borderLeftWidth: 4 },
  campoInfo: { gap: 14 },
  campoIconRow: { flexDirection: 'row', alignItems: 'center', gap: 15 },
  campoIcon: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, justifyContent: 'center', alignItems: 'center' },
  campoIconText: { fontSize: 22 },
  campoTexts: { flex: 1 },
  campoNombre: { fontSize: 16, fontWeight: 'bold', marginBottom: 2 },
  campoDireccion: { fontSize: 13, lineHeight: 18 },
  
  campoActions: { flexDirection: 'row', gap: 10 },
  actionButton: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  actionButtonText: { fontSize: 12, fontWeight: '700' },
  
  miniButton: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },

  // MODAL
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 25, borderWidth: 1, borderBottomWidth: 0 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitulo: { fontSize: 20, fontWeight: 'bold' },
  closeBtn: { padding: 5 },
  form: { gap: 15 },
  label: { fontSize: 13, fontWeight: 'bold' },
  input: { padding: 14, borderRadius: 12, borderWidth: 1, fontSize: 15 },
  btnGuardar: { padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  btnGuardarText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
})