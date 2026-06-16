export type VatStatus = 'ready' | 'review' | 'blocked';

export type VatSummary = {
  quarterLabel: string;
  quarterStart: string;
  quarterEnd: string;
  outputVat: number;
  inputVat: number;
  netPayable: number;
  taxableRevenue: number;
  confirmedSupplierSpend: number;
  confirmedSupplierBills: number;
  pendingSupplierBills: number;
  confidenceScore: number;
  status: VatStatus;
  statusLabel: string;
  statusNote: string;
  lastSyncedAt: string;
};
