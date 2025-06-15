import { expect, test } from 'vitest';
import { validateIftaPeriodData } from '../lib/utils/ifta';

const sample = {
  period: { quarter: 1, year: 2025 },
  summary: { totalMiles: 0, totalGallons: 0, averageMpg: 0, totalFuelCost: 0 },
  trips: [],
  fuelPurchases: [],
  jurisdictionSummary: [],
  report: null,
};

test('validateIftaPeriodData returns true for minimal valid data', () => {
  expect(validateIftaPeriodData(sample)).toBe(true);
});
