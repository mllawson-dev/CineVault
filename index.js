// ── MOVIE DATA ──
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
 
// ── SORT STATE ──
let currentSort = 'az';
 
// ── SORT HANDLER ──
function sortMovies(method, btn) {
  currentSort = method;
  document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderMovies();
}
 
// ── SORT LOGIC ──
function getSorted() {
  const list = [...movies];
  if (currentSort === 'az')     return list.sort((a, b) => a.title.localeCompare(b.title));
  if (currentSort === 'za')     return list.sort((a, b) => b.title.localeCompare(a.title));
  if (currentSort === 'newest') return list.sort((a, b) => b.year - a.year);
  if (currentSort === 'oldest') return list.sort((a, b) => a.year - b.year);
  return list;
}
 
// ── RENDER ──
function renderMovies() {
  const grid = document.getElementById('moviesGrid');
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