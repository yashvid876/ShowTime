import { useEffect, useState } from "react";
import { getAdminDashboard } from "../api/admin.api.js";
import { apiMessage } from "../api/client.js";
import { ErrorMessage, Loading } from "../components/Feedback.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { Link } from "react-router-dom";

export default function AdminPage() {
  const { user } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    getAdminDashboard()
      .then(setData)
      .catch((reason) => setError(apiMessage(reason, "Couldn't load the admin route.")))
      .finally(() => setLoading(false));
  };
  useEffect(load, []);

  return (
    <section className="section admin-page">
      <div className="eyebrow"><span className="eyebrow-line" /> SHOWTIME ADMIN</div>
      <h1>Dashboard.</h1>
      <p className="muted">Signed in as {user.name} · {user.email}</p>
      {loading && <Loading label="Checking admin access…" />}
      {!loading && error && <ErrorMessage message={error} onRetry={load} />}
      {!loading && !error && data && (
        <div className="admin-response">
          <span className="status-pill status-booked">Admin access confirmed</span>
          <h2>You're in.</h2>
          <p>The current backend dashboard confirms administrator access but does not return analytics or management data.</p>
          <code>{data.message}</code>
          <div className="admin-links">
            <Link className="button button-outline" to="/admin/manage">Manage movies, venues & shows <span aria-hidden="true">→</span></Link>
            <Link className="button button-outline" to="/admin/seats">Manage screen seats <span aria-hidden="true">→</span></Link>
          </div>
        </div>
      )}
    </section>
  );
}
