/**
 * PocketSmart AI - Client-Side Application Engine
 * Language: JavaScript (ES6+)
 * 
 * Handles:
 * 1. View navigation & hash routing (#home, #dashboard, #home-planner, etc.)
 * 2. User authentication state (persistent & demo accounts)
 * 3. Home Interior, Party, and Jewelry budget recommendation generators
 * 4. Image preview for outfit photo matching
 * 5. Recommendation History management (Save, Filter, View Details, Delete)
 */

// Application State
const AppState = {
  currentUser: {
    username: 'sai',
    name: 'Sai Kumar',
    email: 'sai@example.com'
  },
  currentPlan: null,
  history: [],
  activeFilter: 'all',
  outfitImageBase64: null
};

// Utilities
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => document.querySelectorAll(selector);

function formatINR(amount) {
  const num = Number(amount) || 0;
  return '₹' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHTML(str) {
  return String(str || '').replace(/[&<>"']/g, (m) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }[m]));
}

// ========================================================
// 1. ROUTING & VIEW NAVIGATION
// ========================================================
const VIEWS = [
  'home',
  'dashboard',
  'home-planner',
  'party-planner',
  'jewelry-planner',
  'history',
  'testimonials',
  'login',
  'register'
];

function navigateTo(viewName) {
  if (!VIEWS.includes(viewName)) viewName = 'home';
  window.location.hash = `#${viewName}`;
  renderView(viewName);
}

function renderView(viewName) {
  // Hide all views
  $$('.view-panel').forEach((el) => el.classList.remove('active'));

  // Show active view
  const targetView = $(`#view-${viewName}`);
  if (targetView) {
    targetView.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Update navigation items
  $$('.nav-item').forEach((el) => {
    if (el.dataset.nav === viewName) {
      el.classList.add('active');
    } else {
      el.classList.remove('active');
    }
  });

  // Page-specific initializers
  if (viewName === 'dashboard') {
    renderDashboard();
  } else if (viewName === 'history') {
    renderHistory();
  }
}

function handleHashChange() {
  const hash = window.location.hash.replace('#', '') || 'home';
  renderView(hash);
}

// ========================================================
// 2. AUTHENTICATION & USER MANAGEMENT
// ========================================================
function updateAuthUI() {
  const userPill = $('#userPill');
  const authButtons = $('#authButtons');
  const navAvatar = $('#navAvatar');
  const navUserGreeting = $('#navUserGreeting');
  const dashWelcome = $('#dashWelcome');
  const dashAvatar = $('#dashAvatar');

  if (AppState.currentUser) {
    userPill.classList.remove('hidden');
    authButtons.classList.add('hidden');

    const firstLetter = (AppState.currentUser.name || AppState.currentUser.username || 'S').charAt(0).toUpperCase();
    navAvatar.textContent = firstLetter;
    navUserGreeting.textContent = `Welcome, ${AppState.currentUser.username}!`;

    if (dashWelcome) dashWelcome.textContent = `Welcome, ${AppState.currentUser.username}!`;
    if (dashAvatar) dashAvatar.textContent = firstLetter;
  } else {
    userPill.classList.add('hidden');
    authButtons.classList.remove('hidden');
  }
}

async function loginUser(username) {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username })
    });
    const data = await res.json();
    if (data.success && data.user) {
      AppState.currentUser = data.user;
      localStorage.setItem('pocket_user', JSON.stringify(data.user));
      updateAuthUI();
      navigateTo('dashboard');
    }
  } catch (err) {
    console.warn('Login fallback:', err);
    AppState.currentUser = { username: username || 'sai', name: 'Sai Kumar' };
    updateAuthUI();
    navigateTo('dashboard');
  }
}

function logoutUser() {
  AppState.currentUser = null;
  localStorage.removeItem('pocket_user');
  updateAuthUI();
  navigateTo('home');
}

// ========================================================
// 3. DASHBOARD STATS & RECENT ACTIVITY
// ========================================================
async function loadHistoryData() {
  try {
    const res = await fetch('/api/pocket/history');
    const data = await res.json();
    if (data.success && Array.isArray(data.history)) {
      AppState.history = data.history;
    }
  } catch (err) {
    console.warn('History fetch error, using local fallback:', err);
  }
}

function renderDashboard() {
  const totalPlans = AppState.history.length;
  const totalBudget = AppState.history.reduce((sum, h) => sum + (Number(h.budget) || 0), 0);
  const totalSavings = AppState.history.reduce((sum, h) => sum + (Number(h.remaining) || 0), 0);

  if ($('#statPlansCount')) $('#statPlansCount').textContent = totalPlans;
  if ($('#statTotalBudget')) $('#statTotalBudget').textContent = formatINR(totalBudget);
  if ($('#statTotalSavings')) $('#statTotalSavings').textContent = formatINR(totalSavings);

  const dashTable = $('#dashHistoryTable');
  if (!dashTable) return;

  if (AppState.history.length === 0) {
    dashTable.innerHTML = `<tr><td colspan="6" style="text-align: center; padding: 30px; color: var(--text-muted);">No plans saved yet. Click above to create your first budget plan!</td></tr>`;
    return;
  }

  dashTable.innerHTML = AppState.history.slice(0, 5).map((h) => {
    return `
      <tr>
        <td><strong>${escapeHTML(h.title)}</strong></td>
        <td><span class="type-badge ${escapeHTML(h.type)}">${escapeHTML(h.type.toUpperCase())}</span></td>
        <td>${formatINR(h.budget)}</td>
        <td class="text-primary font-bold">${formatINR(h.allocated)}</td>
        <td>${h.date || 'Recent'}</td>
        <td class="text-right">
          <button class="btn-secondary sm" onclick="viewHistoryPlan('${h.id}')">View Plan</button>
        </td>
      </tr>
    `;
  }).join('');
}

// ========================================================
// 4. HOME INTERIOR PLANNER GENERATOR
// ========================================================
async function handleHomePlannerSubmit(e) {
  e.preventDefault();
  const btn = $('#btnGenHome');
  btn.disabled = true;
  btn.innerHTML = '<span>✦ Generating Multi-Platform Recommendations...</span>';

  const budget = parseFloat($('#homeBudget').value) || 50000;
  const rooms = $('#homeRooms').value;
  const style = $('#homeStyle').value;
  const notes = $('#homeNotes').value;

  const roomTypes = Array.from($$('input[name="homeRoomType"]:checked')).map((el) => el.value);
  const retailers = Array.from($$('input[name="homeRetailer"]:checked')).map((el) => el.value);

  try {
    const res = await fetch('/api/pocket/home-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget, rooms, style, notes, roomTypes, retailers })
    });
    const data = await res.json();
    if (data.success && data.plan) {
      AppState.currentPlan = data.plan;
      renderHomePlanResult(data.plan);
    }
  } catch (err) {
    alert('Failed to generate home plan: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>✦ Generate Recommendations</span>';
  }
}

function renderHomePlanResult(plan) {
  const placeholder = $('#homePlaceholder');
  const container = $('#homeResultContent');
  if (placeholder) placeholder.classList.add('hidden');
  if (container) container.classList.remove('hidden');

  const { budget, allocated, remaining, details } = plan;

  let sectionsHTML = '';
  (details.sections || []).forEach((sec) => {
    const itemsRows = (sec.items || []).map((item) => {
      const platformClass = (item.platform || 'Amazon').toLowerCase().replace(/\s+/g, '');
      return `
        <tr>
          <td class="item-name-cell">
            <strong>${escapeHTML(item.name)}</strong>
            <small>${escapeHTML(item.desc)}</small>
          </td>
          <td class="item-price-cell">${formatINR(item.price)}</td>
          <td>${item.qty || 1}</td>
          <td>
            <a href="${item.url || '#'}" target="_blank" rel="noopener noreferrer" class="store-link-btn ${platformClass}">
              Shop on ${escapeHTML(item.platform || 'Store')} ↗
            </a>
          </td>
        </tr>
      `;
    }).join('');

    sectionsHTML += `
      <div class="category-section-block">
        <div class="category-section-header">
          <div class="category-title-wrap">
            <span class="category-icon">✦</span>
            <span class="category-title">${escapeHTML(sec.category)}</span>
          </div>
          <span class="category-alloc-badge">Allocation: ${formatINR(sec.allocation)}</span>
        </div>
        <div class="items-table-wrap">
          <table class="items-table">
            <thead>
              <tr>
                <th>Item Name &amp; Description</th>
                <th>Price</th>
                <th>Qty</th>
                <th>Shopping Link</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  const suggestionsHTML = (details.suggestions || []).map((s) => `<li>${escapeHTML(s)}</li>`).join('');

  container.innerHTML = `
    <div class="result-header-bar">
      <div>
        <h3 class="result-title">Your Personalized Budget Plan</h3>
        <p style="font-size: 13px; color: var(--text-muted);">${escapeHTML(plan.title)}</p>
      </div>
      <div class="result-header-actions">
        <button class="btn-secondary sm" onclick="window.print()">Print Plan</button>
        <button class="btn-primary sm" onclick="saveCurrentPlan()">Save to History</button>
      </div>
    </div>

    <!-- Budget Summary Box (Matching Video) -->
    <div class="budget-summary-box">
      <div>
        <div class="budget-metric-label">Total Budget</div>
        <div class="budget-metric-val">${formatINR(budget)}</div>
      </div>
      <div>
        <div class="budget-metric-label">Allocated Budget</div>
        <div class="budget-metric-val">${formatINR(allocated)}</div>
      </div>
      <div>
        <div class="budget-metric-label">Remaining Budget (Savings)</div>
        <div class="budget-metric-val savings">${formatINR(remaining)}</div>
      </div>
    </div>

    <!-- Categorized Tables -->
    ${sectionsHTML}

    <!-- Additional Suggestions Box -->
    <div class="suggestions-box">
      <div class="suggestions-header">
        <span>💡</span>
        <span>Additional Smart Suggestions</span>
      </div>
      <ul class="suggestions-list">
        ${suggestionsHTML}
      </ul>
    </div>
  `;
}

// ========================================================
// 5. PARTY BUDGET PLANNER GENERATOR
// ========================================================
async function handlePartyPlannerSubmit(e) {
  e.preventDefault();
  const btn = $('#btnGenParty');
  btn.disabled = true;
  btn.innerHTML = '<span>✦ Curating Swiggy, Zomato & OYO Packages...</span>';

  const budget = parseFloat($('#partyBudget').value) || 15000;
  const occasion = $('#partyOccasion').value;
  const guests = parseInt($('#partyGuests').value, 10) || 15;
  const venueType = $('#partyVenue').value;
  const city = $('#partyCity').value;
  const cuisine = $('#partyCuisine').value;

  const decorOptions = Array.from($$('input[name="partyDecor"]:checked')).map((el) => el.value);

  try {
    const res = await fetch('/api/pocket/party-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ budget, occasion, guests, venueType, city, cuisine, decorOptions })
    });
    const data = await res.json();
    if (data.success && data.plan) {
      AppState.currentPlan = data.plan;
      renderPartyPlanResult(data.plan);
    }
  } catch (err) {
    alert('Failed to generate party plan: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>✦ Generate Party Budget Plan</span>';
  }
}

function renderPartyPlanResult(plan) {
  const placeholder = $('#partyPlaceholder');
  const container = $('#partyResultContent');
  if (placeholder) placeholder.classList.add('hidden');
  if (container) container.classList.remove('hidden');

  const { budget, allocated, remaining, details } = plan;

  let sectionsHTML = '';
  (details.sections || []).forEach((sec) => {
    const itemsRows = (sec.items || []).map((item) => {
      const platformClass = (item.platform || 'Swiggy').toLowerCase().replace(/\s+/g, '');
      return `
        <tr>
          <td class="item-name-cell">
            <strong>${escapeHTML(item.name)}</strong>
            <small>${escapeHTML(item.desc)}</small>
          </td>
          <td class="item-price-cell">${formatINR(item.price)}</td>
          <td>
            <a href="${item.url || '#'}" target="_blank" rel="noopener noreferrer" class="store-link-btn ${platformClass}">
              Book on ${escapeHTML(item.platform || 'Platform')} ↗
            </a>
          </td>
        </tr>
      `;
    }).join('');

    sectionsHTML += `
      <div class="category-section-block">
        <div class="category-section-header">
          <div class="category-title-wrap">
            <span class="category-icon">🎉</span>
            <span class="category-title">${escapeHTML(sec.category)}</span>
          </div>
          <span class="category-alloc-badge">Allocation: ${formatINR(sec.allocation)}</span>
        </div>
        <div class="items-table-wrap">
          <table class="items-table">
            <thead>
              <tr>
                <th>Package Item &amp; Details</th>
                <th>Estimate</th>
                <th>Booking Link</th>
              </tr>
            </thead>
            <tbody>
              ${itemsRows}
            </tbody>
          </table>
        </div>
      </div>
    `;
  });

  const suggestionsHTML = (details.suggestions || []).map((s) => `<li>${escapeHTML(s)}</li>`).join('');

  container.innerHTML = `
    <div class="result-header-bar">
      <div>
        <h3 class="result-title">Your Party Budget Plan</h3>
        <p style="font-size: 13px; color: var(--text-muted);">${escapeHTML(plan.title)} · Est. ${formatINR(details.costPerGuest)} / guest</p>
      </div>
      <div class="result-header-actions">
        <button class="btn-secondary sm" onclick="window.print()">Print Plan</button>
        <button class="btn-primary party-btn sm" onclick="saveCurrentPlan()">Save to History</button>
      </div>
    </div>

    <!-- Budget Summary Box -->
    <div class="budget-summary-box">
      <div>
        <div class="budget-metric-label">Total Event Budget</div>
        <div class="budget-metric-val">${formatINR(budget)}</div>
      </div>
      <div>
        <div class="budget-metric-label">Allocated Packages</div>
        <div class="budget-metric-val">${formatINR(allocated)}</div>
      </div>
      <div>
        <div class="budget-metric-label">Remaining Savings Buffer</div>
        <div class="budget-metric-val savings">${formatINR(remaining)}</div>
      </div>
    </div>

    <!-- Categorized Packages -->
    ${sectionsHTML}

    <!-- Additional Suggestions Box -->
    <div class="suggestions-box">
      <div class="suggestions-header">
        <span>💡</span>
        <span>Party Execution Advice</span>
      </div>
      <ul class="suggestions-list">
        ${suggestionsHTML}
      </ul>
    </div>
  `;
}

// ========================================================
// 6. JEWELRY BUDGET PLANNER GENERATOR
// ========================================================
function handleImageUpload(e) {
  const file = e.target.files && e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    AppState.outfitImageBase64 = event.target.result;
    $('#imagePreviewImg').src = AppState.outfitImageBase64;
    $('#dropContent').classList.add('hidden');
    $('#imagePreviewBox').classList.remove('hidden');
  };
  reader.readAsDataURL(file);
}

function handleRemoveImage() {
  AppState.outfitImageBase64 = null;
  $('#outfitImageInput').value = '';
  $('#imagePreviewImg').src = '';
  $('#dropContent').classList.remove('hidden');
  $('#imagePreviewBox').classList.add('hidden');
}

async function handleJewelryPlannerSubmit(e) {
  e.preventDefault();
  const btn = $('#btnGenJewelry');
  btn.disabled = true;
  btn.innerHTML = '<span>✦ Analyzing Outfit &amp; Matching Jewelry...</span>';

  const budget = parseFloat($('#jewelryBudget').value) || 20000;
  const occasion = $('#jewelryOccasion').value;
  const material = $('#jewelryMaterial').value;
  const outfit = $('#jewelryOutfit').value;

  try {
    const res = await fetch('/api/pocket/jewelry-plan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget,
        occasion,
        material,
        outfit,
        imageData: AppState.outfitImageBase64
      })
    });
    const data = await res.json();
    if (data.success && data.plan) {
      AppState.currentPlan = data.plan;
      renderJewelryPlanResult(data.plan);
    }
  } catch (err) {
    alert('Failed to generate jewelry plan: ' + err.message);
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<span>✦ Get Recommendations</span>';
  }
}

function renderJewelryPlanResult(plan) {
  const placeholder = $('#jewelryPlaceholder');
  const container = $('#jewelryResultContent');
  if (placeholder) placeholder.classList.add('hidden');
  if (container) container.classList.remove('hidden');

  const { budget, allocated, remaining, details } = plan;

  const itemsHTML = (details.items || []).map((item) => {
    const shopTags = (item.shopOn || ['CaratLane', 'Amazon']).map((platform) => {
      const cls = platform.toLowerCase().replace(/\s+/g, '');
      return `<a href="${item.url || 'https://www.caratlane.com'}" target="_blank" rel="noopener noreferrer" class="store-link-btn ${cls}">Shop on ${escapeHTML(platform)} ↗</a>`;
    }).join(' ');

    return `
      <div class="jewelry-item-row">
        <div class="jewelry-item-left">
          <div class="jewelry-bullet-icon">✦</div>
          <div>
            <div class="jewelry-item-title">${escapeHTML(item.name)}</div>
            <div class="jewelry-item-desc">${escapeHTML(item.desc)}</div>
          </div>
        </div>
        <div class="jewelry-item-right">
          <div class="jewelry-price">${formatINR(item.price)}</div>
          <div>${shopTags}</div>
        </div>
      </div>
    `;
  }).join('');

  const tipsHTML = (details.stylingTips || []).map((tip) => `<li>${escapeHTML(tip)}</li>`).join('');

  container.innerHTML = `
    <div class="result-header-bar">
      <div>
        <h3 class="result-title">Your Personalized Jewelry Recommendations</h3>
        <p style="font-size: 13px; color: var(--text-muted);">${escapeHTML(plan.title)}</p>
      </div>
      <div class="result-header-actions">
        <button class="btn-secondary sm" onclick="window.print()">Print Plan</button>
        <button class="btn-primary jewelry-btn sm" onclick="saveCurrentPlan()">Save to History</button>
      </div>
    </div>

    <!-- Budget Summary Box -->
    <div class="budget-summary-box">
      <div>
        <div class="budget-metric-label">Total Jewelry Budget</div>
        <div class="budget-metric-val">${formatINR(budget)}</div>
      </div>
      <div>
        <div class="budget-metric-label">Allocated Pieces</div>
        <div class="budget-metric-val">${formatINR(allocated)}</div>
      </div>
      <div>
        <div class="budget-metric-label">Remaining Budget</div>
        <div class="budget-metric-val savings">${formatINR(remaining)}</div>
      </div>
    </div>

    <!-- AI Outfit Analysis Box (Matching Video) -->
    <div class="outfit-analysis-box">
      <div class="outfit-analysis-header">
        <span>👗</span>
        <span>Outfit &amp; Silhouette Analysis</span>
      </div>
      <p class="outfit-analysis-text">${escapeHTML(details.outfitAnalysis)}</p>
    </div>

    <!-- Jewelry Recommendations Stack -->
    <div class="jewelry-items-stack">
      ${itemsHTML}
    </div>

    <!-- Styling Tips Box -->
    <div class="suggestions-box">
      <div class="suggestions-header">
        <span>✨</span>
        <span>Styling &amp; Coordination Tips</span>
      </div>
      <ul class="suggestions-list">
        ${tipsHTML}
      </ul>
    </div>
  `;
}

// ========================================================
// 7. RECOMMENDATION HISTORY MANAGEMENT
// ========================================================
async function saveCurrentPlan() {
  if (!AppState.currentPlan) return;
  try {
    const res = await fetch('/api/pocket/history/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan: AppState.currentPlan })
    });
    const data = await res.json();
    if (data.success) {
      alert('Plan saved successfully to Recommendation History!');
      AppState.history.unshift(data.saved);
      renderDashboard();
    }
  } catch (err) {
    alert('Plan saved locally.');
    AppState.history.unshift(AppState.currentPlan);
    renderDashboard();
  }
}

function renderHistory() {
  const grid = $('#historyGrid');
  const empty = $('#historyEmptyState');
  if (!grid) return;

  const filtered = AppState.activeFilter === 'all'
    ? AppState.history
    : AppState.history.filter((h) => h.type === AppState.activeFilter);

  // Update counts
  if ($('#countAll')) $('#countAll').textContent = AppState.history.length;
  if ($('#countHome')) $('#countHome').textContent = AppState.history.length ? AppState.history.filter(h => h.type === 'home').length : 0;
  if ($('#countParty')) $('#countParty').textContent = AppState.history.length ? AppState.history.filter(h => h.type === 'party').length : 0;
  if ($('#countJewelry')) $('#countJewelry').textContent = AppState.history.length ? AppState.history.filter(h => h.type === 'jewelry').length : 0;

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (empty) empty.classList.remove('hidden');
    return;
  }

  if (empty) empty.classList.add('hidden');

  grid.innerHTML = filtered.map((h) => {
    return `
      <div class="history-card">
        <div class="history-card-top">
          <span class="type-badge ${escapeHTML(h.type)}">${escapeHTML(h.type.toUpperCase())}</span>
          <span class="history-card-date">${h.date || 'Saved'}</span>
        </div>
        <h4 class="history-card-title">${escapeHTML(h.title)}</h4>
        <div class="history-card-metrics">
          <div>
            <small style="color: var(--text-muted); font-size: 11px;">BUDGET</small>
            <div style="font-weight: 700;">${formatINR(h.budget)}</div>
          </div>
          <div>
            <small style="color: var(--text-muted); font-size: 11px;">SAVINGS</small>
            <div style="font-weight: 700; color: var(--emerald-dark);">${formatINR(h.remaining)}</div>
          </div>
        </div>
        <div class="history-card-actions">
          <button class="btn-primary sm" onclick="viewHistoryPlan('${h.id}')">View Details ↗</button>
          <button class="btn-text" style="color: var(--danger);" onclick="deleteHistoryPlan('${h.id}')">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

function viewHistoryPlan(id) {
  const plan = AppState.history.find((h) => h.id === id);
  if (!plan) return;

  const modal = $('#planDetailModal');
  const content = $('#modalPlanContent');
  if (!modal || !content) return;

  let detailsBody = '';
  if (plan.type === 'home') {
    const sections = (plan.details?.sections || []).map((sec) => `
      <div style="margin-top: 16px;">
        <h4 style="font-size: 13.5px; font-weight: 800; color: var(--navy-dark);">${sec.category} (Allocation: ${formatINR(sec.allocation)})</h4>
        <ul style="padding-left: 20px; font-size: 12.5px; margin-top: 6px; color: var(--text-muted);">
          ${(sec.items || []).map((i) => `<li><strong>${i.name}</strong> - ${formatINR(i.price)} (${i.platform})</li>`).join('')}
        </ul>
      </div>
    `).join('');
    detailsBody = sections;
  } else if (plan.type === 'party') {
    const sections = (plan.details?.sections || []).map((sec) => `
      <div style="margin-top: 16px;">
        <h4 style="font-size: 13.5px; font-weight: 800; color: var(--navy-dark);">${sec.category} (Allocation: ${formatINR(sec.allocation)})</h4>
        <ul style="padding-left: 20px; font-size: 12.5px; margin-top: 6px; color: var(--text-muted);">
          ${(sec.items || []).map((i) => `<li><strong>${i.name}</strong> - ${formatINR(i.price)} (${i.platform})</li>`).join('')}
        </ul>
      </div>
    `).join('');
    detailsBody = sections;
  } else if (plan.type === 'jewelry') {
    const items = (plan.details?.items || []).map((i) => `
      <li style="margin-bottom: 8px;">
        <strong>${i.name}</strong> · ${formatINR(i.price)}<br>
        <small style="color: var(--text-muted);">${i.desc}</small>
      </li>
    `).join('');
    detailsBody = `<ul style="padding-left: 20px; font-size: 13px; margin-top: 12px;">${items}</ul>`;
  }

  content.innerHTML = `
    <h2 style="font-family: 'Space Grotesk', sans-serif; font-size: 22px; font-weight: 800; color: var(--navy-dark); margin-bottom: 6px;">
      ${escapeHTML(plan.title)}
    </h2>
    <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 16px;">
      Saved on ${plan.date || 'Recent'} · Type: <span class="type-badge ${plan.type}">${plan.type.toUpperCase()}</span>
    </div>

    <div class="budget-summary-box" style="margin-bottom: 20px;">
      <div>
        <div class="budget-metric-label">Total Budget</div>
        <div class="budget-metric-val">${formatINR(plan.budget)}</div>
      </div>
      <div>
        <div class="budget-metric-label">Allocated</div>
        <div class="budget-metric-val">${formatINR(plan.allocated)}</div>
      </div>
      <div>
        <div class="budget-metric-label">Remaining</div>
        <div class="budget-metric-val savings">${formatINR(plan.remaining)}</div>
      </div>
    </div>

    ${detailsBody}

    <div style="display: flex; justify-content: flex-end; gap: 10px; margin-top: 24px; border-top: 1px solid var(--border-light); padding-top: 16px;">
      <button class="btn-secondary sm" onclick="window.print()">Print Statement</button>
      <button class="btn-primary sm" onclick="$('#planDetailModal').close()">Done</button>
    </div>
  `;

  modal.showModal();
}

async function deleteHistoryPlan(id) {
  if (!confirm('Are you sure you want to delete this saved plan?')) return;
  try {
    await fetch(`/api/pocket/history/${id}`, { method: 'DELETE' });
  } catch (err) {
    console.warn(err);
  }
  AppState.history = AppState.history.filter((h) => h.id !== id);
  renderHistory();
  renderDashboard();
}

// ========================================================
// 8. EVENT LISTENERS INITIALIZATION
// ========================================================
function initEventListeners() {
  // Navigation Links
  document.addEventListener('click', (e) => {
    const link = e.target.closest('[data-nav]');
    if (link) {
      e.preventDefault();
      const navTarget = link.dataset.nav;
      navigateTo(navTarget);
    }
  });

  window.addEventListener('hashchange', handleHashChange);

  // Auth Forms
  const loginForm = $('#loginForm');
  if (loginForm) {
    loginForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const username = $('#loginUsername').value.trim() || 'sai';
      loginUser(username);
    });
  }

  const registerForm = $('#registerForm');
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = $('#regUsername').value.trim();
      const email = $('#regEmail').value.trim();
      if (!username || !email) return;

      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, email })
        });
        const data = await res.json();
        if (data.success && data.user) {
          AppState.currentUser = data.user;
          localStorage.setItem('pocket_user', JSON.stringify(data.user));
          updateAuthUI();
          navigateTo('dashboard');
        } else {
          alert(data.error || 'Registration failed');
        }
      } catch (err) {
        AppState.currentUser = { username, email, name: username.toUpperCase() };
        updateAuthUI();
        navigateTo('dashboard');
      }
    });
  }

  // Logout button
  const logoutBtn = $('#logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', logoutUser);
  }

  // Home Planner Form
  const homeForm = $('#homePlannerForm');
  if (homeForm) {
    homeForm.addEventListener('submit', handleHomePlannerSubmit);
  }

  // Party Planner Form
  const partyForm = $('#partyPlannerForm');
  if (partyForm) {
    partyForm.addEventListener('submit', handlePartyPlannerSubmit);
  }

  // Jewelry Planner Form & Image Drop
  const jewelryForm = $('#jewelryPlannerForm');
  if (jewelryForm) {
    jewelryForm.addEventListener('submit', handleJewelryPlannerSubmit);
  }

  const outfitImageInput = $('#outfitImageInput');
  if (outfitImageInput) {
    outfitImageInput.addEventListener('change', handleImageUpload);
  }

  const btnRemoveImg = $('#btnRemoveImg');
  if (btnRemoveImg) {
    btnRemoveImg.addEventListener('click', handleRemoveImage);
  }

  // History Filter Pills
  const historyFilters = $('#historyFilters');
  if (historyFilters) {
    historyFilters.addEventListener('click', (e) => {
      const pill = e.target.closest('.filter-pill');
      if (pill) {
        $$('.filter-pill').forEach((p) => p.classList.remove('active'));
        pill.classList.add('active');
        AppState.activeFilter = pill.dataset.filter || 'all';
        renderHistory();
      }
    });
  }

  const btnRefreshHistory = $('#btnRefreshHistory');
  if (btnRefreshHistory) {
    btnRefreshHistory.addEventListener('click', async () => {
      await loadHistoryData();
      renderHistory();
      renderDashboard();
    });
  }

  // Close Dialog Modal
  const btnCloseModal = $('#btnCloseModal');
  if (btnCloseModal) {
    btnCloseModal.addEventListener('click', () => {
      $('#planDetailModal').close();
    });
  }

  // ========================================================
  // GEMINI AI ASSISTANT EVENT LISTENERS
  // ========================================================
  const floatingAiBtn = $('#floatingAiBtn');
  const aiChatDock = $('#aiChatDock');
  const btnCloseAiChat = $('#btnCloseAiChat');
  const aiChatForm = $('#aiChatForm');
  const aiChatInput = $('#aiChatInput');
  const aiChatMessages = $('#aiChatMessages');

  if (floatingAiBtn && aiChatDock) {
    floatingAiBtn.addEventListener('click', () => {
      aiChatDock.classList.toggle('hidden');
      if (!aiChatDock.classList.contains('hidden') && aiChatInput) {
        aiChatInput.focus();
      }
    });
  }

  if (btnCloseAiChat && aiChatDock) {
    btnCloseAiChat.addEventListener('click', () => {
      aiChatDock.classList.add('hidden');
    });
  }

  // Quick Prompt Chips
  document.addEventListener('click', (e) => {
    const chip = e.target.closest('.prompt-chip');
    if (chip && chip.dataset.prompt) {
      if (aiChatDock && aiChatDock.classList.contains('hidden')) {
        aiChatDock.classList.remove('hidden');
      }
      sendAiChatMessage(chip.dataset.prompt);
    }
  });

  if (aiChatForm && aiChatInput) {
    aiChatForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const text = aiChatInput.value.trim();
      if (!text) return;
      aiChatInput.value = '';
      sendAiChatMessage(text);
    });
  }
}

async function sendAiChatMessage(userMessage) {
  const container = $('#aiChatMessages');
  const btnSend = $('#btnSendAiChat');
  if (!container) return;

  // Append user message
  const userBubble = document.createElement('div');
  userBubble.className = 'chat-bubble user';
  userBubble.innerHTML = `
    <div class="bubble-sender">You</div>
    <p>${escapeHTML(userMessage)}</p>
  `;
  container.appendChild(userBubble);

  // Append typing indicator
  const typingBubble = document.createElement('div');
  typingBubble.className = 'chat-bubble ai typing';
  typingBubble.id = 'aiTypingIndicator';
  typingBubble.innerHTML = `
    <div class="bubble-sender">PocketSmart Gemini AI</div>
    <div class="typing-dots">
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
      <span class="typing-dot"></span>
    </div>
  `;
  container.appendChild(typingBubble);
  container.scrollTop = container.scrollHeight;

  if (btnSend) btnSend.disabled = true;

  try {
    const res = await fetch('/api/ai/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: userMessage,
        summary: AppState.currentPlan ? { title: AppState.currentPlan.title, budget: AppState.currentPlan.budget } : {}
      })
    });
    const data = await res.json();
    const typingEl = $('#aiTypingIndicator');
    if (typingEl) typingEl.remove();

    const aiBubble = document.createElement('div');
    aiBubble.className = 'chat-bubble ai';
    const replyText = data.reply || "I am analyzing your budget parameters. Feel free to refine your preferred category or price point.";
    aiBubble.innerHTML = `
      <div class="bubble-sender">PocketSmart Gemini AI <span style="font-size: 9px; opacity: 0.8; margin-left: 4px;">(${data.model || 'gemini-3.1-flash-lite'})</span></div>
      <p>${escapeHTML(replyText)}</p>
    `;
    container.appendChild(aiBubble);
  } catch (err) {
    const typingEl = $('#aiTypingIndicator');
    if (typingEl) typingEl.remove();

    const aiBubble = document.createElement('div');
    aiBubble.className = 'chat-bubble ai';
    aiBubble.innerHTML = `
      <div class="bubble-sender">PocketSmart Gemini AI</div>
      <p>A good budget strategy is 50% for core necessities, 30% for curated comforts, and 20% dedicated savings. Which planner can I guide you through?</p>
    `;
    container.appendChild(aiBubble);
  } finally {
    if (btnSend) btnSend.disabled = false;
    container.scrollTop = container.scrollHeight;
  }
}

async function checkGeminiStatus() {
  try {
    const res = await fetch('/api/ai/status');
    const data = await res.json();
    const pill = $('#aiStatusPill');
    if (pill) {
      if (data.aiEnabled) {
        pill.innerHTML = `<span class="ai-pulse-dot"></span> <span class="ai-status-text">Gemini AI Active</span>`;
        pill.style.display = 'inline-flex';
      } else {
        pill.innerHTML = `<span style="width:7px;height:7px;border-radius:50%;background:#94a3b8;display:inline-block;"></span> <span class="ai-status-text">Rule Engine Active</span>`;
      }
    }
  } catch (e) {
    console.warn('AI status check:', e);
  }
}

// ========================================================
// 9. APP BOOTSTRAP
// ========================================================
async function initApp() {
  initEventListeners();
  checkGeminiStatus();

  // Restore session or default to 'sai'
  const savedUser = localStorage.getItem('pocket_user');
  if (savedUser) {
    try {
      AppState.currentUser = JSON.parse(savedUser);
    } catch (e) {
      AppState.currentUser = { username: 'sai', name: 'Sai Kumar' };
    }
  }

  updateAuthUI();
  await loadHistoryData();

  // Route according to initial hash
  const initialHash = window.location.hash.replace('#', '') || 'home';
  renderView(initialHash);
}

document.addEventListener('DOMContentLoaded', initApp);
