import { Href, Redirect, useLocalSearchParams } from 'expo-router';

/**
 * Legacy route — redirects to signup so onboarding + invite flow always runs.
 */
export default function RegisterScreen() {
  const { invite } = useLocalSearchParams<{ invite?: string }>();
  const token = typeof invite === 'string' ? invite.trim() : '';
  const href = (token ? `/auth/signup?invite=${encodeURIComponent(token)}` : '/auth/signup') as Href;
  return <Redirect href={href} />;
}
