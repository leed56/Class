type Translate = (path: string) => string;

export const COURSE_TEMPLATE_LOCALE_KEYS: Record<string, string> = {
  'al-combined-maths-theory-si': 'alCombinedMathsTheorySi',
  'al-combined-maths-revision-si': 'alCombinedMathsRevisionSi',
  'al-physics-theory-si': 'alPhysicsTheorySi',
  'ol-science-theory-si': 'olScienceTheorySi',
  'it-dip-software-eng': 'itDipSoftwareEng',
  'it-hdip-computer-eng': 'itHdipComputerEng',
  'it-cert-web-dev': 'itCertWebDev',
  'gem-dip-professional': 'gemDipProfessional',
  'gem-nvq-cutting': 'gemNvqCutting',
  'gem-cert-basic': 'gemCertBasic',
  'psy-dip-counselling': 'psyDipCounselling',
  'psy-module-part1': 'psyModulePart1',
  'psy-cert-skills': 'psyCertSkills',
  'biz-hnd-management': 'bizHndManagement',
  'lang-ielts-prep': 'langIeltsPrep',
  'hotel-cert-food': 'hotelCertFood',
  'health-nvq-nursing-aide': 'healthNvqNursingAide',
  'aviation-cabin-crew': 'aviationCabinCrew',
  'nvq-electrician': 'nvqElectrician',
  'mar-nav-cadet-p1': 'marNavCadetP1',
  'mar-nav-cadet-p3': 'marNavCadetP3',
  'mar-eng-cadet-p1': 'marEngCadetP1',
  'mar-eng-cadet-p2': 'marEngCadetP2',
  'mar-eng-cadet-p4': 'marEngCadetP4',
  'mar-eto-cadet-p1': 'marEtoCadetP1',
  'mar-presea-deck-rating': 'marPreseaDeckRating',
  'mar-presea-engine-rating': 'marPreseaEngineRating',
  'mar-cop-able-deck': 'marCopAbleDeck',
  'mar-nav-oow-prep': 'marNavOowPrep',
  'mar-stcw-pst': 'marStcwPst',
  'mar-stcw-pssr': 'marStcwPssr',
  'mar-stcw-fa': 'marStcwFa',
  'mar-stcw-ff': 'marStcwFf',
  'mar-stcw-basic-bundle': 'marStcwBasicBundle',
  'mar-stcw-aff': 'marStcwAff',
  'mar-brm-mgmt': 'marBrmMgmt',
  'mar-erm-sim-op': 'marErmSimOp',
  'mar-english-op': 'marEnglishOp',
  'mar-tanker-oil-chem': 'marTankerOilChem',
};

function localizedOrFallback(t: Translate, path: string, fallback: string) {
  const translated = t(path);
  return translated === path ? fallback : translated;
}

export function getLocalizedCourseTemplateLabel(templateId: string, fallback: string, t: Translate) {
  const key = COURSE_TEMPLATE_LOCALE_KEYS[templateId];
  if (!key) return fallback;
  return localizedOrFallback(t, `courseTemplateLabels.${key}`, fallback);
}

export function getLocalizedCourseTemplatePhaseLabel(templateId: string, fallback: string | undefined, t: Translate) {
  if (!fallback) return undefined;
  const key = COURSE_TEMPLATE_LOCALE_KEYS[templateId];
  if (!key) return fallback;
  return localizedOrFallback(t, `courseTemplateExtras.${key}.phaseLabel`, fallback);
}

export function getLocalizedCourseTemplateDurationNote(templateId: string, fallback: string | undefined, t: Translate) {
  if (!fallback) return undefined;
  const key = COURSE_TEMPLATE_LOCALE_KEYS[templateId];
  if (!key) return fallback;
  return localizedOrFallback(t, `courseTemplateExtras.${key}.durationNote`, fallback);
}

export function getLocalizedIntakeLabel(intakeLabel: string | undefined, t: Translate) {
  if (!intakeLabel) return undefined;
  if (intakeLabel === '2026 Intake') {
    return localizedOrFallback(t, 'classForm.intake2026', intakeLabel);
  }
  return intakeLabel;
}
