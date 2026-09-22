import { HardwareProfile } from '@exifguard/seed-profiles';

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CoherencyCheckResult {
  isCohesive: boolean;
  score: number; // 0 - 100
  warnings: string[];
  coercedTags: Record<string, any>;
}

export interface PIIRiskReport {
  riskScore: number; // 0 (clean) - 100 (critical leak)
  detectedPIITags: string[];
  hasGPS: boolean;
  hasSerialNumber: boolean;
  hasTimestamps: boolean;
  hasOwnerName: boolean;
}

/**
 * Audit image metadata tags for Privacy / PII risks.
 */
export function auditPIIRisks(tags: Record<string, any>): PIIRiskReport {
  const piiTags: string[] = [];
  let score = 0;
  let hasGPS = false;
  let hasSerialNumber = false;
  let hasTimestamps = false;
  let hasOwnerName = false;

  const gpsKeys = ['GPSLatitude', 'GPSLongitude', 'GPSAltitude', 'GPSSpeed', 'GPSImgDirection', 'GPSPosition', 'GPSInfo'];
  for (const key of gpsKeys) {
    if (key in tags && tags[key] !== undefined && tags[key] !== null) {
      piiTags.push(key);
      if (!hasGPS) {
        hasGPS = true;
        score += 50; // Critical location leak
      }
    }
  }

  const serialKeys = ['InternalSerialNumber', 'LensSerialNumber', 'BodySerialNumber', 'CameraSerialNumber', 'SerialNumber'];
  for (const key of serialKeys) {
    if (key in tags && tags[key] !== undefined && tags[key] !== null) {
      piiTags.push(key);
      if (!hasSerialNumber) {
        hasSerialNumber = true;
        score += 30; // Hardware fingerprint leak
      }
    }
  }

  const timeKeys = ['DateTimeOriginal', 'CreateDate', 'ModifyDate', 'OffsetTimeOriginal', 'SubSecTimeOriginal', 'GPSDateStamp', 'GPSTimeStamp'];
  for (const key of timeKeys) {
    if (key in tags && tags[key] !== undefined && tags[key] !== null) {
      piiTags.push(key);
      if (!hasTimestamps) {
        hasTimestamps = true;
        score += 30; // Temporal activity leak
      }
    }
  }

  const ownerKeys = ['OwnerName', 'Artist', 'Copyright', 'CameraOwnerName', 'UserComment'];
  for (const key of ownerKeys) {
    if (key in tags && tags[key] !== undefined && tags[key] !== null) {
      piiTags.push(key);
      if (!hasOwnerName) {
        hasOwnerName = true;
        score += 25; // Identity leak
      }
    }
  }

  const deviceKeys = ['Make', 'Model', 'Software', 'LensModel'];
  for (const key of deviceKeys) {
    if (key in tags && tags[key] !== undefined && tags[key] !== null) {
      piiTags.push(key);
      score += 5; // Device model fingerprinting
    }
  }

  return {
    riskScore: Math.min(100, score),
    detectedPIITags: Array.from(new Set(piiTags)),
    hasGPS,
    hasSerialNumber,
    hasTimestamps,
    hasOwnerName
  };
}

/**
 * Validate and harmonize target device metadata against target image dimensions.
 */
export function validateCoherency(
  dimensions: ImageDimensions,
  profile: HardwareProfile,
  userOverrides: Record<string, any> = {}
): CoherencyCheckResult {
  const warnings: string[] = [];
  let score = 100;

  // 1. Aspect Ratio Match
  const imageAspect = dimensions.width / dimensions.height;
  const targetAspects = profile.coherency_rules.supported_aspect_ratios.map((ar: string) => {
    const [w, h] = ar.split(':').map(Number);
    return w / h;
  });

  const aspectMatches = targetAspects.some((ta: number) => Math.abs(ta - imageAspect) < 0.08 || Math.abs((1 / ta) - imageAspect) < 0.08);
  if (!aspectMatches) {
    warnings.push(`Image aspect ratio (${dimensions.width}x${dimensions.height}) differs from ${profile.device.model} standard sensor ratios (${profile.coherency_rules.supported_aspect_ratios.join(', ')}).`);
    score -= 15;
  }

  // 2. Coerce Aperture (FNumber)
  let fNumber = userOverrides.FNumber ?? profile.exif_tags.FNumber ?? 2.8;
  if (fNumber < profile.lens.min_aperture) {
    warnings.push(`Aperture f/${fNumber} is below target lens minimum f/${profile.lens.min_aperture}. Coercing to f/${profile.lens.min_aperture}.`);
    fNumber = profile.lens.min_aperture;
    score -= 10;
  } else if (fNumber > profile.lens.max_aperture) {
    warnings.push(`Aperture f/${fNumber} exceeds target lens maximum f/${profile.lens.max_aperture}. Coercing to f/${profile.lens.max_aperture}.`);
    fNumber = profile.lens.max_aperture;
    score -= 10;
  }

  // 3. Coerce Focal Length
  let focalLength = userOverrides.FocalLength ?? profile.exif_tags.FocalLength ?? profile.lens.min_focal_length;
  if (focalLength < profile.lens.min_focal_length) {
    warnings.push(`Focal length ${focalLength}mm is below lens wide limit ${profile.lens.min_focal_length}mm.`);
    focalLength = profile.lens.min_focal_length;
    score -= 10;
  } else if (focalLength > profile.lens.max_focal_length) {
    warnings.push(`Focal length ${focalLength}mm exceeds lens telephoto limit ${profile.lens.max_focal_length}mm.`);
    focalLength = profile.lens.max_focal_length;
    score -= 10;
  }

  // Calculate 35mm Equivalent
  const focalLength35mm = Math.round(profile.lens.focal_length_35mm * (focalLength / (profile.lens.min_focal_length || 1)));

  // Build Final Coerced Tag Set
  const coercedTags: Record<string, any> = {
    ...profile.exif_tags,
    ...userOverrides,
    ExifImageWidth: dimensions.width,
    ExifImageHeight: dimensions.height,
    FNumber: fNumber,
    FocalLength: focalLength,
    FocalLengthIn35mmFormat: focalLength35mm
  };

  return {
    isCohesive: warnings.length === 0,
    score: Math.max(0, score),
    warnings,
    coercedTags
  };
}
