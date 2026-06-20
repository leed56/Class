import { LanguageCode } from '@/lib/database.types';

export type Locale = LanguageCode;

export type TranslationTree = {
  common: {
    loading: string;
    save: string;
    cancel: string;
    back: string;
    error: string;
    notSet: string;
  };
  tabs: {
    home: string;
    classes: string;
    students: string;
    fees: string;
    more: string;
  };
  auth: {
    appName: string;
    tagline: string;
    teacherSignIn: string;
    email: string;
    password: string;
    signIn: string;
    createAccount: string;
    newTeacher: string;
    parentPortal: string;
    parentPortalHint: string;
    demoMode: string;
    supabaseMissing: string;
    platformAdmin: string;
  };
  settings: {
    title: string;
    subtitle: string;
    language: string;
    languageHint: string;
    english: string;
    sinhala: string;
    tamil: string;
    teacherProfile: string;
    displayName: string;
    phone: string;
    workspaceLanguage: string;
  };
  parent: {
    loginTitle: string;
    loginSubtitle: string;
    phoneLabel: string;
    sendOtp: string;
    verifyTitle: string;
    otpHint: string;
    otpHintSms: string;
    verify: string;
  };
  dashboard: {
    greeting: string;
    students: string;
    collected: string;
    outstanding: string;
    defaulters: string;
    attendance: string;
  };
};
