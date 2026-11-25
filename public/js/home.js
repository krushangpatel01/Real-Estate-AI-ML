'use strict';

(function () {
  let allProperties = [];
  let currentUser = null;
  let activeType = 'All';
  let showAllResidences = true;

  const usd = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  });

  function formatCompactPrice(amount) {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(2)}M`;
    }
    return usd.format(amount);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // ==================== AUTH SESSION HYDRATION ====================
  async function loadSession() {
    const res = await fetch('/api/auth/me');
    const data = await res.json();
    const authNavArea = document.getElementById('authNavArea');
    const memberStrip = document.getElementById('memberStrip');

    if (data.authenticated && data.user) {
      currentUser = data.user;
      const initials = data.user.fullName
        .split(' ')
        .map((n) => n[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

      authNavArea.innerHTML = `
        <span class="user-pill">
          <span class="user-avatar">${initials}</span>
          <span>${escapeHtml(data.user.fullName)}</span>
        </span>
        <button id="openViewingNavBtn" type="button" class="btn-gold-sm">Book Viewing</button>
        <button id="logoutBtn" type="button" class="nav-link-muted" style="background:none;border:none;cursor:pointer;">Sign Out</button>
      `;

      document.getElementById('openViewingNavBtn').addEventListener('click', () => openViewingModal());
      document.getElementById('logoutBtn').addEventListener('click', async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.reload();
      });

      // Update membership banner CTA when signed in
      const ctaActions = document.getElementById('membershipCtaActions');
      if (ctaActions) {
        ctaActions.innerHTML = `
          <button id="ctaBookBtn" type="button" class="btn-hero-gold">Book Private Viewing</button>
          <a href="#collection" class="btn-hero-outline">Browse Saved Portfolio</a>
        `;
        document.getElementById('ctaBookBtn').addEventListener('click', () => openViewingModal());
      }

      memberStrip.classList.add('visible');
      document.getElementById('memberRoleBadge').textContent = data.user.role;
      document.getElementById('memberGreeting').textContent = `Welcome, ${data.user.fullName}`;
      document.getElementById('memberSubtext').textContent = `ML Match calibrated for ${data.user.preferredLocation}`;

      if (data.stats) {
        document.getElementById('statSavedCount').textContent = data.stats.savedCount;
        document.getElementById('statViewingCount').textContent = data.stats.viewingCount;
      }

      document.getElementById('viewFullName').value = data.user.fullName;
      document.getElementById('viewEmail').value = data.user.email;
      document.getElementById('viewPhone').value = data.user.phone || '';
    } else {
      currentUser = null;
      memberStrip.classList.remove('visible');
    }
  }

  // ==================== PROPERTIES & ML MATCH SCORES ====================
  async function loadProperties(filters = {}) {
    const params = new URLSearchParams();
    if (filters.location && filters.location !== 'All') params.set('location', filters.location);
    if (filters.type && filters.type !== 'All') params.set('type', filters.type);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.minBeds) params.set('minBeds', filters.minBeds);

    const res = await fetch(`/api/properties?${params.toString()}`);
    const data = await res.json();
    allProperties = data.properties || [];

    if (data.modelMetrics && data.modelMetrics.r2) {
      const pct = `${(data.modelMetrics.r2 * 100).toFixed(1)}%`;
      document.getElementById('mlR2Label').textContent = pct;
      document.getElementById('bannerR2Stat').textContent = pct;
    }

    populateLocationDropdown(data.locations || []);
    populatePropertySelect(allProperties);
    renderProperties(allProperties);
  }

  let locationsInitialized = false;
  function populateLocationDropdown(locations) {
    if (locationsInitialized || !locations.length) return;
    locationsInitialized = true;

    const select = document.getElementById('locationFilter');
    locations.forEach((loc) => {
      const opt = document.createElement('option');
      opt.value = loc;
      opt.textContent = loc;
      select.appendChild(opt);
    });
  }

  function populatePropertySelect(properties) {
    const select = document.getElementById('viewPropertySelect');
    if (!select || select.options.length > 0) return;
    properties.forEach((p) => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.title} (${p.location})`;
      select.appendChild(opt);
    });
  }

  function renderProperties(properties) {
    const grid = document.getElementById('propertiesGrid');
    const toggleBtn = document.getElementById('toggleAllResidencesBtn');

    if (!properties.length) {
      grid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 48px; text-align: center; background: #fff; border-radius: 16px; border: 1px solid var(--border-cream);">
          <div class="serif-headline" style="font-size: 30px; color: var(--ink-dark);">No residences match your criteria.</div>
          <p style="color: var(--ink-muted); margin-top: 8px;">Try selecting "All" categories or widening your budget filter.</p>
        </div>
      `;
      return;
    }

    const visibleList = showAllResidences ? properties : properties.slice(0, 3);
    toggleBtn.innerHTML = showAllResidences
      ? `Showing ${visibleList.length} Curated Residences · Collapse &#8593;`
      : `View All Architectural Residences (${properties.length}) <span>&#8594;</span>`;

    grid.innerHTML = visibleList
      .map((p) => {
        const diffPct = (((p.ml_estimated_usd - p.price_usd) / p.price_usd) * 100).toFixed(1);
        const diffSign = Number(diffPct) >= 0 ? `+${diffPct}%` : `${diffPct}%`;

        return `
          <article class="sig-card">
            <div class="sig-media">
              <img src="${escapeHtml(p.image_url)}" alt="${escapeHtml(p.title)}" />
              <div class="sig-media-grad"></div>

              <div class="sig-top-badges">
                <div class="sig-badge-row">
                  <span class="sig-pill-dark">${escapeHtml(p.property_type || 'Villa')}</span>
                  <span class="sig-pill-gold">Featured</span>
                </div>
                <button
                  type="button"
                  class="sig-save-btn ${p.isSaved ? 'saved' : ''}"
                  data-save-id="${p.id}"
                  title="${p.isSaved ? 'Remove from saved homes' : 'Save residence'}"
                >${p.isSaved ? '&#9733;' : '&#9734;'}</button>
              </div>

              <div class="sig-bottom-overlay">
                <div>
                  <div class="sig-price">${formatCompactPrice(p.price_usd)}</div>
                  <div class="sig-ml-est">ML Est: ${formatCompactPrice(p.ml_estimated_usd)} (${diffSign})</div>
                </div>
                <span class="sig-verified-pill">${p.mlMatchScore}% ML Match</span>
              </div>
            </div>

            <div class="sig-body">
              <div>
                <h3 class="sig-title">${escapeHtml(p.title)}</h3>
                <div class="sig-loc">&#9679; ${escapeHtml(p.location)} · Smart ${p.smart_home_score}/10</div>
              </div>

              <div class="sig-footer-specs">
                <span>${p.bedrooms} Beds &nbsp;|&nbsp; ${p.bathrooms} Baths &nbsp;|&nbsp; ${Number(p.area_sqft).toLocaleString()} Sq Ft</span>
                <button type="button" class="sig-book-link" data-book-id="${p.id}">Book &#8594;</button>
              </div>
            </div>
          </article>
        `;
      })
      .join('');

    grid.querySelectorAll('[data-save-id]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        if (!currentUser) {
          window.location.href = '/login';
          return;
        }
        const id = btn.dataset.saveId;
        const res = await fetch(`/api/properties/${id}/save`, { method: 'POST' });
        if (res.ok) {
          const result = await res.json();
          btn.classList.toggle('saved', result.saved);
          btn.innerHTML = result.saved ? '&#9733;' : '&#9734;';
          loadSession();
        }
      });
    });

    grid.querySelectorAll('[data-book-id]').forEach((btn) => {
      btn.addEventListener('click', () => openViewingModal(btn.dataset.bookId));
    });
  }

  // Category Tabs (All | Villa | Apartment | Estate | Pavilion)
  document.getElementById('typeTabs').querySelectorAll('.filter-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('#typeTabs .filter-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      activeType = tab.dataset.type;
      document.getElementById('typeFilter').value = activeType;
      loadProperties({
        location: document.getElementById('locationFilter').value,
        type: activeType,
        maxPrice: document.getElementById('maxPriceFilter').value,
        minBeds: document.getElementById('minBedsFilter').value
      });
    });
  });

  document.getElementById('toggleAllResidencesBtn').addEventListener('click', () => {
    showAllResidences = !showAllResidences;
    renderProperties(allProperties);
  });

  document.getElementById('filterForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    activeType = document.getElementById('typeFilter').value;
    document.querySelectorAll('#typeTabs .filter-tab').forEach((t) => {
      t.classList.toggle('active', t.dataset.type === activeType);
    });
    showAllResidences = true;
    await loadProperties({
      location: document.getElementById('locationFilter').value,
      type: activeType,
      maxPrice: document.getElementById('maxPriceFilter').value,
      minBeds: document.getElementById('minBedsFilter').value
    });
    document.getElementById('collection').scrollIntoView({ behavior: 'smooth' });
  });

  // ==================== VIEWING MODAL ====================
  const defaultDate = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10);
  const modal = document.getElementById('viewingModal');
  const viewingAlert = document.getElementById('viewingAlert');

  function openViewingModal(propertyId = null) {
    if (propertyId) {
      document.getElementById('viewPropertySelect').value = propertyId;
    }
    if (!document.getElementById('viewDate').value) {
      document.getElementById('viewDate').value = defaultDate;
    }
    viewingAlert.className = 'alert-banner';
    modal.classList.add('open');
  }

  document.getElementById('footerBookViewingLink').addEventListener('click', (e) => {
    e.preventDefault();
    openViewingModal();
  });
  document.getElementById('closeModalBtn').addEventListener('click', () => modal.classList.remove('open'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('open');
  });

  document.getElementById('viewingForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const res = await fetch('/api/viewings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        propertyId: document.getElementById('viewPropertySelect').value,
        fullName: document.getElementById('viewFullName').value.trim(),
        email: document.getElementById('viewEmail').value.trim(),
        phone: document.getElementById('viewPhone').value.trim(),
        preferredDate: document.getElementById('viewDate').value,
        notes: document.getElementById('viewNotes').value.trim()
      })
    });
    const data = await res.json();
    if (!res.ok) {
      viewingAlert.className = 'alert-banner visible error';
      viewingAlert.textContent = data.error || 'Unable to confirm viewing.';
      return;
    }

    viewingAlert.className = 'alert-banner visible success';
    viewingAlert.textContent = 'Private twilight viewing confirmed and saved to database.';
    if (currentUser) loadSession();
    setTimeout(() => modal.classList.remove('open'), 1300);
  });

  // ==================== INITIALIZE ====================
  (async function init() {
    await loadSession();
    await loadProperties();
  })();
})();
