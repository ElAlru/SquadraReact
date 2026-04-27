import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import LogoSimbolo from "../../components/LogoSimbolo";
import { apiFetch } from "../../lib/api";
import { isValidEmail } from "../../lib/helper";
import { useTheme } from "../../lib/useTheme";

export default function RecuperarPassword() {
  const { t } = useTranslation();
  const c = useTheme(); // ¡Tu paleta unificada!

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleRecover = async () => {
    setErrorMessage(""); // Limpiamos errores previos

    if (!isValidEmail(email)) {
      setErrorMessage(t("forgotPassword.invalidEmail") || "Introduce un email válido (ej: correo@dominio.com).");
      return;
    }

    setLoading(true);
    try {
      const res = await apiFetch("/auth/recover", {
        method: "POST",
        body: JSON.stringify({
          email: email.toLowerCase().trim(),
          redirectTo: "https://squadra-reset-password.onrender.com",
        }),
      });

      if (res.ok) {
        setSent(true);
      } else {
        const msg = await res.text();
        setErrorMessage(msg || t("forgotPassword.sendError") || "No se pudo enviar el enlace.");
      }
    } catch {
      setErrorMessage(t("common.serverError") || "No hemos podido conectar con el servidor. Revisa tu conexión.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={[styles.root, { backgroundColor: c.fondo }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <LogoSimbolo
        size={700}
        color={c.colorMarca}
        style={[styles.watermark, { opacity: c.marcaAguaOpacity }]}
      />

      <ScrollView
        contentContainerStyle={styles.outer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>

          {/* Bloque de marca unificado (Texto en lugar de PNG) */}
          <View style={styles.headerTextContainer}>
            <LogoSimbolo size={60} color={c.colorMarca} style={styles.logo} />
            <Text style={[styles.tituloTexto, { color: c.colorMarca }]}>
              SQUADRA
            </Text>
            <Text style={[styles.subtituloTexto, { color: c.colorMarca }]}>
              DONDE NACE EL FÚTBOL
            </Text>
          </View>

          {!sent ? (
            <>
              <Text style={[styles.title, { color: c.texto }]}>
                {t("forgotPassword.title")}
              </Text>
              <Text style={[styles.subtitle, { color: c.subtexto }]}>
                {t("forgotPassword.description")}
              </Text>

              <Text style={[styles.label, { color: c.subtexto }]}>
                {t("forgotPassword.emailLabel")} *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  { backgroundColor: c.input, borderColor: c.bordeInput, color: c.texto },
                ]}
                placeholder={t("forgotPassword.emailPlaceholder") || "ejemplo@squadra.com"}
                placeholderTextColor={c.subtexto}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />

              {/* Banner de Error */}
              {errorMessage !== "" && (
                <View style={[styles.errorBanner, { backgroundColor: `${c.error}15`, borderColor: c.error }]}>
                  <Text style={{ color: c.error, fontSize: 13, textAlign: 'center', fontWeight: '500' }}>
                    ⚠️ {errorMessage}
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.button, { backgroundColor: loading ? c.bordeInput : c.boton }]}
                onPress={handleRecover}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color={c.botonTexto} />
                ) : (
                  <Text style={[styles.buttonText, { color: c.botonTexto }]}>
                    {t("forgotPassword.sendButton")}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.backLink}
                onPress={() => router.back()}
                disabled={loading}
              >
                <Text style={[styles.backLinkText, { color: c.boton }]}>
                  {t("forgotPassword.backToLogin")}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successContainer}>
              <Text style={{ fontSize: 52, marginBottom: 16 }}>✅</Text>
              <Text style={[styles.title, { color: c.texto, textAlign: "center" }]}>
                {t("forgotPassword.successTitle", "Enlace enviado")}
              </Text>
              <Text style={[styles.subtitle, { color: c.subtexto, textAlign: "center" }]}>
                {t("forgotPassword.successDescription", "Revisa tu bandeja de entrada o la carpeta de spam para restablecer tu contraseña.")}
              </Text>
              <TouchableOpacity
                style={[
                  styles.button,
                  { backgroundColor: "transparent", borderWidth: 1, borderColor: c.boton },
                ]}
                onPress={() => router.back()}
              >
                <Text style={[styles.buttonText, { color: c.boton }]}>
                  {t("forgotPassword.backToLogin")}
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  watermark: { position: "absolute", top: "50%", left: "50%", transform: [{ translateX: -350 }, { translateY: -350 }] },
  outer: { flexGrow: 1, justifyContent: "center", paddingBottom: 24 },
  formContainer: { maxWidth: 440, width: "100%", alignSelf: "center", paddingHorizontal: 28, paddingVertical: 32 },
  headerTextContainer: { alignItems: "center", marginBottom: 32 },
  logo: { marginBottom: 8 },
  tituloTexto: { fontFamily: "SquadraStencil", fontSize: 48, textAlign: "center", letterSpacing: 2, lineHeight: 52 },
  subtituloTexto: { fontFamily: "SquadraStencil", fontSize: 13, textAlign: "center", letterSpacing: 4, marginTop: -4, opacity: 0.85 },
  title: { fontSize: 26, fontWeight: "bold", marginBottom: 8 },
  subtitle: { fontSize: 14, lineHeight: 22, marginBottom: 28 },
  label: { fontSize: 13, fontWeight: "600", marginBottom: 7, letterSpacing: 0.2 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 20, fontSize: 15 },
  errorBanner: { padding: 13, borderWidth: 1, borderRadius: 12, marginBottom: 16 },
  button: { paddingVertical: 16, borderRadius: 12, alignItems: "center", marginBottom: 16, width: "100%" },
  buttonText: { fontWeight: "bold", fontSize: 16, letterSpacing: 0.5 },
  backLink: { alignSelf: "center", padding: 10 },
  backLinkText: { fontSize: 14, fontWeight: "600" },
  successContainer: { alignItems: "center", marginTop: 16 },
});