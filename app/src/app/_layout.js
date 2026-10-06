import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { SessionProvider } from "../features/session/SessionContext";
import { colors } from "../tokens";

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <SessionProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.white },
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="screen/[id]" />
        </Stack>
      </SessionProvider>
    </SafeAreaProvider>
  );
}
