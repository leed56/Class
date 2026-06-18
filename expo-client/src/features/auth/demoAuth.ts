export const DEMO_PARENT_PHONE = '0771234567';
export const DEMO_PARENT_OTP = '123456';

export const DEMO_TEACHER_EMAIL =
  process.env.EXPO_PUBLIC_DEMO_TEACHER_EMAIL?.trim() || 'demo@classflow.lk';
export const DEMO_TEACHER_PASSWORD =
  process.env.EXPO_PUBLIC_DEMO_TEACHER_PASSWORD?.trim() || 'ClassflowDemo1!';

export function isPilotDemoAuthEnabled() {
  return process.env.EXPO_PUBLIC_PILOT_DEMO_AUTH !== 'false';
}
