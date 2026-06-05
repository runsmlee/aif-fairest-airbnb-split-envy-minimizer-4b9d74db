export interface RoomAssignment {
  personIndex: number;
  roomIndex: number;
  price: number;
}

export interface SplitResult {
  assignments: RoomAssignment[];
  isEnvyFree: boolean;
  totalRent: number;
  fairShare: number;
}

export interface SplitState {
  roommateCount: number;
  roomNames: string[];
  personNames: string[];
  bids: number[][]; // bids[personIndex][roomIndex]
  totalRent: number;
  result: SplitResult | null;
}
