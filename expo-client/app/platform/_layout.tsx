import { Stack } from 'expo-router';

import { PlatformAdminGate } from '@/features/platform/PlatformAdminGate';

export default function PlatformLayout() {
  return (
    <PlatformAdminGate>
      <Stack screenOptions={{ headerShown: false }} />
    </PlatformAdminGate>
  );
}
