import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { apiMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function RegisterPage() {
  const { user, signUp } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();

  if (user) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signUp({ name: name.trim(), email: email.trim(), password });
      navigate("/login", { replace: true, state: { registered: true } });
    } catch (reason) {
      setError(apiMessage(reason, "We couldn't create your account."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-card">
        <div className="eyebrow"><span className="eyebrow-line" /> JOIN SHOWTIME</div>
        <h1>Make it a<br /><em>movie night.</em></h1>
        <p>Create an account to choose seats and manage your bookings.</p>
        <form className="form-stack" onSubmit={submit}>
          <label>Your name<input autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></label>
          <label>Email address<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input autoComplete="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary button-full" type="submit" disabled={busy}>{busy ? "Creating account…" : "Create account"} <span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p>
      </div>
    </section>
  );
}
