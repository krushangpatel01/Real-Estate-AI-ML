'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { DatabaseSync } = require('node:sqlite');
const { valuationModel } = require('../ml/valuationEngine');

const DATA_DIR = path.join(__dirname, '..', 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'velux_estates.db');
const db = new DatabaseSync(DB_PATH);

db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA journal_mode = WAL;');

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL UNIQUE,
      phone TEXT DEFAULT '',
      role TEXT NOT NULL DEFAULT 'buyer',
      preferred_location TEXT DEFAULT 'Baridhara · Dhaka',
      budget_tier TEXT DEFAULT '1.5m-2.5m',
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      user_id INTEGER NOT NULL,
      expires_at TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      slide_order INTEGER NOT NULL DEFAULT 1,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      location TEXT NOT NULL,
      property_type TEXT NOT NULL DEFAULT 'Villa',
      architectural_style TEXT NOT NULL,
      price_usd INTEGER NOT NULL,
      ml_estimated_usd INTEGER NOT NULL,
      ml_confidence REAL NOT NULL,
      ml_growth_5yr_pct REAL NOT NULL,
      bedrooms INTEGER NOT NULL,
      bathrooms INTEGER NOT NULL,
      area_sqft INTEGER NOT NULL,
      lot_sqft INTEGER NOT NULL,
      year_built INTEGER NOT NULL,
      smart_home_score REAL NOT NULL,
      pool_included INTEGER NOT NULL DEFAULT 0,
      waterfront INTEGER NOT NULL DEFAULT 0,
      image_url TEXT NOT NULL,
      badge TEXT NOT NULL DEFAULT 'AI Verified',
      description TEXT NOT NULL,
      features_json TEXT NOT NULL,
      is_featured INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS ml_valuations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      location TEXT NOT NULL,
      area_sqft INTEGER NOT NULL,
      bedrooms INTEGER NOT NULL,
      bathrooms INTEGER NOT NULL,
      lot_sqft INTEGER NOT NULL,
      year_built INTEGER NOT NULL,
      smart_home_score REAL NOT NULL,
      pool_included INTEGER NOT NULL DEFAULT 0,
      waterfront INTEGER NOT NULL DEFAULT 0,
      predicted_price_usd INTEGER NOT NULL,
      price_low_usd INTEGER NOT NULL,
      price_high_usd INTEGER NOT NULL,
      confidence_pct REAL NOT NULL,
      predicted_5yr_roi_pct REAL NOT NULL,
      price_per_sqft INTEGER NOT NULL,
      feature_breakdown_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS saved_properties (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      property_id INTEGER NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, property_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS viewing_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      property_id INTEGER,
      full_name TEXT NOT NULL,
      email TEXT NOT NULL,
      phone TEXT DEFAULT '',
      preferred_date TEXT NOT NULL,
      notes TEXT DEFAULT '',
      status TEXT NOT NULL DEFAULT 'Confirmed',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
      FOREIGN KEY (property_id) REFERENCES properties(id) ON DELETE SET NULL
    );
  `);
}

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password, storedHash) {
  const parts = String(storedHash).split(':');
  if (parts.length !== 2) return false;
  const [salt, originalHex] = parts;
  const derived = crypto.scryptSync(password, salt, 64);
  const original = Buffer.from(originalHex, 'hex');
  if (derived.length !== original.length) return false;
  return crypto.timingSafeEqual(derived, original);
}

function seedDatabase() {
  const propCount = db.prepare('SELECT COUNT(*) AS count FROM properties').get().count;
  if (propCount === 0) {
    const seedProperties = [
      {
        slide_order: 1,
        title: 'The Canopy Glass Pavilion',
        slug: 'canopy-glass-pavilion',
        location: 'Baridhara · Dhaka',
        architectural_style: 'Modern Timber & Steel',
        price_usd: 2150000,
        bedrooms: 5,
        bathrooms: 6,
        area_sqft: 5200,
        lot_sqft: 7800,
        year_built: 2025,
        smart_home_score: 9.6,
        pool_included: 1,
        waterfront: 0,
        image_url: '/images/hero-1.svg',
        badge: 'AI Undervalued · +7.4%',
        description:
          'Framed beneath a sculptural canopy tree, this dark-steel and cedar pavilion pairs floor-to-ceiling acoustic glazing with predictive KNX climate automation and solar microgrid storage.',
        features: ['Predictive Climate AI', 'Solar Microgrid 18kW', 'Biometric Entry', 'Heated Plunge Pool'],
        is_featured: 1
      },
      {
        slide_order: 2,
        title: 'Solstice Horizon Villa',
        slug: 'solstice-horizon-villa',
        location: 'Gulshan North · Dhaka',
        architectural_style: 'Cantilevered Minimalist',
        price_usd: 2480000,
        bedrooms: 5,
        bathrooms: 6,
        area_sqft: 5600,
        lot_sqft: 8400,
        year_built: 2025,
        smart_home_score: 9.4,
        pool_included: 1,
        waterfront: 1,
        image_url: '/images/hero-2.svg',
        badge: 'Top ML Yield',
        description:
          'Cantilevered limestone planes float over a serene black-basalt reflection pool. Equipped with AI circadian lighting, automated acoustic shading, and dual EV fast-charging bays.',
        features: ['Circadian Lighting AI', 'Reflection Infinity Pool', 'Private Lift', 'Dual EV Supercharge'],
        is_featured: 1
      },
      {
        slide_order: 3,
        title: 'Nocturne Lakefront Sanctuary',
        slug: 'nocturne-lakefront-sanctuary',
        location: 'Banani Lakefront · Dhaka',
        architectural_style: 'Warm Brutalist & Oak',
        price_usd: 1890000,
        bedrooms: 4,
        bathrooms: 5,
        area_sqft: 4450,
        lot_sqft: 6400,
        year_built: 2024,
        smart_home_score: 9.1,
        pool_included: 1,
        waterfront: 1,
        image_url: '/images/hero-3.svg',
        badge: 'Lakefront Smart Gem',
        description:
          'Serene lakeside living crafted in honed travertine and smoked oak. Real-time air quality telemetry, greywater recycling, and predictive energy load balancing come standard.',
        features: ['Lakefront Promenade', 'HEPA Air Telemetry', 'Acoustic Wine Vault', 'Smart Irrigation'],
        is_featured: 1
      },
      {
        slide_order: 4,
        title: 'Eucalyptus Courtyard Residence',
        slug: 'eucalyptus-courtyard-residence',
        location: 'Baridhara · Dhaka',
        architectural_style: 'Architectural Contemporary',
        price_usd: 2620000,
        bedrooms: 5,
        bathrooms: 7,
        area_sqft: 5900,
        lot_sqft: 9100,
        year_built: 2026,
        smart_home_score: 9.8,
        pool_included: 1,
        waterfront: 1,
        image_url: '/images/hero-4.svg',
        badge: 'Flagship · 04 / 04',
        description:
          'Our flagship residence in diplomatic Baridhara. Seamless indoor-outdoor courtyard living with neural security analytics, zero-net energy envelope, and bespoke architectural millwork.',
        features: ['Neural Security Grid', 'Net-Zero Envelope', 'Double-Height Salon', 'Private Garden Pavilion'],
        is_featured: 1
      },
      {
        slide_order: 5,
        title: 'Vespera Sky Atrium',
        slug: 'vespera-sky-atrium',
        location: 'Bashundhara Enclave · Dhaka',
        architectural_style: 'Glass & Basalt Penthouse',
        price_usd: 1340000,
        bedrooms: 4,
        bathrooms: 4,
        area_sqft: 3950,
        lot_sqft: 5400,
        year_built: 2025,
        smart_home_score: 9.0,
        pool_included: 0,
        waterfront: 0,
        image_url: '/images/hero-2.svg',
        badge: 'High Appreciation',
        description:
          'High-growth smart residence engineered for modern families and tech-forward investors, featuring voice-free ambient presence sensing and automated solar shading.',
        features: ['Presence Sensing AI', 'Double Glazed Facade', 'Rooftop Lounge', 'Smart Lock Ecosystem'],
        is_featured: 1
      },
      {
        slide_order: 6,
        title: 'Aurelia Heritage Manor',
        slug: 'aurelia-heritage-manor',
        location: 'Dhanmondi Heritage · Dhaka',
        architectural_style: 'Neo-Modern Courtyard',
        price_usd: 1580000,
        bedrooms: 4,
        bathrooms: 5,
        area_sqft: 4300,
        lot_sqft: 6100,
        year_built: 2023,
        smart_home_score: 8.6,
        pool_included: 1,
        waterfront: 0,
        image_url: '/images/hero-3.svg',
        badge: 'Architectural Pick',
        description:
          'Timeless brick, bronze, and warm walnut craftsmanship elevated by concealed smart climate zones, acoustic cinema suite, and AI-guided maintenance diagnostics.',
        features: ['Acoustic Cinema', 'AI Diagnostics', 'Courtyard Lap Pool', 'Bronze Louvers'],
        is_featured: 1
      }
    ];

    const insertStmt = db.prepare(`
      INSERT INTO properties (
        slide_order, title, slug, location, architectural_style,
        price_usd, ml_estimated_usd, ml_confidence, ml_growth_5yr_pct,
        bedrooms, bathrooms, area_sqft, lot_sqft, year_built,
        smart_home_score, pool_included, waterfront, image_url,
        badge, description, features_json, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    for (const p of seedProperties) {
      const prediction = valuationModel.predictValuation({
        location: p.location,
        areaSqft: p.area_sqft,
        bedrooms: p.bedrooms,
        bathrooms: p.bathrooms,
        lotSqft: p.lot_sqft,
        yearBuilt: p.year_built,
        smartScore: p.smart_home_score,
        poolIncluded: Boolean(p.pool_included),
        waterfront: Boolean(p.waterfront)
      });

      insertStmt.run(
        p.slide_order,
        p.title,
        p.slug,
        p.location,
        p.architectural_style,
        p.price_usd,
        prediction.predictedPriceUsd,
        prediction.confidencePct,
        prediction.projected5YrRoiPct,
        p.bedrooms,
        p.bathrooms,
        p.area_sqft,
        p.lot_sqft,
        p.year_built,
        p.smart_home_score,
        p.pool_included,
        p.waterfront,
        p.image_url,
        p.badge,
        p.description,
        JSON.stringify(p.features),
        p.is_featured
      );
    }
  }

  // Seed demo accounts so evaluators can either register or sign in immediately
  const demoEmails = ['demo@propvanta.ai', 'demo@veluxestates.ai'];
  for (const demoEmail of demoEmails) {
    const existingDemo = db.prepare('SELECT id FROM users WHERE email = ?').get(demoEmail);
    if (!existingDemo) {
      const res = db
        .prepare(
          `INSERT INTO users (full_name, email, phone, role, preferred_location, budget_tier, password_hash)
           VALUES (?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          'Aarav Rahman',
          demoEmail,
          '+880 1711-000842',
          'investor',
          'Baridhara · Dhaka',
          '1.5m-2.5m',
          hashPassword('Propvanta@2026')
        );

      const firstProp = db.prepare('SELECT id FROM properties ORDER BY slide_order ASC LIMIT 1').get();
      if (firstProp) {
        db.prepare('INSERT OR IGNORE INTO saved_properties (user_id, property_id) VALUES (?, ?)').run(
          res.lastInsertRowid,
          firstProp.id
        );
      }
    }
  }
}

function ensurePropertyTypes() {
  const cols = db.prepare('PRAGMA table_info(properties)').all();
  if (!cols.some((c) => c.name === 'property_type')) {
    db.exec("ALTER TABLE properties ADD COLUMN property_type TEXT NOT NULL DEFAULT 'Villa';");
  }
  const typeByOrder = {
    1: 'Pavilion',
    2: 'Villa',
    3: 'Estate',
    4: 'Villa',
    5: 'Apartment',
    6: 'Estate'
  };
  for (const [order, pType] of Object.entries(typeByOrder)) {
    db.prepare('UPDATE properties SET property_type = ? WHERE slide_order = ?').run(pType, Number(order));
  }
}

initSchema();
ensurePropertyTypes();
seedDatabase();

// User & Session helpers
function sanitizeUser(row) {
  if (!row) return null;
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone,
    role: row.role,
    preferredLocation: row.preferred_location,
    budgetTier: row.budget_tier,
    createdAt: row.created_at
  };
}

function createUser({ fullName, email, phone, role, preferredLocation, budgetTier, password }) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
  if (existing) {
    const err = new Error('An account with this email already exists.');
    err.statusCode = 409;
    throw err;
  }

  const passwordHash = hashPassword(password);
  const info = db
    .prepare(
      `INSERT INTO users (full_name, email, phone, role, preferred_location, budget_tier, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      fullName.trim(),
      normalizedEmail,
      (phone || '').trim(),
      role || 'buyer',
      preferredLocation || 'Baridhara · Dhaka',
      budgetTier || '1.5m-2.5m',
      passwordHash
    );

  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  return sanitizeUser(user);
}

function authenticateUser(email, password) {
  const normalizedEmail = String(email).trim().toLowerCase();
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(normalizedEmail);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return null;
  }
  return sanitizeUser(user);
}

function createSession(userId, rememberMe = false) {
  const token = crypto.randomBytes(32).toString('hex');
  const days = rememberMe ? 30 : 7;
  const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(token, userId, expiresAt);
  return { token, expiresAt, maxAgeSeconds: days * 24 * 60 * 60 };
}

function getUserBySessionToken(token) {
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.*, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.id = ?`
    )
    .get(token);

  if (!row) return null;
  if (new Date(row.expires_at).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
    return null;
  }
  return row;
}

function deleteSession(token) {
  if (!token) return;
  db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
}

// Property & ML queries
function getProperties({ location = '', propertyType = '', search = '', maxPrice = 0, minBeds = 0, minSmart = 0, user = null } = {}) {
  let sql = 'SELECT * FROM properties WHERE 1=1';
  const params = [];

  if (location && location !== 'All') {
    sql += ' AND location = ?';
    params.push(location);
  }
  if (propertyType && propertyType !== 'All') {
    sql += ' AND LOWER(property_type) = LOWER(?)';
    params.push(propertyType);
  }
  if (search) {
    sql += ' AND (title LIKE ? OR location LIKE ? OR architectural_style LIKE ? OR description LIKE ?)';
    const q = `%${search}%`;
    params.push(q, q, q, q);
  }
  if (maxPrice > 0) {
    sql += ' AND price_usd <= ?';
    params.push(maxPrice);
  }
  if (minBeds > 0) {
    sql += ' AND bedrooms >= ?';
    params.push(minBeds);
  }
  if (minSmart > 0) {
    sql += ' AND smart_home_score >= ?';
    params.push(minSmart);
  }

  sql += ' ORDER BY slide_order ASC';
  const rows = db.prepare(sql).all(...params);

  let savedSet = new Set();
  if (user) {
    const savedRows = db.prepare('SELECT property_id FROM saved_properties WHERE user_id = ?').all(user.id);
    savedSet = new Set(savedRows.map((r) => r.property_id));
  }

  return rows.map((row) => ({
    ...row,
    features: JSON.parse(row.features_json || '[]'),
    isSaved: savedSet.has(row.id),
    mlMatchScore: valuationModel.scorePropertyForUser(row, user)
  }));
}

function toggleSavedProperty(userId, propertyId) {
  const existing = db
    .prepare('SELECT id FROM saved_properties WHERE user_id = ? AND property_id = ?')
    .get(userId, propertyId);

  if (existing) {
    db.prepare('DELETE FROM saved_properties WHERE id = ?').run(existing.id);
    return { saved: false };
  }

  db.prepare('INSERT INTO saved_properties (user_id, property_id) VALUES (?, ?)').run(userId, propertyId);
  return { saved: true };
}

function saveValuationHistory(userId, valuation) {
  const info = db
    .prepare(
      `INSERT INTO ml_valuations (
        user_id, location, area_sqft, bedrooms, bathrooms, lot_sqft,
        year_built, smart_home_score, pool_included, waterfront,
        predicted_price_usd, price_low_usd, price_high_usd,
        confidence_pct, predicted_5yr_roi_pct, price_per_sqft, feature_breakdown_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      userId || null,
      valuation.location,
      valuation.inputs.areaSqft,
      valuation.inputs.bedrooms,
      valuation.inputs.bathrooms,
      valuation.inputs.lotSqft,
      valuation.inputs.yearBuilt,
      valuation.inputs.smartScore,
      valuation.inputs.poolIncluded ? 1 : 0,
      valuation.inputs.waterfront ? 1 : 0,
      valuation.predictedPriceUsd,
      valuation.priceLowUsd,
      valuation.priceHighUsd,
      valuation.confidencePct,
      valuation.projected5YrRoiPct,
      valuation.pricePerSqft,
      JSON.stringify(valuation.featureContributions)
    );

  return info.lastInsertRowid;
}

function getRecentValuations(userId = null, limit = 6) {
  const rows = userId
    ? db
        .prepare('SELECT * FROM ml_valuations WHERE user_id = ? ORDER BY id DESC LIMIT ?')
        .all(userId, limit)
    : db.prepare('SELECT * FROM ml_valuations ORDER BY id DESC LIMIT ?').all(limit);

  return rows.map((r) => ({
    ...r,
    featureBreakdown: JSON.parse(r.feature_breakdown_json || '[]')
  }));
}

function createViewingRequest({ userId, propertyId, fullName, email, phone, preferredDate, notes }) {
  const info = db
    .prepare(
      `INSERT INTO viewing_requests (user_id, property_id, full_name, email, phone, preferred_date, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      userId || null,
      propertyId || null,
      fullName.trim(),
      email.trim().toLowerCase(),
      (phone || '').trim(),
      preferredDate,
      (notes || '').trim()
    );

  return db.prepare('SELECT * FROM viewing_requests WHERE id = ?').get(info.lastInsertRowid);
}

function getUserDashboardStats(userId) {
  const savedCount = db.prepare('SELECT COUNT(*) AS c FROM saved_properties WHERE user_id = ?').get(userId).c;
  const valuationCount = db.prepare('SELECT COUNT(*) AS c FROM ml_valuations WHERE user_id = ?').get(userId).c;
  const viewingCount = db.prepare('SELECT COUNT(*) AS c FROM viewing_requests WHERE user_id = ?').get(userId).c;
  const viewings = db
    .prepare(
      `SELECT vr.*, p.title AS property_title, p.location AS property_location
       FROM viewing_requests vr
       LEFT JOIN properties p ON p.id = vr.property_id
       WHERE vr.user_id = ?
       ORDER BY vr.id DESC
       LIMIT 5`
    )
    .all(userId);

  return { savedCount, valuationCount, viewingCount, viewings };
}

function getPlatformSummary() {
  const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  const totalProperties = db.prepare('SELECT COUNT(*) AS c FROM properties').get().c;
  const totalValuations = db.prepare('SELECT COUNT(*) AS c FROM ml_valuations').get().c;
  return { totalUsers, totalProperties, totalValuations };
}

module.exports = {
  db,
  DB_PATH,
  createUser,
  authenticateUser,
  createSession,
  getUserBySessionToken,
  deleteSession,
  sanitizeUser,
  getProperties,
  toggleSavedProperty,
  saveValuationHistory,
  getRecentValuations,
  createViewingRequest,
  getUserDashboardStats,
  getPlatformSummary
};
