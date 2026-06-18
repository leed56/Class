import AsyncStorage from '@react-native-async-storage/async-storage';

const INVITE_TOKEN_KEY = 'classflow_platform_invite_token';

export async function saveInviteToken(token: string) {
  await AsyncStorage.setItem(INVITE_TOKEN_KEY, token.trim());
}

export async function readInviteToken() {
  const value = await AsyncStorage.getItem(INVITE_TOKEN_KEY);
  return value?.trim() || null;
}

export async function clearInviteToken() {
  await AsyncStorage.removeItem(INVITE_TOKEN_KEY);
}
