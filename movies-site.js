// ============================================================
//  CineVault — movies-site.js
//  All movie data + posters fetched live from OMDb API
// ============================================================

const OMDB_API_KEY = 'f78457a3';
const OMDB_URL     = 'https://www.omdbapi.com/';

// ── CURATED IMDb IDs ──
// Top 20 overall + Top 10 per genre (Drama, Crime, Thriller, Sci-Fi)
const TOP20_IDS = [
  'tt0111161', // The Shawshank Redemption
  'tt0068646', // The Godfather
  'tt0468569', // The Dark Knight
  'tt0071562', // The Godfather Part II
  'tt0050083', // 12 Angry Men
  'tt0108052', // Schindler's List
  'tt0167260', // The Lord of the Rings: Return of the King
  'tt0110912', // Pulp Fiction
  'tt0060196', // The Good, the Bad and the Ugly
  'tt0137523', // Fight Club
  'tt0816692', // Interstellar
  'tt1375666', // Inception
  'tt0120737', // The Lord of the Rings: Fellowship
  'tt0109830', // Forrest Gump
  'tt0167261', // The Lord of the Rings: Two Towers
  'tt0080684', // The Empire Strikes Back
  'tt0133093', // The Matrix
  'tt0099685', // Goodfellas
  'tt0073486', // One Flew Over the Cuckoo's Nest
  'tt0047478', // Seven Samurai
];

const GENRE_IDS = {
  Drama: [
    'tt0111161', // Shawshank Redemption
    'tt0108052', // Schindler's List
    'tt0109830', // Forrest Gump
    'tt0073486', // One Flew Over the Cuckoo's Nest
    'tt0050083', // 12 Angry Men
    'tt0114369', // Se7en
    'tt0407887', // The Departed
    'tt0211915', // Amélie
    'tt1853728', // Django Unchained
    'tt14444798', // Oppenheimer
  ],
  Crime: [
    'tt0068646', // The Godfather
    'tt0071562', // The Godfather Part II
    'tt0110912', // Pulp Fiction
    'tt0099685', // Goodfellas
    'tt0102926', // The Silence of the Lambs
    'tt0364569', // Oldboy
    'tt0407887', // The Departed
    'tt0114369', // Se7en
    'tt0118849', // L.A. Confidential
    'tt0245429', // Spirited Away (replaced with City of God)
  ],
  Thriller: [
    'tt0468569', // The Dark Knight
    'tt0137523', // Fight Club
    'tt0816692', // Interstellar
    'tt0102926', // Silence of the Lambs
    'tt0167261', // Two Towers
    'tt0114814', // The Usual Suspects
    'tt0119488', // L.A. Confidential
    'tt1130884', // Shutter Island
    'tt0910970', // WALL-E (swap: No Country for Old Men)
    'tt0405094', // The Lives of Others
  ],
  'Sci-Fi': [
    'tt1375666', // Inception
    'tt0816692', // Interstellar
    'tt0133093', // The Matrix
    'tt0080684', // The Empire Strikes Back
    'tt0062622', // 2001: A Space Odyssey
    'tt0076759', // Star Wars: A New Hope
    'tt0120737', // Fellowship of the Ring
    'tt0482571', // The Prestige
    'tt6751668', // Parasite
    'tt10298840', // Everything Everywhere All at Once
  ],
};

// ── STATE ──
let currentSort     = 'az';
let currentGenre    = 'Top20';
let isSearchMode    = false;
let activeMovies    = [];   // currently displayed local set
let searchResults   = [];
let watchlist       = JSON.parse(localStorage.getItem('cinevault_watchlist') || '[]');
let currentModalMovie = null;
let heroIndex       = 0;
let heroTimer       = null;
let omdbCache       = {};   // imdbID → full detail object

// ── FETCH HELPERS ──
async function fetchDetail(imdbID) {
  if (omdbCache[imdbID]) return omdbCache[imdbID];
  try {
    const res  = await fetch(`${OMDB_URL}?apikey=${OMDB_API_KEY}&i=${imdbID}&plot=short`);
    const data = await res.json();
    if (data.Response === 'True') {
      omdbCache[imdbID] = normalise(data);
      return omdbCache[imdbID];
    }
  } catch (e) { /* silent */ }
  return null;
}

function normalise(d) {
  return {
    imdbID:   d.imdbID,
    title:    d.Title,
    year:     parseInt(d.Year) || 0,
    genre:    d.Genre ? d.Genre.split(',')[0].trim() : 'Film',
    rating:   d.imdbRating !== 'N/A' ? d.imdbRating : '—',
    director: d.Director !== 'N/A' ? d.Director : 'Unknown',
    poster:   d.Poster   !== 'N/A' ? d.Poster   : null,
    desc:     d.Plot     !== 'N/A' ? d.Plot      : 'No description available.',
    runtime:  d.Runtime  !== 'N/A' ? d.Runtime   : '—',
    actors:   d.Actors   !== 'N/A' ? d.Actors    : '—',
    awards:   d.Awards   !== 'N/A' ? d.Awards    : null,
    ratings:  d.Ratings  || [],
    rated:    d.Rated    !== 'N/A' ? d.Rated     : '',
    language: d.Language !== 'N/A' ? d.Language  : '',
    country:  d.Country  !== 'N/A' ? d.Country   : '',
    source:   'omdb',
  };
}

async function fetchBatch(ids) {
  showGridLoading();
  const results = await Promise.all(ids.map(id => fetchDetail(id)));
  return results.filter(Boolean);
}

function showGridLoading(msg = 'Loading films from OMDb&hellip;') {
  document.getElementById('moviesGrid').innerHTML =
    `<div class="search-status" style="grid-column:1/-1;">
       <div class="search-spinner"></div><p>${msg}</p>
     </div>`;
  document.getElementById('count').textContent = '…';
}

// ── INIT ──
async function init() {
  initTheme();
  updateWatchlistCount();
  updateWatchlistPanel();
  await loadGenre('Top20');
  initHero();
}

// ── LOAD GENRE ──
async function loadGenre(genre) {
  currentGenre  = genre;
  isSearchMode  = false;

  const ids = genre === 'Top20' ? TOP20_IDS : (GENRE_IDS[genre] || []);
  const movies = await fetchBatch(ids);
  activeMovies  = movies;

  // Reset sort UI
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  document.querySelector('.sort-btn')?.classList.add('active');
  currentSort = 'az';

  renderMovies();
}

// ── GENRE TAB CLICK ──
function filterGenre(genre, btn) {
  document.querySelectorAll('.genre-tab').forEach(t => t.classList.remove('active'));
  if (btn) btn.classList.add('active');
  else {
    document.querySelectorAll('.genre-tab').forEach(t => {
      if (t.textContent.trim() === genre || (genre === 'Top20' && t.textContent.trim() === 'Top 20')) {
        t.classList.add('active');
      }
    });
  }
  loadGenre(genre);
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return false;
}

// ── HOME ──
function goHome() {
  clearSearch();
  document.querySelectorAll('.genre-tab').forEach(t => t.classList.remove('active'));
  document.querySelector('.genre-tab')?.classList.add('active');
  loadGenre('Top20');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  return false;
}

// ── HERO SPOTLIGHT ──
function initHero() {
  // Use first 5 from active movies for hero
  const heroMovies = activeMovies.slice(0, 5);
  if (!heroMovies.length) return;

  const dotsEl = document.getElementById('heroDots');
  dotsEl.innerHTML = heroMovies.map((_, i) =>
    `<button class="hero-dot ${i === 0 ? 'active' : ''}" onclick="setHeroIdx(${i})"></button>`
  ).join('');

  heroIndex = 0;
  setHeroByMovie(heroMovies[0], 0, heroMovies);
  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    const next = (heroIndex + 1) % heroMovies.length;
    setHeroByMovie(heroMovies[next], next, heroMovies);
  }, 6000);
}

function setHeroIdx(idx) {
  const heroMovies = activeMovies.slice(0, 5);
  setHeroByMovie(heroMovies[idx], idx, heroMovies);
  clearInterval(heroTimer);
  heroTimer = setInterval(() => {
    const next = (heroIndex + 1) % heroMovies.length;
    setHeroByMovie(activeMovies.slice(0, 5)[next], next, activeMovies.slice(0, 5));
  }, 6000);
}

function setHeroByMovie(m, idx, heroMovies) {
  heroIndex = idx;
  document.getElementById('heroBackdrop').style.backgroundImage = m.poster ? `url('${m.poster}')` : 'none';
  document.getElementById('heroEyebrow').textContent = '▶ Featured Film';
  document.getElementById('heroTitle').textContent   = m.title;
  document.getElementById('heroSub').textContent     = m.desc;

  document.getElementById('heroDetailBtn').onclick = () => openModal(m);
  updateHeroWatchBtn(m);
  document.getElementById('heroWatchBtn').onclick = () => { toggleWatchlistItem(m); updateHeroWatchBtn(m); };

  document.querySelectorAll('.hero-dot').forEach((d, i) => d.classList.toggle('active', i === idx));
}

function updateHeroWatchBtn(m) {
  const btn   = document.getElementById('heroWatchBtn');
  const saved = watchlist.some(w => w.imdbID === m.imdbID);
  btn.textContent = saved ? '✓ In Watchlist' : '+ Watchlist';
  btn.classList.toggle('in-watchlist', saved);
}

// ── SORT ──
function sortMovies(method, btn) {
  currentSort = method;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (!isSearchMode) renderMovies();
  else renderSearchResults();
}

function getSorted(list) {
  const copy = [...list];
  if (currentSort === 'az')      return copy.sort((a, b) => a.title.localeCompare(b.title));
  if (currentSort === 'za')      return copy.sort((a, b) => b.title.localeCompare(a.title));
  if (currentSort === 'newest')  return copy.sort((a, b) => b.year - a.year);
  if (currentSort === 'oldest')  return copy.sort((a, b) => a.year - b.year);
  if (currentSort === 'rating')  return copy.sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
  return copy;
}

// ── SEARCH ──
function handleSearchInput(value) {
  document.getElementById('searchClear').classList.toggle('visible', value.trim().length > 0);
  if (!value.trim() && isSearchMode) clearSearch();
}

function triggerSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;
  fetchFromOMDB(query);
}

async function fetchFromOMDB(query) {
  const grid      = document.getElementById('moviesGrid');
  const sortRow   = document.getElementById('sortRow');
  const submitBtn = document.querySelector('.search-submit');

  isSearchMode = true;
  submitBtn.disabled = true;
  sortRow.style.opacity = '0.35';
  sortRow.style.pointerEvents = 'none';

  grid.innerHTML = `<div class="search-status" style="grid-column:1/-1;">
    <div class="search-spinner"></div>
    <p>Searching OMDb for <em>"${query}"</em>&hellip;</p>
  </div>`;
  document.getElementById('count').textContent = '…';

  try {
    const res  = await fetch(`${OMDB_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&type=movie`);
    const data = await res.json();

    if (data.Response === 'False') {
      showSearchError(`No results found for "${query}". Try a different title.`);
      submitBtn.disabled = false;
      return;
    }

    const details = await Promise.all(
      data.Search.slice(0, 12).map(item => fetchDetail(item.imdbID))
    );

    searchResults = details.filter(Boolean);
    renderSearchResults();
  } catch (err) {
    showSearchError('Could not connect to OMDb. Please check your connection and try again.');
  }

  submitBtn.disabled = false;
}

function renderSearchResults() {
  const sorted = getSorted(searchResults);
  document.getElementById('count').textContent = sorted.length;
  if (!sorted.length) { showSearchError('No results found. Try a different search.'); return; }
  document.getElementById('moviesGrid').innerHTML = sorted.map((m, i) => buildCard(m, i, true)).join('');
  const sortRow = document.getElementById('sortRow');
  sortRow.style.opacity = '';
  sortRow.style.pointerEvents = '';
}

function showSearchError(msg) {
  document.getElementById('moviesGrid').innerHTML =
    `<div class="search-status" style="grid-column:1/-1;"><strong>No Results</strong>${msg}</div>`;
  document.getElementById('count').textContent = '0';
}

function clearSearch() {
  isSearchMode  = false;
  searchResults = [];
  document.getElementById('searchInput').value = '';
  document.getElementById('searchClear').classList.remove('visible');
  const sortRow = document.getElementById('sortRow');
  sortRow.style.opacity = '';
  sortRow.style.pointerEvents = '';
  renderMovies();
}

// ── RENDER ──
function buildCard(m, i, isOmdb = false) {
  const saved = watchlist.some(w => w.imdbID === m.imdbID);
  const posterHTML = m.poster
    ? `<img src="${m.poster}" alt="${m.title} poster" class="card-poster-img"
         onerror="this.style.display='none';this.nextElementSibling.style.display='flex';" />
       <div class="card-poster-fallback" style="display:none;">${m.title}</div>`
    : `<div class="card-poster-fallback">${m.title}</div>`;

  const safeTitle = m.title.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  return `
    <div class="movie-card" style="animation-delay:${i * 0.04}s" onclick="openModalById('${m.imdbID}')">
      <div class="card-poster">
        ${posterHTML}
        <div class="card-poster-overlay"></div>
        <div class="card-rating">&#9733; ${m.rating}</div>
        <div class="card-genre-badge">${m.genre}</div>
        ${isOmdb ? '<div class="omdb-badge">OMDb</div>' : ''}
        <button class="card-watchlist-btn ${saved ? 'saved' : ''}"
          onclick="event.stopPropagation(); toggleWatchlistItem(omdbCache['${m.imdbID}']); rerenderCards();"
          title="${saved ? 'Remove from watchlist' : 'Add to watchlist'}">&#9733;</button>
      </div>
      <div class="card-body">
        <div class="card-year">${m.year}</div>
        <h3 class="card-title">${m.title}</h3>
        <p class="card-desc">${m.desc}</p>
        <p class="card-director">Dir. <span>${m.director}</span></p>
      </div>
    </div>`;
}

function renderMovies() {
  const sorted = getSorted(activeMovies);
  document.getElementById('moviesGrid').innerHTML = sorted.map((m, i) => buildCard(m, i, false)).join('');
  document.getElementById('count').textContent = sorted.length;
  initHero();
}

function rerenderCards() {
  if (isSearchMode) renderSearchResults();
  else renderMovies();
  updateWatchlistPanel();
}

// ── MODAL ──
async function openModalById(imdbID) {
  let m = omdbCache[imdbID];
  if (!m) m = await fetchDetail(imdbID);
  if (!m) return;
  openModal(m);
}

async function openModal(m) {
  currentModalMovie = m;
  const overlay = document.getElementById('modalOverlay');

  document.getElementById('modalTitle').textContent = m.title;
  document.getElementById('modalPlot').textContent  = m.desc;

  const posterImg = document.getElementById('modalPoster');
  const posterFb  = document.getElementById('modalPosterFallback');
  if (m.poster) {
    posterImg.src = m.poster;
    posterImg.style.display = 'block';
    posterFb.style.display  = 'none';
  } else {
    posterImg.style.display = 'none';
    posterFb.textContent    = m.title;
    posterFb.style.display  = 'flex';
  }

  document.getElementById('modalBadges').innerHTML =
    `<span class="modal-badge badge-genre">${m.genre}</span>` +
    (m.rated ? `<span class="modal-badge badge-genre">${m.rated}</span>` : '');

  document.getElementById('modalMeta').innerHTML =
    `<span>${m.year}</span><span>${m.runtime}</span>`;

  document.getElementById('modalDetails').innerHTML = [
    ['Director',  m.director],
    ['Cast',      m.actors],
    ['Genre',     m.genre],
    ['Language',  m.language],
    ['Country',   m.country],
    ['Awards',    m.awards],
  ].filter(([, v]) => v && v !== '—').map(([label, value]) =>
    `<div class="modal-detail-item">
       <div class="modal-detail-label">${label}</div>
       <div class="modal-detail-value">${value}</div>
     </div>`
  ).join('');

  document.getElementById('modalRatings').innerHTML = (m.ratings && m.ratings.length)
    ? m.ratings.map(r =>
        `<div class="modal-rating-pill">
           <div class="modal-rating-source">${r.Source.replace('Internet Movie Database','IMDb').replace('Rotten Tomatoes','RT')}</div>
           <div class="modal-rating-value">${r.Value}</div>
         </div>`
      ).join('')
    : `<div class="modal-rating-pill">
         <div class="modal-rating-source">IMDb</div>
         <div class="modal-rating-value">&#9733; ${m.rating}</div>
       </div>`;

  updateModalWatchBtn();

  document.getElementById('modalTrailerBtn').href =
    `https://www.youtube.com/results?search_query=${encodeURIComponent(m.title + ' ' + m.year + ' official trailer')}`;

  overlay.classList.add('open');
  document.body.style.overflow = 'hidden';

  // Fetch full plot if we only have short
  if (m.imdbID && (!m._fullPlot)) {
    try {
      const res  = await fetch(`${OMDB_URL}?apikey=${OMDB_API_KEY}&i=${m.imdbID}&plot=full`);
      const data = await res.json();
      if (data.Response === 'True' && data.Plot !== 'N/A') {
        m._fullPlot = true;
        m.desc = data.Plot;
        document.getElementById('modalPlot').textContent = data.Plot;
      }
    } catch (e) { /* silent */ }
  }
}

function closeModal(e) {
  if (e.target === document.getElementById('modalOverlay')) closeModalDirect();
}
function closeModalDirect() {
  document.getElementById('modalOverlay').classList.remove('open');
  document.body.style.overflow = '';
}

// ── WATCHLIST ──
function toggleWatchlistItem(m) {
  if (!m) return;
  const idx = watchlist.findIndex(w => w.imdbID === m.imdbID);
  if (idx > -1) watchlist.splice(idx, 1);
  else watchlist.push({ imdbID: m.imdbID, title: m.title, year: m.year, poster: m.poster });
  localStorage.setItem('cinevault_watchlist', JSON.stringify(watchlist));
  updateWatchlistCount();
  updateWatchlistPanel();
  if (currentModalMovie?.imdbID === m.imdbID) updateModalWatchBtn();
}

function toggleWatchlistFromModal() {
  if (currentModalMovie) { toggleWatchlistItem(currentModalMovie); rerenderCards(); }
}

function updateModalWatchBtn() {
  if (!currentModalMovie) return;
  const saved = watchlist.some(w => w.imdbID === currentModalMovie.imdbID);
  const btn = document.getElementById('modalWatchBtn');
  btn.textContent = saved ? '✓ In Watchlist' : '+ Add to Watchlist';
  btn.classList.toggle('saved', saved);
}

function updateWatchlistCount() {
  document.getElementById('watchlistCount').textContent = watchlist.length;
}

function toggleWatchlistPanel() {
  document.getElementById('watchlistPanel').classList.toggle('open');
  document.getElementById('watchlistBackdrop').classList.toggle('open');
  updateWatchlistPanel();
}

function updateWatchlistPanel() {
  const body = document.getElementById('watchlistBody');
  if (!watchlist.length) {
    body.innerHTML = '<div class="watchlist-empty">Your watchlist is empty.<br>Click ★ on any film to save it.</div>';
    return;
  }
  body.innerHTML = watchlist.map((m, i) => `
    <div class="watchlist-item" onclick="openModalById('${m.imdbID}')">
      <img class="watchlist-item-thumb" src="${m.poster || ''}" alt="${m.title}"
        onerror="this.style.display='none'" />
      <div class="watchlist-item-info">
        <div class="watchlist-item-title">${m.title}</div>
        <div class="watchlist-item-year">${m.year}</div>
      </div>
      <button class="watchlist-item-remove" onclick="event.stopPropagation(); removeFromWatchlist(${i})" title="Remove">&#10005;</button>
    </div>
  `).join('');
}

function removeFromWatchlist(i) {
  watchlist.splice(i, 1);
  localStorage.setItem('cinevault_watchlist', JSON.stringify(watchlist));
  updateWatchlistCount();
  updateWatchlistPanel();
  rerenderCards();
}

// ── THEME ──
function toggleTheme() {
  document.body.classList.toggle('light');
  document.getElementById('themeBtn').textContent = document.body.classList.contains('light') ? '☀' : '☾';
  localStorage.setItem('cinevault_theme', document.body.classList.contains('light') ? 'light' : 'dark');
}
function initTheme() {
  const saved = localStorage.getItem('cinevault_theme');
  if (saved === 'light') { document.body.classList.add('light'); document.getElementById('themeBtn').textContent = '☀'; }
}

// ── KEYBOARD ──
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if (document.getElementById('modalOverlay').classList.contains('open')) closeModalDirect();
    if (document.getElementById('watchlistPanel').classList.contains('open')) toggleWatchlistPanel();
  }
});

// ── BOOT ──
init();
