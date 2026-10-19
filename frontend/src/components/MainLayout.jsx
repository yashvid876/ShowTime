import { Outlet } from "react-router-dom";
import Header from "./Header.jsx";
import Footer from "./Footer.jsx";

export default function MainLayout({ city, cities, citiesError, onCityChange }) {
  return (
    <div className="app-shell">
      <Header city={city} cities={cities} citiesError={citiesError} onCityChange={onCityChange} />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
