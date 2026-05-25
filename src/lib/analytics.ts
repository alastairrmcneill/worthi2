import { Mixpanel } from 'mixpanel-react-native';

const TOKEN = process.env.EXPO_PUBLIC_MIXPANEL_TOKEN ?? '';

const mixpanel = new Mixpanel(TOKEN, /* trackAutomaticEvents */ true);

export async function initAnalytics(): Promise<void> {
  await mixpanel.init();
  mixpanel.registerSuperProperties({ is_dev: __DEV__ });
}

// Fire-and-forget — safe to call from any component
export function track(
  event: string,
  properties: Record<string, string | number | boolean> = {}
): void {
  mixpanel.track(event, properties);
}
