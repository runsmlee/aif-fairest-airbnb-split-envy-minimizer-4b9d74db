import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BidsInput } from '../src/components/BidsInput';

describe('BidsInput', () => {
  const defaultProps = {
    personNames: ['Alice', 'Bob'],
    roomNames: ['Master', 'Guest'],
    bids: [
      [800, 200],
      [300, 700],
    ],
    onBidChange: () => {},
  };

  it('renders the polished label "Max they\'d pay"', () => {
    render(<BidsInput {...defaultProps} />);
    expect(screen.getByText(/Max they'd pay/i)).toBeInTheDocument();
  });

  it('renders the helper text explaining the input', () => {
    render(<BidsInput {...defaultProps} />);
    expect(
      screen.getByText(/Enter the most each person would pay for each room/i),
    ).toBeInTheDocument();
  });

  it('renders person names as row headers', () => {
    render(<BidsInput {...defaultProps} />);
    expect(screen.getByText('Alice')).toBeInTheDocument();
    expect(screen.getByText('Bob')).toBeInTheDocument();
  });

  it('renders room names as column headers', () => {
    render(<BidsInput {...defaultProps} />);
    expect(screen.getByText('Master')).toBeInTheDocument();
    expect(screen.getByText('Guest')).toBeInTheDocument();
  });

  it('renders input fields for each person-room combination', () => {
    render(<BidsInput {...defaultProps} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs).toHaveLength(4); // 2 people × 2 rooms
  });

  it('displays current bid values in inputs', () => {
    render(<BidsInput {...defaultProps} />);
    const inputs = screen.getAllByRole('spinbutton');
    expect(inputs[0]).toHaveValue(800);
    expect(inputs[1]).toHaveValue(200);
    expect(inputs[2]).toHaveValue(300);
    expect(inputs[3]).toHaveValue(700);
  });
});
