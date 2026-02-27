import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ConnectionStatus as StatusType } from '../store';

const STATUS_LABEL: Record<StatusType, string> = {
  disconnected: 'Disconnected',
  discovering: 'Discovering...',
  connecting: 'Connecting...',
  connected: 'Connected',
};

const STATUS_COLOR: Record<StatusType, string> = {
  disconnected: '#FF3B30',
  discovering: '#FF9500',
  connecting: '#FF9500',
  connected: '#34C759',
};

interface Props {
  status: StatusType;
  serverName: string | null;
}

export function ConnectionStatus({ status, serverName }: Props) {
  const color = STATUS_COLOR[status];
  const label = status === 'connected' && serverName
    ? serverName
    : STATUS_LABEL[status];

  return (
    <View style={styles.container}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#F2F2F7',
    gap: 6,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  label: { fontSize: 13, color: '#333' },
});
