import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  cancelShow,
  createMovie,
  createScreen,
  createShow,
  createTheatre,
  deleteMovie,
  deleteScreen,
  deleteTheatre,
  generateShowSeats,
  getAdminMovies,
  getAdminShows,
  getScreens,
  getTheatres,
  updateMovie,
} from "../api/admin.api.js";
import { apiMessage } from "../api/client.js";
import { ErrorMessage, Loading } from "../components/Feedback.jsx";
import { formatDateTime } from "../utils/format.js";

const blankMovie = {
  title: "",
  description: "",
  duration_minutes: "",
  language: "",
  genre: "",
  release_date: "",
  poster_url: "",
  status: "upcoming",
};

export default function AdminManagementPage() {
  const [movies, setMovies] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [shows, setShows] = useState([]);
  const [screens, setScreens] = useState([]);
  const [screenTheatreId, setScreenTheatreId] = useState("");
  const [showTheatreId, setShowTheatreId] = useState("");
  const [showScreens, setShowScreens] = useState([]);
  const [movieForm, setMovieForm] = useState(blankMovie);
  const [editingMovieId, setEditingMovieId] = useState("");
  const [theatreForm, setTheatreForm] = useState({ name: "", address: "", city: "", pincode: "" });
  const [screenName, setScreenName] = useState("");
  const [showForm, setShowForm] = useState({ movie_id: "", screen_id: "", start_time: "", base_price: "" });
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const movieHeadingRef = useRef(null);

  const loadData = async () => {
    setError("");
    try {
      const [movieResult, theatreResult, showResult] = await Promise.all([
        getAdminMovies({ page: 1, limit: 50 }),
        getTheatres(),
        getAdminShows(),
      ]);
      setMovies(movieResult.movies || []);
      setTheatres(theatreResult);
      setShows(showResult);
    } catch (reason) {
      setError(apiMessage(reason, "Couldn't load administration data."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    setScreens([]);
    if (!screenTheatreId) return;
    getScreens(screenTheatreId)
      .then(setScreens)
      .catch((reason) => setError(apiMessage(reason, "Couldn't load theatre screens.")));
  }, [screenTheatreId]);

  useEffect(() => {
    setShowScreens([]);
    setShowForm((current) => ({ ...current, screen_id: "" }));
    if (!showTheatreId) return;
    getScreens(showTheatreId)
      .then(setShowScreens)
      .catch((reason) => setError(apiMessage(reason, "Couldn't load screens for the show.")));
  }, [showTheatreId]);

  const runAction = async (action, successMessage) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      setNotice(successMessage);
      await loadData();
      return true;
    } catch (reason) {
      setError(apiMessage(reason, "The requested change could not be completed."));
      return false;
    } finally {
      setBusy(false);
    }
  };

  const submitMovie = async (event) => {
    event.preventDefault();
    const payload = {
      ...movieForm,
      duration_minutes: Number(movieForm.duration_minutes),
      description: movieForm.description || null,
      release_date: movieForm.release_date || null,
      poster_url: movieForm.poster_url || null,
    };
    const succeeded = await runAction(
      () => editingMovieId ? updateMovie(editingMovieId, payload) : createMovie(payload),
      editingMovieId ? "Movie updated." : "Movie created.",
    );
    if (succeeded) {
      setMovieForm(blankMovie);
      setEditingMovieId("");
    }
  };

  const beginMovieEdit = (movie) => {
    setEditingMovieId(String(movie.movie_id));
    setMovieForm({
      title: movie.title || "",
      description: movie.description || "",
      duration_minutes: String(movie.duration_minutes || ""),
      language: movie.language || "",
      genre: movie.genre || "",
      release_date: movie.release_date ? String(movie.release_date).slice(0, 10) : "",
      poster_url: movie.poster_url || "",
      status: movie.status || "upcoming",
    });
    movieHeadingRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const removeMovie = (movie) => {
    if (!window.confirm(`Delete "${movie.title}"?`)) return;
    runAction(() => deleteMovie(movie.movie_id), "Movie deleted.");
  };

  const submitTheatre = async (event) => {
    event.preventDefault();
    const succeeded = await runAction(
      () => createTheatre({ ...theatreForm, pincode: theatreForm.pincode || null }),
      "Theatre created.",
    );
    if (succeeded) setTheatreForm({ name: "", address: "", city: "", pincode: "" });
  };

  const removeTheatre = (theatre) => {
    if (!window.confirm(`Delete theatre "${theatre.name}"?`)) return;
    runAction(() => deleteTheatre(theatre.theatre_id), "Theatre deleted.");
  };

  const submitScreen = async (event) => {
    event.preventDefault();
    const succeeded = await runAction(
      () => createScreen(screenTheatreId, screenName.trim()),
      "Screen created.",
    );
    if (succeeded) setScreenName("");
  };

  const removeScreen = (screen) => {
    if (!window.confirm(`Delete screen "${screen.name}"?`)) return;
    runAction(() => deleteScreen(screen.screen_id), "Screen deleted.");
  };

  const submitShow = async (event) => {
    event.preventDefault();
    const payload = {
      movie_id: Number(showForm.movie_id),
      screen_id: Number(showForm.screen_id),
      start_time: new Date(showForm.start_time).toISOString(),
      base_price: Number(showForm.base_price),
    };
    const succeeded = await runAction(
      () => createShow(payload),
      "Show created. Generate its seat inventory when ready.",
    );
    if (succeeded) {
      setShowForm({ movie_id: "", screen_id: "", start_time: "", base_price: "" });
    }
  };

  const mutateShow = (show, operation, successText) => {
    runAction(() => operation(show.show_id), successText);
  };

  if (loading) return <Loading label="Loading admin management…" />;

  return (
    <section className="section admin-management-page">
      <Link className="back-link" to="/admin">← Admin dashboard</Link>
      <div className="eyebrow"><span className="eyebrow-line" /> VENUES, FILMS & SHOWS</div>
      <div className="section-heading">
        <div><h1>Manage ShowTime.</h1><p className="muted">Changes here use the backend’s admin-only operations.</p></div>
      </div>
      {error && <div className="admin-feedback"><ErrorMessage message={error} onRetry={loadData} /></div>}
      {notice && <div className="inline-success admin-feedback" role="status">{notice}</div>}

      <section className="admin-manage-section" aria-labelledby="admin-movies-heading">
        <div className="admin-table-heading"><h2 id="admin-movies-heading" ref={movieHeadingRef}>Movies</h2><span>{movies.length} shown · up to 50</span></div>
        <form className="admin-form-grid" onSubmit={submitMovie}>
          <label>Title<input value={movieForm.title} onChange={(event) => setMovieForm({ ...movieForm, title: event.target.value })} required /></label>
          <label>Duration (minutes)<input type="number" min="1" step="1" value={movieForm.duration_minutes} onChange={(event) => setMovieForm({ ...movieForm, duration_minutes: event.target.value })} required /></label>
          <label>Language<input value={movieForm.language} onChange={(event) => setMovieForm({ ...movieForm, language: event.target.value })} required /></label>
          <label>Genre<input value={movieForm.genre} onChange={(event) => setMovieForm({ ...movieForm, genre: event.target.value })} placeholder="Drama, Comedy" required /></label>
          <label>Release date<input type="date" value={movieForm.release_date} onChange={(event) => setMovieForm({ ...movieForm, release_date: event.target.value })} /></label>
          <label>Status
            <select value={movieForm.status} onChange={(event) => setMovieForm({ ...movieForm, status: event.target.value })}>
              <option value="upcoming">Upcoming</option>
              <option value="now_showing">Now showing</option>
              <option value="ended">Ended</option>
            </select>
          </label>
          <label className="admin-form-wide">Poster URL<input type="url" value={movieForm.poster_url} onChange={(event) => setMovieForm({ ...movieForm, poster_url: event.target.value })} /></label>
          <label className="admin-form-wide">Description<textarea rows="3" value={movieForm.description} onChange={(event) => setMovieForm({ ...movieForm, description: event.target.value })} /></label>
          <div className="admin-form-actions admin-form-wide">
            <button className="button button-primary" type="submit" disabled={busy}>{editingMovieId ? "Save movie" : "Add movie"}</button>
            {editingMovieId && <button className="button button-outline" type="button" onClick={() => { setEditingMovieId(""); setMovieForm(blankMovie); }}>Stop editing</button>}
          </div>
        </form>
        <div className="admin-record-list">
          {movies.map((movie) => (
            <div className="admin-record" key={movie.movie_id}>
              <div><strong>{movie.title}</strong><span>{movie.status} · {movie.duration_minutes} min · {movie.genre}</span></div>
              <div className="admin-record-actions">
                <button className="text-button" disabled={busy} onClick={() => beginMovieEdit(movie)}>Edit</button>
                <button className="text-button danger-button" disabled={busy} onClick={() => removeMovie(movie)}>Delete</button>
              </div>
            </div>
          ))}
          {!movies.length && <div className="inline-note">No movies returned by the backend.</div>}
        </div>
      </section>

      <section className="admin-manage-section" aria-labelledby="admin-venues-heading">
        <div className="admin-table-heading"><h2 id="admin-venues-heading">Theatres & screens</h2><span>{theatres.length} theatres</span></div>
        <form className="admin-form-grid" onSubmit={submitTheatre}>
          <label>Theatre name<input value={theatreForm.name} onChange={(event) => setTheatreForm({ ...theatreForm, name: event.target.value })} required /></label>
          <label>City<input value={theatreForm.city} onChange={(event) => setTheatreForm({ ...theatreForm, city: event.target.value })} required /></label>
          <label>Address<input value={theatreForm.address} onChange={(event) => setTheatreForm({ ...theatreForm, address: event.target.value })} required /></label>
          <label>PIN code<input value={theatreForm.pincode} onChange={(event) => setTheatreForm({ ...theatreForm, pincode: event.target.value })} /></label>
          <div className="admin-form-actions admin-form-wide"><button className="button button-primary" type="submit" disabled={busy}>Add theatre</button></div>
        </form>
        <div className="admin-theatre-list">
          {theatres.map((theatre) => (
            <div className="admin-theatre" key={theatre.theatre_id}>
              <div className="admin-theatre-heading">
                <div><strong>{theatre.name}</strong><span>{theatre.city} · {theatre.address}</span></div>
                <button className="text-button danger-button" disabled={busy} onClick={() => removeTheatre(theatre)}>Delete theatre</button>
              </div>
            </div>
          ))}
        </div>
        <form className="admin-form-grid admin-screen-form" onSubmit={submitScreen}>
          <label>Theatre for screen
            <select value={screenTheatreId} onChange={(event) => setScreenTheatreId(event.target.value)}>
              <option value="">Choose theatre</option>
              {theatres.map((theatre) => <option key={theatre.theatre_id} value={theatre.theatre_id}>{theatre.name}</option>)}
            </select>
          </label>
          <label>New screen name<input value={screenName} onChange={(event) => setScreenName(event.target.value)} disabled={!screenTheatreId} required /></label>
          <button className="button button-outline" type="submit" disabled={busy || !screenTheatreId}>Add screen</button>
        </form>
        {screenTheatreId && (
          <div className="admin-record-list">
            {screens.map((screen) => (
              <div className="admin-record" key={screen.screen_id}>
                <div><strong>{screen.name}</strong><span>Screen #{screen.screen_id} · {screen.total_seats ?? 0} seats</span></div>
                <div className="admin-record-actions">
                  <button className="text-button danger-button" disabled={busy} onClick={() => removeScreen(screen)}>Delete</button>
                </div>
              </div>
            ))}
            {!screens.length && <div className="inline-note">No screens for this theatre yet.</div>}
          </div>
        )}
        <p className="admin-footnote">Existing theatres or screens with dependent records may not be deletable; the backend will report conflicts.</p>
      </section>

      <section className="admin-manage-section" aria-labelledby="admin-shows-heading">
        <div className="admin-table-heading"><h2 id="admin-shows-heading">Shows</h2><span>{shows.length} scheduled future shows</span></div>
        <form className="admin-form-grid" onSubmit={submitShow}>
          <label>Movie
            <select value={showForm.movie_id} onChange={(event) => setShowForm({ ...showForm, movie_id: event.target.value })} required>
              <option value="">Choose movie</option>
              {movies.map((movie) => <option key={movie.movie_id} value={movie.movie_id}>{movie.title}</option>)}
            </select>
          </label>
          <label>Theatre
            <select value={showTheatreId} onChange={(event) => setShowTheatreId(event.target.value)} required>
              <option value="">Choose theatre</option>
              {theatres.map((theatre) => <option key={theatre.theatre_id} value={theatre.theatre_id}>{theatre.name} · {theatre.city}</option>)}
            </select>
          </label>
          <label>Screen
            <select value={showForm.screen_id} onChange={(event) => setShowForm({ ...showForm, screen_id: event.target.value })} required disabled={!showTheatreId}>
              <option value="">Choose screen</option>
              {showScreens.map((screen) => <option key={screen.screen_id} value={screen.screen_id}>{screen.name}</option>)}
            </select>
          </label>
          <label>Start time<input type="datetime-local" value={showForm.start_time} onChange={(event) => setShowForm({ ...showForm, start_time: event.target.value })} required /></label>
          <label>Base ticket price (₹)<input type="number" min="0" step="0.01" value={showForm.base_price} onChange={(event) => setShowForm({ ...showForm, base_price: event.target.value })} required /></label>
          <button className="button button-primary" type="submit" disabled={busy}>Create show</button>
        </form>
        <p className="admin-footnote">The backend enforces future showtimes and prevents overlapping shows. Seat inventory is generated separately after physical seats exist.</p>
        <div className="admin-record-list">
          {shows.map((show) => (
            <div className="admin-record" key={show.show_id}>
              <div><strong>{show.movie_title}</strong><span>{show.theatre_name} · {show.screen_name} · {formatDateTime(show.start_time)}</span></div>
              <div className="admin-record-actions">
                <button className="text-button" disabled={busy} onClick={() => mutateShow(show, generateShowSeats, "Seat inventory generated.")}>Generate seats</button>
                <button className="text-button danger-button" disabled={busy} onClick={() => {
                  if (window.confirm(`Cancel the show for "${show.movie_title}"?`)) {
                    mutateShow(show, cancelShow, "Show cancelled.");
                  }
                }}>Cancel show</button>
              </div>
            </div>
          ))}
          {!shows.length && <div className="inline-note">No scheduled future shows returned by the backend.</div>}
        </div>
      </section>
      <div className="admin-footer-actions">
        <Link className="button button-outline" to="/admin/seats">Manage physical seat rows <span aria-hidden="true">→</span></Link>
      </div>
    </section>
  );
}
