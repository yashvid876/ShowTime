import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Header({ city, cities, citiesError, onCityChange }) {
  const { user, signOut } = useAuth();
  const [query, setQuery] = useState("");
  const [logoutError, setLogoutError] = useState("");
  const navigate = useNavigate();

  const search = (event) => {
    event.preventDefault();
    navigate(`/?q=${encodeURIComponent(query.trim())}`);
  };

  const handleSignOut = async () => {
    setLogoutError("");
    try {
      await signOut();
      navigate("/");
    } catch {
      setLogoutError("Sign out could not reach the server. Your local session was cleared.");
    }
  };

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="ShowTime home">
          <span className="brand-mark" aria-hidden="true">S</span>
          <span>showtime<span className="brand-period">.</span></span>
        </Link>
        <form className="nav-search" onSubmit={search} role="search">
          <span aria-hidden="true" className="search-icon">⌕</span>
          <label className="sr-only" htmlFor="nav-search">Search movies</label>
          <input
            id="nav-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search movies"
          />
          <button className="sr-only" type="submit">Search</button>
        </form>
        <div className="header-actions">
          <label className="city-picker">
            <span className="pin-icon" aria-hidden="true">⌖</span>
            <span className="sr-only">Select city</span>
            <select value={city} onChange={(event) => onCityChange(event.target.value)}>
              <option value="">All cities</option>
              {cities.map((item) => (
                <option key={item.name} value={item.name}>{item.name}</option>
              ))}
            </select>
          </label>
          {user ? (
            <>
              <Link className="nav-link bookings-link" to="/bookings">My bookings</Link>
              {user.role === "admin" && <Link className="nav-link" to="/admin">Admin</Link>}
              <button className="avatar-button" onClick={handleSignOut} title="Sign out">
                {user.name?.slice(0, 1)?.toUpperCase() || "U"}
              </button>
            </>
          ) : (
            <Link className="button button-small button-outline" to="/login">Sign in</Link>
          )}
        </div>
      </div>
      {(logoutError || citiesError) && (
        <div className="header-message" role="status">{logoutError || citiesError}</div>
      )}
    </header>
  );
}
