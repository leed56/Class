import { isServiceError, resolveServiceErrorMessage } from '@/i18n/serviceErrors';

type Translate = (path: string) => string;

type ErrorMapping = {
  codes?: Record<string, string>;
  patterns?: Array<{ pattern: RegExp; key: string }>;
};

const AUTH_ERROR_MAPPING: ErrorMapping = {
  codes: {
    invalid_credentials: 'auth.invalidCredentials',
    email_not_confirmed: 'auth.emailNotConfirmed',
    user_already_registered: 'auth.userAlreadyRegistered',
    weak_password: 'auth.weakPassword',
    over_request_rate_limit: 'auth.tooManyRequests',
    signup_disabled: 'auth.signupDisabled',
  },
  patterns: [
    { pattern: /invalid login credentials/i, key: 'auth.invalidCredentials' },
    { pattern: /email not confirmed/i, key: 'auth.emailNotConfirmed' },
    { pattern: /already registered/i, key: 'auth.userAlreadyRegistered' },
    { pattern: /password should be at least/i, key: 'auth.weakPassword' },
    { pattern: /rate limit/i, key: 'auth.tooManyRequests' },
  ],
};

const PARENT_AUTH_ERROR_MAPPING: ErrorMapping = {
  patterns: [
    { pattern: /invalid otp/i, key: 'parent.otpInvalid' },
    { pattern: /otp expired/i, key: 'parent.otpExpired' },
    { pattern: /no student/i, key: 'parent.phoneNotRegistered' },
    { pattern: /phone.*not found/i, key: 'parent.phoneNotRegistered' },
  ],
};

function resolveMappedError(
  error: unknown,
  t: Translate,
  mapping: ErrorMapping,
  fallbackKey: string,
) {
  if (isServiceError(error)) {
    return resolveServiceErrorMessage(error, t, fallbackKey);
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const code = String((error as { code: unknown }).code);
    const key = mapping.codes?.[code];
    if (key) return t(key);
  }

  const message =
    error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  if (message) {
    for (const entry of mapping.patterns ?? []) {
      if (entry.pattern.test(message)) return t(entry.key);
    }
    return message;
  }

  return t(fallbackKey);
}

export function resolveAuthErrorMessage(error: unknown, t: Translate, fallbackKey: string) {
  return resolveMappedError(error, t, AUTH_ERROR_MAPPING, fallbackKey);
}

export function resolveParentAuthErrorMessage(error: unknown, t: Translate, fallbackKey: string) {
  return resolveMappedError(error, t, PARENT_AUTH_ERROR_MAPPING, fallbackKey);
}
