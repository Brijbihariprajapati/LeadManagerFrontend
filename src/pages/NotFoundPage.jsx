import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div className="container py-5 px-3 text-center" style={{ maxWidth: 480 }}>
      <h1 className="h4 mb-2">Page not found</h1>
      <p className="text-muted small mb-4">This URL does not exist or was removed.</p>
      <Link to="/" className="btn btn-primary">
        Go to home
      </Link>
    </div>
  );
}
