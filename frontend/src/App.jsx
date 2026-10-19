import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import { getCities } from "./api/movies.api.js";
import { useAuth } from "./context/AuthContext.jsx";
import MainLayout from "./components/MainLayout.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import BookingDetailPage from "./pages/BookingDetailPage.jsx";
import CheckoutPage from "./pages/CheckoutPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import MovieDetailPage from "./pages/MovieDetailPage.jsx";
import MyBookingsPage from "./pages/MyBookingsPage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import SeatSelectionPage from "./pages/SeatSelectionPage.jsx";
import SeatManagementPage from "./pages/SeatManagementPage.jsx";
import AdminManagementPage from "./pages/AdminManagementPage.jsx";

function RequireAuth({ children }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return <div className="page-loading">Restoring your session…</div>;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}

function RequireAdmin({ children }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="page-loading">Restoring your session…</div>;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  const [cities, setCities] = useState([]);
  const [citiesError, setCitiesError] = useState("");
  const [city, setCity] = useState(() => localStorage.getItem("showtime-city") || "");
  const { sessionError } = useAuth();

  useEffect(() => {
    getCities()
      .then((items) => {
        setCities(items);
        setCitiesError("");
      })
      .catch(() => {
        setCities([]);
        setCitiesError("City list unavailable right now. You can still browse all movies.");
      });
  }, []);

  const changeCity = (value) => {
    setCity(value);
    if (value) localStorage.setItem("showtime-city", value);
    else localStorage.removeItem("showtime-city");
  };

  return (
    <>
      {sessionError && <div className="session-note" role="status">{sessionError}</div>}
      <Routes>
        <Route element={<MainLayout city={city} cities={cities} citiesError={citiesError} onCityChange={changeCity} />}>
          <Route path="/" element={<HomePage city={city} />} />
          <Route path="/movies/:id" element={<MovieDetailPage city={city} />} />
          <Route
            path="/shows/:id/seats"
            element={
              <RequireAuth>
                <SeatSelectionPage />
              </RequireAuth>
            }
          />
          <Route
            path="/checkout/:id"
            element={
              <RequireAuth>
                <CheckoutPage />
              </RequireAuth>
            }
          />
          <Route
            path="/bookings"
            element={
              <RequireAuth>
                <MyBookingsPage />
              </RequireAuth>
            }
          />
          <Route
            path="/bookings/:id"
            element={
              <RequireAuth>
                <BookingDetailPage />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <AdminPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/seats"
            element={
              <RequireAdmin>
                <SeatManagementPage />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/manage"
            element={
              <RequireAdmin>
                <AdminManagementPage />
              </RequireAdmin>
            }
          />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </>
  );
}
