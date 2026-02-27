import * as BackgroundFetch from 'expo-background-fetch';
import * as TaskManager from 'expo-task-manager';
import { fetchEvents } from '../lib/api';
import { scheduleIdleNotification } from '../lib/notifications';
import { useJigAiStore } from '../store';

export const BACKGROUND_FETCH_TASK = 'JIGAI_BACKGROUND_FETCH';

TaskManager.defineTask(BACKGROUND_FETCH_TASK, async () => {
  try {
    const store = useJigAiStore.getState();
    const { server, lastSeenTimestamp, notificationsEnabled, soundEnabled, setLastSeen } = store;

    if (!server || !notificationsEnabled) {
      return BackgroundFetch.BackgroundFetchResult.NoData;
    }

    const baseUrl = `http://${server.ip}:${server.port}`;
    const events = await fetchEvents(baseUrl, 20);

    if (!events.length) return BackgroundFetch.BackgroundFetchResult.NoData;

    // Filter events newer than last seen
    const newEvents = lastSeenTimestamp
      ? events.filter((e) => e.server_time > lastSeenTimestamp)
      : events.slice(0, 1);

    for (const event of newEvents.slice(0, 3)) {
      await scheduleIdleNotification({
        toolName: event.tool_name,
        lastOutput: event.last_output,
        workingDir: event.working_dir,
        sound: soundEnabled,
      });
    }

    if (newEvents.length > 0) {
      setLastSeen(newEvents[0].server_time);
    }

    return BackgroundFetch.BackgroundFetchResult.NewData;
  } catch {
    return BackgroundFetch.BackgroundFetchResult.Failed;
  }
});

export async function registerBackgroundFetch(): Promise<void> {
  await BackgroundFetch.registerTaskAsync(BACKGROUND_FETCH_TASK, {
    minimumInterval: 15 * 60, // 15 minutes (iOS enforces minimum)
    stopOnTerminate: false,
    startOnBoot: true,
  });
}
