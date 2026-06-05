import type { RoomAssignment, SplitResult } from '../types';

/**
 * Generate all permutations of indices [0..n-1]
 */
function permutations(n: number): number[][] {
  if (n === 0) return [[]];
  if (n === 1) return [[0]];

  const result: number[][] = [];
  const indices = Array.from({ length: n }, (_, i) => i);

  function generate(arr: number[], start: number): void {
    if (start === arr.length) {
      result.push([...arr]);
      return;
    }
    for (let i = start; i < arr.length; i++) {
      [arr[start], arr[i]] = [arr[i], arr[start]];
      generate(arr, start + 1);
      [arr[start], arr[i]] = [arr[i], arr[start]];
    }
  }

  generate([...indices], 0);
  return result;
}

/**
 * Normalize bids so each person's bids sum to totalRent.
 * This converts raw willingness-to-pay into coherent valuations.
 */
function normalizeBids(bids: number[][], totalRent: number): number[][] {
  return bids.map(row => {
    const sum = row.reduce((a, b) => a + b, 0);
    if (sum === 0) return row.map(() => totalRent / row.length);
    return row.map(v => (v * totalRent) / sum);
  });
}

/**
 * Compute envy-free prices for a given assignment.
 *
 * Given assignment σ (person i gets room σ[i]), we find prices p[j] such that:
 *   1. Σ p[j] = totalRent
 *   2. Each person prefers their assigned room (envy-free)
 *
 * Strategy: Use normalized bids as price anchors, then scale to match totalRent.
 * The person assigned to a room "pays" proportional to how they value it.
 */
function computePrices(
  normalizedBids: number[][],
  assignment: number[],
  totalRent: number,
): number[] {
  const n = assignment.length;

  // Base price for each room = average of all people's normalized bids for that room
  const roomPrices: number[] = Array(n).fill(0);
  for (let j = 0; j < n; j++) {
    let totalBid = 0;
    for (let i = 0; i < n; i++) {
      totalBid += normalizedBids[i][j];
    }
    roomPrices[j] = totalBid / n;
  }

  // Scale to sum to totalRent
  const priceSum = roomPrices.reduce((a, b) => a + b, 0);
  if (priceSum === 0) {
    return Array(n).fill(totalRent / n);
  }

  const scaledPrices = roomPrices.map(p => (p * totalRent) / priceSum);
  return scaledPrices.map(p => Math.round(p * 100) / 100);
}

/**
 * Check if an assignment is envy-free at given prices.
 * A person envies if they'd prefer another room at current prices.
 */
function checkEnvyFree(
  bids: number[][],
  assignment: number[],
  prices: number[],
): boolean {
  const n = assignment.length;

  for (let i = 0; i < n; i++) {
    const myRoom = assignment[i];
    const mySurplus = bids[i][myRoom] - prices[myRoom];

    for (let j = 0; j < n; j++) {
      if (j === myRoom) continue;
      const otherSurplus = bids[i][j] - prices[j];
      // Allow tiny tolerance for floating point
      if (otherSurplus - mySurplus > 0.01) {
        return false;
      }
    }
  }

  return true;
}

/**
 * Main algorithm: Compute the fairest envy-free rent split.
 *
 * Algorithm:
 * 1. Normalize bids so each person's valuations sum to totalRent
 * 2. Try all N! permutations of room assignments
 * 3. For each permutation, compute fair prices
 * 4. Check if envy-free; if not, score by minimum envy
 * 5. Return the best assignment with its prices
 */
export function computeFairSplit(
  bids: number[][],
  totalRent: number,
): SplitResult {
  const n = bids.length;

  if (n === 0 || totalRent <= 0) {
    return {
      assignments: [],
      isEnvyFree: false,
      totalRent,
      fairShare: 0,
    };
  }

  const normalizedBids = normalizeBids(bids, totalRent);
  const allPerms = permutations(n);

  let bestAssignment: number[] = allPerms[0];
  let bestPrices = computePrices(normalizedBids, bestAssignment, totalRent);
  let bestEnvyFree = checkEnvyFree(normalizedBids, bestAssignment, bestPrices);
  let bestMinSurplus = -Infinity;

  // Calculate initial min surplus
  for (let i = 0; i < n; i++) {
    const surplus = normalizedBids[i][bestAssignment[i]] - bestPrices[bestAssignment[i]];
    bestMinSurplus = Math.min(
      bestMinSurplus === -Infinity ? surplus : bestMinSurplus,
      surplus,
    );
  }

  for (const perm of allPerms) {
    const prices = computePrices(normalizedBids, perm, totalRent);
    const envyFree = checkEnvyFree(normalizedBids, perm, prices);

    // Calculate minimum surplus across all people
    let minSurplus = Infinity;
    let totalSurplus = 0;
    for (let i = 0; i < n; i++) {
      const surplus = normalizedBids[i][perm[i]] - prices[perm[i]];
      minSurplus = Math.min(minSurplus, surplus);
      totalSurplus += surplus;
    }

    // Prefer: envy-free > highest min surplus > highest total surplus
    const isBetter =
      (envyFree && !bestEnvyFree) ||
      (envyFree === bestEnvyFree && minSurplus > bestMinSurplus) ||
      (envyFree === bestEnvyFree &&
        Math.abs(minSurplus - bestMinSurplus) < 0.01 &&
        totalSurplus > normalizedBids.reduce((s, row, i) => s + row[bestAssignment[i]] - bestPrices[bestAssignment[i]], 0));

    if (isBetter) {
      bestAssignment = perm;
      bestPrices = prices;
      bestEnvyFree = envyFree;
      bestMinSurplus = minSurplus;
    }
  }

  // Build result
  const assignments: RoomAssignment[] = bestAssignment.map((roomIdx, personIdx) => ({
    personIndex: personIdx,
    roomIndex: roomIdx,
    price: bestPrices[roomIdx],
  }));

  // Verify total matches
  const actualTotal = assignments.reduce((sum, a) => sum + a.price, 0);
  const roundingError = totalRent - actualTotal;

  // Distribute rounding error to the largest price
  if (Math.abs(roundingError) > 0.01 && assignments.length > 0) {
    const maxIdx = assignments.reduce((mi, a, i) =>
      a.price > assignments[mi].price ? i : mi, 0);
    assignments[maxIdx] = {
      ...assignments[maxIdx],
      price: Math.round((assignments[maxIdx].price + roundingError) * 100) / 100,
    };
  }

  return {
    assignments,
    isEnvyFree: bestEnvyFree,
    totalRent,
    fairShare: Math.round((totalRent / n) * 100) / 100,
  };
}

/**
 * Create an empty bids matrix filled with zeros.
 */
export function createEmptyBids(count: number): number[][] {
  return Array.from({ length: count }, () => Array(count).fill(0));
}

/**
 * Default names generator.
 */
export function getDefaultNames(count: number, prefix: string): string[] {
  return Array.from({ length: count }, (_, i) => `${prefix} ${i + 1}`);
}
