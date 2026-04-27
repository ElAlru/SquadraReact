import { Redirect } from "expo-router";

export default function Index() {
  // En lugar de ir a "/login", vamos a la portada del grupo de autenticación
  return <Redirect href="/(auth)" />;
}
