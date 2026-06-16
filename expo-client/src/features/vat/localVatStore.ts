import * as SQLite from 'expo-sqlite';

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

type VatSaleRow = {
  taxable_amount: number;
  vat_amount: number;
};

type SupplierBillRow = {
  supplier_name: string;
  bill_no: string;
  bill_date: string;
  taxable_amount: number;
  vat_amount: number;
  status: 'confirmed' | 'pending' | 'rejected';
};

const DATABASE_NAME = 'classflow_vat.db';
const VAT_RATE = 0.18;

function getQuarterRange(date = new Date()) {
  const year = date.getFullYear();
  const quarter = Math.floor(date.getMonth() / 3) + 1;
  const startMonth = (quarter - 1) * 3;
  const start = new Date(year, startMonth, 1);
  const end = new Date(year, startMonth + 3, 0);

  return {
    quarter,
    year,
    start,
    end,
    quarterLabel: `Q${quarter} ${year}`,
    quarterStart: toSqlDate(start),
    quarterEnd: toSqlDate(end),
  };
}

function toSqlDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function roundCurrency(value: number) {
  return Math.round(value);
}

async function getDb() {
  return SQLite.openDatabaseAsync(DATABASE_NAME);
}

async function setupVatDatabase() {
  const db = await getDb();

  await db.execAsync(`
    create table if not exists vat_sales (
      id integer primary key not null,
      receipt_no text not null unique,
      receipt_date text not null,
      taxable_amount integer not null,
      vat_amount integer not null,
      source text not null default 'fee_receipt'
    );

    create table if not exists supplier_bills (
      id integer primary key not null,
      supplier_name text not null,
      bill_no text not null unique,
      bill_date text not null,
      taxable_amount integer not null,
      vat_amount integer not null,
      status text not null check (status in ('confirmed', 'pending', 'rejected'))
    );
  `);

  const range = getQuarterRange();

  const salesCount = await db.getFirstAsync<{ count: number }>('select count(*) as count from vat_sales where receipt_date between ? and ?', [range.quarterStart, range.quarterEnd]);
  if (!salesCount?.count) {
    const sampleSales = [
      ['CF-2026-0412', `${range.year}-04-12`, 185000],
      ['CF-2026-0504', `${range.year}-05-04`, 214500],
      ['CF-2026-0527', `${range.year}-05-27`, 167000],
      ['CF-2026-0610', `${range.year}-06-10`, 196500],
    ];

    for (const [receiptNo, receiptDate, taxableAmount] of sampleSales) {
      await db.runAsync(
        'insert or ignore into vat_sales (receipt_no, receipt_date, taxable_amount, vat_amount, source) values (?, ?, ?, ?, ?)',
        [receiptNo, receiptDate, taxableAmount, roundCurrency(Number(taxableAmount) * VAT_RATE), 'fee_receipt'],
      );
    }
  }

  const supplierCount = await db.getFirstAsync<{ count: number }>('select count(*) as count from supplier_bills where bill_date between ? and ?', [range.quarterStart, range.quarterEnd]);
  if (!supplierCount?.count) {
    const sampleBills: SupplierBillRow[] = [
      { supplier_name: 'Print House Colombo', bill_no: 'PHC-9041', bill_date: `${range.year}-04-19`, taxable_amount: 42000, vat_amount: roundCurrency(42000 * VAT_RATE), status: 'confirmed' },
      { supplier_name: 'Hall Rent - Nugegoda', bill_no: 'HRN-2218', bill_date: `${range.year}-05-02`, taxable_amount: 85000, vat_amount: roundCurrency(85000 * VAT_RATE), status: 'confirmed' },
      { supplier_name: 'Stationery Lanka', bill_no: 'SL-1187', bill_date: `${range.year}-05-29`, taxable_amount: 18500, vat_amount: roundCurrency(18500 * VAT_RATE), status: 'confirmed' },
      { supplier_name: 'Internet & Utilities', bill_no: 'UTIL-4302', bill_date: `${range.year}-06-08`, taxable_amount: 24000, vat_amount: roundCurrency(24000 * VAT_RATE), status: 'pending' },
    ];

    for (const bill of sampleBills) {
      await db.runAsync(
        'insert or ignore into supplier_bills (supplier_name, bill_no, bill_date, taxable_amount, vat_amount, status) values (?, ?, ?, ?, ?, ?)',
        [bill.supplier_name, bill.bill_no, bill.bill_date, bill.taxable_amount, bill.vat_amount, bill.status],
      );
    }
  }

  return db;
}

export async function getVatSummary(): Promise<VatSummary> {
  const db = await setupVatDatabase();
  const range = getQuarterRange();

  const salesRows = await db.getAllAsync<VatSaleRow>('select taxable_amount, vat_amount from vat_sales where receipt_date between ? and ?', [range.quarterStart, range.quarterEnd]);
  const supplierRows = await db.getAllAsync<SupplierBillRow>('select supplier_name, bill_no, bill_date, taxable_amount, vat_amount, status from supplier_bills where bill_date between ? and ?', [range.quarterStart, range.quarterEnd]);

  const taxableRevenue = salesRows.reduce((sum, row) => sum + row.taxable_amount, 0);
  const outputVat = salesRows.reduce((sum, row) => sum + row.vat_amount, 0);
  const confirmedBills = supplierRows.filter((row) => row.status === 'confirmed');
  const pendingBills = supplierRows.filter((row) => row.status === 'pending');
  const confirmedSupplierSpend = confirmedBills.reduce((sum, row) => sum + row.taxable_amount, 0);
  const inputVat = confirmedBills.reduce((sum, row) => sum + row.vat_amount, 0);
  const netPayable = Math.max(outputVat - inputVat, 0);
  const confidenceScore = pendingBills.length === 0 ? 96 : Math.max(72, 96 - pendingBills.length * 8);
  const status: VatStatus = pendingBills.length === 0 ? 'ready' : 'review';

  return {
    quarterLabel: range.quarterLabel,
    quarterStart: range.quarterStart,
    quarterEnd: range.quarterEnd,
    outputVat,
    inputVat,
    netPayable,
    taxableRevenue,
    confirmedSupplierSpend,
    confirmedSupplierBills: confirmedBills.length,
    pendingSupplierBills: pendingBills.length,
    confidenceScore,
    status,
    statusLabel: status === 'ready' ? 'Ready for review' : 'Needs bill review',
    statusNote: pendingBills.length === 0 ? 'All supplier bills in this quarter are confirmed.' : `${pendingBills.length} supplier bill${pendingBills.length === 1 ? '' : 's'} still pending confirmation.`,
    lastSyncedAt: new Date().toISOString(),
  };
}
