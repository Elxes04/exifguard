import { HardwareProfile } from '@exifguard/seed-profiles';
export interface DatabaseProfileRecord {
    id: string;
    camera_id: string;
    lens_id: string;
    profile_name: string;
    category: string;
    byte_order: string;
    exif_version: string;
    exif_tags: string;
    coherency_rules: string;
    makernote_structure: string;
    is_verified: number;
    submission_count: number;
    created_at?: string;
}
/**
 * Converts a HardwareProfile runtime object into an official SQL Database Record.
 */
export declare function profileToDatabaseRecord(profile: HardwareProfile): DatabaseProfileRecord;
/**
 * Converts an official SQL Database Record back into a HardwareProfile runtime object.
 */
export declare function databaseRecordToProfile(record: DatabaseProfileRecord): HardwareProfile;
/**
 * Filter & Search Hardware Profiles by query string and category filter.
 */
export declare function searchProfiles(profiles: HardwareProfile[], query: string, categoryFilter?: string): HardwareProfile[];
//# sourceMappingURL=index.d.ts.map