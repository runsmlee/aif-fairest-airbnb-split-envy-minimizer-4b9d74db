import type { SplitResult } from '../types';

interface ResultsDisplayProps {
  result: SplitResult | null;
  personNames: string[];
  roomNames: string[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function ResultsDisplay({ result, personNames, roomNames }: ResultsDisplayProps) {
  if (!result) return null;

  return (
    <section
      className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-5"
      aria-label="Fair Split Results"
    >
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Fair Split Results</h2>
        {result.isEnvyFree && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
            Envy-free
          </span>
        )}
      </div>

      <div className="space-y-3">
        {result.assignments.map((assignment, idx) => {
          const personName = personNames[assignment.personIndex] || `Person ${assignment.personIndex + 1}`;
          const roomName = roomNames[assignment.roomIndex] || `Room ${assignment.roomIndex + 1}`;
          const isBelowFairShare = assignment.price <= result.fairShare;

          return (
            <div
              key={`result-${idx}`}
              className="flex items-center justify-between p-4 rounded-lg bg-gray-50 border border-gray-100"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-100 text-red-700 flex items-center justify-center text-sm font-bold">
                  {personName.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{personName}</p>
                  <p className="text-sm text-gray-500">
                    Gets <span className="font-medium text-gray-700">{roomName}</span>
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-gray-900">
                  {formatCurrency(assignment.price)}
                </p>
                <p className={`text-xs ${isBelowFairShare ? 'text-emerald-600' : 'text-amber-600'}`}>
                  {isBelowFairShare ? '≤' : '>'} fair share ({formatCurrency(result.fairShare)})
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="pt-3 border-t border-gray-200">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Total</span>
          <span className="font-semibold text-gray-900">{formatCurrency(result.totalRent)}</span>
        </div>
        <div className="flex justify-between text-sm mt-1">
          <span className="text-gray-500">Fair share (equal split)</span>
          <span className="text-gray-700">{formatCurrency(result.fairShare)}</span>
        </div>
      </div>
    </section>
  );
}
