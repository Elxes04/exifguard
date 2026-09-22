import { validateCoherency, auditPIIRisks } from '../src/index';
import { SEED_PROFILES } from '@exifguard/seed-profiles';

describe('Coherency Engine Tests', () => {
  const iphoneProfile = SEED_PROFILES.find(p => p.id === 'apple_iphone_13_pro')!;

  test('aspect ratio coherency check', () => {
    const res = validateCoherency({ width: 4032, height: 3024 }, iphoneProfile); // 4:3
    expect(res.isCohesive).toBe(true);
    expect(res.score).toBe(100);
  });

  test('PII audit detects GPS and serial numbers', () => {
    const report = auditPIIRisks({
      GPSLatitude: 37.7749,
      GPSLongitude: -122.4194,
      CameraSerialNumber: '1234567890',
      Make: 'Apple'
    });
    expect(report.hasGPS).toBe(true);
    expect(report.hasSerialNumber).toBe(true);
    expect(report.riskScore).toBeGreaterThan(40);
  });
});
