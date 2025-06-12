//TODO :: implement code to generate QR codes for using RICO
import QRCode from 'qrcode';

export const generateBusinessQR = async (businessId: string, domainUrl: string): Promise<Buffer> => {
  const url = `${domainUrl}/review/${businessId}`;

  // Generates a QR code as a buffer (PNG format)
  const qrBuffer: Buffer = await QRCode.toBuffer(url, { type: 'png' });
  return qrBuffer;
};
