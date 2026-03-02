import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { EventCard } from '../EventCard';

const mockEvent = {
  session_id: 'abc123',
  tool_name: 'Claude Code',
  working_dir: '/Users/user/projects/foo',
  last_output: '────────────────────────────',
  notification_body: 'What would you like to do next?',
  idle_seconds: 32.5,
  detection_method: 'pattern',
  timestamp: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
  server_time: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
};

describe('EventCard', () => {
  it('renders tool name', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('Claude Code')).toBeTruthy();
  });

  it('renders notification_body', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('What would you like to do next?')).toBeTruthy();
  });

  it('renders detection method badge', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText('pattern')).toBeTruthy();
  });

  it('renders working directory (shortened)', () => {
    render(<EventCard event={mockEvent} />);
    expect(screen.getByText(/foo/)).toBeTruthy();
  });
});
