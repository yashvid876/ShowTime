export function Loading({ label = "Loading…" }) {
  return <div className="feedback-card" role="status"><span className="spinner" />{label}</div>;
}

export function ErrorMessage({ message, onRetry }) {
  return (
    <div className="feedback-card feedback-error" role="alert">
      <span>{message}</span>
      {onRetry && <button className="text-button" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function EmptyState({ title, children }) {
  return (
    <div className="empty-state">
      <span className="empty-icon" aria-hidden="true">✦</span>
      <h2>{title}</h2>
      {children && <p>{children}</p>}
    </div>
  );
}
