import { HardwareProfile, SEED_PROFILES } from '@exifguard/seed-profiles';

export interface DatabaseProfileRecord {
  id: string;
  camera_id: string;
  lens_id: string;
  profile_name: string;
  category: string;
  byte_order: string;
  exif_version: string;
  exif_tags: string; // JSON
  coherency_rules: string; // JSON
  makernote_structure: string; // JSON
  is_verified: number;
  submission_count: number;
  created_at?: string;
}

/**
 * Converts a HardwareProfile runtime object into an official SQL Database Record.
 */
export function profileToDatabaseRecord(profile: HardwareProfile): DatabaseProfileRecord {
  return {
    id: profile.id,
    camera_id: profile.device.model.toLowerCase().replace(/\s+/g, '_'),
    lens_id: profile.lens.model.toLowerCase().replace(/\s+/g, '_'),
    profile_name: profile.name,
    category: profile.category,
    byte_order: profile.coherency_rules.byte_order,
    exif_version: profile.exif_tags.ExifVersion || '0232',
    exif_tags: JSON.stringify(profile.exif_tags),
    coherency_rules: JSON.stringify(profile.coherency_rules),
    makernote_structure: JSON.stringify(profile.makernote_structure),
    is_verified: 1,
    submission_count: 1
  };
}

/**
 * Converts an official SQL Database Record back into a HardwareProfile runtime object.
 */
export function databaseRecordToProfile(record: DatabaseProfileRecord): HardwareProfile {
  return {
    id: record.id,
    name: record.profile_name,
    category: record.category as any,
    device: {
      make: record.profile_name.split(' ')[0] || 'Unknown',
      model: record.profile_name,
      software: 'Firmware Default',
      sensor_aspect_ratios: ['4:3', '16:9', '3:2']
    },
    lens: {
      make: record.profile_name.split(' ')[0] || 'Unknown',
      model: `${record.profile_name} Lens`,
      min_focal_length: 24,
      max_focal_length: 70,
      focal_length_35mm: 24,
      min_aperture: 1.8,
      max_aperture: 22
    },
    coherency_rules: typeof record.coherency_rules === 'string' ? JSON.parse(record.coherency_rules) : record.coherency_rules,
    exif_tags: typeof record.exif_tags === 'string' ? JSON.parse(record.exif_tags) : record.exif_tags,
    makernote_structure: typeof record.makernote_structure === 'string' ? JSON.parse(record.makernote_structure) : record.makernote_structure
  };
}

/**
 * Filter & Search Hardware Profiles by query string and category filter.
 */
export function searchProfiles(
  profiles: HardwareProfile[],
  query: string,
  categoryFilter: string = 'All'
): HardwareProfile[] {
  const q = query.trim().toLowerCase();

  return profiles.filter(p => {
    // Category match
    const categoryMatches = (categoryFilter === 'All') ||
      (categoryFilter === 'Contributed' && p.id.startsWith('contributed_')) ||
      (p.category.toLowerCase() === categoryFilter.toLowerCase());

    if (!categoryMatches) return false;

    if (!q) return true;

    // Search fields: Name, Make, Model, Lens Model, Makernote Format
    return (
      p.name.toLowerCase().includes(q) ||
      p.device.make.toLowerCase().includes(q) ||
      p.device.model.toLowerCase().includes(q) ||
      p.lens.model.toLowerCase().includes(q) ||
      p.makernote_structure.format.toLowerCase().includes(q)
    );
  });
}
