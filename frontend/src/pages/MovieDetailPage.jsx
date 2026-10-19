import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getMovie } from "../api/movies.api.js";
import { MoviePoster } from "../components/MovieCard.jsx";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback.jsx";
import { dateFromToday, formatTime } from "../utils/format.js";

export default function MovieDetailPage({ city }) {
  const { id } = useParams();
  const [date, setDate] = useState("");
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMovie = () => {
    setLoading(true);
    setError("");
    getMovie(id, { city, date })
      .then(setResult)
      .catch((reason) => setError(reason.response?.data?.message || "Couldn't load this movie."))
      .finally(() => setLoading(false));
  };

  useEffect(loadMovie, [id, city, date]);

  if (loading) return <Loading label="Loading movie and showtimes…" />;
  if (error) return <div className="section"><ErrorMessage message={error} onRetry={loadMovie} /></div>;
  if (!result?.movie) return <div className="section"><EmptyState title="Movie not found" /></div>;

  const { movie, shows = [] } = result;
  const genres = String(movie.genre || "").split(",").map((item) => item.trim()).filter(Boolean);
  const languages = String(movie.language || "").split(",").map((item) => item.trim()).filter(Boolean);
  const dates = Array.from({ length: 7 }, (_, index) => dateFromToday(index));

  return (
    <>
      <section className="detail-hero">
        <div className="detail-poster-wrap"><MoviePoster movie={movie} className="detail-poster" /></div>
        <div className="detail-copy">
          <Link className="back-link" to="/">← All movies</Link>
          <span className="eyebrow"><span className="eyebrow-line" /> SHOWTIME PRESENTS</span>
          <h1>{movie.title}</h1>
          <div className="detail-tags">
            {movie.duration_minutes && <span>{movie.duration_minutes} min</span>}
            {languages.map((language) => <span key={language}>{language}</span>)}
            {genres.map((genre) => <span key={genre}>{genre}</span>)}
          </div>
          <p className="detail-description">{movie.description || "Movie details have not been provided."}</p>
          {movie.release_date && <p className="detail-release">Release date · {new Date(movie.release_date).toLocaleDateString()}</p>}
        </div>
      </section>

      <section className="section showtimes-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> PICK YOUR MOMENT</div>
            <h2>Choose a showtime</h2>
          </div>
          <label className="date-field">
            <span>Show date</span>
            <select value={date} onChange={(event) => setDate(event.target.value)}>
              <option value="">All upcoming dates</option>
              {dates.map((value) => (
                <option key={value} value={value}>
                  {new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}
                </option>
              ))}
            </select>
          </label>
        </div>
        {shows.length === 0 ? (
          <EmptyState title="No upcoming showtimes">
            There are no scheduled shows for the selected location and date.
          </EmptyState>
        ) : (
          <div className="show-list">
            {shows.map((show) => (
              <article className="show-row" key={show.show_id}>
                <div>
                  <h3>{show.theatre_name}</h3>
                  <p>{[show.city, show.screen_name].filter(Boolean).join(" · ")}</p>
                </div>
                <div className="show-time">{formatTime(show.start_time)}</div>
                <div className="show-price">{show.base_price ? `From ₹${Number(show.base_price).toFixed(0)}` : "Price at checkout"}</div>
                <Link className="button button-primary button-small" to={`/shows/${show.show_id}/seats`}>Select seats <span aria-hidden="true">→</span></Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
