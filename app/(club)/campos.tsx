import { useState } from 'react'
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
} from 'react-native'
import { useTheme } from '../../lib/useTheme'

// MOCK — reemplazar con datos reales de la API
type Rol = 'PRESIDENT' | 'COACH' | 'PLAYER' | 'RELATIVE' | 'OTHER'
const getRolUsuario = (): Rol => 'PRESIDENT'
const ROL_USUARIO = getRolUsuario()
const puedeGestionar = ROL_USUARIO === 'PRESIDENT' || ROL_USUARIO === 'COACH'

const CAMPOS_MOCK = [
  {
    id: 1,
    name: 'Campo Municipal',
    address: 'Calle Mayor 1, Getafe, Madrid',
    mapUrl: 'https://maps.google.com/?q=Campo+Municipal+Getafe',
    isActive: true,
  },
  {
    id: 2,
    name: 'Campo Anexo',
    address: 'Calle Secundaria 5, Getafe, Madrid',
    mapUrl: 'https://maps.google.com/?q=Campo+Anexo+Getafe',
    isActive: true,
  },
  {
    id: 3,
    name: 'Campo Viejo',
    address: 'Avenida del Deporte 10, Getafe, Madrid',
    mapUrl: 'https://maps.google.com/?q=Campo+Viejo+Getafe',
    isActive: false,
  },
]

export default function Campos() {
  const c = useTheme()
  const { t } = useTranslation()

  const [campos, setCampos] = useState(CAMPOS_MOCK)
  const [modalAnadir, setModalAnadir] = useState(false)
  const [nombre, setNombre] = useState('')
  const [direccion, setDireccion] = useState('')
  const [mapsUrl, setMapsUrl] = useState('')

  const abrirMaps = (url: string) => {
    if (url) Linking.openURL(url)
  }

  const toggleActivo = (id: number) => {
    setCampos((prev) =>
      prev.map((c) => c.id === id ? { ...c, isActive: !c.isActive } : c)
    )
  }

  const guardarCampo = () => {
    if (!nombre || !direccion) return
    setCampos((prev) => [
      ...prev,
      {
        id: Date.now(),
        name: nombre,
        address: direccion,
        mapUrl: mapsUrl,
        isActive: true,
      },
    ])
    setNombre('')
    setDireccion('')
    setMapsUrl('')
    setModalAnadir(false)
  }

  const camposActivos = campos.filter((c) => c.isActive)
  const camposInactivos = campos.filter((c) => !c.isActive)

  return (
    <View style={[styles.wrapper, { backgroundColor: c.fondo }]}>
      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.titulo, { color: c.texto }]}>📍 {t('fields.title')}</Text>
          {puedeGestionar && (
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: c.boton }]}
              onPress={() => setModalAnadir(true)}
            >
              <Text style={[styles.addButtonText, { color: c.botonTexto }]}>{t('fields.addField')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Sin campos */}
        {campos.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
            <Text style={[styles.emptyText, { color: c.subtexto }]}>📍 {t('fields.noFields')}</Text>
          </View>
        )}

        {/* Campos activos */}
        {camposActivos.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.subtexto }]}>{t('fields.active')}</Text>
            <View style={styles.list}>
              {camposActivos.map((campo) => (
                <View
                  key={campo.id}
                  style={[styles.campoCard, { backgroundColor: c.input, borderColor: c.bordeInput, borderLeftColor: c.boton }]}
                >
                  {/* Info */}
                  <View style={styles.campoInfo}>
                    <View style={styles.campoIconRow}>
                      <View style={[styles.campoIcon, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                        <Text style={styles.campoIconText}>🏟</Text>
                      </View>
                      <View style={styles.campoTexts}>
                        <Text style={[styles.campoNombre, { color: c.texto }]}>{campo.name}</Text>
                        <Text style={[styles.campoDireccion, { color: c.subtexto }]}>📍 {campo.address}</Text>
                      </View>
                    </View>

                    {/* Acciones */}
                    <View style={styles.campoActions}>
                      {campo.mapUrl ? (
                        <TouchableOpacity
                          style={[styles.mapsButton, { backgroundColor: '#3b82f618', borderColor: '#3b82f635' }]}
                          onPress={() => abrirMaps(campo.mapUrl)}
                        >
                          <Text style={[styles.mapsButtonText, { color: '#3b82f6' }]}>🗺 {t('fields.viewMaps')}</Text>
                        </TouchableOpacity>
                      ) : null}

                      {puedeGestionar && (
                        <TouchableOpacity
                          style={[styles.toggleButton, { backgroundColor: '#ef444410', borderColor: '#ef444435' }]}
                          onPress={() => toggleActivo(campo.id)}
                        >
                          <Text style={[styles.toggleButtonText, { color: '#ef4444' }]}>{t('fields.deactivate')}</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Campos inactivos */}
        {camposInactivos.length > 0 && puedeGestionar && (
          <View style={styles.section}>
            <Text style={[styles.sectionLabel, { color: c.subtexto }]}>Inactivos</Text>
            <View style={styles.list}>
              {camposInactivos.map((campo) => (
                <View
                  key={campo.id}
                  style={[styles.campoCard, { backgroundColor: c.input, borderColor: c.bordeInput, borderLeftColor: c.bordeInput, opacity: 0.6 }]}
                >
                  <View style={styles.campoInfo}>
                    <View style={styles.campoIconRow}>
                      <View style={[styles.campoIcon, { backgroundColor: c.bordeInput, borderColor: c.bordeInput }]}>
                        <Text style={styles.campoIconText}>🏟</Text>
                      </View>
                      <View style={styles.campoTexts}>
                        <Text style={[styles.campoNombre, { color: c.subtexto }]}>{campo.name}</Text>
                        <Text style={[styles.campoDireccion, { color: c.subtexto }]}>📍 {campo.address}</Text>
                      </View>
                    </View>
                    <View style={styles.campoActions}>
                      <TouchableOpacity
                        style={[styles.toggleButton, { backgroundColor: `${c.boton}10`, borderColor: `${c.boton}35` }]}
                        onPress={() => toggleActivo(campo.id)}
                      >
                        <Text style={[styles.toggleButtonText, { color: c.boton }]}>{t('fields.activate')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

      </ScrollView>

      {/* ── MODAL AÑADIR CAMPO ── */}
      <Modal visible={modalAnadir} transparent animationType="slide" onRequestClose={() => setModalAnadir(false)}>
        <Pressable style={styles.overlay} onPress={() => setModalAnadir(false)}>
          <Pressable style={[styles.modalCard, { backgroundColor: c.fondo, borderColor: c.bordeInput }]} onPress={() => {}}>

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitulo, { color: c.texto }]}>📍 {t('fields.addField')}</Text>
              <TouchableOpacity
                style={[styles.closeButton, { backgroundColor: c.input, borderColor: c.bordeInput }]}
                onPress={() => setModalAnadir(false)}
              >
                <Text style={[styles.closeText, { color: c.subtexto }]}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('fields.name')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
              placeholder={t('fields.namePlaceholder')}
              placeholderTextColor={c.subtexto}
              value={nombre}
              onChangeText={setNombre}
            />

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('fields.address')} *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
              placeholder={t('fields.addressPlaceholder')}
              placeholderTextColor={c.subtexto}
              value={direccion}
              onChangeText={setDireccion}
            />

            <Text style={[styles.inputLabel, { color: c.subtexto }]}>{t('fields.mapsUrl')}</Text>
            <TextInput
              style={[styles.input, { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto }]}
              placeholder={t('fields.mapsUrlPlaceholder')}
              placeholderTextColor={c.subtexto}
              value={mapsUrl}
              onChangeText={setMapsUrl}
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={[styles.mapsHint, { backgroundColor: '#3b82f618', borderColor: '#3b82f635' }]}>
              <Text style={[styles.mapsHintText, { color: '#3b82f6' }]}>
                💡 Para obtener el link: abre Google Maps → busca el campo → pulsa Compartir → copia el enlace
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: c.boton, opacity: nombre && direccion ? 1 : 0.5 }]}
              onPress={guardarCampo}
            >
              <Text style={[styles.saveButtonText, { color: c.botonTexto }]}>{t('fields.save')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: c.bordeInput }]}
              onPress={() => setModalAnadir(false)}
            >
              <Text style={[styles.cancelButtonText, { color: c.subtexto }]}>{t('fields.cancel')}</Text>
            </TouchableOpacity>

          </Pressable>
        </Pressable>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  container: { padding: 24, paddingTop: 20, paddingBottom: 40 },

  // Header
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  titulo: { fontSize: 22, fontWeight: 'bold' },
  addButton: { borderRadius: 10, paddingHorizontal: 14, paddingVertical: 8 },
  addButtonText: { fontSize: 13, fontWeight: '600' },

  // Empty
  emptyCard: { borderRadius: 14, borderWidth: 1, padding: 24, alignItems: 'center' },
  emptyText: { fontSize: 14 },

  // Sección
  section: { marginBottom: 24 },
  sectionLabel: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  list: { gap: 10 },

  // Campo card
  campoCard: { borderRadius: 14, borderWidth: 1, borderLeftWidth: 3, padding: 14 },
  campoInfo: { gap: 12 },
  campoIconRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  campoIcon: { width: 44, height: 44, borderRadius: 12, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  campoIconText: { fontSize: 20 },
  campoTexts: { flex: 1, gap: 3 },
  campoNombre: { fontSize: 15, fontWeight: '700' },
  campoDireccion: { fontSize: 13 },
  campoActions: { flexDirection: 'row', gap: 8 },
  mapsButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  mapsButtonText: { fontSize: 12, fontWeight: '600' },
  toggleButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 7 },
  toggleButtonText: { fontSize: 12, fontWeight: '600' },

  // Modal
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end', padding: 16, paddingBottom: 32 },
  modalCard: { borderRadius: 20, borderWidth: 1, padding: 20 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitulo: { fontSize: 17, fontWeight: 'bold', flex: 1 },
  closeButton: { width: 32, height: 32, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  closeText: { fontSize: 13, fontWeight: '600' },
  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 14, fontSize: 14 },
  mapsHint: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 16 },
  mapsHintText: { fontSize: 12, lineHeight: 18 },
  saveButton: { padding: 14, borderRadius: 10, alignItems: 'center', marginBottom: 10 },
  saveButtonText: { fontWeight: 'bold', fontSize: 15 },
  cancelButton: { padding: 12, borderRadius: 10, alignItems: 'center', borderWidth: 1 },
  cancelButtonText: { fontSize: 14, fontWeight: '500' },
})