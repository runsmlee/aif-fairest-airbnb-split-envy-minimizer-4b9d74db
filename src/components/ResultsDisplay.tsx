import { useState, useCallback } from 'react';
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

function formatResultAsText(
  result: SplitResult,
  personNames: string[],
  roomNames: string[],
): string {
  const lines: string[] = [
    '🏠 Fairest Airbnb Split',
    `Total: ${formatCurrency(result.totalRent)} | Fair share: ${formatCurrency(result.fairShare)}`,
  ];
  if (result.isEnvyFree) {
    lines.push('✅ Envy-free split');
  }
  lines.push('');
  for (const assignment of result.assignments) {
    const personName = personNames[assignment.personIndex] || `Person ${assignment.personIndex + 1}`;
    const roomName = roomNames[assignment.roomIndex] || `Room ${assignment.roomIndex + 1}`;
    const relation = assignment.price <= result.fairShare ? '≤' : '>';
    lines.push(`${personName} → ${roomName}: ${formatCurrency(assignment.price)} (${relation} fair share)`);
  }
  return lines.join('\n');
}

function buildShareUrl(
  result: SplitResult,
  personNames: string[],
  roomNames: string[],
): string {
  const p = personNames.join(',');
  const r = roomNames.join(',');
  const a = result.assignments
    .map((asgn) => `${asgn.personIndex}-${asgn.roomIndex}-${asgn.price}`)
    .join(';');
  const params = new URLSearchParams({
    p,
    r,
    a,
    t: String(result.totalRent),
    f: String(result.fairShare),
    e: String(result.isEnvyFree ? 1 : 0),
  });
  const base = typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '';
  return `${base}?${params.toString()}`;
}

export function ResultsDisplay({ result, personNames, roomNames }: ResultsDisplayProps) {
  const [copiedText, setCopiedText] = useState<'text' | 'link' | null>(null);

  const handleCopyText = useCallback(async () => {
    if (!result) return;
    const text = formatResultAsText(result, personNames, roomNames);
    await navigator.clipboard.writeText(text);
    setCopiedText('text');
    setTimeout(() => setCopiedText(null), 2000);
  }, [result, personNames, roomNames]);

  const handleCopyLink = useCallback(async () => {
    if (!result) return;
    const url = buildShareUrl(result, personNames, roomNames);
    await navigator.clipboard.writeText(url);
    setCopiedText('link');
    setTimeout(() => setCopiedText(null), 2000);
  }, [result, personNames, roomNames]);

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

      {/* Share actions */}
      <div className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-gray-200">
        <button
          type="button"
          onClick={handleCopyText}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 outline-none"
          aria-label="Copy as text"
        >
          {copiedText === 'text' ? (
            <>
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-600">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copy as text
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleCopyLink}
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 text-sm font-medium rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 transition-colors focus:ring-2 focus:ring-red-500 focus:ring-offset-2 outline-none"
          aria-label="Copy share link"
        >
          {copiedText === 'link' ? (
            <>
              <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-emerald-600">Copied!</span>
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
              Copy share link
            </>
          )}
        </button>
      </div>
    </section>
  );
}
