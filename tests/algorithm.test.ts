import { describe, it, expect } from 'vitest';
import { computeFairSplit, createEmptyBids, getDefaultNames } from '../src/lib/algorithm';

describe('computeFairSplit', () => {
  it('returns empty result for zero participants', () => {
    const result = computeFairSplit([], 1000);
    expect(result.assignments).toHaveLength(0);
    expect(result.totalRent).toBe(1000);
  });

  it('returns empty result for zero total rent', () => {
    const result = computeFairSplit([[100]], 0);
    expect(result.assignments).toHaveLength(0);
  });

  it('handles single person, single room', () => {
    const result = computeFairSplit([[500]], 500);
    expect(result.assignments).toHaveLength(1);
    expect(result.assignments[0].personIndex).toBe(0);
    expect(result.assignments[0].roomIndex).toBe(0);
    expect(result.assignments[0].price).toBe(500);
  });

  it('handles two people, two rooms — equal bids', () => {
    // Both people value both rooms equally
    const bids = [
      [500, 500],
      [500, 500],
    ];
    const result = computeFairSplit(bids, 1000);

    expect(result.assignments).toHaveLength(2);
    expect(result.totalRent).toBe(1000);

    // Total prices should equal total rent
    const totalPrice = result.assignments.reduce((sum, a) => sum + a.price, 0);
    expect(totalPrice).toBeCloseTo(1000, 1);
  });

  it('handles two people, two rooms — different preferences', () => {
    // Person 0 prefers Room 0, Person 1 prefers Room 1
    const bids = [
      [800, 200],
      [200, 800],
    ];
    const result = computeFairSplit(bids, 1000);

    expect(result.assignments).toHaveLength(2);

    // Person 0 should get Room 0, Person 1 should get Room 1
    const p0 = result.assignments.find(a => a.personIndex === 0);
    const p1 = result.assignments.find(a => a.personIndex === 1);
    expect(p0).toBeDefined();
    expect(p1).toBeDefined();
    expect(p0!.roomIndex).toBe(0);
    expect(p1!.roomIndex).toBe(1);

    // Total should equal total rent
    const totalPrice = result.assignments.reduce((sum, a) => sum + a.price, 0);
    expect(totalPrice).toBeCloseTo(1000, 1);
  });

  it('handles three people, three rooms', () => {
    const bids = [
      [900, 500, 400],
      [400, 900, 500],
      [500, 400, 900],
    ];
    const result = computeFairSplit(bids, 1800);

    expect(result.assignments).toHaveLength(3);

    // Each person should get their preferred room
    const p0 = result.assignments.find(a => a.personIndex === 0);
    const p1 = result.assignments.find(a => a.personIndex === 1);
    const p2 = result.assignments.find(a => a.personIndex === 2);

    expect(p0!.roomIndex).toBe(0);
    expect(p1!.roomIndex).toBe(1);
    expect(p2!.roomIndex).toBe(2);

    // Total should equal total rent
    const totalPrice = result.assignments.reduce((sum, a) => sum + a.price, 0);
    expect(totalPrice).toBeCloseTo(1800, 1);
  });

  it('produces deterministic results', () => {
    const bids = [
      [700, 300],
      [400, 600],
    ];
    const result1 = computeFairSplit(bids, 1000);
    const result2 = computeFairSplit(bids, 1000);

    expect(result1.assignments).toEqual(result2.assignments);
  });

  it('calculates correct fair share', () => {
    const result = computeFairSplit([[500, 500], [500, 500]], 1000);
    expect(result.fairShare).toBe(500);
  });

  it('fair share is total rent divided by N', () => {
    const result = computeFairSplit(
      [[600, 400, 300], [300, 600, 400], [400, 300, 600]],
      1500,
    );
    expect(result.fairShare).toBe(500);
  });

  it('each assigned price is non-negative', () => {
    const bids = [
      [900, 100],
      [100, 900],
    ];
    const result = computeFairSplit(bids, 1000);
    for (const assignment of result.assignments) {
      expect(assignment.price).toBeGreaterThanOrEqual(0);
    }
  });

  it('works with asymmetric valuations', () => {
    // Person 0 strongly prefers Room 0, Person 1 is indifferent
    const bids = [
      [900, 100],
      [500, 500],
    ];
    const result = computeFairSplit(bids, 1000);
    expect(result.assignments).toHaveLength(2);

    const totalPrice = result.assignments.reduce((sum, a) => sum + a.price, 0);
    expect(totalPrice).toBeCloseTo(1000, 1);
  });
});

describe('createEmptyBids', () => {
  it('creates a square matrix of zeros', () => {
    const bids = createEmptyBids(3);
    expect(bids).toHaveLength(3);
    expect(bids[0]).toHaveLength(3);
    expect(bids.every(row => row.every(v => v === 0))).toBe(true);
  });

  it('creates empty for count 0', () => {
    const bids = createEmptyBids(0);
    expect(bids).toHaveLength(0);
  });
});

describe('getDefaultNames', () => {
  it('generates person names', () => {
    const names = getDefaultNames(3, 'Person');
    expect(names).toEqual(['Person 1', 'Person 2', 'Person 3']);
  });

  it('generates room names', () => {
    const names = getDefaultNames(2, 'Room');
    expect(names).toEqual(['Room 1', 'Room 2']);
  });
});
