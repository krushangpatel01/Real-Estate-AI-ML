'use strict';

/**
 * Pure JavaScript Ridge Multiple Regression (L2-Regularized) Valuation Engine
 * Trains on historical smart-luxury residential sales at startup using the
 * Normal Equation: w = (X^T X + lambda * I)^(-1) X^T y
 */

const LOCATION_TIERS = {
  'Baridhara · Dhaka': { multiplier: 1.32, index: 9.4, growthBase: 9.2 },
  'Gulshan North · Dhaka': { multiplier: 1.28, index: 9.0, growthBase: 8.8 },
  'Banani Lakefront · Dhaka': { multiplier: 1.18, index: 8.3, growthBase: 8.1 },
  'Bashundhara Enclave · Dhaka': { multiplier: 0.94, index: 7.1, growthBase: 9.6 },
  'Dhanmondi Heritage · Dhaka': { multiplier: 1.05, index: 7.8, growthBase: 7.4 },
  'Purbachal Smart City': { multiplier: 0.82, index: 6.6, growthBase: 11.4 }
};

// Curated historical transaction dataset for Ridge Regression training
// Columns: [areaSqft, bedrooms, bathrooms, lotSqft, ageYears, smartScore, locationIndex, hasPool, isWaterfront, priceUsd]
const TRAINING_DATA = [
  [4200, 4, 5, 6500, 2, 9.2, 9.4, 1, 0, 1890000],
  [5400, 5, 6, 8200, 1, 9.6, 9.4, 1, 1, 2650000],
  [3600, 4, 4, 5200, 4, 8.4, 9.4, 0, 0, 1480000],
  [6100, 5, 7, 9500, 0, 9.8, 9.4, 1, 1, 3120000],
  [3100, 3, 4, 4400, 6, 7.2, 9.4, 0, 0, 1180000],
  [4800, 4, 5, 7000, 2, 9.0, 9.0, 1, 0, 2050000],
  [5200, 5, 6, 7600, 1, 9.4, 9.0, 1, 0, 2320000],
  [3400, 3, 4, 4800, 5, 7.8, 9.0, 0, 0, 1340000],
  [2900, 3, 3, 4000, 8, 6.5, 9.0, 0, 0, 1020000],
  [4400, 4, 5, 6200, 3, 8.8, 8.3, 1, 1, 1980000],
  [3900, 4, 4, 5400, 2, 8.6, 8.3, 0, 1, 1690000],
  [5600, 5, 6, 8400, 1, 9.5, 8.3, 1, 1, 2540000],
  [2800, 3, 3, 3800, 7, 7.0, 8.3, 0, 0, 950000],
  [4600, 4, 5, 6800, 1, 9.1, 7.1, 1, 0, 1380000],
  [3800, 4, 4, 5500, 2, 8.5, 7.1, 0, 0, 1080000],
  [5100, 5, 5, 7800, 0, 9.4, 7.1, 1, 0, 1590000],
  [3200, 3, 4, 4600, 3, 8.0, 7.1, 0, 0, 890000],
  [4100, 4, 4, 5800, 6, 7.6, 7.8, 0, 0, 1290000],
  [4900, 5, 5, 7200, 4, 8.4, 7.8, 1, 0, 1680000],
  [3300, 3, 4, 4500, 9, 6.8, 7.8, 0, 0, 980000],
  [4500, 4, 5, 7400, 0, 9.7, 6.6, 1, 0, 1190000],
  [3700, 4, 4, 6000, 1, 9.2, 6.6, 0, 0, 940000],
  [5500, 5, 6, 9000, 0, 9.8, 6.6, 1, 1, 1560000],
  [2600, 3, 3, 3600, 4, 7.5, 6.6, 0, 0, 680000],
  [6400, 6, 7, 10200, 1, 9.9, 9.4, 1, 1, 3380000],
  [4050, 4, 4, 5900, 3, 8.7, 9.0, 0, 0, 1660000],
  [3550, 3, 4, 5000, 2, 8.9, 8.3, 0, 1, 1540000],
  [5800, 5, 6, 8800, 2, 9.3, 9.0, 1, 1, 2760000]
];

function transpose(matrix) {
  const rows = matrix.length;
  const cols = matrix[0].length;
  const result = Array.from({ length: cols }, () => Array(rows).fill(0));
  for (let i = 0; i < rows; i++) {
    for (let j = 0; j < cols; j++) {
      result[j][i] = matrix[i][j];
    }
  }
  return result;
}

function matMul(A, B) {
  const rowsA = A.length;
  const colsA = A[0].length;
  const colsB = B[0].length;
  const result = Array.from({ length: rowsA }, () => Array(colsB).fill(0));
  for (let i = 0; i < rowsA; i++) {
    for (let k = 0; k < colsA; k++) {
      const aik = A[i][k];
      for (let j = 0; j < colsB; j++) {
        result[i][j] += aik * B[k][j];
      }
    }
  }
  return result;
}

function invertMatrix(M) {
  const n = M.length;
  const aug = M.map((row, i) => [
    ...row,
    ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  ]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(aug[row][col]) > Math.abs(aug[pivotRow][col])) {
        pivotRow = row;
      }
    }
    const temp = aug[col];
    aug[col] = aug[pivotRow];
    aug[pivotRow] = temp;

    const pivot = aug[col][col] || 1e-9;
    for (let j = 0; j < 2 * n; j++) {
      aug[col][j] /= pivot;
    }

    for (let row = 0; row < n; row++) {
      if (row !== col) {
        const factor = aug[row][col];
        for (let j = 0; j < 2 * n; j++) {
          aug[row][j] -= factor * aug[col][j];
        }
      }
    }
  }

  return aug.map((row) => row.slice(n));
}

class SmartValuationModel {
  constructor() {
    this.means = [];
    this.stds = [];
    this.weights = [];
    this.bias = 0;
    this.metrics = {
      algorithm: 'Ridge Multiple Regression (L2)',
      r2: 0,
      mae: 0,
      trainingSamples: TRAINING_DATA.length
    };
    this.train();
  }

  extractRawFeatures(row) {
    // [areaSqft, bedrooms, bathrooms, lotSqft, ageYears, smartScore, locationIndex, hasPool, isWaterfront]
    return [row[0], row[1], row[2], row[3], row[4], row[5], row[6], row[7], row[8]];
  }

  train() {
    const rawX = TRAINING_DATA.map((r) => this.extractRawFeatures(r));
    const y = TRAINING_DATA.map((r) => r[9]);
    const n = rawX.length;
    const d = rawX[0].length;

    // Standardize features (z-score)
    this.means = Array(d).fill(0);
    this.stds = Array(d).fill(1);
    for (let j = 0; j < d; j++) {
      const mean = rawX.reduce((acc, row) => acc + row[j], 0) / n;
      const variance = rawX.reduce((acc, row) => acc + Math.pow(row[j] - mean, 2), 0) / n;
      this.means[j] = mean;
      this.stds[j] = Math.sqrt(variance) || 1;
    }

    // Add intercept column of 1s at index 0
    const X = rawX.map((row) => [
      1,
      ...row.map((val, j) => (val - this.means[j]) / this.stds[j])
    ]);

    const XT = transpose(X);
    const XTX = matMul(XT, X);

    // L2 regularization lambda = 0.8 (do not regularize bias term at index 0)
    const lambda = 0.8;
    for (let i = 1; i < XTX.length; i++) {
      XTX[i][i] += lambda;
    }

    const XTXInv = invertMatrix(XTX);
    const yCol = y.map((v) => [v]);
    const XTy = matMul(XT, yCol);
    const theta = matMul(XTXInv, XTy).map((r) => r[0]);

    this.bias = theta[0];
    this.weights = theta.slice(1);

    // Evaluate R^2 and MAE on training set
    const yMean = y.reduce((a, b) => a + b, 0) / n;
    let ssRes = 0;
    let ssTot = 0;
    let absErr = 0;

    for (let i = 0; i < n; i++) {
      const pred = this.predictRaw(rawX[i]);
      const err = y[i] - pred;
      ssRes += err * err;
      ssTot += Math.pow(y[i] - yMean, 2);
      absErr += Math.abs(err);
    }

    this.metrics = {
      algorithm: 'Ridge Multiple Regression (L2)',
      r2: Number((1 - ssRes / ssTot).toFixed(4)),
      mae: Math.round(absErr / n),
      trainingSamples: n
    };
  }

  predictRaw(features) {
    let sum = this.bias;
    for (let j = 0; j < features.length; j++) {
      const norm = (features[j] - this.means[j]) / this.stds[j];
      sum += this.weights[j] * norm;
    }
    return Math.max(250000, sum);
  }

  predictValuation(input) {
    const location = LOCATION_TIERS[input.location] ? input.location : 'Baridhara · Dhaka';
    const locMeta = LOCATION_TIERS[location];

    const areaSqft = Math.min(20000, Math.max(800, Number(input.areaSqft) || 4200));
    const bedrooms = Math.min(12, Math.max(1, Number(input.bedrooms) || 4));
    const bathrooms = Math.min(14, Math.max(1, Number(input.bathrooms) || 5));
    const lotSqft = Math.min(40000, Math.max(areaSqft, Number(input.lotSqft) || Math.round(areaSqft * 1.45)));
    const yearBuilt = Math.min(2027, Math.max(1975, Number(input.yearBuilt) || 2024));
    const ageYears = Math.max(0, 2026 - yearBuilt);
    const smartScore = Math.min(10, Math.max(1, Number(input.smartScore) || 8.8));
    const hasPool = input.poolIncluded ? 1 : 0;
    const isWaterfront = input.waterfront ? 1 : 0;

    const features = [
      areaSqft,
      bedrooms,
      bathrooms,
      lotSqft,
      ageYears,
      smartScore,
      locMeta.index,
      hasPool,
      isWaterfront
    ];

    const predicted = Math.round(this.predictRaw(features) / 1000) * 1000;

    // Calculate feature impact breakdown relative to baseline mean
    const labels = [
      'Living Area (Sq Ft)',
      'Bedroom Suite Count',
      'Architectural Baths',
      'Land & Lot Size',
      'Architectural Age',
      'Smart Home AI Readiness',
      'District Prestige Index',
      'Infinity Pool & Pavilion',
      'Waterfront / Lake Frontage'
    ];

    const rawContributions = features.map((val, j) => {
      const norm = (val - this.means[j]) / this.stds[j];
      return {
        label: labels[j],
        impactUsd: Math.round(this.weights[j] * norm)
      };
    });

    // Confidence decreases slightly for extreme out-of-distribution inputs
    const zDist =
      features.reduce((acc, val, j) => acc + Math.abs((val - this.means[j]) / this.stds[j]), 0) /
      features.length;
    const confidencePct = Number(Math.max(84.5, Math.min(97.8, 97.2 - zDist * 3.1)).toFixed(1));
    const spreadRatio = (100 - confidencePct) * 0.0085 + 0.035;

    const priceLowUsd = Math.round((predicted * (1 - spreadRatio)) / 1000) * 1000;
    const priceHighUsd = Math.round((predicted * (1 + spreadRatio)) / 1000) * 1000;

    // 5-year appreciation projection combining district growth + smart tech readiness premium
    const smartAppreciationBoost = (smartScore - 6) * 0.45;
    const annualGrowthPct = Number(
      Math.max(5.5, Math.min(14.5, locMeta.growthBase + smartAppreciationBoost * 0.35)).toFixed(2)
    );
    const projected5YrRoiPct = Number(((Math.pow(1 + annualGrowthPct / 100, 5) - 1) * 100).toFixed(1));
    const projected5YrValueUsd =
      Math.round((predicted * (1 + projected5YrRoiPct / 100)) / 1000) * 1000;

    const smartPremiumPct = Number(Math.max(0, (smartScore - 5) * 2.4).toFixed(1));

    return {
      location,
      inputs: {
        areaSqft,
        bedrooms,
        bathrooms,
        lotSqft,
        yearBuilt,
        smartScore,
        poolIncluded: Boolean(hasPool),
        waterfront: Boolean(isWaterfront)
      },
      predictedPriceUsd: predicted,
      priceLowUsd,
      priceHighUsd,
      confidencePct,
      pricePerSqft: Math.round(predicted / areaSqft),
      annualGrowthPct,
      projected5YrRoiPct,
      projected5YrValueUsd,
      smartPremiumPct,
      featureContributions: rawContributions
        .sort((a, b) => Math.abs(b.impactUsd) - Math.abs(a.impactUsd))
        .slice(0, 6),
      modelMetrics: this.metrics
    };
  }

  scorePropertyForUser(property, user) {
    let score = 82;
    if (!user) return Math.min(98, Math.round(score + (property.smart_home_score - 8) * 3));

    if (user.preferred_location && property.location.toLowerCase().includes(user.preferred_location.toLowerCase())) {
      score += 9;
    }

    const budgetMap = {
      'under-1.5m': [0, 1550000],
      '1.5m-2.5m': [1400000, 2600000],
      '2.5m-plus': [2300000, 10000000]
    };

    if (user.budget_tier && budgetMap[user.budget_tier]) {
      const [minB, maxB] = budgetMap[user.budget_tier];
      if (property.price_usd >= minB && property.price_usd <= maxB) {
        score += 7;
      } else {
        score -= 6;
      }
    }

    // Value opportunity bonus if ML estimated value > asking price
    const upside = (property.ml_estimated_usd - property.price_usd) / property.price_usd;
    if (upside > 0) {
      score += Math.min(5, Math.round(upside * 60));
    }

    return Math.max(72, Math.min(99, Math.round(score)));
  }
}

const valuationModel = new SmartValuationModel();

module.exports = {
  valuationModel,
  LOCATION_TIERS
};
