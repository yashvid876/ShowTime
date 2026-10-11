export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <div className="container-page flex justify-center py-10 sm:py-16">
      <div className="w-full max-w-md">
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {subtitle && <p className="mt-2 text-sm text-ink-500">{subtitle}</p>}
        <div className="card mt-6 p-5 sm:p-6">{children}</div>
        {footer && <p className="mt-5 text-center text-sm text-ink-600">{footer}</p>}
      </div>
    </div>
  );
}
