import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="text-6xl font-bold text-brand-400 mb-2">404</div>
        <div className="text-ink-muted mb-4">Page introuvable</div>
        <Link to="/" className="btn btn-md btn-primary">
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
