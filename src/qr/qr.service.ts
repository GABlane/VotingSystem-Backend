import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';

@Injectable()
export class QrService {
  constructor(private configService: ConfigService) {}

  async generateQRCode(projectId: string): Promise<string> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const voteUrl = `${frontendUrl}/vote/${projectId}`;

    try {
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(voteUrl, {
        width: 400,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'M',
      });

      return qrCodeDataUrl;
    } catch (error) {
      throw new Error(`Failed to generate QR code: ${error.message}`);
    }
  }

  async generatePrintableQR(projectId: string): Promise<Buffer> {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL') || 'http://localhost:3000';
    const voteUrl = `${frontendUrl}/vote/${projectId}`;

    try {
      // Generate high-resolution QR code for printing
      const buffer = await QRCode.toBuffer(voteUrl, {
        width: 1000,
        margin: 4,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H', // Highest error correction for printing
      });

      return buffer;
    } catch (error) {
      throw new Error(`Failed to generate printable QR code: ${error.message}`);
    }
  }
}
