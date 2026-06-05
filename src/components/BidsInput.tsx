interface BidsInputProps {
  personNames: string[];
  roomNames: string[];
  bids: number[][];
  onBidChange: (personIndex: number, roomIndex: number, value: number) => void;
}

export function BidsInput({ personNames, roomNames, bids, onBidChange }: BidsInputProps) {
  return (
    <fieldset className="space-y-3">
      <div>
        <legend className="text-lg font-semibold text-gray-900">
          Max they'd pay
        </legend>
        <p className="text-sm text-gray-500 mt-1">
          Enter the most each person would pay for each room
        </p>
      </div>

      <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
        <table className="w-full border-collapse" role="grid" aria-label="Bids matrix — maximum each person would pay for each room">
          <thead>
            <tr>
              <th
                className="px-3 py-2 text-left text-sm font-medium text-gray-500 border-b border-gray-200"
                scope="col"
              >
                <span className="sr-only">Person</span>
              </th>
              {roomNames.map((name, j) => (
                <th
                  key={`room-${j}`}
                  className="px-3 py-2 text-center text-sm font-medium text-gray-700 border-b border-gray-200 min-w-[100px]"
                  scope="col"
                >
                  {name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {personNames.map((personName, i) => (
              <tr key={`person-${i}`} className="border-b border-gray-100 last:border-0">
                <td className="px-3 py-2 text-sm font-medium text-gray-700 whitespace-nowrap">
                  {personName}
                </td>
                {roomNames.map((_, j) => (
                  <td key={`bid-${i}-${j}`} className="px-2 py-2">
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">$</span>
                      <input
                        type="number"
                        min="0"
                        step="10"
                        value={bids[i][j] || ''}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value);
                          onBidChange(i, j, isNaN(val) ? 0 : Math.max(0, val));
                        }}
                        className="w-full pl-6 pr-2 py-2 text-sm text-right border border-gray-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-colors bg-white"
                        aria-label={`${personName}'s max payment for ${roomNames[j]}`}
                        placeholder="0"
                      />
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </fieldset>
  );
}
