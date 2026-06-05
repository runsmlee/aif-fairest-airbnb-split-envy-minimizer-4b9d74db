import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import App from '../src/App';

describe('App', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders the product name as h1', () => {
    render(<App />);
    const h1 = screen.getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();
    expect(h1.textContent).toMatch(/Fairest Airbnb Split/i);
  });

  it('renders the main app container', () => {
    render(<App />);
    const main = screen.getByRole('main');
    expect(main).toBeInTheDocument();
  });

  it('shows the total cost input field', () => {
    render(<App />);
    const input = document.getElementById('total-rent');
    expect(input).toBeInTheDocument();
    expect(input?.getAttribute('type')).toBe('number');
  });

  it('shows the roommate count selector', () => {
    render(<App />);
    const label = screen.getByText(/Roommates/i);
    expect(label).toBeInTheDocument();
  });

  it('has polished helper text for total cost', () => {
    render(<App />);
    expect(screen.getByText(/The total Airbnb booking cost/i)).toBeInTheDocument();
  });

  it('has polished helper text for bids input', () => {
    render(<App />);
    expect(screen.getByText(/Enter the most each person would pay for each room/i)).toBeInTheDocument();
  });

  it('calculates fair split when all inputs are filled', () => {
    render(<App />);

    // Set total rent
    const rentInput = document.getElementById('total-rent') as HTMLInputElement;
    fireEvent.change(rentInput, { target: { value: '1000' } });

    // Fill bids for 3 people × 3 rooms
    // getAllByRole('spinbutton') includes total-rent input at [0], bids are [1..9]
    const spinbuttons = screen.getAllByRole('spinbutton');
    // Person 1: spinbuttons[1..3]
    fireEvent.change(spinbuttons[1], { target: { value: '500' } });
    fireEvent.change(spinbuttons[2], { target: { value: '300' } });
    fireEvent.change(spinbuttons[3], { target: { value: '200' } });
    // Person 2: spinbuttons[4..6]
    fireEvent.change(spinbuttons[4], { target: { value: '200' } });
    fireEvent.change(spinbuttons[5], { target: { value: '500' } });
    fireEvent.change(spinbuttons[6], { target: { value: '300' } });
    // Person 3: spinbuttons[7..9]
    fireEvent.change(spinbuttons[7], { target: { value: '300' } });
    fireEvent.change(spinbuttons[8], { target: { value: '200' } });
    fireEvent.change(spinbuttons[9], { target: { value: '500' } });

    // Click calculate
    const calcButton = screen.getByText(/Calculate fair split/i);
    expect(calcButton).not.toBeDisabled();
    fireEvent.click(calcButton);

    // Results should appear
    expect(screen.getByText(/Fair Split Results/i)).toBeInTheDocument();
  });

  it('shows disabled calculate button when inputs are empty', () => {
    render(<App />);
    const calcButton = screen.getByText(/Calculate fair split/i);
    expect(calcButton).toBeDisabled();
  });

  it('allows adjusting roommate count', () => {
    render(<App />);
    const addButton = screen.getByLabelText(/Add one roommate/i);
    fireEvent.click(addButton);
    expect(screen.getByText('4')).toBeInTheDocument();
  });

  it('allows decreasing roommate count', () => {
    render(<App />);
    // Default is 3, minimum is 2
    const removeButton = screen.getByLabelText(/Remove one roommate/i);
    fireEvent.click(removeButton);
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('disables decrease button at minimum (2 roommates)', () => {
    render(<App />);
    const removeButton = screen.getByLabelText(/Remove one roommate/i);
    // Go from 3 to 2
    fireEvent.click(removeButton);
    expect(removeButton).toBeDisabled();
  });

  it('disables increase button at maximum (6 roommates)', () => {
    render(<App />);
    const addButton = screen.getByLabelText(/Add one roommate/i);
    // Go from 3 to 6
    fireEvent.click(addButton); // 4
    fireEvent.click(addButton); // 5
    fireEvent.click(addButton); // 6
    expect(addButton).toBeDisabled();
  });

  it('resets bids and total rent when reset is clicked', () => {
    render(<App />);

    // Set total rent
    const rentInput = document.getElementById('total-rent') as HTMLInputElement;
    fireEvent.change(rentInput, { target: { value: '1000' } });

    // Fill some bids
    const spinbuttons = screen.getAllByRole('spinbutton');
    fireEvent.change(spinbuttons[1], { target: { value: '500' } });
    fireEvent.change(spinbuttons[2], { target: { value: '300' } });
    fireEvent.change(spinbuttons[3], { target: { value: '200' } });
    fireEvent.change(spinbuttons[4], { target: { value: '200' } });
    fireEvent.change(spinbuttons[5], { target: { value: '500' } });
    fireEvent.change(spinbuttons[6], { target: { value: '300' } });
    fireEvent.change(spinbuttons[7], { target: { value: '300' } });
    fireEvent.change(spinbuttons[8], { target: { value: '200' } });
    fireEvent.change(spinbuttons[9], { target: { value: '500' } });

    // Calculate to show results
    fireEvent.click(screen.getByText(/Calculate fair split/i));
    expect(screen.getByText(/Fair Split Results/i)).toBeInTheDocument();

    // Click reset
    fireEvent.click(screen.getByText(/Reset/i));

    // Results should be gone
    expect(screen.queryByText(/Fair Split Results/i)).not.toBeInTheDocument();

    // Calculate button should be disabled again
    expect(screen.getByText(/Calculate fair split/i)).toBeDisabled();

    // Total rent should be cleared
    expect(rentInput.value).toBe('');
  });

  it('persists state to localStorage', () => {
    render(<App />);

    // Set total rent
    const rentInput = document.getElementById('total-rent') as HTMLInputElement;
    fireEvent.change(rentInput, { target: { value: '1500' } });

    // Verify localStorage was updated
    const stored = JSON.parse(localStorage.getItem('fairest-split-state') || '{}');
    expect(stored.totalRent).toBe(1500);
  });

  it('restores state from localStorage on mount', () => {
    // Pre-populate localStorage
    localStorage.setItem('fairest-split-state', JSON.stringify({
      roommateCount: 2,
      roomNames: ['Master', 'Guest'],
      personNames: ['Alice', 'Bob'],
      bids: [[500, 300], [300, 500]],
      totalRent: 800,
    }));

    render(<App />);

    // Should show 2 as the count
    expect(screen.getByText('2')).toBeInTheDocument();

    // Total rent should be restored
    const rentInput = document.getElementById('total-rent') as HTMLInputElement;
    expect(rentInput.value).toBe('800');
  });

  it('clears results when roommate count changes', () => {
    render(<App />);

    // Set total rent and fill bids
    const rentInput = document.getElementById('total-rent') as HTMLInputElement;
    fireEvent.change(rentInput, { target: { value: '1000' } });

    const spinbuttons = screen.getAllByRole('spinbutton');
    fireEvent.change(spinbuttons[1], { target: { value: '500' } });
    fireEvent.change(spinbuttons[2], { target: { value: '300' } });
    fireEvent.change(spinbuttons[3], { target: { value: '200' } });
    fireEvent.change(spinbuttons[4], { target: { value: '200' } });
    fireEvent.change(spinbuttons[5], { target: { value: '500' } });
    fireEvent.change(spinbuttons[6], { target: { value: '300' } });
    fireEvent.change(spinbuttons[7], { target: { value: '300' } });
    fireEvent.change(spinbuttons[8], { target: { value: '200' } });
    fireEvent.change(spinbuttons[9], { target: { value: '500' } });

    // Calculate
    fireEvent.click(screen.getByText(/Calculate fair split/i));
    expect(screen.getByText(/Fair Split Results/i)).toBeInTheDocument();

    // Change roommate count — should clear results
    fireEvent.click(screen.getByLabelText(/Add one roommate/i));
    expect(screen.queryByText(/Fair Split Results/i)).not.toBeInTheDocument();
  });
});
