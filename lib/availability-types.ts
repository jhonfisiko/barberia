export type Slot = { t: string; b: string[] };

export type AvailabilityResult = {
  days: Record<string, Slot[]>;
  error?: string;
};