import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { SEED_PROFILES, HardwareProfile } from '@exifguard/seed-profiles';
import { databaseRecordToProfile, profileToDatabaseRecord } from '@exifguard/database-schema';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// Initialize SQLite Database
const dbPath = process.env.DB_PATH || path.join(__dirname, '../exifguard_public.db');
const db = new Database(dbPath);

// Enable WAL Mode for high concurrency
db.pragma('journal_mode = WAL');

// Create Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS camera_models (
      id TEXT PRIMARY KEY,
      make TEXT NOT NULL,
      model TEXT NOT NULL,
      category TEXT DEFAULT 'Smartphone',
      sensor_aspect_ratios TEXT DEFAULT '["4:3", "16:9"]',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

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

  CREATE TABLE IF NOT EXISTS hardware_profiles (
      id TEXT PRIMARY KEY,
      camera_id TEXT NOT NULL,
      lens_id TEXT,
      profile_name TEXT NOT NULL,
      category TEXT DEFAULT 'Smartphone',
      byte_order TEXT DEFAULT 'II',
      exif_version TEXT DEFAULT '0232',
      exif_tags TEXT NOT NULL,
      coherency_rules TEXT NOT NULL,
      makernote_structure TEXT NOT NULL,
      is_verified INTEGER DEFAULT 1,
      submission_count INTEGER DEFAULT 1,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_profile_category ON hardware_profiles(category);
`);

// Pre-populate Database with Official Seed Profiles if empty
const countStmt = db.prepare('SELECT COUNT(*) as count FROM hardware_profiles');
const row = countStmt.get() as { count: number };

if (row.count === 0) {
  console.log('Initializing hardware profile database with seed entries...');
  const insertStmt = db.prepare(`
    INSERT INTO hardware_profiles 
    (id, camera_id, lens_id, profile_name, category, byte_order, exif_version, exif_tags, coherency_rules, makernote_structure, is_verified, submission_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1)
  `);

  for (const seed of SEED_PROFILES) {
    const rec = profileToDatabaseRecord(seed);
    insertStmt.run(
      rec.id, rec.camera_id, rec.lens_id, rec.profile_name,
      rec.category, rec.byte_order, rec.exif_version,
      rec.exif_tags, rec.coherency_rules, rec.makernote_structure
    );
  }
}

/**
 * GET /api/profiles - Retrieve hardware profiles with optional filtering
 */
app.get('/api/profiles', (req, res) => {
  try {
    const search = (req.query.search as string || '').trim().toLowerCase();
    const category = (req.query.category as string || 'All').trim();

    const stmt = db.prepare('SELECT * FROM hardware_profiles ORDER BY created_at DESC');
    const records = stmt.all() as any[];

    let profiles: HardwareProfile[] = records.map(databaseRecordToProfile);

    if (category !== 'All') {
      profiles = profiles.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    if (search) {
      profiles = profiles.filter(p =>
        p.name.toLowerCase().includes(search) ||
        p.device.make.toLowerCase().includes(search) ||
        p.device.model.toLowerCase().includes(search) ||
        p.lens.model.toLowerCase().includes(search)
      );
    }

    res.json({
      success: true,
      count: profiles.length,
      profiles
    });
  } catch (err) {
    console.error('API Error:', err);
    res.status(500).json({ success: false, error: 'Failed to query public profiles database' });
  }
});

/**
 * POST /api/profiles - Submit hardware profile to database
 */
app.post('/api/profiles', (req, res) => {
  try {
    const profilePayload: HardwareProfile = req.body;

    if (!profilePayload || !profilePayload.name || !profilePayload.exif_tags) {
      return res.status(400).json({ success: false, error: 'Invalid hardware profile payload' });
    }

    const id = profilePayload.id || `public_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    profilePayload.id = id;

    const rec = profileToDatabaseRecord(profilePayload);

    const insertStmt = db.prepare(`
      INSERT OR REPLACE INTO hardware_profiles 
      (id, camera_id, lens_id, profile_name, category, byte_order, exif_version, exif_tags, coherency_rules, makernote_structure, is_verified, submission_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, COALESCE((SELECT submission_count FROM hardware_profiles WHERE id = ?) + 1, 1))
    `);

    insertStmt.run(
      rec.id, rec.camera_id, rec.lens_id, rec.profile_name,
      rec.category, rec.byte_order, rec.exif_version,
      rec.exif_tags, rec.coherency_rules, rec.makernote_structure,
      rec.id
    );

    console.log(`Hardware profile published: ${rec.profile_name} [${rec.id}]`);

    res.status(201).json({
      success: true,
      message: 'Profile published to database',
      profile: profilePayload
    });
  } catch (err) {
    console.error('Submission API Error:', err);
    res.status(500).json({ success: false, error: 'Failed to publish profile to database' });
  }
});

/**
 * GET /api/stats - Database statistics
 */
app.get('/api/stats', (req, res) => {
  const totalProfiles = (db.prepare('SELECT COUNT(*) as count FROM hardware_profiles').get() as any).count;
  const totalSubmissions = (db.prepare('SELECT SUM(submission_count) as total FROM hardware_profiles').get() as any).total || 0;

  res.json({
    success: true,
    total_profiles: totalProfiles,
    total_submissions: totalSubmissions
  });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

// Optional static frontend serving for single-container deployments
import fs from 'fs';
const webDistPath = path.join(__dirname, '../../web/dist');
if (fs.existsSync(webDistPath)) {
  app.use(express.static(webDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(webDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`ExifGuard API listening on http://localhost:${PORT}`);
});

