import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useTheme } from "../../lib/useTheme";
import LogoSimbolo from "../../components/LogoSimbolo";

export default function WelcomeScreen() {
  const { t } = useTranslation();
  const c = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: c.fondo }]}>
      {/* Marca de agua gigante y descentrada para darle un toque dinámico */}
      <LogoSimbolo
        size={800}
        color={c.colorMarca}
        style={[styles.watermark, { opacity: c.marcaAguaOpacity }]}
      />

      <View style={styles.container}>
        
        {/* SECCIÓN 1: Branding (Logo y Títulos) */}
        <View style={styles.heroSection}>
          <LogoSimbolo size={100} color={c.colorMarca} style={styles.logo} />
          <Text style={[styles.tituloTexto, { color: c.colorMarca }]}>
            SQUADRA
          </Text>
          <Text style={[styles.subtituloTexto, { color: c.colorMarca }]}>
            DONDE NACE EL FÚTBOL
          </Text>
        </View>

        {/* SECCIÓN 2: Mensaje de bienvenida / Copywriting */}
        <View style={styles.infoSection}>
          <Text style={[styles.welcomeTitle, { color: c.texto }]}>
            {t("welcome.title", "La gestión de tu club,\nen la palma de tu mano")}
          </Text>
          <Text style={[styles.welcomeDescription, { color: c.subtexto }]}>
            {t(
              "welcome.description",
              "Organiza entrenamientos, gestiona equipos, comunícate con jugadores y lleva tu club de fútbol base al siguiente nivel con una plataforma diseñada para ti."
            )}
          </Text>
        </View>

        {/* SECCIÓN 3: Botones de Acción */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: c.boton }]}
            onPress={() => router.push("/login")}
          >
            <Text style={[styles.primaryButtonText, { color: c.botonTexto }]}>
              {t("welcome.login", "Iniciar Sesión")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: c.boton }]}
            onPress={() => router.push("/registro")}
          >
            <Text style={[styles.secondaryButtonText, { color: c.boton }]}>
              {t("welcome.register", "Crear una cuenta nueva")}
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: "center",
  },
  watermark: {
    position: "absolute",
    top: "-10%",
    right: "-30%",
  },
  container: {
    flex: 1,
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 32,
    justifyContent: "space-evenly", // Reparte el espacio verticalmente
  },
  heroSection: {
    alignItems: "center",
    marginTop: 40,
  },
  logo: {
    marginBottom: 16,
  },
  tituloTexto: {
    fontFamily: "SquadraStencil",
    fontSize: 56,
    textAlign: "center",
    letterSpacing: 2,
    lineHeight: 60,
  },
  subtituloTexto: {
    fontFamily: "SquadraStencil",
    fontSize: 16,
    textAlign: "center",
    letterSpacing: 4,
    marginTop: -5,
  },
  infoSection: {
    alignItems: "center",
    marginVertical: 20,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 32,
  },
  welcomeDescription: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
  },
  actionSection: {
    width: "100%",
    gap: 16,
    marginBottom: 40,
  },
  primaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    elevation: 2, // Sombra ligera en Android
    shadowColor: "#000", // Sombra en iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  primaryButtonText: {
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  secondaryButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 2,
    backgroundColor: "transparent",
  },
  secondaryButtonText: {
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
});