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
export declare const SEED_PROFILES: HardwareProfile[];
export declare function getProfileById(id: string): HardwareProfile | undefined;
//# sourceMappingURL=index.d.ts.map