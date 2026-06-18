import { getCurrentWorkspace } from '@/features/auth/authService';
import { ClassRow, Medium } from '@/lib/database.types';
import { getSupabase } from '@/lib/supabase';

export type InstituteType = 'solo' | 'academy' | 'institute';
export type SyllabusTrack = 'local' | 'cambridge' | 'edexcel' | 'other';
export type OfferingType = 'theory' | 'revision' | 'paper' | 'extra' | 'online';

export type ProgramRow = {
  id: string;
  workspace_id: string;
  name: string;
  syllabus: SyllabusTrack;
  grade: number;
  medium: Medium;
  active: boolean;
  created_at: string;
};

export type BatchRow = {
  id: string;
  workspace_id: string;
  program_id: string;
  name: string;
  intake_year: number | null;
  exam_year: number | null;
  active: boolean;
  created_at: string;
};

export type OfferingRow = {
  id: string;
  workspace_id: string;
  batch_id: string;
  offering_type: OfferingType;
  name: string;
  default_monthly_fee: number;
  active: boolean;
  created_at: string;
};

function programName(subject: string, grade: number) {
  return `${subject} Grade ${grade}`;
}

export async function ensureCatalogForClass(classRow: ClassRow) {
  if (classRow.offering_id) {
    return classRow.offering_id;
  }

  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before managing classes.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const name = programName(classRow.subject, classRow.grade);

  let programId: string | null = null;
  const { data: existingProgram } = await supabase
    .from('programs')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('name', name)
    .eq('grade', classRow.grade)
    .eq('medium', classRow.medium)
    .maybeSingle();

  if (existingProgram?.id) {
    programId = existingProgram.id;
  } else {
    const { data: program, error: programError } = await supabase
      .from('programs')
      .insert({
        workspace_id: workspace.id,
        name,
        syllabus: 'local',
        grade: classRow.grade,
        medium: classRow.medium,
      })
      .select('id')
      .single();
    if (programError) throw new Error(programError.message);
    programId = program.id;
  }

  let batchId: string | null = null;
  const { data: existingBatch } = await supabase
    .from('batches')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('program_id', programId)
    .eq('name', 'Main batch')
    .maybeSingle();

  if (existingBatch?.id) {
    batchId = existingBatch.id;
  } else {
    const { data: batch, error: batchError } = await supabase
      .from('batches')
      .insert({
        workspace_id: workspace.id,
        program_id: programId,
        name: 'Main batch',
        intake_year: new Date().getFullYear(),
      })
      .select('id')
      .single();
    if (batchError) throw new Error(batchError.message);
    batchId = batch.id;
  }

  const offeringName = `${classRow.subject} — Theory`;
  let offeringId: string | null = null;
  const { data: existingOffering } = await supabase
    .from('offerings')
    .select('id')
    .eq('workspace_id', workspace.id)
    .eq('batch_id', batchId)
    .eq('name', offeringName)
    .maybeSingle();

  if (existingOffering?.id) {
    offeringId = existingOffering.id;
  } else {
    const { data: offering, error: offeringError } = await supabase
      .from('offerings')
      .insert({
        workspace_id: workspace.id,
        batch_id: batchId,
        offering_type: 'theory',
        name: offeringName,
        default_monthly_fee: classRow.monthly_fee,
      })
      .select('id')
      .single();
    if (offeringError) throw new Error(offeringError.message);
    offeringId = offering.id;
  }

  const { error: linkError } = await supabase
    .from('classes')
    .update({ offering_id: offeringId })
    .eq('workspace_id', workspace.id)
    .eq('id', classRow.id);

  if (linkError) throw new Error(linkError.message);
  return offeringId;
}

export async function listPrograms() {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before viewing programs.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('active', true)
    .order('name', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as ProgramRow[];
}

export type CatalogOffering = OfferingRow & {
  linkedClassCount: number;
};

export type CatalogBatch = BatchRow & {
  offerings: CatalogOffering[];
};

export type CatalogProgram = ProgramRow & {
  batches: CatalogBatch[];
};

const offeringTypeLabels: Record<OfferingType, string> = {
  theory: 'Theory',
  revision: 'Revision',
  paper: 'Paper class',
  extra: 'Extra course',
  online: 'Online',
};

export function getOfferingTypeLabel(type: OfferingType) {
  return offeringTypeLabels[type];
}

export async function listCatalogTree(): Promise<CatalogProgram[]> {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before viewing the catalog.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const { data: programs, error: programError } = await supabase
    .from('programs')
    .select('*')
    .eq('workspace_id', workspace.id)
    .eq('active', true)
    .order('name', { ascending: true });

  if (programError) throw new Error(programError.message);
  if (!programs?.length) return [];

  const programIds = programs.map((row) => row.id);

  const { data: batches, error: batchError } = await supabase
    .from('batches')
    .select('*')
    .eq('workspace_id', workspace.id)
    .in('program_id', programIds)
    .eq('active', true)
    .order('name', { ascending: true });

  if (batchError) throw new Error(batchError.message);

  const batchIds = (batches ?? []).map((row) => row.id);
  const offeringsByBatch = new Map<string, CatalogOffering[]>();

  if (batchIds.length > 0) {
    const { data: offerings, error: offeringError } = await supabase
      .from('offerings')
      .select('*')
      .eq('workspace_id', workspace.id)
      .in('batch_id', batchIds)
      .eq('active', true)
      .order('name', { ascending: true });

    if (offeringError) throw new Error(offeringError.message);

    const offeringIds = (offerings ?? []).map((row) => row.id);
    const classCounts = new Map<string, number>();

    if (offeringIds.length > 0) {
      const { data: classes, error: classError } = await supabase
        .from('classes')
        .select('offering_id')
        .eq('workspace_id', workspace.id)
        .in('offering_id', offeringIds)
        .eq('active', true);

      if (classError) throw new Error(classError.message);
      for (const row of classes ?? []) {
        if (!row.offering_id) continue;
        classCounts.set(row.offering_id, (classCounts.get(row.offering_id) ?? 0) + 1);
      }
    }

    for (const row of offerings ?? []) {
      const list = offeringsByBatch.get(row.batch_id) ?? [];
      list.push({
        ...(row as OfferingRow),
        linkedClassCount: classCounts.get(row.id) ?? 0,
      });
      offeringsByBatch.set(row.batch_id, list);
    }
  }

  const batchesByProgram = new Map<string, CatalogBatch[]>();
  for (const row of batches ?? []) {
    const list = batchesByProgram.get(row.program_id) ?? [];
    list.push({
      ...(row as BatchRow),
      offerings: offeringsByBatch.get(row.id) ?? [],
    });
    batchesByProgram.set(row.program_id, list);
  }

  return (programs as ProgramRow[]).map((program) => ({
    ...program,
    batches: batchesByProgram.get(program.id) ?? [],
  }));
}

export type CreateOfferingInput = {
  batchId: string;
  offeringType: OfferingType;
  name: string;
  defaultMonthlyFee: number;
};

export type CreateProgramInput = {
  name: string;
  grade: number;
  medium: Medium;
  syllabus?: SyllabusTrack;
};

export type CreateBatchInput = {
  programId: string;
  name: string;
  intakeYear?: number | null;
  examYear?: number | null;
};

export async function createProgram(input: CreateProgramInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before adding programs.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const name = input.name.trim();
  if (!name) throw new Error('Program name is required.');

  const grade = Math.min(13, Math.max(1, Math.round(input.grade || 13)));

  const { data, error } = await supabase
    .from('programs')
    .insert({
      workspace_id: workspace.id,
      name,
      syllabus: input.syllabus ?? 'other',
      grade,
      medium: input.medium,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as ProgramRow;
}

export async function createBatch(input: CreateBatchInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before adding batches.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const name = input.name.trim();
  if (!name) throw new Error('Batch name is required.');

  const { data, error } = await supabase
    .from('batches')
    .insert({
      workspace_id: workspace.id,
      program_id: input.programId,
      name,
      intake_year: input.intakeYear ?? new Date().getFullYear(),
      exam_year: input.examYear ?? null,
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as BatchRow;
}

export async function createOffering(input: CreateOfferingInput) {
  const workspace = await getCurrentWorkspace();
  if (!workspace) throw new Error('Create your workspace before adding offerings.');

  const supabase = getSupabase();
  if (!supabase) throw new Error('Supabase is not configured.');

  const name = input.name.trim();
  if (!name) throw new Error('Offering name is required.');

  const { data, error } = await supabase
    .from('offerings')
    .insert({
      workspace_id: workspace.id,
      batch_id: input.batchId,
      offering_type: input.offeringType,
      name,
      default_monthly_fee: Math.max(0, Math.round(input.defaultMonthlyFee || 0)),
    })
    .select('*')
    .single();

  if (error) throw new Error(error.message);
  return data as OfferingRow;
}
