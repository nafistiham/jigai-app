import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { IdleEvent } from '../store';

function shortenPath(path: string): string {
  return path.replace(/^\/Users\/[^/]+/, '~').replace(/^.*\/(.{2}\/[^/]+\/[^/]+)$/, '~/$1');
}

function timeAgo(isoString: string): string {
  const seconds = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

interface Props {
  event: IdleEvent;
}

export function EventCard({ event }: Props) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.toolName}>{event.tool_name}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{event.detection_method}</Text>
        </View>
        <Text style={styles.time}>{timeAgo(event.server_time)}</Text>
      </View>
      {(event.notification_body || event.last_output) ? (
        <Text style={styles.output} numberOfLines={2}>
          {event.notification_body || event.last_output}
        </Text>
      ) : null}
      <Text style={styles.dir}>{shortenPath(event.working_dir)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  toolName: { fontSize: 15, fontWeight: '600', flex: 1 },
  badge: {
    backgroundColor: '#E8F4FE',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  badgeText: { fontSize: 11, color: '#007AFF' },
  time: { fontSize: 12, color: '#888' },
  output: { fontSize: 13, color: '#333', marginBottom: 4, lineHeight: 18 },
  dir: { fontSize: 11, color: '#999', fontFamily: 'monospace' },
});
