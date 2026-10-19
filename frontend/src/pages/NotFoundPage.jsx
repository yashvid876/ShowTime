import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <section className="empty-state not-found">
      <span className="empty-icon" aria-hidden="true">404</span>
      <h1>That scene isn’t in this movie.</h1>
      <p>The page may have moved or the address may be incorrect.</p>
      <Link className="button button-primary" to="/">Back to ShowTime</Link>
    </section>
  );
}
