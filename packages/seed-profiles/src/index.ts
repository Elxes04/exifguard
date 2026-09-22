import iphone13Pro from '../profiles/apple_iphone_13_pro.json' with { type: 'json' };
import sonyA7iii from '../profiles/sony_a7iii_2470.json' with { type: 'json' };
import pixel7 from '../profiles/google_pixel_7.json' with { type: 'json' };
import canonR5 from '../profiles/canon_eos_r5.json' with { type: 'json' };

export interface HardwareProfile {
  id: string;
  name: string;
  category: 'Smartphone' | 'Mirrorless' | 'DSLR' | 'Compact';
  device: {
    make: string;
    model: string;
    software: string;
    sensor_aspect_ratios: string[];
  };
  lens: {
    make: string;
    model: string;
    min_focal_length: number;
    max_focal_length: number;
    focal_length_35mm: number;
    min_aperture: number;
    max_aperture: number;
  };
  coherency_rules: {
    iso_range: number[];
    shutter_speed_range: string[];
    supported_aspect_ratios: string[];
    byte_order: 'II' | 'MM';
  };
  exif_tags: Record<string, any>;
  makernote_structure: {
    format: string;
    header_signature: string;
    sample_tags: Record<string, string>;
  };
}

export const SEED_PROFILES: HardwareProfile[] = [
  iphone13Pro as unknown as HardwareProfile,
  sonyA7iii as unknown as HardwareProfile,
  pixel7 as unknown as HardwareProfile,
  canonR5 as unknown as HardwareProfile
];

export function getProfileById(id: string): HardwareProfile | undefined {
  return SEED_PROFILES.find(p => p.id === id);
}
