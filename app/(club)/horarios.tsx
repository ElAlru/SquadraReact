import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../lib/useTheme';
import { useAuthStore } from '../../lib/store';
import { apiFetch } from '../../lib/api';

type Filtro = 'TODOS' | 'PARTIDO' | 'ENTRENAMIENTO';

export default function Horarios() {
  const c = useTheme();
  const { t } = useTranslation();

  const clubId = useAuthStore((state: any) => state.activeClubId);
  const activeTeamId = useAuthStore((state: any) => state.activeTeamId);
  const activeRole = useAuthStore((state: any) => state.activeRole);

  const [loading, setLoading] = useState(true);
  const [eventos, setEventos] = useState<any[]>([]);
  const [filtro, setFiltro] = useState<Filtro>('TODOS');

  // --- 1. CARGAR DATOS ---
  const fetchEventos = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const now = new Date();
      // OJO: Ajusta la URL si tu endpoint cambia. Según tu log, usas este:
      let url = `/api/eventos/calendario?clubId=${clubId}&year=${now.getFullYear()}&month=${now.getMonth() + 1}`;
      
      // Si quieres filtrar por equipo (opcional, por si el backend lo soporta):
      if (activeRole !== 'PRESIDENT' && activeTeamId) {
          url += `&teamId=${activeTeamId}`;
      }

      const res = await apiFetch(url);
      
      if (res.ok) {
        // Aseguramos que si es un 204 (No Content) o viene vacío, seteamos un array vacío
        const data = res.status === 204 ? [] : await res.json();
        setEventos(Array.isArray(data) ? data : []);
      } else {
        setEventos([]);
      }
    } catch (error) {
      console.error("Error cargando horarios:", error);
      setEventos([]);
    } finally {
      setLoading(false); // 👈 ¡ESTO EVITA EL BUCLE INFINITO!
    }
  }, [clubId, activeTeamId, activeRole]);

  useEffect(() => {
    fetchEventos();
  }, [fetchEventos]);

  // --- 2. FILTRAR Y AGRUPAR ---
  const eventosAgrupados = useMemo(() => {
    // 1. Filtrar
    const filtrados = eventos.filter((e) => {
      if (filtro === 'TODOS') return true;
      return e.tipo === filtro;
    });

    // 2. Agrupar por mes (Ej: "Abril 2026")
    const grupos: Record<string, any[]> = {};
    
    filtrados.forEach((e) => {
      // Asumimos que la fecha viene en YYYY-MM-DD
      const fechaObj = new Date(e.fecha || e.date);
      const mesNombre = fechaObj.toLocaleString('es-ES', { month: 'long', year: 'numeric' });
      // Capitalizar la primera letra ("abril 2026" -> "Abril 2026")
      const mesCapitalizado = mesNombre.charAt(0).toUpperCase() + mesNombre.slice(1);

      if (!grupos[mesCapitalizado]) {
        grupos[mesCapitalizado] = [];
      }
      grupos[mesCapitalizado].push(e);
    });

    return grupos;
  }, [eventos, filtro]);

  // --- 3. RENDERIZADO ---
  return (
    <View style={[styles.wrapper, { backgroundColor: c.fondo }]}>
      
      {/* FILTROS SUPERIORES */}
      <View style={[styles.filtrosContainer, { borderBottomColor: c.bordeInput }]}>
        {(['TODOS', 'PARTIDO', 'ENTRENAMIENTO'] as Filtro[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filtroBtn,
              filtro === f && { borderBottomColor: c.boton, borderBottomWidth: 2 }
            ]}
            onPress={() => setFiltro(f)}
          >
            <Text style={[
              styles.filtroText, 
              { color: filtro === f ? c.boton : c.subtexto, fontWeight: filtro === f ? 'bold' : '600' }
            ]}>
              {f === 'TODOS' ? 'Todos' : f === 'PARTIDO' ? 'Partidos' : 'Entrenamientos'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView 
        contentContainerStyle={styles.container} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={fetchEventos} tintColor={c.boton} />}
      >
        {loading && eventos.length === 0 ? (
          <ActivityIndicator size="large" color={c.boton} style={{ marginTop: 40 }} />
        ) : Object.keys(eventosAgrupados).length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: c.input, borderColor: c.bordeInput }]}>
            <Text style={{ color: c.subtexto, textAlign: 'center', fontSize: 15 }}>
              No hay {filtro === 'TODOS' ? 'eventos' : filtro.toLowerCase() + 's'} programados.
            </Text>
          </View>
        ) : (
          Object.keys(eventosAgrupados).map((mes) => (
            <View key={mes} style={styles.mesGroup}>
              {/* Título del Mes */}
              <Text style={[styles.mesTitle, { color: c.texto }]}>{mes}</Text>

              {/* Lista de eventos del mes */}
              <View style={styles.eventosList}>
                {eventosAgrupados[mes].map((evento, index) => {
                  const esPartido = evento.tipo === 'PARTIDO';
                  const bordeColor = esPartido ? '#16a34a' : '#3b82f6'; // Verde para partidos, Azul para entrenamientos

                  return (
                    <View 
                      key={evento.id || index} 
                      style={[styles.eventoCard, { backgroundColor: c.input, borderLeftColor: bordeColor }]}
                    >
                      {/* Cabecera del Evento */}
                      <View style={styles.eventoHeader}>
                        <Text style={[styles.eventoTitulo, { color: c.texto }]}>
                          {esPartido ? '⚽' : '🏃'} {evento.titulo}
                        </Text>
                        
                        {/* Marcador (si ya se jugó) */}
                        {esPartido && evento.resultado && (
                          <View style={[styles.resultadoBadge, { backgroundColor: c.fondo }]}>
                            <Text style={[styles.resultadoText, { color: c.texto }]}>{evento.resultado}</Text>
                          </View>
                        )}
                      </View>

                      {/* Detalles: Fecha, Hora y Campo */}
                      <View style={styles.eventoInfoRow}>
                        <Text style={[styles.eventoText, { color: c.subtexto }]}>📅 {evento.fecha || evento.date}</Text>
                        <Text style={[styles.eventoText, { color: c.subtexto }]}>🕒 {evento.horaInicio || evento.time}</Text>
                      </View>
                      <Text style={[styles.eventoText, { color: c.subtexto, marginTop: 4 }]}>📍 {evento.campo || evento.location || 'Campo por confirmar'}</Text>

                      {/* Badges Inferiores (Solo para Partidos) */}
                      {esPartido && (
                        <View style={styles.badgesRow}>
                          <View style={[styles.badge, { backgroundColor: '#f59e0b18', borderColor: '#f59e0b35' }]}>
                            <Text style={[styles.badgeText, { color: '#f59e0b' }]}>{evento.tipoPartido || 'Liga'}</Text>
                          </View>
                          <View style={[styles.badge, { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}35` }]}>
                            <Text style={[styles.badgeText, { color: c.boton }]}>{evento.isLocal ? '🏠 Local' : '🚌 Visitante'}</Text>
                          </View>
                        </View>
                      )}
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  filtrosContainer: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 60, paddingBottom: 0, borderBottomWidth: 1 },
  filtroBtn: { paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  filtroText: { fontSize: 14 },
  container: { padding: 20, paddingBottom: 40 },
  emptyCard: { padding: 30, borderRadius: 14, borderWidth: 1, marginTop: 40, borderStyle: 'dashed' },
  mesGroup: { marginBottom: 24 },
  mesTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, textTransform: 'capitalize' },
  eventosList: { gap: 12 },
  eventoCard: { padding: 16, borderRadius: 12, borderLeftWidth: 5, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, elevation: 2 },
  eventoHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  eventoTitulo: { fontSize: 16, fontWeight: 'bold', flex: 1 },
  resultadoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  resultadoText: { fontSize: 14, fontWeight: 'bold', letterSpacing: 1 },
  eventoInfoRow: { flexDirection: 'row', gap: 16 },
  eventoText: { fontSize: 13 },
  badgesRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  badge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  badgeText: { fontSize: 11, fontWeight: 'bold', textTransform: 'uppercase' },
});