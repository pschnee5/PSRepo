// =============================================================
// Gremlin Glizzy Tracker — script.js
// =============================================================

// ---- City coordinate mapping (approximate % positions on map) ----
const CITY_COORDS = {
  'Copenhagen, Denmark': { x: 50, y: 28 },
  'Berlin, Germany': { x: 52, y: 35 },
  'Munich, Germany': { x: 49, y: 42 },
  'Vienna, Austria': { x: 55, y: 43 },
  'Prague, Czech Republic': { x: 53, y: 39 },
  'Amsterdam, Netherlands': { x: 42, y: 32 },
  'Brussels, Belgium': { x: 41, y: 36 },
  'Zurich, Switzerland': { x: 44, y: 44 },
  'Warsaw, Poland': { x: 60, y: 33 },
  'Krakow, Poland': { x: 60, y: 38 },
  'Budapest, Hungary': { x: 59, y: 44 },
  'Stockholm, Sweden': { x: 56, y: 20 },
  'Oslo, Norway': { x: 47, y: 18 },
  'Helsinki, Finland': { x: 64, y: 16 },
  'Paris, France': { x: 38, y: 42 },
  'London, United Kingdom': { x: 34, y: 34 },
  'Dublin, Ireland': { x: 27, y: 32 },
  'Barcelona, Spain': { x: 36, y: 58 },
  'Madrid, Spain': { x: 30, y: 58 },
  'Lisbon, Portugal': { x: 22, y: 62 },
  'Rome, Italy': { x: 50, y: 55 },
  'Milan, Italy': { x: 46, y: 48 },
  'Athens, Greece': { x: 62, y: 62 },
  'Istanbul, Turkey': { x: 72, y: 56 },
  'Reykjavik, Iceland': { x: 12, y: 8 },
};

// ---- Seed data based on the Copenhagen trip photos ----
const SEED_DATA = [
  {
    id: 'seed-1',
    name: "DØP - Den Økologiske Pølsemand",
    dish: "Ristet Hotdog med det hele",
    type: "Pølse",
    reviewer: "Justin Paul",
    city: "Copenhagen",
    country: "Denmark",
    region: "Scandinavia",
    rating: 9.2,
    price: "45 DKK",
    date: "2025-07-12",
    notes: "The classic Danish street dog — organic pork sausage, crispy onions, raw onions, pickled cucumbers, mustard, ketchup and remoulade in a soft bun. Absolute perfection at the Nyhavn stand. This is the gold standard.",
    image: "images/IMG_3871.jpeg",
    taste: 9.5,
    snap: 9.0,
    toppings: 9.3,
    vibe: 8.8
  },
  {
    id: 'seed-2',
    name: "Pølsevognen ved Rundetårn",
    dish: "Rød Pølse (Red Sausage)",
    type: "Pølse",
    reviewer: "Evan Von Joost",
    city: "Copenhagen",
    country: "Denmark",
    region: "Scandinavia",
    rating: 8.7,
    price: "38 DKK",
    date: "2025-07-12",
    notes: "The bright red casing snapped perfectly. Classic Copenhagen cart vibes — ate it standing up by the Round Tower. Remoulade is the secret weapon. Cocio chocolate milk on the side is mandatory.",
    image: "images/IMG_3870.jpeg",
    taste: 8.8,
    snap: 9.2,
    toppings: 8.0,
    vibe: 8.5
  },
  {
    id: 'seed-3',
    name: "John's Hotdog Deli",
    dish: "French Hotdog",
    type: "Hot Dog",
    reviewer: "Kongens Schnee",
    city: "Copenhagen",
    country: "Denmark",
    region: "Scandinavia",
    rating: 8.4,
    price: "55 DKK",
    date: "2025-07-13",
    notes: "The baguette-style bun with the sausage pushed inside — genius design. Located in the Meatpacking District. Great late-night option.",
    image: "images/IMG_3691.jpeg",
    taste: 8.5,
    snap: 8.0,
    toppings: 8.5,
    vibe: 8.8
  },
  {
    id: 'seed-4',
    name: "Gasoline Grill",
    dish: "Bacon-Wrapped Dog",
    type: "Hot Dog",
    reviewer: "Evan Von Joost",
    city: "Copenhagen",
    country: "Denmark",
    region: "Scandinavia",
    rating: 9.0,
    price: "65 DKK",
    date: "2025-07-13",
    notes: "Bacon-wrapped, griddled to perfection. The crispy fried onions were insane. Ate this on the canal boat — views and dogs, what more could you want?",
    image: "images/IMG_3839.jpg",
    taste: 9.2,
    snap: 8.8,
    toppings: 9.0,
    vibe: 9.5
  },
  {
    id: 'seed-5',
    name: "Curry 36",
    dish: "Currywurst mit Pommes",
    type: "Currywurst",
    reviewer: "Kongens Schnee",
    city: "Berlin",
    country: "Germany",
    region: "Central Europe",
    rating: 8.8,
    price: "4.50 EUR",
    date: "2025-07-15",
    notes: "A Berlin institution. The curry ketchup is tangy and spicy. The sausage itself is a solid bratwurst underneath. Pommes are crispy. Late-night crowds give it great energy.",
    image: "",
    taste: 9.0,
    snap: 8.5,
    toppings: 8.8,
    vibe: 8.5
  },
  {
    id: 'seed-6',
    name: "Konnopke's Imbiss",
    dish: "Original Currywurst",
    type: "Currywurst",
    reviewer: "Evan Von Joost",
    city: "Berlin",
    country: "Germany",
    region: "Central Europe",
    rating: 9.1,
    price: "4.80 EUR",
    date: "2025-07-15",
    notes: "Under the U-Bahn tracks in Prenzlauer Berg. Been running since 1930. The curry powder blend is their secret. Absolute must-visit in Berlin.",
    image: "",
    taste: 9.3,
    snap: 8.8,
    toppings: 9.0,
    vibe: 9.2
  },
  {
    id: 'seed-7',
    name: "Biker's Bratwurst",
    dish: "Thüringer Rostbratwurst",
    type: "Bratwurst",
    reviewer: "Kongens Schnee",
    city: "Munich",
    country: "Germany",
    region: "Central Europe",
    rating: 8.5,
    price: "5.00 EUR",
    date: "2025-07-17",
    notes: "Charcoal-grilled Thuringian bratwurst with sharp mustard and a fresh roll. Smoky flavor is incredible. The marjoram spice blend sets this apart.",
    image: "",
    taste: 8.8,
    snap: 8.5,
    toppings: 7.5,
    vibe: 8.8
  },
  {
    id: 'seed-8',
    name: "Würstelstand LEO",
    dish: "Käsekrainer",
    type: "Sausage",
    reviewer: "Evan Von Joost",
    city: "Vienna",
    country: "Austria",
    region: "Central Europe",
    rating: 9.4,
    price: "5.20 EUR",
    date: "2025-07-19",
    notes: "Cheese-filled sausage that oozes when you bite in. Served with a hard roll and sweet mustard. Vienna's best late-night snack, no contest. The Gremlins' current #1.",
    image: "",
    taste: 9.5,
    snap: 9.0,
    toppings: 9.2,
    vibe: 9.8
  },
  {
    id: 'seed-9',
    name: "Bitzinger Würstelstand",
    dish: "Bosna",
    type: "Bratwurst",
    reviewer: "Kongens Schnee",
    city: "Vienna",
    country: "Austria",
    region: "Central Europe",
    rating: 8.9,
    price: "5.50 EUR",
    date: "2025-07-19",
    notes: "Austrian take on a bratwurst in a sliced roll with raw onions and curry powder. Stood outside the opera house eating this. Peak gremlin behavior.",
    image: "",
    taste: 9.0,
    snap: 8.5,
    toppings: 8.8,
    vibe: 9.5
  },
  {
    id: 'seed-10',
    name: "FEBO",
    dish: "Broodje Frikandel Speciaal",
    type: "Other",
    reviewer: "Evan Von Joost",
    city: "Amsterdam",
    country: "Netherlands",
    region: "Western Europe",
    rating: 7.2,
    price: "3.50 EUR",
    date: "2025-07-21",
    notes: "From the automat wall! Deep-fried mystery meat log with curry ketchup, mayo and raw onions. Is it a sausage? Debatable. Is it delicious at 2am? Absolutely.",
    image: "",
    taste: 7.5,
    snap: 6.0,
    toppings: 7.8,
    vibe: 8.0
  },
  {
    id: 'seed-11',
    name: "Krakowska Kielbasa Cart",
    dish: "Kielbasa z Grilla",
    type: "Kielbasa",
    reviewer: "Justin Paul",
    city: "Krakow",
    country: "Poland",
    region: "Eastern Europe",
    rating: 8.6,
    price: "15 PLN",
    date: "2025-07-23",
    notes: "Charcoal-grilled Polish kielbasa in the main square. Smoky, garlicky, and served with a hunk of bread and mustard. Old-school and phenomenal.",
    image: "",
    taste: 9.0,
    snap: 8.5,
    toppings: 7.0,
    vibe: 9.0
  },
  {
    id: 'seed-12',
    name: "Bæjarins Beztu Pylsur",
    dish: "Eina með öllu",
    type: "Hot Dog",
    reviewer: "Evan Von Joost",
    city: "Reykjavik",
    country: "Iceland",
    region: "Scandinavia",
    rating: 9.3,
    price: "590 ISK",
    date: "2025-08-02",
    notes: "The best hot dog stand in Iceland, maybe Europe. Lamb-based sausage with raw + crispy onions, ketchup, sweet mustard and remoulade. Simple perfection. Bill Clinton ate here.",
    image: "",
    taste: 9.5,
    snap: 9.0,
    toppings: 9.2,
    vibe: 9.0
  }
];

// ---- App State ----
let entries = [];

function loadEntries() {
  const stored = localStorage.getItem('glizzy-entries');
  if (stored) {
    entries = JSON.parse(stored);
    // Sync seed entries with latest data (images, reviewer names, etc.)
    const seedMap = {};
    SEED_DATA.forEach(s => { seedMap[s.id] = s; });
    entries = entries.map(e => {
      if (seedMap[e.id]) {
        return { ...seedMap[e.id], ...e, image: seedMap[e.id].image, reviewer: seedMap[e.id].reviewer };
      }
      return e;
    });
    saveEntries();
  } else {
    entries = [...SEED_DATA];
    saveEntries();
  }
}

function saveEntries() {
  localStorage.setItem('glizzy-entries', JSON.stringify(entries));
}

// ---- Tab Navigation ----
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  const contents = document.querySelectorAll('.tab-content');
  const filters = document.getElementById('filters');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      contents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      const target = document.getElementById('tab-' + tab.dataset.tab);
      if (target) target.classList.add('active');

      // Show filters only on leaderboard
      filters.style.display = tab.dataset.tab === 'leaderboard' ? 'flex' : 'none';
    });
  });
}

// ---- Filters ----
function populateFilters() {
  const countries = [...new Set(entries.map(e => e.country))].sort();
  const cities = [...new Set(entries.map(e => e.city))].sort();
  const regions = [...new Set(entries.map(e => e.region))].sort();

  populateSelect('filter-country', countries);
  populateSelect('filter-city', cities);
  populateSelect('filter-region', regions);
}

function populateSelect(id, values) {
  const select = document.getElementById(id);
  const current = select.value;
  const firstOption = select.options[0].outerHTML;
  select.innerHTML = firstOption;
  values.forEach(v => {
    const opt = document.createElement('option');
    opt.value = v;
    opt.textContent = v;
    select.appendChild(opt);
  });
  select.value = current;
}

function getFilteredEntries() {
  const country = document.getElementById('filter-country').value;
  const city = document.getElementById('filter-city').value;
  const region = document.getElementById('filter-region').value;
  const type = document.getElementById('filter-type').value;
  const reviewer = document.getElementById('filter-reviewer').value;

  return entries.filter(e => {
    if (country && e.country !== country) return false;
    if (city && e.city !== city) return false;
    if (region && e.region !== region) return false;
    if (type && e.type !== type) return false;
    if (reviewer && e.reviewer !== reviewer) return false;
    return true;
  });
}

function initFilters() {
  ['filter-country', 'filter-city', 'filter-region', 'filter-type', 'filter-reviewer'].forEach(id => {
    document.getElementById(id).addEventListener('change', () => {
      renderLeaderboard();
    });
  });

  document.getElementById('sort-by').addEventListener('change', () => {
    renderLeaderboard();
  });
}

// ---- Leaderboard ----
function renderLeaderboard() {
  const list = document.getElementById('leaderboard-list');
  let filtered = getFilteredEntries();
  const sortBy = document.getElementById('sort-by').value;

  if (sortBy === 'rating') {
    filtered.sort((a, b) => b.rating - a.rating);
  } else if (sortBy === 'date') {
    filtered.sort((a, b) => new Date(b.date) - new Date(a.date));
  } else if (sortBy === 'name') {
    filtered.sort((a, b) => a.name.localeCompare(b.name));
  }

  if (filtered.length === 0) {
    list.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">&#127789;</div>
        <p>No glizzies match your filters. Time to explore more of Europe!</p>
      </div>
    `;
    return;
  }

  list.innerHTML = filtered.map((entry, i) => {
    const rankClass = i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : 'normal';
    const imageHTML = entry.image
      ? `<img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.dish)}" class="card-image" />`
      : `<div class="card-image-placeholder">&#127789;</div>`;

    const breakdownHTML = (entry.taste || entry.snap || entry.toppings || entry.vibe) ? `
      <div class="card-breakdown">
        <div class="breakdown-item">
          <div class="breakdown-label">Taste</div>
          <div class="breakdown-value">${entry.taste || '-'}</div>
        </div>
        <div class="breakdown-item">
          <div class="breakdown-label">Snap</div>
          <div class="breakdown-value">${entry.snap || '-'}</div>
        </div>
        <div class="breakdown-item">
          <div class="breakdown-label">Toppings</div>
          <div class="breakdown-value">${entry.toppings || '-'}</div>
        </div>
        <div class="breakdown-item">
          <div class="breakdown-label">Vibe</div>
          <div class="breakdown-value">${entry.vibe || '-'}</div>
        </div>
      </div>
    ` : '';

    return `
      <div class="glizzy-card">
        <div class="rank-badge ${rankClass}">#${i + 1}</div>
        ${imageHTML}
        <div class="card-body">
          <div class="card-top-row">
            <div class="card-name">${escapeHtml(entry.name)}</div>
            <div class="card-rating">&#9733; ${entry.rating.toFixed(1)}</div>
          </div>
          <div class="card-dish">${escapeHtml(entry.dish)}</div>
          <div class="card-location">${escapeHtml(entry.city)}, ${escapeHtml(entry.country)}</div>
          <div class="card-meta">
            <span class="card-tag tag-type">${escapeHtml(entry.type)}</span>
            <span class="card-tag tag-region">${escapeHtml(entry.region)}</span>
            <span class="card-tag tag-reviewer">${escapeHtml(entry.reviewer)}</span>
            ${entry.price ? `<span class="card-tag tag-price">${escapeHtml(entry.price)}</span>` : ''}
          </div>
          ${entry.notes ? `<div class="card-notes">${escapeHtml(entry.notes)}</div>` : ''}
          ${breakdownHTML}
          <div class="card-date">${formatDate(entry.date)}</div>
          <div class="card-actions">
            <button class="btn-delete" onclick="deleteEntry('${entry.id}')">Remove</button>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Map ----
function renderMap() {
  const container = document.getElementById('map-container');
  const pinsDiv = document.getElementById('map-pins');

  // Draw simplified Europe background with SVG
  const svg = document.getElementById('europe-map');
  svg.innerHTML = `
    <rect width="800" height="600" fill="#d6eaf8" />
    <!-- Water -->
    <ellipse cx="400" cy="300" rx="380" ry="280" fill="#aed6f1" opacity="0.3" />
    <!-- Simplified land masses -->
    <!-- Scandinavia -->
    <path d="M380 40 L420 30 L440 80 L450 140 L430 180 L410 200 L420 160 L400 120 L380 100 Z" fill="#a8d8a8" stroke="#7dab7d" stroke-width="1"/>
    <!-- British Isles -->
    <path d="M240 200 L280 180 L300 220 L290 280 L260 300 L240 260 Z" fill="#a8d8a8" stroke="#7dab7d" stroke-width="1"/>
    <path d="M200 210 L230 200 L240 240 L220 260 L200 240 Z" fill="#a8d8a8" stroke="#7dab7d" stroke-width="1"/>
    <!-- Western Europe -->
    <path d="M280 280 L340 260 L380 280 L400 320 L360 380 L320 400 L280 360 L260 320 Z" fill="#a8d8a8" stroke="#7dab7d" stroke-width="1"/>
    <!-- Iberian Peninsula -->
    <path d="M220 360 L300 340 L320 400 L300 440 L240 440 L200 400 Z" fill="#a8d8a8" stroke="#7dab7d" stroke-width="1"/>
    <!-- Central Europe -->
    <path d="M380 200 L500 190 L520 240 L510 300 L460 320 L400 320 L380 280 Z" fill="#a8d8a8" stroke="#7dab7d" stroke-width="1"/>
    <!-- Italy -->
    <path d="M400 320 L420 340 L440 400 L430 440 L410 430 L400 380 L390 340 Z" fill="#a8d8a8" stroke="#7dab7d" stroke-width="1"/>
    <!-- Eastern Europe -->
    <path d="M500 140 L560 120 L600 160 L600 260 L560 300 L520 280 L500 220 Z" fill="#a8d8a8" stroke="#7dab7d" stroke-width="1"/>
    <!-- Balkans / Greece -->
    <path d="M460 320 L520 300 L560 340 L540 400 L500 420 L470 380 Z" fill="#a8d8a8" stroke="#7dab7d" stroke-width="1"/>
    <!-- Turkey -->
    <path d="M560 320 L660 300 L700 340 L660 360 L580 360 Z" fill="#a8d8a8" stroke="#7dab7d" stroke-width="1"/>
    <!-- Iceland -->
    <path d="M80 40 L130 30 L140 60 L110 80 L70 60 Z" fill="#a8d8a8" stroke="#7dab7d" stroke-width="1"/>
    <!-- Finland -->
    <path d="M500 40 L530 30 L540 100 L520 140 L500 120 Z" fill="#a8d8a8" stroke="#7dab7d" stroke-width="1"/>
  `;

  // Group entries by city
  const cityGroups = {};
  entries.forEach(e => {
    const key = `${e.city}, ${e.country}`;
    if (!cityGroups[key]) cityGroups[key] = [];
    cityGroups[key].push(e);
  });

  pinsDiv.innerHTML = '';

  Object.keys(cityGroups).forEach(cityKey => {
    const group = cityGroups[cityKey];
    const avgRating = group.reduce((sum, e) => sum + e.rating, 0) / group.length;
    const coords = CITY_COORDS[cityKey] || guessCoords(cityKey);

    let color;
    if (avgRating >= 9) color = '#e74c3c';
    else if (avgRating >= 7) color = '#f39c12';
    else if (avgRating >= 5) color = '#3498db';
    else color = '#95a5a6';

    const pin = document.createElement('div');
    pin.className = 'map-pin';
    pin.style.background = color;
    pin.style.left = coords.x + '%';
    pin.style.top = coords.y + '%';

    const tooltip = document.createElement('div');
    tooltip.className = 'map-pin-tooltip';
    tooltip.innerHTML = `<strong>${escapeHtml(cityKey)}</strong><br>${group.length} glizz${group.length > 1 ? 'ies' : 'y'} &bull; Avg: ${avgRating.toFixed(1)}`;
    pin.appendChild(tooltip);

    const label = document.createElement('div');
    label.className = 'map-city-label';
    label.style.left = (coords.x + 2) + '%';
    label.style.top = (coords.y - 3) + '%';
    label.textContent = group[0].city;

    pinsDiv.appendChild(pin);
    pinsDiv.appendChild(label);
  });
}

function guessCoords(cityKey) {
  // Fallback: hash the city name to a somewhat-random but stable position in Europe
  let hash = 0;
  for (let i = 0; i < cityKey.length; i++) {
    hash = ((hash << 5) - hash) + cityKey.charCodeAt(i);
    hash |= 0;
  }
  return {
    x: 25 + Math.abs(hash % 50),
    y: 20 + Math.abs((hash >> 8) % 45)
  };
}

// ---- Gallery ----
function renderGallery() {
  const grid = document.getElementById('gallery-grid');
  const withImages = entries.filter(e => e.image);
  const allEntries = entries.slice().sort((a, b) => b.rating - a.rating);

  // Show all entries as gallery cards (those with images first)
  const sorted = [...withImages, ...allEntries.filter(e => !e.image)];
  // dedupe
  const seen = new Set();
  const unique = sorted.filter(e => {
    if (seen.has(e.id)) return false;
    seen.add(e.id);
    return true;
  });

  grid.innerHTML = unique.map(entry => {
    const imgHTML = entry.image
      ? `<img src="${escapeHtml(entry.image)}" alt="${escapeHtml(entry.dish)}" />`
      : `<div class="card-image-placeholder" style="height:220px">&#127789;</div>`;

    return `
      <div class="gallery-item">
        ${imgHTML}
        <div class="gallery-caption">
          <strong>${escapeHtml(entry.name)} &bull; ${entry.rating.toFixed(1)}</strong>
          ${escapeHtml(entry.dish)} &mdash; ${escapeHtml(entry.city)}, ${escapeHtml(entry.country)}
          <br><em>${escapeHtml(entry.reviewer)}</em>
        </div>
      </div>
    `;
  }).join('');
}

// ---- Stats ----
function renderStats() {
  document.getElementById('stat-total').textContent = entries.length;
  document.getElementById('stat-countries').textContent = new Set(entries.map(e => e.country)).size;
  document.getElementById('stat-cities').textContent = new Set(entries.map(e => e.city)).size;

  if (entries.length > 0) {
    const avg = entries.reduce((s, e) => s + e.rating, 0) / entries.length;
    document.getElementById('stat-avg').textContent = avg.toFixed(1);

    const best = entries.reduce((max, e) => e.rating > max.rating ? e : max, entries[0]);
    document.getElementById('stat-best').textContent = best.name;
  }
}

// ---- Add Form ----
function initForm() {
  const form = document.getElementById('add-form');
  form.addEventListener('submit', (e) => {
    e.preventDefault();

    const newEntry = {
      id: 'entry-' + Date.now(),
      name: document.getElementById('entry-name').value.trim(),
      dish: document.getElementById('entry-dish').value.trim(),
      type: document.getElementById('entry-type').value,
      reviewer: document.getElementById('entry-reviewer').value,
      city: document.getElementById('entry-city').value.trim(),
      country: document.getElementById('entry-country').value.trim(),
      region: document.getElementById('entry-region').value.trim(),
      rating: parseFloat(document.getElementById('entry-rating').value),
      price: document.getElementById('entry-price').value.trim(),
      date: document.getElementById('entry-date').value,
      notes: document.getElementById('entry-notes').value.trim(),
      image: document.getElementById('entry-image').value.trim(),
      taste: parseFloat(document.getElementById('entry-taste').value) || null,
      snap: parseFloat(document.getElementById('entry-snap').value) || null,
      toppings: parseFloat(document.getElementById('entry-toppings').value) || null,
      vibe: parseFloat(document.getElementById('entry-vibe').value) || null,
    };

    entries.push(newEntry);
    saveEntries();
    form.reset();
    showToast(`Logged "${newEntry.dish}" at ${newEntry.name}!`);
    refreshAll();

    // Switch to leaderboard tab
    document.querySelector('.tab[data-tab="leaderboard"]').click();
  });
}

// ---- Delete ----
function deleteEntry(id) {
  entries = entries.filter(e => e.id !== id);
  saveEntries();
  refreshAll();
  showToast('Entry removed.');
}

// ---- Helpers ----
function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function showToast(msg) {
  const existing = document.querySelector('.toast');
  if (existing) existing.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = msg;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 3000);
}

function refreshAll() {
  populateFilters();
  renderLeaderboard();
  renderMap();
  renderGallery();
  renderStats();
}

// ---- Init ----
document.addEventListener('DOMContentLoaded', () => {
  loadEntries();
  initTabs();
  initFilters();
  initForm();
  refreshAll();
});
