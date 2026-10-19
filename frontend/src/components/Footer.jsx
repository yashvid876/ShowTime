export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <span className="footer-brand">showtime<span className="brand-period">.</span></span>
        <span>Good stories deserve a big screen.</span>
        <span>© {new Date().getFullYear()} ShowTime</span>
      </div>
    </footer>
  );
}
