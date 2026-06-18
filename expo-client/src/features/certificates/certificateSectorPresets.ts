import { AcademySector } from '@/features/courses/slCourseModel';

export type SectorCertificatePreset = {
  label: string;
  signatoryTitle: string;
  completionBody: string;
  achievementBody: string;
  footerNote: string;
};

const maritimePreset: SectorCertificatePreset = {
  label: 'Maritime (STCW / rating)',
  signatoryTitle: 'Principal / DPA',
  completionBody:
    'This is to certify that {{student_name}} has successfully completed {{title}} in accordance with the training standards of {{workspace_name}}, meeting the attendance and assessment requirements for issuance of this certificate. Serial: {{serial_no}}. Date: {{issued_on}}.',
  achievementBody:
    'This is to certify that {{student_name}} has demonstrated outstanding competence in {{title}} at {{workspace_name}}, exceeding the minimum standards for this programme. Serial: {{serial_no}}. Date: {{issued_on}}.',
  footerNote: 'Issued via ClassFlow • Maritime training record',
};

const itPreset: SectorCertificatePreset = {
  label: 'IT & technology (diploma / NVQ)',
  signatoryTitle: 'Academic Director',
  completionBody:
    'This is to certify that {{student_name}} has successfully completed {{title}} at {{workspace_name}}, having satisfied the coursework, project and attendance requirements of the programme. Serial: {{serial_no}}. Date: {{issued_on}}.',
  achievementBody:
    'This is to certify that {{student_name}} has achieved distinction-level performance in {{title}} at {{workspace_name}}. Serial: {{serial_no}}. Date: {{issued_on}}.',
  footerNote: 'Issued via ClassFlow • ICT qualification record',
};

const schoolPreset: SectorCertificatePreset = {
  label: 'School tuition (O/L & A/L)',
  signatoryTitle: 'Director',
  completionBody:
    'This is to certify that {{student_name}} has successfully completed {{title}} at {{workspace_name}}.',
  achievementBody:
    'This is to certify that {{student_name}} has demonstrated outstanding achievement in {{title}} at {{workspace_name}}.',
  footerNote: 'Issued via ClassFlow',
};

export function getSectorCertificatePreset(sector: AcademySector | string | null | undefined): SectorCertificatePreset {
  if (sector === 'maritime') return maritimePreset;
  if (sector === 'it_technology') return itPreset;
  return schoolPreset;
}

export function listSectorCertificatePresets(sector: AcademySector | string | null | undefined) {
  const primary = getSectorCertificatePreset(sector);
  const extras = [maritimePreset, itPreset, schoolPreset].filter((preset) => preset.label !== primary.label);
  return [primary, ...extras];
}
