import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next"; // <-- Reintegrado
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { apiFetch } from "../../lib/api";
import { isValidEmail } from "../../lib/helper";
import { useTheme } from "../../lib/useTheme";

export default function RecuperarPassword() {
  const { t } = useTranslation(); // <-- Inicializamos el hook de i18n
  const c = useTheme();
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
          msg ||
            t("forgotPassword.sendError") ||
            "No se pudo enviar el enlace.",
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
    <ScrollView
      contentContainerStyle={[styles.container, { backgroundColor: c.fondo }]}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.brand}>SQUADRA</Text>

      <View
        style={[
          styles.shield,
          { backgroundColor: `${c.boton}18`, borderColor: `${c.boton}40` },
        ]}
      >
        <Text style={{ fontSize: 28 }}>🔑</Text>
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
              {
                backgroundColor: c.input,
                borderColor: c.bordeInput,
                color: c.texto,
              },
            ]}
            placeholder={
              t("forgotPassword.emailPlaceholder") || "ejemplo@squadra.com"
            }
            placeholderTextColor={c.subtexto}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!loading}
          />

          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: loading ? c.bordeInput : c.boton },
            ]}
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
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: c.boton,
              },
            ]}
            onPress={() => router.back()}
          >
            <Text style={[styles.buttonText, { color: c.boton }]}>
              {t("forgotPassword.backToLogin")}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 80,
    paddingBottom: 40,
  },
  brand: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#C9A84C",
    letterSpacing: 4,
    marginBottom: 32,
  },
  shield: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
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
