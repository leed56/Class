import { VatSummary } from './localVatStore';

function getQuarterRange(date = new Date()) {
  const year = date.getFullYear();
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0);

  return {
    quarterLabel: `Q${quarter} ${year}`,
    quarterStart: toSqlDate(start),
    quarterEnd: toSqlDate(end),
  };
}

function toSqlDate(date: Date) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getVatSummary(): Promise<VatSummary> {
  const range = getQuarterRange();
  const taxableRevenue = 763000;
  const outputVat = 137340;
  const confirmedSupplierSpend = 145500;
  const inputVat = 26190;
  const netPayable = outputVat - inputVat;

  return {
    quarterLabel: range.quarterLabel,
    quarterStart: range.quarterStart,
    quarterEnd: range.quarterEnd,
    outputVat,
    inputVat,
    netPayable,
    taxableRevenue,
    confirmedSupplierSpend,
    confirmedSupplierBills: 3,
    pendingSupplierBills: 1,
    confidenceScore: 88,
    status: 'review',
    statusLabel: 'Needs bill review',
    statusNote: 'Web preview uses a static VAT snapshot. Mobile uses local SQLite data.',
    lastSyncedAt: new Date().toISOString(),
  };
}

export type { VatStatus, VatSummary } from './localVatStore';
