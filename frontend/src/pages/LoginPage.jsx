import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { apiMessage } from "../api/client.js";
import { useAuth } from "../context/AuthContext.jsx";

export default function LoginPage() {
  const { user, signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  if (user) return <Navigate to="/" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError("");
    setBusy(true);
    try {
      await signIn({ email: email.trim(), password });
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (reason) {
      setError(apiMessage(reason, "We couldn't sign you in."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="auth-section">
      <div className="auth-card">
        <div className="eyebrow"><span className="eyebrow-line" /> WELCOME BACK</div>
        <h1>Your seat is<br /><em>waiting.</em></h1>
        <p>Sign in to pick up where the previews left off.</p>
        <form className="form-stack" onSubmit={submit}>
          <label>Email address<input autoComplete="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label>Password<input autoComplete="current-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {location.state?.registered && (
            <div className="inline-success" role="status">Account created. Sign in to start booking.</div>
          )}
          {error && <div className="form-error" role="alert">{error}</div>}
          <button className="button button-primary button-full" type="submit" disabled={busy}>{busy ? "Signing in…" : "Sign in"} <span aria-hidden="true">→</span></button>
        </form>
        <p className="auth-switch">New to ShowTime? <Link to="/register">Create an account</Link></p>
      </div>
    </section>
  );
}
