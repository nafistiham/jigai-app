import { renderHook, act } from '@testing-library/react-native';
import { useWebSocket } from '../useWebSocket';
import { useJigAiStore } from '../../store';

// Mock WebSocket
class MockWebSocket {
  static instances: MockWebSocket[] = [];
  onopen: (() => void) | null = null;
  onclose: (() => void) | null = null;
  onmessage: ((e: { data: string }) => void) | null = null;
  onerror: (() => void) | null = null;
  closed = false;

  constructor(public url: string) {
    MockWebSocket.instances.push(this);
  }

  close() { this.closed = true; this.onclose?.(); }
  triggerOpen() { this.onopen?.(); }
  triggerMessage(data: object) { this.onmessage?.({ data: JSON.stringify(data) }); }
}

(global as any).WebSocket = MockWebSocket;

beforeEach(() => {
  MockWebSocket.instances = [];
  useJigAiStore.setState({
    status: 'disconnected',
    server: { name: 'Mac', ip: '192.168.1.5', port: 9384 },
    events: [],
    lastHeartbeat: null,
  });
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

describe('useWebSocket', () => {
  it('connects when server is set', () => {
    renderHook(() => useWebSocket());
    expect(MockWebSocket.instances).toHaveLength(1);
    expect(MockWebSocket.instances[0].url).toBe('ws://192.168.1.5:9384/ws');
  });

  it('sets status to connected on open', () => {
    renderHook(() => useWebSocket());
    act(() => MockWebSocket.instances[0].triggerOpen());
    expect(useJigAiStore.getState().status).toBe('connected');
  });

  it('adds event to store on idle_detected message', () => {
    renderHook(() => useWebSocket());
    act(() => {
      MockWebSocket.instances[0].triggerOpen();
      MockWebSocket.instances[0].triggerMessage({
        type: 'idle_detected',
        session_id: 'abc',
        tool_name: 'Claude Code',
        working_dir: '/foo',
        last_output: 'waiting',
        idle_seconds: 30,
        detection_method: 'pattern',
        timestamp: '2026-02-28T10:00:00Z',
        server_time: '2026-02-28T10:00:01Z',
      });
    });
    expect(useJigAiStore.getState().events).toHaveLength(1);
    expect(useJigAiStore.getState().events[0].tool_name).toBe('Claude Code');
  });

  it('sets status to disconnected on close', () => {
    renderHook(() => useWebSocket());
    act(() => {
      MockWebSocket.instances[0].triggerOpen();
      MockWebSocket.instances[0].close();
    });
    expect(useJigAiStore.getState().status).toBe('disconnected');
  });
});
