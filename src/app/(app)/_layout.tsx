import { Stack } from 'expo-router';
import { useTheme } from '@/hooks/use-theme';

export default function AppLayout() {
  const theme = useTheme();
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: theme.bg },
        animation: 'slide_from_right',
      }}
    />
  );
}
