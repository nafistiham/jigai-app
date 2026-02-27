import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ConnectionStatus } from '../ConnectionStatus';

describe('ConnectionStatus', () => {
  it('shows connected state with server name', () => {
    render(<ConnectionStatus status="connected" serverName="MacBook-Pro" />);
    expect(screen.getByText(/MacBook-Pro/)).toBeTruthy();
  });

  it('shows disconnected state', () => {
    render(<ConnectionStatus status="disconnected" serverName={null} />);
    expect(screen.getByText(/Disconnected/)).toBeTruthy();
  });

  it('shows discovering state', () => {
    render(<ConnectionStatus status="discovering" serverName={null} />);
    expect(screen.getByText(/Discovering/)).toBeTruthy();
  });
});
