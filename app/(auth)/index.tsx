import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import LogoSimbolo from "../../components/LogoSimbolo";
import { useTheme } from "../../lib/useTheme";

const { width } = Dimensions.get("window");

/* ─── Mini componente para cada feature ─── */
function FeaturePill({
  icon,
  label,
  color,
}: {
  icon: string;
  label: string;
  color: string;
}) {
  return (
    <View style={[styles.pill, { borderColor: color + "30" }]}>
      <Text style={styles.pillIcon}>{icon}</Text>
      <Text style={[styles.pillLabel, { color }]}>{label}</Text>
    </View>
  );
}

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const c = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: c.fondo }]}>
      {/* ── Marca de agua gigante con rotación sutil ── */}
      <View style={styles.watermarkWrap}>
        <LogoSimbolo
          size={700}
          color={c.colorMarca}
          style={[styles.watermark, { opacity: c.marcaAguaOpacity ?? 0.06 }]}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ═══════════════════  HERO  ═══════════════════ */}
        <View style={styles.heroSection}>
          <View style={[styles.logoRing, { borderColor: c.colorMarca + "25" }]}>
            <LogoSimbolo size={72} color={c.colorMarca} style={styles.logo} />
          </View>

          <Text style={[styles.tituloTexto, { color: c.colorMarca }]}>
            SQUADRA
          </Text>
          <Text style={[styles.subtituloTexto, { color: c.colorMarca }]}>
            DONDE NACE EL FÚTBOL
          </Text>
        </View>

        {/* ═══════════════════  COPY  ═══════════════════ */}
        <View style={styles.infoSection}>
          <Text style={[styles.welcomeTitle, { color: c.texto }]}>
            {t(
              "welcome.title",
              "La gestión de tu club,\nen la palma de tu mano",
            )}
          </Text>
          <Text style={[styles.welcomeDescription, { color: c.subtexto }]}>
            {t(
              "welcome.description",
              "Organiza entrenamientos, gestiona equipos, comunícate con jugadores y lleva tu club de fútbol base al siguiente nivel con una plataforma diseñada para ti.",
            )}
          </Text>
        </View>

        {/* ═══════════════════  FEATURES  ═══════════════════ */}
        <View style={styles.featuresSection}>
          <View style={styles.featuresGrid}>
            <FeaturePill
              icon="👥"
              label={t("feat.teams", "Equipos")}
              color={c.texto}
            />
            <FeaturePill
              icon="📋"
              label={t("feat.lineups", "Alineaciones")}
              color={c.texto}
            />
            <FeaturePill
              icon="💶"
              label={t("feat.fees", "Cuotas")}
              color={c.texto}
            />
            <FeaturePill
              icon="📅"
              label={t("feat.training", "Entrenos")}
              color={c.texto}
            />
            <FeaturePill
              icon="⚽"
              label={t("feat.matches", "Partidos")}
              color={c.texto}
            />
            <FeaturePill
              icon="📌"
              label={t("feat.fields", "Campos")}
              color={c.texto}
            />
            <FeaturePill
              icon="📢"
              label={t("feat.board", "Anuncios")}
              color={c.texto}
            />
          </View>
        </View>

        {/* ═══════════════════  CTA  ═══════════════════ */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: c.boton }]}
            activeOpacity={0.85}
            onPress={() => router.push("/login")}
          >
            <Text style={[styles.primaryButtonText, { color: c.botonTexto }]}>
              {t("welcome.login", "Iniciar Sesión")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: c.boton }]}
            activeOpacity={0.7}
            onPress={() => router.push("/registro")}
          >
            <Text style={[styles.secondaryButtonText, { color: c.boton }]}>
              {t("welcome.register", "Crear una cuenta nueva")}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ═══════════════════  FOOTER  ═══════════════════ */}
        <Text style={[styles.footer, { color: c.subtexto }]}>
          {t("welcome.footer", "¿Tu club ya usa Squadra?")}{" "}
          <Text
            style={[styles.footerLink, { color: c.boton }]}
            onPress={() => router.push("/login")}
          >
            {t("welcome.footerLink", "Únete ahora")}
          </Text>
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  watermarkWrap: {
    position: "absolute",
    top: -80,
    right: -120,
    transform: [{ rotate: "12deg" }],
  },
  watermark: {
    /* la opacidad se controla desde tema */
  },
  scrollContent: {
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 40,
    alignItems: "center",
    gap: 28,
  },

  /* ── Hero ── */
  heroSection: {
    alignItems: "center",
    marginTop: 20,
  },
  logoRing: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logo: {
    /* centrado dentro del anillo */
  },
  tituloTexto: {
    fontFamily: "SquadraStencil",
    fontSize: 48,
    textAlign: "center",
    letterSpacing: 3,
    lineHeight: 52,
  },
  subtituloTexto: {
    fontFamily: "SquadraStencil",
    fontSize: 14,
    textAlign: "center",
    letterSpacing: 6,
    marginTop: 6,
    opacity: 0.9,
  },

  /* ── Copy ── */
  infoSection: {
    alignItems: "center",
    maxWidth: 340,
  },
  welcomeTitle: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 14,
    lineHeight: 34,
    letterSpacing: -0.3,
  },
  welcomeDescription: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    opacity: 0.85,
  },

  /* ── Features ── */
  featuresSection: {
    width: "100%",
    maxWidth: 380,
    marginTop: 8,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 10,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  pillIcon: {
    fontSize: 16,
  },
  pillLabel: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  /* ── CTAs ── */
  actionSection: {
    width: "100%",
    maxWidth: 340,
    gap: 14,
    marginTop: 12,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    transform: [{ scale: 1 }],
  },
  primaryButtonText: {
    fontWeight: "800",
    fontSize: 16,
    letterSpacing: 0.6,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    fontWeight: "700",
    fontSize: 16,
    letterSpacing: 0.3,
  },

  /* ── Footer ── */
  footer: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 8,
  },
  footerLink: {
    fontWeight: "700",
  },
});
