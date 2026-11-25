'use strict';

const { EventEmitter } = require('events');
const assert = require('assert');
const { handleRequest } = require('../server');
const { db } = require('../db/database');

function invoke(method, url, body = null, cookie = '') {
  return new Promise((resolve, reject) => {
    const req = new EventEmitter();
    req.method = method;
    req.url = url;
    req.headers = {
      host: 'localhost:3000',
      cookie
    };
    req.destroy = () => {};

    const chunks = [];
    const res = {
      statusCode: 200,
      headers: {},
      writeHead(code, headers = {}) {
        this.statusCode = code;
        for (const [k, v] of Object.entries(headers)) {
          this.headers[k.toLowerCase()] = v;
        }
      },
      end(chunk) {
        if (chunk) chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
        const raw = Buffer.concat(chunks).toString('utf8');
        let json = null;
        try {
          json = JSON.parse(raw);
        } catch {
          json = null;
        }
        resolve({ status: this.statusCode, headers: this.headers, body: raw, json });
      }
    };

    handleRequest(req, res).catch(reject);

    process.nextTick(() => {
      if (body !== null) {
        req.emit('data', JSON.stringify(body));
      }
      req.emit('end');
    });
  });
}

async function main() {
  // 1. Static HTML, CSS & SVG routes
  for (const route of [
    '/',
    '/login',
    '/register',
    '/css/theme.css',
    '/css/home.css',
    '/images/hero-1.svg',
    '/images/auth-interior.svg',
    '/images/interior-1.svg',
    '/images/interior-2.svg',
    '/images/detail-facade.svg',
    '/images/map-baridhara.svg',
    '/images/team/krushang-panara.jpg',
    '/images/team/jeel-babariya.jpg',
    '/images/team/krish-zalavadiya.jpg',
    '/images/team/neel-vachhani.jpg',
    '/images/team/anjan-vachhani.jpg'
  ]) {
    const r = await invoke('GET', route);
    assert.strictEqual(r.status, 200, `Expected 200 for ${route}`);
    assert.ok(r.body.length > 100, `Expected non-empty body for ${route}`);
  }

  // 2. Health check & ML model metrics
  const health = await invoke('GET', '/api/health');
  assert.strictEqual(health.status, 200);
  assert.strictEqual(health.json.status, 'ok');
  assert.ok(health.json.mlModel.r2 > 0.9, 'Expected ML R2 > 0.9');

  // 3. Register new user
  const testEmail = `verify_${Date.now()}@veluxestates.ai`;
  const reg = await invoke('POST', '/api/auth/register', {
    fullName: 'Nadia Karim',
    email: testEmail,
    phone: '+8801711000111',
    role: 'investor',
    preferredLocation: 'Baridhara · Dhaka',
    budgetTier: '1.5m-2.5m',
    password: 'Password@2026'
  });
  assert.strictEqual(reg.status, 201, `Register failed: ${reg.body}`);
  assert.strictEqual(reg.json.user.email, testEmail);
  const cookie = reg.headers['set-cookie'].split(';')[0];

  // 4. Verify session /api/auth/me
  const me = await invoke('GET', '/api/auth/me', null, cookie);
  assert.strictEqual(me.status, 200);
  assert.strictEqual(me.json.authenticated, true);
  assert.strictEqual(me.json.user.fullName, 'Nadia Karim');

  // 5. Reject wrong password on login & accept demo credentials
  const badLogin = await invoke('POST', '/api/auth/login', {
    email: 'demo@propvanta.ai',
    password: 'wrong-password'
  });
  assert.strictEqual(badLogin.status, 401);

  const demoLogin = await invoke('POST', '/api/auth/login', {
    email: 'demo@propvanta.ai',
    password: 'Propvanta@2026',
    rememberMe: true
  });
  assert.strictEqual(demoLogin.status, 200);
  assert.strictEqual(demoLogin.json.user.email, 'demo@propvanta.ai');

  // 6. Properties list, type filter & save property to SQLite
  const props = await invoke('GET', '/api/properties', null, cookie);
  assert.strictEqual(props.status, 200);
  assert.strictEqual(props.json.properties.length, 6);
  const villas = await invoke('GET', '/api/properties?type=Villa', null, cookie);
  assert.strictEqual(villas.status, 200);
  assert.ok(villas.json.properties.length >= 1 && villas.json.properties.every((p) => p.property_type === 'Villa'));
  const save = await invoke('POST', '/api/properties/1/save', {}, cookie);
  assert.strictEqual(save.status, 200);
  assert.strictEqual(save.json.saved, true);

  // 7. ML Prediction & SQLite persistence
  const ml = await invoke(
    'POST',
    '/api/ml/predict',
    {
      location: 'Baridhara · Dhaka',
      areaSqft: 5200,
      bedrooms: 5,
      bathrooms: 6,
      lotSqft: 7800,
      yearBuilt: 2025,
      smartScore: 9.6,
      poolIncluded: true,
      waterfront: true
    },
    cookie
  );
  assert.strictEqual(ml.status, 200);
  assert.ok(ml.json.valuation.predictedPriceUsd > 1500000);
  assert.strictEqual(ml.json.savedToUser, true);

  // 8. Viewing request persistence
  const viewing = await invoke(
    'POST',
    '/api/viewings',
    {
      propertyId: 1,
      preferredDate: '2026-12-05',
      notes: 'Twilight smart home walkthrough'
    },
    cookie
  );
  assert.strictEqual(viewing.status, 201);

  // 9. Logout clears session
  const logout = await invoke('POST', '/api/auth/logout', {}, cookie);
  assert.strictEqual(logout.status, 200);

  // Clean up test user records so DB stays clean
  db.prepare('DELETE FROM users WHERE email = ?').run(testEmail);
  db.prepare('DELETE FROM ml_valuations WHERE id = ?').run(ml.json.id);
  db.prepare('DELETE FROM viewing_requests WHERE id = ?').run(viewing.json.viewing.id);

  console.log('VERIFICATION PASSED:', {
    mlAlgorithm: health.json.mlModel.algorithm,
    r2: health.json.mlModel.r2,
    maeUsd: health.json.mlModel.mae,
    samplePredictedPriceUsd: ml.json.valuation.predictedPriceUsd,
    sampleConfidencePct: ml.json.valuation.confidencePct,
    propertiesSeeded: props.json.properties.length
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
