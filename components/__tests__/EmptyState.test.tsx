import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { EmptyState } from '../EmptyState';

describe('EmptyState', () => {
  it('renders the prompt message', () => {
    render(<EmptyState />);
    expect(screen.getByText(/jigai watch/)).toBeTruthy();
  });
});
