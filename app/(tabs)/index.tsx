import React, { useState, useEffect } from 'react';
import {
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJigAiStore, IdleEvent } from '../../store';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useDiscovery } from '../../hooks/useDiscovery';
import { EventCard } from '../../components/EventCard';
import { ConnectionStatus } from '../../components/ConnectionStatus';
import { EmptyState } from '../../components/EmptyState';
import { InAppBanner } from '../../components/InAppBanner';
import { requestNotificationPermissions, scheduleIdleNotification } from '../../lib/notifications';

export default function FeedScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [bannerEvent, setBannerEvent] = useState<IdleEvent | null>(null);

  const events = useJigAiStore((s) => s.events);
  const status = useJigAiStore((s) => s.status);
  const server = useJigAiStore((s) => s.server);
  const autoDiscovery = useJigAiStore((s) => s.autoDiscovery);
  const notificationsEnabled = useJigAiStore((s) => s.notificationsEnabled);
  const soundEnabled = useJigAiStore((s) => s.soundEnabled);

  // Request notification permissions on mount
  useEffect(() => {
    if (notificationsEnabled) requestNotificationPermissions();
  }, [notificationsEnabled]);

  // Start WebSocket connection
  useWebSocket();

  // Start mDNS discovery
  useDiscovery(autoDiscovery);

  // Show in-app banner and schedule local notification on new events
  const prevEventCount = React.useRef(events.length);
  useEffect(() => {
    if (events.length > prevEventCount.current) {
      const newest = events[0];
      setBannerEvent(newest);
      if (notificationsEnabled) {
        scheduleIdleNotification({
          toolName: newest.tool_name,
          lastOutput: newest.last_output,
          workingDir: newest.working_dir,
          sound: soundEnabled,
        });
      }
    }
    prevEventCount.current = events.length;
  }, [events]);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <InAppBanner event={bannerEvent} onDismiss={() => setBannerEvent(null)} />

      <Text style={styles.title}>Notifications</Text>

      <ConnectionStatus
        status={status}
        serverName={server?.name ?? null}
      />

      <FlatList
        data={events}
        keyExtractor={(item) => `${item.session_id}-${item.server_time}`}
        renderItem={({ item }) => <EventCard event={item} />}
        ListEmptyComponent={<EmptyState />}
        contentContainerStyle={events.length === 0 ? styles.emptyContainer : styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  title: { fontSize: 28, fontWeight: 'bold', padding: 16, paddingBottom: 8 },
  list: { paddingVertical: 8 },
  emptyContainer: { flex: 1 },
});
