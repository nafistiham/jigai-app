import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('jigai', {
      name: 'JigAi Notifications',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });
  }

  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

interface NotificationOptions {
  toolName: string;
  notificationBody?: string; // Pre-processed line from server — only this is shown
  workingDir: string;
  sound: boolean;
}

export async function scheduleIdleNotification(opts: NotificationOptions): Promise<void> {
  const body = opts.notificationBody || opts.workingDir || 'Waiting for your input';

  await Notifications.scheduleNotificationAsync({
    content: {
      title: `${opts.toolName} is waiting`,
      body,
      sound: opts.sound,
    },
    trigger: null, // immediate
  });
}
