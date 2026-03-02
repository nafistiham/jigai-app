import { scheduleIdleNotification } from '../notifications';

jest.mock('expo-notifications', () => ({
  scheduleNotificationAsync: jest.fn().mockResolvedValue('notification-id'),
  requestPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  setNotificationHandler: jest.fn(),
  AndroidImportance: { HIGH: 4 },
  setNotificationChannelAsync: jest.fn(),
}));

import * as Notifications from 'expo-notifications';

describe('scheduleIdleNotification', () => {
  it('schedules notification with tool name in title', async () => {
    await scheduleIdleNotification({
      toolName: 'Claude Code',
      notificationBody: 'What would you like to do?',
      workingDir: '~/projects/foo',
      sound: true,
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          title: 'Claude Code is waiting',
          body: 'What would you like to do?',
        }),
      })
    );
  });

  it('falls back to workingDir when notificationBody is empty', async () => {
    await scheduleIdleNotification({
      toolName: 'Aider',
      notificationBody: '',
      workingDir: '~/projects/bar',
      sound: true,
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          body: '~/projects/bar',
        }),
      })
    );
  });

  it('falls back to workingDir when notificationBody is absent', async () => {
    await scheduleIdleNotification({
      toolName: 'Aider',
      workingDir: '~/projects/bar',
      sound: true,
    });

    expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(
      expect.objectContaining({
        content: expect.objectContaining({
          body: '~/projects/bar',
        }),
      })
    );
  });
});
