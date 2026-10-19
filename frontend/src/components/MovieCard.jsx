import { Link } from "react-router-dom";

export function MoviePoster({ movie, className = "" }) {
  const posterUrl = movie?.poster_url;
  return (
    <div className={`poster-frame ${className}`}>
      {posterUrl ? (
        <img src={posterUrl} alt={`${movie.title} poster`} loading="lazy" />
      ) : (
        <div className="poster-fallback" aria-label="Poster not available">
          <span className="poster-star" aria-hidden="true">✦</span>
          <span>{movie?.title || "ShowTime"}</span>
        </div>
      )}
    </div>
  );
}

export default function MovieCard({ movie }) {
  const genres = String(movie.genre || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    <Link className="movie-card" to={`/movies/${movie.movie_id}`}>
      <MoviePoster movie={movie} />
      <div className="movie-card-info">
        <div className="movie-card-title-row">
          <h3>{movie.title}</h3>
          {movie.duration_minutes && (
            <span className="movie-duration">{movie.duration_minutes} min</span>
          )}
        </div>
        <p className="movie-meta">
          {genres.slice(0, 2).join(" · ") || movie.language || "Movie"}
        </p>
        <span className="movie-card-link">Explore showtimes <span aria-hidden="true">↗</span></span>
      </div>
    </Link>
  );
}
