import { useJigAiStore } from '../index';

// Reset store between tests
beforeEach(() => {
  useJigAiStore.setState({
    status: 'disconnected',
    server: null,
    lastHeartbeat: null,
    events: [],
    lastSeenTimestamp: null,
    autoDiscovery: true,
    notificationsEnabled: true,
    soundEnabled: true,
    manualAddress: '',
  });
});

const mockEvent = {
  session_id: 'abc123',
  tool_name: 'Claude Code',
  working_dir: '/projects/foo',
  last_output: 'What would you like to do?',
  idle_seconds: 32.5,
  detection_method: 'pattern',
  timestamp: '2026-02-28T10:00:00Z',
  server_time: '2026-02-28T10:00:01Z',
};

describe('connection slice', () => {
  it('sets status', () => {
    useJigAiStore.getState().setStatus('connected');
    expect(useJigAiStore.getState().status).toBe('connected');
  });

  it('sets server', () => {
    const server = { name: 'MacBook', ip: '192.168.1.5', port: 9384 };
    useJigAiStore.getState().setServer(server);
    expect(useJigAiStore.getState().server).toEqual(server);
  });
});

describe('events slice', () => {
  it('adds event to front of list', () => {
    useJigAiStore.getState().addEvent(mockEvent);
    expect(useJigAiStore.getState().events[0]).toEqual(mockEvent);
  });

  it('limits events to 50', () => {
    for (let i = 0; i < 60; i++) {
      useJigAiStore.getState().addEvent({ ...mockEvent, session_id: `id${i}` });
    }
    expect(useJigAiStore.getState().events.length).toBe(50);
  });

  it('clears events', () => {
    useJigAiStore.getState().addEvent(mockEvent);
    useJigAiStore.getState().clearEvents();
    expect(useJigAiStore.getState().events).toHaveLength(0);
  });

  it('prefers notification_body when present', () => {
    const eventWithBody = { ...mockEvent, notification_body: 'Clean output line' };
    useJigAiStore.getState().addEvent(eventWithBody);
    expect(useJigAiStore.getState().events[0].notification_body).toBe('Clean output line');
  });
});

describe('settings slice', () => {
  it('toggles autoDiscovery', () => {
    useJigAiStore.getState().setAutoDiscovery(false);
    expect(useJigAiStore.getState().autoDiscovery).toBe(false);
  });

  it('sets manual address', () => {
    useJigAiStore.getState().setManualAddress('192.168.1.10:9384');
    expect(useJigAiStore.getState().manualAddress).toBe('192.168.1.10:9384');
  });
});
