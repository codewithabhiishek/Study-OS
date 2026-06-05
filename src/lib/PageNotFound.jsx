import { useLocation } from 'react-router-dom';

export default function PageNotFound() {
  const location = useLocation();
  const pageName = location.pathname.substring(1);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-black">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-7xl font-light text-[#00FF87]" style={{ textShadow: '0 0 20px #00FF87' }}>
            404
          </h1>
          <div className="h-0.5 w-16 bg-[#FF006E] mx-auto" />
        </div>
        <div className="space-y-3">
          <h2 className="text-2xl font-bold text-white">Page Not Found</h2>
          <p className="text-[#888] leading-relaxed">
            The page <span className="font-mono text-white">"{pageName}"</span> could not be found.
          </p>
        </div>
        <div className="pt-6">
          <button
            onClick={() => (window.location.href = '/')}
            className="inline-flex items-center px-4 py-2 text-sm font-mono font-bold tracking-widest btn-neon-green"
          >
            GO HOME
          </button>
        </div>
      </div>
    </div>
  );
}
