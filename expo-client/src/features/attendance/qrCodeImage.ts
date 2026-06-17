import QRCode from 'qrcode';

export async function generateQrDataUrl(payload: string, size = 240) {
  return QRCode.toDataURL(payload, {
    width: size,
    margin: 1,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#1B1338',
      light: '#FFFFFF',
    },
  });
}
