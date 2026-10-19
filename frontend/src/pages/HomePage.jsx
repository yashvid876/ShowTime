import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { getMovies } from "../api/movies.api.js";
import MovieCard from "../components/MovieCard.jsx";
import { EmptyState, ErrorMessage, Loading } from "../components/Feedback.jsx";

export default function HomePage({ city }) {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("q") || "";
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadMovies = () => {
    setLoading(true);
    setError("");
    getMovies({ q: query, city, limit: 20, page: 1 })
      .then((result) => setMovies(result.movies || []))
      .catch((reason) => setError(reason.response?.data?.message || "Couldn't load movies. Check your connection and try again."))
      .finally(() => setLoading(false));
  };

  useEffect(loadMovies, [city, query]);

  return (
    <>
      <section className="hero">
        <div className="hero-glow" aria-hidden="true" />
        <div className="hero-content">
          <div className="eyebrow"><span className="eyebrow-line" /> THE NIGHT IS YOURS</div>
          <h1>Make room<br />for <em>movie magic.</em></h1>
          <p>Find the story you’re in the mood for. We’ll save you a seat.</p>
          <a className="button button-primary" href="#now-showing">
            Find your film <span aria-hidden="true">↓</span>
          </a>
        </div>
        <div className="hero-art" aria-hidden="true">
          <div className="hero-disc disc-back" />
          <div className="hero-disc disc-front"><span>ST</span></div>
          <div className="hero-spark spark-one">✦</div>
          <div className="hero-spark spark-two">✧</div>
          <div className="hero-caption">YOUR NEXT<br />FAVORITE FILM</div>
        </div>
        <div className="hero-bottom"><span>01 / DISCOVER</span><span>SCROLL TO EXPLORE ↓</span></div>
      </section>

      <section id="now-showing" className="section movie-section">
        <div className="section-heading">
          <div>
            <div className="eyebrow"><span className="eyebrow-line" /> THE BIG SCREEN</div>
            <h2>{query ? `Results for “${query}”` : "Find your next favorite."}</h2>
          </div>
          <span className="section-note">{city ? `Showing in ${city}` : "Movies from your theatres"}</span>
        </div>
        {loading ? <Loading label="Finding movies…" /> : null}
        {!loading && error ? <ErrorMessage message={error} onRetry={loadMovies} /> : null}
        {!loading && !error && movies.length === 0 ? (
          <EmptyState title="No movies found">
            Try another search or choose a different city.
          </EmptyState>
        ) : null}
        {!loading && !error && movies.length > 0 && (
          <div className="movie-grid">
            {movies.map((movie) => <MovieCard key={movie.movie_id} movie={movie} />)}
          </div>
        )}
      </section>
      <section className="quiet-banner">
        <span className="banner-mark" aria-hidden="true">✦</span>
        <p>Some nights are made for the movies.</p>
        <span>MAKE ONE COUNT</span>
      </section>
    </>
  );
}
