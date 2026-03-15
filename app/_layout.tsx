// app/(onboarding)/_layout.tsx
import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
      <Stack.Screen name="cargo" />
      <Stack.Screen name="localizacao" />
      <Stack.Screen name="salario" />
      <Stack.Screen name="reward" />
    </Stack>
  );
}
