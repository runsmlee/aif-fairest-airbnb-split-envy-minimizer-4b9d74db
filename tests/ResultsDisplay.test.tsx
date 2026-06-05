import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultsDisplay } from '../src/components/ResultsDisplay';
import type { SplitResult } from '../src/types';

describe('ResultsDisplay', () => {
  const mockResult: SplitResult = {
    assignments: [
      { personIndex: 0, roomIndex: 0, price: 550 },
      { personIndex: 1, roomIndex: 1, price: 450 },
    ],
    isEnvyFree: true,
    totalRent: 1000,
    fairShare: 500,
  };

  it('renders nothing when result is null', () => {
    const { container } = render(<ResultsDisplay result={null} personNames={['A', 'B']} roomNames={['R1', 'R2']} />);
    expect(container.innerHTML).toBe('');
  });

  it('displays the heading when result is present', () => {
    render(<ResultsDisplay result={mockResult} personNames={['Alice', 'Bob']} roomNames={['Master', 'Guest']} />);
    expect(screen.getByText(/Fair Split Results/i)).toBeInTheDocument();
  });

  it('shows each person\'s room assignment', () => {
    render(<ResultsDisplay result={mockResult} personNames={['Alice', 'Bob']} roomNames={['Master', 'Guest']} />);
    expect(screen.getByText(/Alice/)).toBeInTheDocument();
    expect(screen.getByText(/Bob/)).toBeInTheDocument();
    expect(screen.getByText(/Master/)).toBeInTheDocument();
    expect(screen.getByText(/Guest/)).toBeInTheDocument();
  });

  it('displays prices for each assignment', () => {
    render(<ResultsDisplay result={mockResult} personNames={['Alice', 'Bob']} roomNames={['Master', 'Guest']} />);
    expect(screen.getByText(/\$550/)).toBeInTheDocument();
    expect(screen.getByText(/\$450/)).toBeInTheDocument();
  });

  it('shows envy-free badge when result is envy-free', () => {
    render(<ResultsDisplay result={mockResult} personNames={['Alice', 'Bob']} roomNames={['Master', 'Guest']} />);
    expect(screen.getByText(/Envy-free/i)).toBeInTheDocument();
  });

  it('shows total rent verification', () => {
    render(<ResultsDisplay result={mockResult} personNames={['Alice', 'Bob']} roomNames={['Master', 'Guest']} />);
    expect(screen.getByText(/\$1,000/)).toBeInTheDocument();
  });
});
