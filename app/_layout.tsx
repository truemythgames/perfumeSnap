import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: Colors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen
          name="camera"
          options={{ animation: 'slide_from_bottom' }}
        />
        <Stack.Screen
          name="result"
          options={{
            animation: 'slide_from_right',
            animationDuration: 250,
          }}
        />
        <Stack.Screen
          name="similar"
          options={{
            animation: 'slide_from_right',
            animationDuration: 250,
          }}
        />
        <Stack.Screen
          name="perfume-chat"
          options={{
            animation: 'slide_from_right',
            animationDuration: 250,
          }}
        />
      </Stack>
    </>
  );
}
