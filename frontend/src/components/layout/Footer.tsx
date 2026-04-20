import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <p>&copy; {new Date().getFullYear()} GoPublica. All rights reserved.</p>
      </div>
    </footer>
  );
}