import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { colors } from "../tokens";

// Raíz: todas las rutas viven dentro de (tabs) para que la barra inferior
// (con el botón central de cámara) sea permanente, también en pantallas apiladas.
export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.canvas },
        }}
      >
        <Stack.Screen name="(tabs)" />
      </Stack>
    </SafeAreaProvider>
  );
}
