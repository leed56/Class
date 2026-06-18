import { listClasses } from '@/features/classes/classService';
import { getClassAttendanceAverages } from '@/features/attendance/attendanceService';
import { getCurrentMonthKey } from '@/features/fees/feeService';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { getSupabase } from '@/lib/supabase';

import { listBranches, listHalls } from './branchService';
import { BranchReportRow } from './models';

const UNASSIGNED_BRANCH_ID = 'unassigned';

export async function getBranchMonthlyReports(monthKey = getCurrentMonthKey()): Promise<BranchReportRow[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) return [];

  const supabase = getSupabase();
  if (!supabase) return [];

  const [branches, halls, classes] = await Promise.all([
    listBranches(),
    listHalls(),
    listClasses(),
  ]);

  const hallToBranch = new Map(halls.map((hall) => [hall.id, hall.branchId]));
  const branchNames = new Map(branches.map((branch) => [branch.id, branch.name]));
  branchNames.set(UNASSIGNED_BRANCH_ID, 'Unassigned location');

  const classIds = classes.map((item) => item.id);
  const [attendanceAverages, invoiceRows] = await Promise.all([
    getClassAttendanceAverages(classIds),
    supabase
      .from('fee_invoices')
      .select('class_id, monthly_fee, paid_amount')
      .eq('workspace_id', workspace.id)
      .eq('month', monthKey)
      .in('class_id', classIds.length ? classIds : ['00000000-0000-0000-0000-000000000000']),
  ]);

  if (invoiceRows.error) throw new Error(invoiceRows.error.message);

  const feeByClass = new Map<string, { collected: number; outstanding: number }>();
  for (const row of invoiceRows.data ?? []) {
    if (!row.class_id) continue;
    const bucket = feeByClass.get(row.class_id) ?? { collected: 0, outstanding: 0 };
    bucket.collected += row.paid_amount ?? 0;
    bucket.outstanding += Math.max(0, (row.monthly_fee ?? 0) - (row.paid_amount ?? 0));
    feeByClass.set(row.class_id, bucket);
  }

  const aggregates = new Map<
    string,
    { classCount: number; collected: number; outstanding: number; attendanceTotal: number }
  >();

  function ensureBucket(branchId: string) {
    if (!aggregates.has(branchId)) {
      aggregates.set(branchId, { classCount: 0, collected: 0, outstanding: 0, attendanceTotal: 0 });
    }
    return aggregates.get(branchId)!;
  }

  for (const tuitionClass of classes) {
    const branchId = tuitionClass.hallId
      ? hallToBranch.get(tuitionClass.hallId) ?? UNASSIGNED_BRANCH_ID
      : UNASSIGNED_BRANCH_ID;
    const bucket = ensureBucket(branchId);
    bucket.classCount += 1;
    const fees = feeByClass.get(tuitionClass.id);
    bucket.collected += fees?.collected ?? 0;
    bucket.outstanding += fees?.outstanding ?? 0;
    bucket.attendanceTotal += attendanceAverages.get(tuitionClass.id) ?? tuitionClass.attendanceAverage;
  }

  const rows: BranchReportRow[] = [];
  for (const [branchId, bucket] of aggregates.entries()) {
    const totalFees = bucket.collected + bucket.outstanding;
    rows.push({
      branchId,
      branchName: branchNames.get(branchId) ?? 'Branch',
      classCount: bucket.classCount,
      collected: bucket.collected,
      outstanding: bucket.outstanding,
      collectionPercent: totalFees === 0 ? 0 : Math.round((bucket.collected / totalFees) * 100),
      attendancePercent:
        bucket.classCount === 0 ? 0 : Math.round(bucket.attendanceTotal / bucket.classCount),
    });
  }

  return rows.sort((a, b) => b.collected - a.collected);
}
