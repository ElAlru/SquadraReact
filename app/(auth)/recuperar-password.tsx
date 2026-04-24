import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from "react-native";
import { apiFetch } from "../../lib/api";
import { isValidEmail } from "../../lib/helper";
import { useTheme } from "../../lib/useTheme";
import { useAuthStore } from "../../lib/store";
import LogoSimbolo from "../../components/LogoSimbolo";

export default function RecuperarPassword() {
  const { t } = useTranslation();
  const c = useTheme();
  const themeMode = useAuthStore((s: any) => s.themeMode);
  const colorScheme = useColorScheme();
  const isDark = themeMode === "dark" || (themeMode === "auto" && colorScheme === "dark");

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleRecover = async () => {
    if (!isValidEmail(email)) {
      Alert.alert(
        t("common.error"),
        t("forgotPassword.invalidEmail") || "Introduce un email válido.",
      );
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
        Alert.alert(
          t("common.error"),
          msg || t("forgotPassword.sendError") || "No se pudo enviar el enlace.",
        );
      }
    } catch {
      Alert.alert(
        t("common.connectionError"),
        t("common.serverError") || "No hemos podido conectar con el servidor.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: c.fondo }]}>
      <LogoSimbolo
        size={700}
        color="#ffc06d"
        style={styles.watermark}
      />

      <ScrollView
        contentContainerStyle={styles.outer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formContainer}>

          {/* Branding compacto */}
          <View style={styles.brandBlock}>
            <LogoSimbolo size={60} color="#ffc06d" style={{ alignSelf: "center" }} />
            <Image
              source={
                isDark
                  ? require("../../assets/images/titulo-squadra-dark.png")
                  : require("../../assets/images/titulo-squadra.png")
              }
              style={styles.imgTitulo}
            />
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
              <Text style={[styles.title, { color: c.texto }]}>
                {t("forgotPassword.successTitle")}
              </Text>
              <Text style={[styles.subtitle, { color: c.subtexto }]}>
                {t("forgotPassword.successDescription")}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  watermark: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -350 }, { translateY: -350 }],
    opacity: 0.06,
  },
  outer: { flexGrow: 1, justifyContent: "center" },
  formContainer: {
    maxWidth: 420,
    width: "100%",
    alignSelf: "center",
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  brandBlock: {
    alignItems: "center",
    gap: 8,
    marginBottom: 20,
  },
  imgTitulo: {
    width: "55%",
    height: 36,
    resizeMode: "contain",
    alignSelf: "center",
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 32,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    padding: 13,
    marginBottom: 24,
    fontSize: 15,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
    marginBottom: 16,
    width: "100%",
  },
  buttonText: {
    fontWeight: "bold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  backLink: {
    alignSelf: "center",
    padding: 8,
  },
  backLinkText: {
    fontSize: 14,
    fontWeight: "600",
  },
  successContainer: {
    alignItems: "center",
  },
});
