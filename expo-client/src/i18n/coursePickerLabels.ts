import { MARITIME_TRACKS, MaritimeTrack, MaritimeTrackInfo } from '@/features/courses/maritimeCourseModel';
import { ExamLevel } from '@/features/courses/slCourseModel';
import { SchoolSessionType } from '@/features/courses/schoolSubjectModel';

type Translate = (path: string) => string;

const EXAM_LEVEL_KEYS: Record<ExamLevel, string> = {
  'A/L': 'al',
  'O/L': 'ol',
  'Grade 5 Scholarship': 'grade5',
  'London A/L': 'londonAl',
  Other: 'other',
};

export function getLocalizedExamLevelLabel(level: ExamLevel, t: Translate) {
  return t(`examLevels.${EXAM_LEVEL_KEYS[level]}`);
}

export function listLocalizedExamLevels(t: Translate): { value: ExamLevel; label: string }[] {
  return (Object.keys(EXAM_LEVEL_KEYS) as ExamLevel[]).map((value) => ({
    value,
    label: getLocalizedExamLevelLabel(value, t),
  }));
}

function localizeMaritimeTrack(track: MaritimeTrackInfo, t: Translate): MaritimeTrackInfo {
  return {
    ...track,
    label: t(`maritimeTracks.${track.id}.label`),
    subtitle: t(`maritimeTracks.${track.id}.subtitle`),
  };
}

export function listLocalizedMaritimeTracks(t: Translate): MaritimeTrackInfo[] {
  return MARITIME_TRACKS.map((track) => localizeMaritimeTrack(track, t));
}

export function getLocalizedMaritimeTrack(track: MaritimeTrack, t: Translate): MaritimeTrackInfo | undefined {
  const base = MARITIME_TRACKS.find((item) => item.id === track);
  if (!base) return undefined;
  return localizeMaritimeTrack(base, t);
}

export function getLocalizedSchoolSessionLabel(type: SchoolSessionType, t: Translate) {
  return t(`schoolSessions.${type}`);
}

export function listLocalizedSchoolSessionOptions(t: Translate): { value: SchoolSessionType; label: string }[] {
  const types: SchoolSessionType[] = ['theory', 'revision', 'paper', 'mass'];
  return types.map((value) => ({ value, label: getLocalizedSchoolSessionLabel(value, t) }));
}
