'use strict';

const http = require('http');
const fs = require('fs');
const path = require('path');
const { URL } = require('url');

const {
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
} = require('./db/database');
const { valuationModel, LOCATION_TIERS } = require('./ml/valuationEngine');

const PORT = Number(process.env.PORT) || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');
const SESSION_COOKIE = 'velux_session';

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function parseCookies(req) {
  const header = req.headers.cookie || '';
  const cookies = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const key = part.slice(0, idx).trim();
      const val = part.slice(idx + 1).trim();
      cookies[key] = decodeURIComponent(val);
    }
  }
  return cookies;
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', (chunk) => {
      raw += chunk;
      if (raw.length > 1e6) {
        reject(new Error('Request payload too large'));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error('Invalid JSON payload'));
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  const body = JSON.stringify(payload);
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(body);
}

function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';
  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      res.end('Not Found');
      return;
    }
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

function buildSessionCookie(token, maxAgeSeconds) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

function clearSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; SameSite=Lax; Max-Age=0`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

const handleRequest = async (req, res) => {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const method = req.method.toUpperCase();

    const cookies = parseCookies(req);
    const sessionToken = cookies[SESSION_COOKIE];
    const currentUserRow = getUserBySessionToken(sessionToken);
    const currentUser = sanitizeUser(currentUserRow);

    // ==================== API ROUTES ====================
    if (pathname === '/api/health' && method === 'GET') {
      return sendJson(res, 200, {
        status: 'ok',
        database: 'sqlite',
        mlModel: valuationModel.metrics,
        summary: getPlatformSummary()
      });
    }

    // Auth: Register
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = await readJsonBody(req);
      const { fullName, email, phone, role, preferredLocation, budgetTier, password } = body;

      if (!fullName || String(fullName).trim().length < 2) {
        return sendJson(res, 400, { error: 'Please enter your full name (at least 2 characters).' });
      }
      if (!validateEmail(email)) {
        return sendJson(res, 400, { error: 'Please enter a valid email address.' });
      }
      if (!password || String(password).length < 6) {
        return sendJson(res, 400, { error: 'Password must be at least 6 characters long.' });
      }

      try {
        const user = createUser({
          fullName,
          email,
          phone,
          role,
          preferredLocation,
          budgetTier,
          password
        });
        const session = createSession(user.id, true);
        return sendJson(
          res,
          201,
          { message: 'Account created successfully.', user },
          { 'Set-Cookie': buildSessionCookie(session.token, session.maxAgeSeconds) }
        );
      } catch (err) {
        return sendJson(res, err.statusCode || 400, { error: err.message });
      }
    }

    // Auth: Login
    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await readJsonBody(req);
      const { email, password, rememberMe } = body;

      if (!validateEmail(email) || !password) {
        return sendJson(res, 400, { error: 'Email and password are required.' });
      }

      const user = authenticateUser(email, password);
      if (!user) {
        return sendJson(res, 401, { error: 'Invalid email or password.' });
      }

      const session = createSession(user.id, Boolean(rememberMe));
      return sendJson(
        res,
        200,
        { message: 'Signed in successfully.', user },
        { 'Set-Cookie': buildSessionCookie(session.token, session.maxAgeSeconds) }
      );
    }

    // Auth: Logout
    if (pathname === '/api/auth/logout' && method === 'POST') {
      deleteSession(sessionToken);
      return sendJson(
        res,
        200,
        { message: 'Signed out.' },
        { 'Set-Cookie': clearSessionCookie() }
      );
    }

    // Auth: Current session user + dashboard stats
    if (pathname === '/api/auth/me' && method === 'GET') {
      if (!currentUser) {
        return sendJson(res, 200, { authenticated: false, user: null, stats: null });
      }
      const stats = getUserDashboardStats(currentUser.id);
      return sendJson(res, 200, { authenticated: true, user: currentUser, stats });
    }

    // Properties: List & Filter
    if (pathname === '/api/properties' && method === 'GET') {
      const location = parsedUrl.searchParams.get('location') || '';
      const propertyType = parsedUrl.searchParams.get('type') || '';
      const search = parsedUrl.searchParams.get('search') || '';
      const maxPrice = Number(parsedUrl.searchParams.get('maxPrice')) || 0;
      const minBeds = Number(parsedUrl.searchParams.get('minBeds')) || 0;
      const minSmart = Number(parsedUrl.searchParams.get('minSmart')) || 0;

      const properties = getProperties({
        location,
        propertyType,
        search,
        maxPrice,
        minBeds,
        minSmart,
        user: currentUserRow
      });

      return sendJson(res, 200, {
        properties,
        locations: Object.keys(LOCATION_TIERS),
        modelMetrics: valuationModel.metrics
      });
    }

    // Properties: Toggle Save (Authenticated)
    const saveMatch = pathname.match(/^\/api\/properties\/(\d+)\/save$/);
    if (saveMatch && method === 'POST') {
      if (!currentUser) {
        return sendJson(res, 401, { error: 'Please sign in to save residences to your portfolio.' });
      }
      const propertyId = Number(saveMatch[1]);
      const result = toggleSavedProperty(currentUser.id, propertyId);
      return sendJson(res, 200, result);
    }

    // ML Valuation Engine: Predict & Persist to SQLite
    if (pathname === '/api/ml/predict' && method === 'POST') {
      const body = await readJsonBody(req);
      const valuation = valuationModel.predictValuation(body);
      const recordId = saveValuationHistory(currentUser ? currentUser.id : null, valuation);
      return sendJson(res, 200, {
        id: recordId,
        valuation,
        savedToUser: Boolean(currentUser)
      });
    }

    // ML Valuation History
    if (pathname === '/api/ml/history' && method === 'GET') {
      const history = getRecentValuations(currentUser ? currentUser.id : null, 6);
      return sendJson(res, 200, {
        history,
        modelMetrics: valuationModel.metrics,
        locations: Object.keys(LOCATION_TIERS)
      });
    }

    // Viewing Request: Book Private Viewing
    if (pathname === '/api/viewings' && method === 'POST') {
      const body = await readJsonBody(req);
      const fullName = body.fullName || (currentUser ? currentUser.fullName : '');
      const email = body.email || (currentUser ? currentUser.email : '');
      const phone = body.phone || (currentUser ? currentUser.phone : '');
      const preferredDate = body.preferredDate;
      const propertyId = body.propertyId ? Number(body.propertyId) : null;
      const notes = body.notes || '';

      if (!fullName || !validateEmail(email) || !preferredDate) {
        return sendJson(res, 400, {
          error: 'Full name, valid email, and preferred viewing date are required.'
        });
      }

      const viewing = createViewingRequest({
        userId: currentUser ? currentUser.id : null,
        propertyId,
        fullName,
        email,
        phone,
        preferredDate,
        notes
      });

      return sendJson(res, 201, {
        message: 'Private architectural viewing confirmed.',
        viewing
      });
    }

    // ==================== PAGE & STATIC ROUTES ====================
    if (method === 'GET') {
      const pageRoutes = {
        '/': 'index.html',
        '/index.html': 'index.html',
        '/login': 'login.html',
        '/login.html': 'login.html',
        '/register': 'register.html',
        '/register.html': 'register.html'
      };

      if (pageRoutes[pathname]) {
        return serveFile(res, path.join(PUBLIC_DIR, pageRoutes[pathname]));
      }

      // Safe static file resolution inside PUBLIC_DIR
      const safeRelPath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
      const targetPath = path.join(PUBLIC_DIR, safeRelPath);
      if (targetPath.startsWith(PUBLIC_DIR) && fs.existsSync(targetPath) && fs.statSync(targetPath).isFile()) {
        return serveFile(res, targetPath);
      }
    }

    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('404 Not Found');
  } catch (err) {
    console.error('Server error:', err);
    sendJson(res, 500, { error: 'Internal server error.' });
  }
};

const server = http.createServer(handleRequest);

if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Velux Estates Smart Real Estate Platform running at http://localhost:${PORT}`);
    console.log(`ML Engine ready -> ${valuationModel.metrics.algorithm} | R²=${valuationModel.metrics.r2} | MAE=$${valuationModel.metrics.mae}`);
  });
}

module.exports = { server, handleRequest };
