# Propvanta — Smart Real Estate Platform With ML

An architectural luxury real estate platform powered by a **Node.js** backend, **SQLite** database (`node:sqlite`), and a pure-JavaScript **L2-Regularized Ridge Multiple Regression** valuation engine.

## Features

- **Home Page (`/`)**: Propvanta architectural editorial layout featuring a twilight hero with docked multi-filter search bar, Philosophy & ML Precision cards, *Architectural Signatures* portfolio with category tabs (`All`, `Villa`, `Apartment`, `Estate`, `Pavilion`), live ML Match Scores & Fair Value estimates, Advisory Council, and Private Viewing modal.
- **Register & Login (`/register`, `/login`)**: Full authentication with `crypto.scryptSync` salted password hashing, persistent `HttpOnly` session cookies, member preference calibration (preferred district & budget tier), and instant demo login (`demo@propvanta.ai` / `Propvanta@2026`).
- **SQLite Database (`db/database.js`)**: Automatically initializes and seeds `users`, `sessions`, `properties`, `ml_valuations`, `saved_properties`, and `viewing_requests` on first startup.
- **ML Valuation Engine (`ml/valuationEngine.js`)**: Trains an L2 Ridge Regression model (`R² ≈ 0.9678`) at startup to estimate fair property values, confidence corridors, 5-year ROI projections, and personalized user match scores.

## Getting Started

Requires **Node.js v22.5+** (built with **Node.js v24** `node:sqlite`, zero external `npm` dependencies needed).

```bash
npm start
```

Then open:
- Home: `http://localhost:3000/`
- Register: `http://localhost:3000/register`
- Login: `http://localhost:3000/login`

## Verification

```bash
npm test
```
