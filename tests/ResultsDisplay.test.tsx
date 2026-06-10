import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

  beforeEach(() => {
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
    // Mock window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: 'https://example.com', href: 'https://example.com/' },
      writable: true,
    });
  });

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

  it('shows a copy formatted text button', () => {
    render(<ResultsDisplay result={mockResult} personNames={['Alice', 'Bob']} roomNames={['Master', 'Guest']} />);
    expect(screen.getByRole('button', { name: /copy as text/i })).toBeInTheDocument();
  });

  it('shows a share link button', () => {
    render(<ResultsDisplay result={mockResult} personNames={['Alice', 'Bob']} roomNames={['Master', 'Guest']} />);
    expect(screen.getByRole('button', { name: /copy share link/i })).toBeInTheDocument();
  });

  it('copies formatted text when copy button is clicked', async () => {
    render(<ResultsDisplay result={mockResult} personNames={['Alice', 'Bob']} roomNames={['Master', 'Guest']} />);
    const copyBtn = screen.getByRole('button', { name: /copy as text/i });
    fireEvent.click(copyBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const copiedText = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(copiedText).toContain('Alice');
    expect(copiedText).toContain('Bob');
    expect(copiedText).toContain('Master');
    expect(copiedText).toContain('Guest');
    expect(copiedText).toContain('$550');
    expect(copiedText).toContain('$450');
    expect(copiedText).toContain('$1,000');
  });

  it('copies share link when share button is clicked', async () => {
    render(<ResultsDisplay result={mockResult} personNames={['Alice', 'Bob']} roomNames={['Master', 'Guest']} />);
    const shareBtn = screen.getByRole('button', { name: /copy share link/i });
    fireEvent.click(shareBtn);

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const copiedUrl = (navigator.clipboard.writeText as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(copiedUrl).toContain('p=');
    expect(copiedUrl).toContain('r=');
    expect(copiedUrl).toContain('a=');
    expect(copiedUrl).toContain('t=');
  });

  it('shows copied confirmation after clicking copy button', async () => {
    render(<ResultsDisplay result={mockResult} personNames={['Alice', 'Bob']} roomNames={['Master', 'Guest']} />);
    const copyBtn = screen.getByRole('button', { name: /copy as text/i });
    fireEvent.click(copyBtn);

    // Wait for the async clipboard to resolve and confirmation to appear
    const confirmation = await screen.findByText(/copied/i);
    expect(confirmation).toBeInTheDocument();
  });

  it('shows copied confirmation after clicking share link button', async () => {
    render(<ResultsDisplay result={mockResult} personNames={['Alice', 'Bob']} roomNames={['Master', 'Guest']} />);
    const shareBtn = screen.getByRole('button', { name: /copy share link/i });
    fireEvent.click(shareBtn);

    const confirmation = await screen.findByText(/copied/i);
    expect(confirmation).toBeInTheDocument();
  });
});
