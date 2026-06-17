/**
 * Sri Lanka–style mid-month enrollment rules (configurable per workspace).
 * - Join in last week of month → no fee for current month
 * - Join after 15th → half monthly fee
 * - Otherwise → full monthly fee
 */
export function calculateProRataMonthlyFee(
  fullFee: number,
  enrolledAt: Date,
  monthKey: string,
  enabled = true,
): number {
  if (!enabled || fullFee <= 0) return fullFee;

  const [year, month] = monthKey.split('-').map(Number);
  const enrollYear = enrolledAt.getFullYear();
  const enrollMonth = enrolledAt.getMonth() + 1;

  if (enrollYear !== year || enrollMonth !== month) {
    return fullFee;
  }

  const day = enrolledAt.getDate();
  const daysInMonth = new Date(year, month, 0).getDate();

  if (day >= daysInMonth - 6) {
    return 0;
  }
  if (day > 15) {
    return Math.round(fullFee / 2);
  }
  return fullFee;
}
