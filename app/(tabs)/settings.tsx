import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useJigAiStore } from '../../store';
import Constants from 'expo-constants';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
}

function Row({
  label,
  right,
  onPress,
}: {
  label: string;
  right?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const autoDiscovery = useJigAiStore((s) => s.autoDiscovery);
  const notificationsEnabled = useJigAiStore((s) => s.notificationsEnabled);
  const soundEnabled = useJigAiStore((s) => s.soundEnabled);
  const manualAddress = useJigAiStore((s) => s.manualAddress);
  const server = useJigAiStore((s) => s.server);
  const status = useJigAiStore((s) => s.status);

  const setAutoDiscovery = useJigAiStore((s) => s.setAutoDiscovery);
  const setNotificationsEnabled = useJigAiStore((s) => s.setNotificationsEnabled);
  const setSoundEnabled = useJigAiStore((s) => s.setSoundEnabled);
  const setManualAddress = useJigAiStore((s) => s.setManualAddress);
  const setServer = useJigAiStore((s) => s.setServer);
  const setStatus = useJigAiStore((s) => s.setStatus);

  const [addressInput, setAddressInput] = useState(manualAddress);

  const handleConnect = () => {
    const trimmed = addressInput.trim();
    if (!trimmed) return;

    const [ip, portStr] = trimmed.split(':');
    const port = parseInt(portStr ?? '9384', 10);

    if (!ip || isNaN(port)) {
      Alert.alert('Invalid address', 'Use format: 192.168.1.5:9384');
      return;
    }

    setManualAddress(trimmed);
    setServer({ name: ip, ip, port });
    setAutoDiscovery(false);
  };

  const handleDisconnect = () => {
    setServer(null);
    setStatus('disconnected');
  };

  const isConnected = status === 'connected';

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Text style={styles.title}>Settings</Text>
      <ScrollView>

        <Section title="CONNECTION">
          <Row
            label="Auto-discovery"
            right={
              <Switch
                value={autoDiscovery}
                onValueChange={setAutoDiscovery}
              />
            }
          />
          {server && (
            <Row
              label={`${server.name} · ${server.ip}:${server.port}`}
              right={
                <Text style={[styles.statusPill, isConnected ? styles.connected : styles.disconnected]}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </Text>
              }
            />
          )}
          <View style={styles.manualRow}>
            <TextInput
              style={styles.input}
              value={addressInput}
              onChangeText={setAddressInput}
              placeholder="192.168.1.5:9384"
              placeholderTextColor="#aaa"
              autoCapitalize="none"
              keyboardType="numbers-and-punctuation"
            />
            <TouchableOpacity
              style={[styles.connectBtn, isConnected && styles.disconnectBtn]}
              onPress={isConnected ? handleDisconnect : handleConnect}
            >
              <Text style={styles.connectBtnText}>
                {isConnected ? 'Disconnect' : 'Connect'}
              </Text>
            </TouchableOpacity>
          </View>
        </Section>

        <Section title="NOTIFICATIONS">
          <Row
            label="Enable notifications"
            right={
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
              />
            }
          />
          <Row
            label="Sound"
            right={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                disabled={!notificationsEnabled}
              />
            }
          />
        </Section>

        <Section title="ABOUT">
          <Row label="Version" right={<Text style={styles.value}>v{Constants.expoConfig?.version}</Text>} />
          <Row label="Server" right={<Text style={styles.value}>nafistiham/jigai</Text>} />
        </Section>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F2F2F7' },
  title: { fontSize: 28, fontWeight: 'bold', padding: 16, paddingBottom: 8 },
  section: { marginTop: 20, marginHorizontal: 16 },
  sectionTitle: { fontSize: 12, color: '#888', fontWeight: '600', marginBottom: 6, letterSpacing: 0.5 },
  sectionBody: { backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  rowLabel: { fontSize: 16, color: '#000' },
  value: { fontSize: 15, color: '#888' },
  statusPill: { fontSize: 12, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  connected: { backgroundColor: '#E6F9EE', color: '#34C759' },
  disconnected: { backgroundColor: '#FEE2E2', color: '#FF3B30' },
  manualRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    borderRadius: 8,
    paddingHorizontal: 10,
    fontSize: 15,
    backgroundColor: '#F9F9F9',
  },
  connectBtn: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  disconnectBtn: { backgroundColor: '#FF3B30' },
  connectBtnText: { color: '#fff', fontWeight: '600', fontSize: 14 },
});
