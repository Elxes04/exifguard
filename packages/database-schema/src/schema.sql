-- ExifGuard Official Database Schema (SQLite / PostgreSQL Compatible)

-- Hardware Camera Models Table
CREATE TABLE IF NOT EXISTS camera_models (
    id TEXT PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    category TEXT CHECK (category IN ('Smartphone', 'Mirrorless', 'DSLR', 'Compact')) DEFAULT 'Smartphone',
    sensor_aspect_ratios TEXT DEFAULT '["4:3", "16:9"]',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Lens Specifications Table
CREATE TABLE IF NOT EXISTS lens_models (
    id TEXT PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    min_focal_length REAL NOT NULL,
    max_focal_length REAL NOT NULL,
    focal_length_35mm INTEGER NOT NULL,
    min_aperture REAL NOT NULL,
    max_aperture REAL NOT NULL
);

-- Complete Hardware Metadata Profiles
CREATE TABLE IF NOT EXISTS hardware_profiles (
    id TEXT PRIMARY KEY,
    camera_id TEXT NOT NULL REFERENCES camera_models(id),
    lens_id TEXT REFERENCES lens_models(id),
    profile_name TEXT NOT NULL,
    category TEXT DEFAULT 'Smartphone',
    byte_order TEXT CHECK (byte_order IN ('II', 'MM')) DEFAULT 'II',
    exif_version TEXT DEFAULT '0232',
    exif_tags TEXT NOT NULL, -- JSON string
    coherency_rules TEXT NOT NULL, -- JSON string
    makernote_structure TEXT NOT NULL, -- JSON string
    is_verified INTEGER DEFAULT 0,
    submission_count INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Profile Search Indexes
CREATE INDEX IF NOT EXISTS idx_camera_make_model ON camera_models(make, model);
CREATE INDEX IF NOT EXISTS idx_profile_category ON hardware_profiles(category);
