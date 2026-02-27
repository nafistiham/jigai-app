export interface HealthResponse {
  status: string;
  version: string;
  clients: number;
  sessions: number;
}

export interface EventResponse {
  session_id: string;
  tool_name: string;
  working_dir: string;
  last_output: string;
  idle_seconds: number;
  detection_method: string;
  timestamp: string;
  server_time: string;
}

export interface SessionResponse {
  session_id: string;
  tool_name: string;
  working_dir: string;
  status: string;
}

export async function fetchHealth(baseUrl: string): Promise<HealthResponse | null> {
  try {
    const res = await fetch(`${baseUrl}/api/health`);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchEvents(baseUrl: string, limit = 20): Promise<EventResponse[]> {
  try {
    const res = await fetch(`${baseUrl}/api/events?limit=${limit}`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.events ?? [];
  } catch {
    return [];
  }
}

export async function fetchSessions(baseUrl: string): Promise<SessionResponse[]> {
  try {
    const res = await fetch(`${baseUrl}/api/sessions`);
    if (!res.ok) return [];
    const data = await res.json();
    return data.sessions ?? [];
  } catch {
    return [];
  }
}
