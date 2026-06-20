/** Text.lk SMS gateway — https://text.lk/docs/send-sms/ */
export const TEXT_LK_SEND_URL = 'https://app.text.lk/api/v3/sms/send';

export const TEXT_LK_EDGE_SECRETS = {
  apiToken: 'TEXT_LK_API_TOKEN',
  senderId: 'TEXT_LK_SENDER_ID',
} as const;

export const TEXT_LK_DEFAULT_SENDER_ID = 'TextLKDemo';
