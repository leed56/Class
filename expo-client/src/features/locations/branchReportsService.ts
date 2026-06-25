import { listClasses } from '@/features/classes/classService';
import { getClassAttendanceAverages } from '@/features/attendance/attendanceService';
import { getCurrentMonthKey } from '@/features/fees/feeService';
import { getCurrentWorkspace } from '@/features/auth/authService';
import { getSupabase } from '@/lib/supabase';

import { listBranches, listHalls } from './branchService';
import {
  BranchMonthlyReport,
  HallReportRow,
  UNASSIGNED_BRANCH_ID,
  UNASSIGNED_HALL_ID,
} from './models';

type FeeBucket = { collected: number; outstanding: number };
type AggregateBucket = { classCount: number; collected: number; outstanding: number; attendanceTotal: number };

function buildReportRow(
  classCount: number,
  collected: number,
  outstanding: number,
  attendanceTotal: number,
): Omit<HallReportRow, 'hallId' | 'hallName'> {
  const totalFees = collected + outstanding;
  return {
    classCount,
    collected,
    outstanding,
    collectionPercent: totalFees === 0 ? 0 : Math.round((collected / totalFees) * 100),
    attendancePercent: classCount === 0 ? 0 : Math.round(attendanceTotal / classCount),
  };
}

function ensureBucket(map: Map<string, AggregateBucket>, key: string) {
  if (!map.has(key)) {
    map.set(key, { classCount: 0, collected: 0, outstanding: 0, attendanceTotal: 0 });
  }
  return map.get(key)!;
}

export async function getBranchMonthlyReports(monthKey = getCurrentMonthKey()): Promise<BranchMonthlyReport[]> {
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
  const hallNames = new Map(halls.map((hall) => [hall.id, hall.name]));
  const branchNames = new Map(branches.map((branch) => [branch.id, branch.name]));

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

  const feeByClass = new Map<string, FeeBucket>();
  for (const row of invoiceRows.data ?? []) {
    if (!row.class_id) continue;
    const bucket = feeByClass.get(row.class_id) ?? { collected: 0, outstanding: 0 };
    bucket.collected += row.paid_amount ?? 0;
    bucket.outstanding += Math.max(0, (row.monthly_fee ?? 0) - (row.paid_amount ?? 0));
    feeByClass.set(row.class_id, bucket);
  }

  const branchAggregates = new Map<string, AggregateBucket>();
  const hallAggregates = new Map<string, AggregateBucket>();
  const hallBranchByHall = new Map<string, string>();

  for (const tuitionClass of classes) {
    const branchId = tuitionClass.hallId
      ? hallToBranch.get(tuitionClass.hallId) ?? UNASSIGNED_BRANCH_ID
      : UNASSIGNED_BRANCH_ID;
    const hallId = tuitionClass.hallId ?? UNASSIGNED_HALL_ID;
    hallBranchByHall.set(hallId, branchId);

    const fees = feeByClass.get(tuitionClass.id);
    const attendance = attendanceAverages.get(tuitionClass.id) ?? tuitionClass.attendanceAverage;

    const branchBucket = ensureBucket(branchAggregates, branchId);
    branchBucket.classCount += 1;
    branchBucket.collected += fees?.collected ?? 0;
    branchBucket.outstanding += fees?.outstanding ?? 0;
    branchBucket.attendanceTotal += attendance;

    const hallBucket = ensureBucket(hallAggregates, hallId);
    hallBucket.classCount += 1;
    hallBucket.collected += fees?.collected ?? 0;
    hallBucket.outstanding += fees?.outstanding ?? 0;
    hallBucket.attendanceTotal += attendance;
  }

  const hallsByBranch = new Map<string, HallReportRow[]>();
  for (const [hallId, bucket] of hallAggregates.entries()) {
    const branchId = hallBranchByHall.get(hallId) ?? UNASSIGNED_BRANCH_ID;
    const hallName = hallId === UNASSIGNED_HALL_ID ? '' : hallNames.get(hallId) ?? 'Hall';
    const hallRow: HallReportRow = {
      hallId,
      hallName,
      ...buildReportRow(bucket.classCount, bucket.collected, bucket.outstanding, bucket.attendanceTotal),
    };
    const branchHalls = hallsByBranch.get(branchId) ?? [];
    branchHalls.push(hallRow);
    hallsByBranch.set(branchId, branchHalls);
  }

  const rows: BranchMonthlyReport[] = [];
  for (const [branchId, bucket] of branchAggregates.entries()) {
    const hallsForBranch = (hallsByBranch.get(branchId) ?? []).sort((a, b) => b.collected - a.collected);
    rows.push({
      branchId,
      branchName: branchNames.get(branchId) ?? '',
      ...buildReportRow(bucket.classCount, bucket.collected, bucket.outstanding, bucket.attendanceTotal),
      halls: hallsForBranch,
    });
  }

  return rows.sort((a, b) => b.collected - a.collected);
}
