// ============================================================
//  CineVault — Movies Site JavaScript
//  Link: <script src="movies-site.js" defer></script>
//  Note: Place all poster images in the same folder as this file
// ============================================================

const OMDB_API_KEY = 'f78457a3';
const OMDB_URL     = 'https://www.omdbapi.com/';

// ── LOCAL MOVIE DATA ──
const movies = [
  { title: "The Godfather",            year: 1972, genre: "Crime",    rating: "9.2", director: "Francis Ford Coppola",           poster: "Godfather.jpg",             desc: "The aging patriarch of an organized crime dynasty transfers control of his empire to his reluctant son." },
  { title: "2001: A Space Odyssey",    year: 1968, genre: "Sci-Fi",   rating: "8.3", director: "Stanley Kubrick",                poster: "2001__A_Space_Odyessey.jpg", desc: "After discovering a mysterious artifact buried beneath the Lunar surface, mankind sets off on a quest." },
  { title: "Schindler's List",         year: 1993, genre: "Drama",    rating: "9.0", director: "Steven Spielberg",               poster: "Schindler_s_List.jpg",       desc: "In German-occupied Poland during World War II, industrialist Oskar Schindler saves the lives of more than a thousand Jewish refugees." },
  { title: "Pulp Fiction",             year: 1994, genre: "Crime",    rating: "8.9", director: "Quentin Tarantino",              poster: "Pulp_Fiction.webp",          desc: "The lives of two mob hitmen, a boxer, a gangster and his wife intertwine in four tales of violence and redemption." },
  { title: "Inception",                year: 2010, genre: "Sci-Fi",   rating: "8.8", director: "Christopher Nolan",              poster: "Inception.webp",             desc: "A thief who steals corporate secrets through dream-sharing technology is given the inverse task of planting an idea." },
  { title: "The Dark Knight",          year: 2008, genre: "Thriller", rating: "9.0", director: "Christopher Nolan",              poster: "Dark_Knight.webp",           desc: "Batman faces the Joker, a criminal mastermind who plunges Gotham into anarchy and forces him to question everything." },
  { title: "Parasite",                 year: 2019, genre: "Thriller", rating: "8.5", director: "Bong Joon-ho",                   poster: "Parasite.jpg",               desc: "A poor family schemes to become employed by a wealthy family and infiltrate their household." },
  { title: "Casablanca",               year: 1942, genre: "Drama",    rating: "8.5", director: "Michael Curtiz",                 poster: "Casablanca.jpg",             desc: "A cynical expatriate American cafe owner struggles to decide between love and virtue when his ex-lover arrives." },
  { title: "Interstellar",             year: 2014, genre: "Sci-Fi",   rating: "8.7", director: "Christopher Nolan",              poster: "Interstellar.jpg",           desc: "A team of explorers travel through a wormhole in space in an attempt to ensure humanity's survival." },
  { title: "Everything Everywhere",    year: 2022, genre: "Sci-Fi",   rating: "7.8", director: "Daniel Kwan & Daniel Scheinert", poster: "Everything_Everywhere.webp", desc: "A middle-aged Chinese immigrant is swept up in an insane adventure where she alone can save the world." },
  { title: "Goodfellas",               year: 1990, genre: "Crime",    rating: "8.7", director: "Martin Scorsese",                poster: "GoodFellas.webp",            desc: "The story of Henry Hill and his life in the mob, covering his relationship with his wife Karen." },
  { title: "Oppenheimer",              year: 2023, genre: "Drama",    rating: "8.4", director: "Christopher Nolan",              poster: "Oppenheimer.webp",           desc: "The story of American scientist J. Robert Oppenheimer and his role in the development of the atomic bomb." },
  { title: "Rear Window",              year: 1954, genre: "Thriller", rating: "8.5", director: "Alfred Hitchcock",               poster: "Rear_Window.webp",           desc: "A photographer with a broken leg spies on his neighbours and becomes convinced that one has committed murder." },
  { title: "The Shawshank Redemption", year: 1994, genre: "Drama",    rating: "9.3", director: "Frank Darabont",                 poster: "Shawshank_Redemption.webp",  desc: "Two imprisoned men bond over a number of years, finding solace and eventual redemption through acts of common decency." },
  { title: "Dune",                     year: 2021, genre: "Sci-Fi",   rating: "8.0", director: "Denis Villeneuve",               poster: "Dune.webp",                  desc: "Paul Atreides leads nomadic tribes in a battle to control the desert planet Arrakis and its precious resource." },
  { title: "Alien",                    year: 1979, genre: "Thriller", rating: "8.5", director: "Ridley Scott",                   poster: "Alien.webp",                 desc: "The crew of a commercial spacecraft encounters a deadly extraterrestrial being after investigating a mysterious signal." },
];

// ── STATE ──
let currentSort    = 'az';
let isSearchMode   = false;
let searchResults  = [];
let searchDebounce = null;

// ── SEARCH: INPUT HANDLER ──
// Shows/hides the clear (×) button as user types
function handleSearchInput(value) {
  const clearBtn = document.getElementById('searchClear');
  if (value.trim().length > 0) {
    clearBtn.classList.add('visible');
  } else {
    clearBtn.classList.remove('visible');
    // If user clears the field, restore the local collection
    if (isSearchMode) clearSearch();
  }
}

// ── SEARCH: TRIGGER ──
// Called on button click or Enter key
function triggerSearch() {
  const query = document.getElementById('searchInput').value.trim();
  if (!query) return;
  fetchFromOMDB(query);
}

// ── SEARCH: FETCH FROM OMDB ──
async function fetchFromOMDB(query) {
  const grid        = document.getElementById('moviesGrid');
  const sortRow     = document.getElementById('sortRow');
  const submitBtn   = document.querySelector('.search-submit');

  // Show loading state
  isSearchMode    = true;
  submitBtn.disabled = true;
  sortRow.style.opacity = '0.35';
  sortRow.style.pointerEvents = 'none';

  grid.innerHTML = `
    <div class="search-status" style="grid-column:1/-1;">
      <div class="search-spinner"></div>
      <p>Searching OMDb for <em>"${query}"</em>&hellip;</p>
    </div>`;
  document.getElementById('count').textContent = '…';

  try {
    // Search endpoint returns up to 10 results per page
    const searchRes  = await fetch(`${OMDB_URL}?apikey=${OMDB_API_KEY}&s=${encodeURIComponent(query)}&type=movie`);
    const searchData = await searchRes.json();

    if (searchData.Response === 'False') {
      showSearchError(`No results found for "${query}". Try a different title.`);
      submitBtn.disabled = false;
      return;
    }

    // Fetch full details for each result (for ratings, plot, director)
    const detailPromises = searchData.Search.slice(0, 12).map(item =>
      fetch(`${OMDB_URL}?apikey=${OMDB_API_KEY}&i=${item.imdbID}&plot=short`)
        .then(r => r.json())
    );

    const details = await Promise.all(detailPromises);

    searchResults = details
      .filter(d => d.Response === 'True')
      .map(d => ({
        title:    d.Title,
        year:     parseInt(d.Year) || 0,
        genre:    d.Genre ? d.Genre.split(',')[0].trim() : 'Film',
        rating:   d.imdbRating !== 'N/A' ? d.imdbRating : '—',
        director: d.Director !== 'N/A' ? d.Director : 'Unknown',
        poster:   d.Poster !== 'N/A' ? d.Poster : null,
        desc:     d.Plot !== 'N/A' ? d.Plot : 'No description available.',
        source:   'omdb',
      }));

    renderSearchResults();

  } catch (err) {
    showSearchError('Could not connect to OMDb. Please check your connection and try again.');
  }

  submitBtn.disabled = false;
}

// ── SEARCH: RENDER RESULTS ──
function renderSearchResults() {
  const grid = document.getElementById('moviesGrid');
  document.getElementById('count').textContent = searchResults.length;

  if (searchResults.length === 0) {
    showSearchError('No detailed results found. Try a different search.');
    return;
  }

  grid.innerHTML = searchResults.map((m, i) => `
    <div class="movie-card omdb-card" style="animation-delay:${i * 0.04}s">
      <div class="card-poster">
        ${m.poster
          ? `<img src="${m.poster}" alt="${m.title} poster" class="card-poster-img"
               onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
             <div class="card-poster-fallback" style="display:none;">${m.title}</div>`
          : `<div class="card-poster-fallback">${m.title}</div>`
        }
        <div class="card-poster-overlay"></div>
        <div class="card-rating">&#9733; ${m.rating}</div>
        <div class="card-genre-badge">${m.genre}</div>
        <div class="omdb-badge">OMDb</div>
      </div>
      <div class="card-body">
        <div class="card-year">${m.year || '—'}</div>
        <h3 class="card-title">${m.title}</h3>
        <p class="card-desc">${m.desc}</p>
        <p class="card-director">Dir. <span>${m.director}</span></p>
      </div>
    </div>
  `).join('');
}

// ── SEARCH: ERROR STATE ──
function showSearchError(message) {
  const grid = document.getElementById('moviesGrid');
  grid.innerHTML = `
    <div class="search-status" style="grid-column:1/-1;">
      <strong>No Results</strong>
      ${message}
    </div>`;
  document.getElementById('count').textContent = '0';
}

// ── SEARCH: CLEAR ──
function clearSearch() {
  isSearchMode  = false;
  searchResults = [];

  document.getElementById('searchInput').value = '';
  document.getElementById('searchClear').classList.remove('visible');

  const sortRow = document.getElementById('sortRow');
  sortRow.style.opacity      = '';
  sortRow.style.pointerEvents = '';

  renderMovies();
}

// ── SORT ──
function sortMovies(method, btn) {
  currentSort = method;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  if (!isSearchMode) renderMovies();
}

function getSorted() {
  const list = [...movies];
  if (currentSort === 'az')     return list.sort((a, b) => a.title.localeCompare(b.title));
  if (currentSort === 'za')     return list.sort((a, b) => b.title.localeCompare(a.title));
  if (currentSort === 'newest') return list.sort((a, b) => b.year - a.year);
  if (currentSort === 'oldest') return list.sort((a, b) => a.year - b.year);
  return list;
}

// ── RENDER LOCAL COLLECTION ──
function renderMovies() {
  const grid   = document.getElementById('moviesGrid');
  const sorted = getSorted();

  grid.innerHTML = sorted.map((m, i) => `
    <div class="movie-card" style="animation-delay:${i * 0.04}s">
      <div class="card-poster">
        <img
          src="assets/${m.poster}"
          alt="${m.title} poster"
          class="card-poster-img"
          onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
        />
        <div class="card-poster-fallback" style="display:none;">${m.title}</div>
        <div class="card-poster-overlay"></div>
        <div class="card-rating">&#9733; ${m.rating}</div>
        <div class="card-genre-badge">${m.genre}</div>
      </div>
      <div class="card-body">
        <div class="card-year">${m.year}</div>
        <h3 class="card-title">${m.title}</h3>
        <p class="card-desc">${m.desc}</p>
        <p class="card-director">Dir. <span>${m.director}</span></p>
      </div>
    </div>
  `).join('');

  document.getElementById('count').textContent = sorted.length;
}

// ── INIT ──
renderMovies();
