import {
  ACADEMY_SECTORS,
  AcademySector,
  AcademySectorInfo,
  getSectorInfo,
} from '@/features/courses/slCourseModel';

type Translate = (path: string) => string;

function localizeSectorItem(item: AcademySectorInfo, t: Translate): AcademySectorInfo {
  return {
    ...item,
    label: t(`sectors.${item.id}.label`),
    subtitle: t(`sectors.${item.id}.subtitle`),
    examples: t(`sectors.${item.id}.examples`),
  };
}

export function getLocalizedSectorInfo(sector: AcademySector, t: Translate): AcademySectorInfo | undefined {
  const base = getSectorInfo(sector);
  if (!base) return undefined;
  return localizeSectorItem(base, t);
}

export function listLocalizedSectors(t: Translate): AcademySectorInfo[] {
  return ACADEMY_SECTORS.map((item) => localizeSectorItem(item, t));
}
