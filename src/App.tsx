import React, { useState, useCallback, useEffect } from 'react';
import { BidsInput } from './components/BidsInput';
import { ResultsDisplay } from './components/ResultsDisplay';
import { computeFairSplit, createEmptyBids, getDefaultNames } from './lib/algorithm';
import { useLocalStorage } from './hooks/useLocalStorage';
import type { SplitResult } from './types';

const STORAGE_KEY = 'fairest-split-state';

interface AppState {
  roommateCount: number;
  roomNames: string[];
  personNames: string[];
  bids: number[][];
  totalRent: number;
}

function trackEvent(event: string, props?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.aif?.track) {
    window.aif.track(event, props);
  }
}

export default function App() {
  const [savedState, setSavedState] = useLocalStorage<AppState | null>(STORAGE_KEY, null);
  const [roommateCount, setRoommateCount] = useState(savedState?.roommateCount ?? 3);
  const [roomNames, setRoomNames] = useState<string[]>(
    savedState?.roomNames ?? getDefaultNames(3, 'Room'),
  );
  const [personNames, setPersonNames] = useState<string[]>(
    savedState?.personNames ?? getDefaultNames(3, 'Person'),
  );
  const [bids, setBids] = useState<number[][]>(
    savedState?.bids ?? createEmptyBids(3),
  );
  const [totalRent, setTotalRent] = useState(savedState?.totalRent ?? 0);
  const [result, setResult] = useState<SplitResult | null>(null);

  // Persist state to localStorage
  useEffect(() => {
    setSavedState({
      roommateCount,
      roomNames,
      personNames,
      bids,
      totalRent,
    });
  }, [roommateCount, roomNames, personNames, bids, totalRent, setSavedState]);

  // Track page view on mount
  useEffect(() => {
    trackEvent('page_view', { path: window.location.pathname });
  }, []);

  const handleRoommateCountChange = useCallback(
    (newCount: number) => {
      const clamped = Math.min(Math.max(newCount, 2), 6);
      setRoommateCount(clamped);
      setRoomNames(prev => {
        const defaults = getDefaultNames(clamped, 'Room');
        return defaults.map((d, i) => prev[i] || d);
      });
      setPersonNames(prev => {
        const defaults = getDefaultNames(clamped, 'Person');
        return defaults.map((d, i) => prev[i] || d);
      });
      setBids(prev => {
        const newBids = createEmptyBids(clamped);
        for (let i = 0; i < Math.min(prev.length, clamped); i++) {
          for (let j = 0; j < Math.min(prev[i].length, clamped); j++) {
            newBids[i][j] = prev[i][j];
          }
        }
        return newBids;
      });
      setResult(null);
    },
    [],
  );

  const handleBidChange = useCallback(
    (personIndex: number, roomIndex: number, value: number) => {
      setBids(prev => {
        const next = prev.map(row => [...row]);
        next[personIndex][roomIndex] = value;
        return next;
      });
    },
    [],
  );

  const handleRoomNameChange = useCallback((index: number, name: string) => {
    setRoomNames(prev => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  }, []);

  const handlePersonNameChange = useCallback((index: number, name: string) => {
    setPersonNames(prev => {
      const next = [...prev];
      next[index] = name;
      return next;
    });
  }, []);

  const handleCalculate = useCallback(() => {
    const computed = computeFairSplit(bids, totalRent);
    setResult(computed);
    trackEvent('split_calculated', {
      roommate_count: roommateCount,
      total_rent: totalRent,
      is_envy_free: computed.isEnvyFree,
    });
  }, [bids, totalRent, roommateCount]);

  const handleReset = useCallback(() => {
    setBids(createEmptyBids(roommateCount));
    setTotalRent(0);
    setResult(null);
    trackEvent('reset');
  }, [roommateCount]);

  const hasAllBids = bids.every(row => row.every(v => v > 0));
  const canCalculate = totalRent > 0 && hasAllBids;

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-2xl mx-auto px-4 py-6 sm:py-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Fairest Airbnb Split
          </h1>
          <p className="mt-2 text-gray-500 text-sm sm:text-base">
            Find the envy-free room assignment everyone can agree on. Enter what each person
            would pay and the total cost — the algorithm handles the rest.
          </p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Step 1: Roommate Count */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-4" aria-label="Setup">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">How many roommates?</h2>
            <p className="text-sm text-gray-500 mt-1">
              Including yourself — everyone gets their own room
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => handleRoommateCountChange(roommateCount - 1)}
              disabled={roommateCount <= 2}
              className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Remove one roommate"
            >
              −
            </button>
            <span className="text-2xl font-bold text-gray-900 w-8 text-center" aria-live="polite">
              {roommateCount}
            </span>
            <button
              type="button"
              onClick={() => handleRoommateCountChange(roommateCount + 1)}
              disabled={roommateCount >= 6}
              className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Add one roommate"
            >
              +
            </button>
          </div>

          {/* Person Names */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {personNames.map((name, i) => (
              <input
                key={`pname-${i}`}
                type="text"
                value={name}
                onChange={(e) => handlePersonNameChange(i, e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                aria-label={`Name for roommate ${i + 1}`}
                placeholder={`Person ${i + 1}`}
              />
            ))}
          </div>

          {/* Room Names */}
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">Room names</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {roomNames.map((name, i) => (
                <input
                  key={`rname-${i}`}
                  type="text"
                  value={name}
                  onChange={(e) => handleRoomNameChange(i, e.target.value)}
                  className="px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
                  aria-label={`Name for room ${i + 1}`}
                  placeholder={`Room ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </section>

        {/* Step 2: Total Cost */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3" aria-label="Total cost">
          <div>
            <label htmlFor="total-rent" className="block text-lg font-semibold text-gray-900">
              Total cost ($)
            </label>
            <p className="text-sm text-gray-500 mt-1">
              The total Airbnb booking cost
            </p>
          </div>
          <div className="relative max-w-xs">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-lg pointer-events-none">$</span>
            <input
              id="total-rent"
              type="number"
              min="0"
              step="50"
              value={totalRent || ''}
              onChange={(e) => {
                const val = parseFloat(e.target.value);
                setTotalRent(isNaN(val) ? 0 : Math.max(0, val));
              }}
              className="w-full pl-8 pr-3 py-3 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors"
              placeholder="1,200"
              aria-describedby="total-rent-help"
            />
          </div>
        </section>

        {/* Step 3: Bids Matrix */}
        <section className="bg-white rounded-xl border border-gray-200 shadow-sm p-5" aria-label="Bids input">
          <BidsInput
            personNames={personNames}
            roomNames={roomNames}
            bids={bids}
            onBidChange={handleBidChange}
          />
        </section>

        {/* Calculate Button */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleCalculate}
            disabled={!canCalculate}
            className="flex-1 py-3 px-6 text-white bg-red-500 hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-lg font-semibold text-base transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 outline-none"
          >
            Calculate fair split
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="py-3 px-4 text-gray-600 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg font-medium text-sm transition-colors focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 outline-none"
          >
            Reset
          </button>
        </div>

        {/* Results */}
        {result && (
          <ResultsDisplay
            result={result}
            personNames={personNames}
            roomNames={roomNames}
          />
        )}

        {!canCalculate && (
          <p className="text-center text-sm text-gray-400 py-2">
            {!totalRent
              ? 'Enter the total cost and each person\'s max payment to continue'
              : 'Fill in what each person would pay for each room'}
          </p>
        )}
      </main>

      <footer className="max-w-2xl mx-auto px-4 py-8 text-center text-xs text-gray-400">
        Uses an envy-free fair division algorithm — no one gets a raw deal.
      </footer>
    </div>
  );
}
