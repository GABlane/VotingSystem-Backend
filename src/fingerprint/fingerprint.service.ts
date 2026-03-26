import { Injectable } from '@nestjs/common';
import * as crypto from 'crypto';

@Injectable()
export class FingerprintService {
  /**
   * Generates a SHA-256 hash from device fingerprint data and IP address
   * This hash is used to prevent duplicate votes from the same device
   */
  generateHash(fingerprintData: string, ipAddress: string): string {
    const combined = `${fingerprintData}:${ipAddress}`;

    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Extracts the client's IP address from the request
   * Handles various proxy headers
   */
  extractIpAddress(request: any): string {
    // Try to get IP from various headers (in order of preference)
    const ip =
      request.headers['x-forwarded-for']?.split(',')[0].trim() ||
      request.headers['x-real-ip'] ||
      request.connection?.remoteAddress ||
      request.socket?.remoteAddress ||
      'unknown';

    // Clean up IPv6 localhost
    if (ip === '::1' || ip === '::ffff:127.0.0.1') {
      return '127.0.0.1';
    }

    return ip;
  }

  /**
   * Extracts user agent from the request
   */
  extractUserAgent(request: any): string {
    return request.headers['user-agent'] || 'unknown';
  }
}
